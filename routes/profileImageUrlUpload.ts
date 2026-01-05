/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs from 'node:fs'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { type Request, type Response, type NextFunction } from 'express'

import * as security from '../lib/insecurity'
import { UserModel } from '../models/user'
import * as utils from '../lib/utils'
import logger from '../lib/logger'

function isValidUrl (url: string): URL {
  try {
    return new URL(url)
  } catch {
    throw new Error('Invalid URL provided')
  }
}

function isPrivateNetwork (hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase()
  const privateIpRegex = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|127\.|169\.254\.|::1|localhost|0\.0\.0\.0)/
  return privateIpRegex.test(lowerHostname)
}

function isAllowedProtocol (protocol: string): boolean {
  return ['http:', 'https:'].includes(protocol)
}

function extractFileExtension (url: string): string {
  const ext = url.split('.').at(-1)?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(ext) ? ext : 'jpg'
}

async function downloadAndSaveImage (url: URL, userId: number): Promise<string> {
  const response = await fetch(url.href)

  if (!response.ok || !response.body) {
    throw new Error('url returned a non-OK status code or an empty body')
  }

  const ext = extractFileExtension(url.href)
  const filePath = `frontend/dist/frontend/assets/public/images/uploads/${userId}.${ext}`
  const fileStream = fs.createWriteStream(filePath, { flags: 'w' })

  await finished(Readable.fromWeb(response.body as any).pipe(fileStream))

  return `/assets/public/images/uploads/${userId}.${ext}`
}

async function updateUserProfileImage (userId: number, imageUrl: string): Promise<void> {
  const user = await UserModel.findByPk(userId)
  if (user) {
    await user.update({ profileImage: imageUrl })
  }
}

export function profileImageUrlUpload () {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.imageUrl === undefined) {
      res.location(process.env.BASE_PATH + '/profile')
      res.redirect(process.env.BASE_PATH + '/profile')
      return
    }

    const url = req.body.imageUrl
    if (url.includes('solve/challenges/server-side')) {
      req.app.locals.abused_ssrf_bug = true
    }

    const loggedInUser = security.authenticatedUsers.get(req.cookies.token)

    if (!loggedInUser) {
      next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
      return
    }

    try {
      const parsedUrl = isValidUrl(url)

      if (isPrivateNetwork(parsedUrl.hostname)) {
        throw new Error('Access to private network resources is not allowed')
      }

      if (!isAllowedProtocol(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are allowed')
      }

      const profileImagePath = await downloadAndSaveImage(parsedUrl, loggedInUser.data.id)
      await updateUserProfileImage(loggedInUser.data.id, profileImagePath)
    } catch (error) {
      try {
        await updateUserProfileImage(loggedInUser.data.id, url)
        logger.warn(`Error retrieving user profile image: ${utils.getErrorMessage(error)}; using image link directly`)
      } catch (innerError) {
        next(innerError)
        return
      }
    }

    res.location(process.env.BASE_PATH + '/profile')
    res.redirect(process.env.BASE_PATH + '/profile')
  }
}
