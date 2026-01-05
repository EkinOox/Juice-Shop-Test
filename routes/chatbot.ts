/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs from 'node:fs/promises'
import { type Request, type Response, type NextFunction } from 'express'
import { type User } from '../data/types'
import { UserModel } from '../models/user'
import jwt, { type JwtPayload, type VerifyErrors } from 'jsonwebtoken'
import * as challengeUtils from '../lib/challengeUtils'
import logger from '../lib/logger'
import config from 'config'
// Custom download function imported from utils
import { download } from '../lib/utils'
import * as utils from '../lib/utils'
import { isString } from 'lodash'
// Custom Bot implementation without vm2
import Bot from '../lib/bot'
import validateChatBot from '../lib/startup/validateChatBot'
import * as security from '../lib/insecurity'
import * as botUtils from '../lib/botUtils'
import { challenges } from '../data/datacache'

let trainingFile = config.get<string>('application.chatBot.trainingData')
let testCommand: string
let _bot: Bot | null = null
export const bot = {
  get: () => _bot,
  set: (value: Bot | null) => { _bot = value }
}

export async function initializeChatbot () {
  if (utils.isUrl(trainingFile)) {
    const file = utils.extractFilename(trainingFile)
    const data = await download(trainingFile)
    await fs.writeFile('data/chatbot/' + file, data)
  }

  await fs.copyFile(
    'data/static/botDefaultTrainingData.json',
    'data/chatbot/botDefaultTrainingData.json'
  )

  trainingFile = utils.extractFilename(trainingFile)
  const trainingSet = await fs.readFile(`data/chatbot/${trainingFile}`, 'utf8')
  validateChatBot(JSON.parse(trainingSet))

  testCommand = JSON.parse(trainingSet).data[0].utterances[0]
  const newBot = new Bot(config.get('application.chatBot.name'), config.get('application.chatBot.greeting'), trainingSet, config.get('application.chatBot.defaultResponse'))
  await newBot.train()
  bot.set(newBot)
}

void initializeChatbot()

function addUserIfNeeded (currentBot: Bot, userId: string, username: string, remoteAddress: string | undefined): void {
  try {
    currentBot.addUser(userId, username)
  } catch (err) {
    throw new Error('Blocked illegal activity by ' + remoteAddress)
  }
}

async function handleBotResponse (response: any, query: string, user: User, res: Response) {
  if (response.action !== 'function') {
    res.status(200).json(response)
    return
  }

  // @ts-expect-error FIXME unclean usage of any type as index
  const handler = response.handler && botUtils[response.handler]
  if (handler) {
    // @ts-expect-error FIXME unclean usage of any type as index
    res.status(200).json(await botUtils[response.handler](query, user))
  } else {
    res.status(200).json({
      action: 'response',
      body: config.get('application.chatBot.defaultResponse')
    })
  }
}

async function handleBotError (currentBot: Bot, userId: string, res: Response) {
  try {
    await currentBot.respond(testCommand, userId)
    res.status(200).json({
      action: 'response',
      body: config.get('application.chatBot.defaultResponse')
    })
  } catch (err) {
    challengeUtils.solveIf(challenges.killChatbotChallenge, () => { return true })
    res.status(200).json({
      action: 'response',
      body: `Remember to stay hydrated while I try to recover from "${utils.getErrorMessage(err)}"...`
    })
  }
}

