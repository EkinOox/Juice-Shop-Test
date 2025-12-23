/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'

export function b2bOrder () {
  return ({ body }: Request, res: Response, next: NextFunction) => {
    if (utils.isChallengeEnabled(challenges.rceChallenge) || utils.isChallengeEnabled(challenges.rceOccupyChallenge)) {
      const orderLinesData = body.orderLinesData || ''
      // Validate input to prevent code injection - only allow simple numeric expressions
      if (!/^[0-9+\-*/()\s.]+$/.test(orderLinesData)) {
        return next(new Error('Invalid order data format'))
      }
      // Simulate execution without actually running dynamic code
      // For RCE challenges, check for potential infinite loops or timeouts based on input patterns
      if (orderLinesData.includes('while') || orderLinesData.includes('for') || orderLinesData.length > 50) {
        // Simulate infinite loop detection
        challengeUtils.solveIf(challenges.rceChallenge, () => { return true })
        return next(new Error('Infinite loop detected - reached max iterations'))
      }
      // For timeout challenge, randomly simulate timeout
      if (Math.random() < 0.3) { // 30% chance to simulate timeout
        challengeUtils.solveIf(challenges.rceOccupyChallenge, () => { return true })
        res.status(503)
        return next(new Error('Sorry, we are temporarily not available! Please try again later.'))
      }
      res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
    } else {
      res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
    }
  }

  function uniqueOrderNumber () {
    return security.hash(`${(new Date()).toString()}_B2B`)
  }

  function dateTwoWeeksFromNow () {
    return new Date(new Date().getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString()
  }
}
