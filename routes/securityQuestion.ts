/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { SecurityAnswerModel } from '../models/securityAnswer'
import { UserModel } from '../models/user'
import { SecurityQuestionModel } from '../models/securityQuestion'

export function securityQuestion () {
  return ({ query }: Request, res: Response, next: NextFunction) => {
    const email = typeof query.email === 'string' ? query.email : ''
    SecurityAnswerModel.findOne({
      include: [{
        model: UserModel,
        where: { email }
      }]
    }).then((answer: SecurityAnswerModel | null) => {
      if (answer != null) {
        SecurityQuestionModel.findByPk(answer.SecurityQuestionId).then((question: SecurityQuestionModel | null) => {
          res.json({ question })
        }).catch((error: Error) => {
          next(error)
        })
      } else {
        res.json({})
      }
    }).catch((error: unknown) => {
      next(error)
    })
  }
}