async function processQuery (user: User, req: Request, res: Response, next: NextFunction) {
  const currentBot = bot.get()
  if (currentBot == null) {
    res.status(503).send()
    return
  }

  const username = user.username
  if (!username) {
    res.status(200).json({
      action: 'namequery',
      body: 'I\'m sorry I didn\'t get your name. What shall I call you?'
    })
    return
  }

  const userId = `${user.id}`
  const userExists = currentBot.factory.run(`currentUser('${user.id}')`)

  if (!userExists) {
    try {
      addUserIfNeeded(currentBot, userId, username, req.socket.remoteAddress)
      res.status(200).json({
        action: 'response',
        body: currentBot.greet(userId)
      })
    } catch (err) {
      next(err)
    }
    return
  }

  if (userExists !== username) {
    try {
      addUserIfNeeded(currentBot, userId, username, req.socket.remoteAddress)
    } catch (err) {
      next(err)
      return
    }
  }

  if (!req.body.query) {
    res.status(200).json({
      action: 'response',
      body: currentBot.greet(userId)
    })
    return
  }

  try {
    const response = await currentBot.respond(req.body.query, userId)
    await handleBotResponse(response, req.body.query, user, res)
  } catch (err) {
    await handleBotError(currentBot, userId, res)
  }
}

async function setUserName (user: User, req: Request, res: Response) {
  const currentBot = bot.get()
  if (currentBot == null) {
    return
  }
  try {
    const userModel = await UserModel.findByPk(user.id)
    if (userModel == null) {
      res.status(401).json({
        status: 'error',
        error: 'Unknown user'
      })
      return
    }
    const updatedUser = await userModel.update({ username: req.body.query })
    const updatedUserResponse = utils.queryResultToJson(updatedUser)
    const updatedToken = security.authorize(updatedUserResponse)
    security.authenticatedUsers.put(updatedToken, updatedUserResponse)
    currentBot.addUser(`${updatedUser.id}`, req.body.query)
    res.status(200).json({
      action: 'response',
      body: currentBot.greet(`${updatedUser.id}`),
      token: updatedToken
    })
  } catch (err) {
    logger.error(`Could not set username: ${utils.getErrorMessage(err)}`)
    res.status(500).send()
  }
}

export const status = function status () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentBot = bot.get()
    if (currentBot == null) {
      res.status(200).json({
        status: false,
        body: `${config.get<string>('application.chatBot.name')} isn't ready at the moment, please wait while I set things up`
      })
      return
    }
    const token = req.cookies.token || utils.jwtFrom(req)
    if (!token) {
      res.status(200).json({
        status: currentBot.training.state,
        body: `Hi, I can't recognize you. Sign in to talk to ${config.get<string>('application.chatBot.name')}`
      })
      return
    }

    const user = await getUserFromJwt(token)
    if (user == null) {
      res.status(401).json({
        error: 'Unauthenticated user'
      })
      return
    }

    const username = user.username

    if (!username) {
      res.status(200).json({
        action: 'namequery',
        body: 'I\'m sorry I didn\'t get your name. What shall I call you?'
      })
      return
    }

    try {
      currentBot.addUser(`${user.id}`, username)
      res.status(200).json({
        status: currentBot.training.state,
        body: currentBot.training.state ? currentBot.greet(`${user.id}`) : `${config.get<string>('application.chatBot.name')} isn't ready at the moment, please wait while I set things up`
      })
    } catch (err) {
      next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
    }
  }
}

export function process () {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (bot == null) {
      res.status(200).json({
        action: 'response',
        body: `${config.get<string>('application.chatBot.name')} isn't ready at the moment, please wait while I set things up`
      })
    }
    const token = req.cookies.token || utils.jwtFrom(req)
    if (!token) {
      res.status(400).json({
        error: 'Unauthenticated user'
      })
      return
    }

    const user = await getUserFromJwt(token)
    if (user == null) {
      res.status(401).json({
        error: 'Unauthenticated user'
      })
      return
    }

    if (req.body.action === 'query') {
      await processQuery(user, req, res, next)
    } else if (req.body.action === 'setname') {
      await setUserName(user, req, res)
    }
  }
}

async function getUserFromJwt (token: string): Promise<User | null> {
  return await new Promise((resolve) => {
    jwt.verify(token, security.publicKey, (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
      if (err !== null || !decoded || isString(decoded)) {
        resolve(null)
      } else {
        resolve(decoded.data)
      }
    })
  })
}
