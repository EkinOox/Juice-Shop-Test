/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'
import { type Captcha } from '../data/types'
import { CaptchaModel } from '../models/captcha'
import crypto from 'crypto'

function safeEvalMath (expression: string): number {
  // Simple arithmetic evaluator with operator precedence (* / before + -)
  const tokens = expression.match(/(\d+|[+\-*/])/g)
  if (!tokens) throw new Error('Invalid expression')

  // Evaluate * and / first
  for (let i = 1; i < tokens.length; i += 2) {
    if (tokens[i] === '*' || tokens[i] === '/') {
      const left = parseFloat(tokens[i - 1])
      const right = parseFloat(tokens[i + 1])
      const result = tokens[i] === '*' ? left * right : left / right
      tokens.splice(i - 1, 3, result.toString())
      i -= 2 // adjust index
    }
  }

  // Now evaluate + and -
  let result = parseFloat(tokens[0])
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const num = parseFloat(tokens[i + 1])
    if (op === '+') result += num
    else if (op === '-') result -= num
  }
  return result
}

export function captchas () {
  return async (req: Request, res: Response) => {
    const captchaId = req.app.locals.captchaId++
    const operators = ['*', '+', '-']

    const firstTerm = crypto.randomInt(1, 11)
    const secondTerm = crypto.randomInt(1, 11)
    const thirdTerm = crypto.randomInt(1, 11)

    const firstOperator = operators[crypto.randomInt(0, 3)]
    const secondOperator = operators[crypto.randomInt(0, 3)]

    const expression = firstTerm.toString() + firstOperator + secondTerm.toString() + secondOperator + thirdTerm.toString()
    const answer = safeEvalMath(expression).toString()

    const captcha = {
      captchaId,
      captcha: expression,
      answer
    }
    const captchaInstance = CaptchaModel.build(captcha)
    await captchaInstance.save()
    res.json(captcha)
  }
}

export const verifyCaptcha = () => (req: Request, res: Response, next: NextFunction) => {
  CaptchaModel.findOne({ where: { captchaId: req.body.captchaId } }).then((captcha: Captcha | null) => {
    if ((captcha != null) && req.body.captcha === captcha.answer) {
      next()
    } else {
      res.status(401).send(res.__('Wrong answer to CAPTCHA. Please try again.'))
    }
  }).catch((error: Error) => {
    next(error)
  })
}
