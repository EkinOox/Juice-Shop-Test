/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import express, { type NextFunction, type Request, type Response } from 'express'
import path from 'node:path'

import { SecurityQuestionModel } from '../models/securityQuestion'
import { PrivacyRequestModel } from '../models/privacyRequests'
import { SecurityAnswerModel } from '../models/securityAnswer'
import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'
import { UserModel } from '../models/user'

const router = express.Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const loggedInUser = security.authenticatedUsers.get(req.cookies.token)
  if (!loggedInUser) {
    next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
    return
  }
  const email = loggedInUser.data.email

  try {
    const answer = await SecurityAnswerModel.findOne({
      include: [{
        model: UserModel,
        where: { email }
      }]
    })
    if (answer == null) {
      throw new Error('No answer found!')
    }
    const question = await SecurityQuestionModel.findByPk(answer.SecurityQuestionId)
    if (question == null) {
      throw new Error('No question found!')
    }

    res.render('dataErasureForm', { userEmail: email, securityQuestion: question.question })
  } catch (error) {
    next(error)
  }
})

interface DataErasureRequestParams {
  layout?: string
  email: string
  securityAnswer: string
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/', async (req: Request<Record<string, unknown>, Record<string, unknown>, DataErasureRequestParams>, res: Response, next: NextFunction): Promise<void> => {
  const loggedInUser = security.authenticatedUsers.get(req.cookies.token)
  if (!loggedInUser) {
    next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
    return
  }

  try {
    await PrivacyRequestModel.create({
      UserId: loggedInUser.data.id,
      deletionRequested: true
    })

    res.clearCookie('token')
    if (req.body.layout) {
      // Validate and sanitize the layout parameter
      const layoutName = req.body.layout.trim()

      // Only allow alphanumeric characters, hyphens, and underscores for layout names
      if (!/^[a-zA-Z0-9_-]+$/.test(layoutName)) {
        return next(new Error('Invalid layout name'))
      }

      // Limit layout name length to prevent buffer overflow attacks
      if (layoutName.length > 50) {
        return next(new Error('Layout name too long'))
      }

      // Use path.basename to prevent directory traversal
      const safeLayoutName = path.basename(layoutName)

      // Define allowed layouts (whitelist approach)
      const allowedLayouts = ['default', 'minimal', 'compact', 'detailed']

      if (!allowedLayouts.includes(safeLayoutName)) {
        return next(new Error('Layout not allowed'))
      }

      // Construct safe path within views directory only
      const viewsDir = path.join(__dirname, '..', 'views')
      const templatePath = path.join(viewsDir, `dataErasureResult-${safeLayoutName}`)

      // Verify the template file exists
      const fs = require('fs')
      if (!fs.existsSync(templatePath + '.hbs') && !fs.existsSync(templatePath + '.ejs')) {
        return next(new Error('Template not found'))
      }

      res.render('dataErasureResult', {
        ...req.body,
        layout: safeLayoutName
      }, (error, html) => {
        if (!html || error) {
          next(new Error(error?.message || 'Rendering failed'))
        } else {
          const sendlfrResponse: string = html.slice(0, 100) + '......'
          res.send(sendlfrResponse)
          challengeUtils.solveIf(challenges.lfrChallenge, () => { return true })
        }
      })
    } else {
      res.render('dataErasureResult', {
        ...req.body
      })
    }
  } catch (error) {
    next(error)
  }
})

export default router
