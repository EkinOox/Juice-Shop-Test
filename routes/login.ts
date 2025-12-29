/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import { type Request, type Response, type NextFunction } from 'express'
import config from 'config'

import * as challengeUtils from '../lib/challengeUtils'
import { challenges, users } from '../data/datacache'
import { BasketModel } from '../models/basket'
import * as security from '../lib/insecurity'
import { UserModel } from '../models/user'
import { type User } from '../data/types'

// vuln-code-snippet start loginAdminChallenge loginBenderChallenge loginJimChallenge
export function login () {
  function afterLogin (
    user: { data: User, bid: number },
    res: Response,
    next: NextFunction
  ) {
    verifyPostLoginChallenges(user) // vuln-code-snippet hide-line
    BasketModel.findOrCreate({ where: { UserId: user.data.id } })
      .then(([basket]: [BasketModel, boolean]) => {
        const token = security.authorize(user)
        user.bid = basket.id // keep track of original basket
        security.authenticatedUsers.put(token, user)
        res.json({
          authentication: { token, bid: basket.id, umail: user.data.email }
        })
      })
      .catch((error: Error) => {
        next(error)
      })
  }

  return (req: Request, res: Response, next: NextFunction) => {
    verifyPreLoginChallenges(req) // vuln-code-snippet hide-line
    UserModel.findOne({
      where: {
        email: req.body.email || '',
        password: security.hash(req.body.password || '')
      }
    })
      .then((authenticatedUser) => {
        if (authenticatedUser && authenticatedUser.totpSecret !== '') {
          res.status(401).json({
            status: 'totp_token_required',
            data: {
              tmpToken: security.authorize({
                userId: authenticatedUser.id,
                type: 'password_valid_needs_second_factor_token'
              })
            }
          })
        } else if (authenticatedUser) {
          afterLogin({ data: authenticatedUser, bid: 0 }, res, next)
        } else {
          res.status(401).send(res.__('Invalid email or password.'))
        }
      })
      .catch((error: Error) => {
        next(error)
      })
  }
  // vuln-code-snippet end loginAdminChallenge loginBenderChallenge loginJimChallenge

  function verifyPreLoginChallenges (req: Request) {
    challengeUtils.solveIf(challenges.weakPasswordChallenge, () => {
      return (
        req.body.email ===
          'admin@' + config.get<string>('application.domain') &&
        req.body.password === process.env.ADMIN_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.loginSupportChallenge, () => {
      return (
        req.body.email ===
          'support@' + config.get<string>('application.domain') &&
        req.body.password === process.env.SUPPORT_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.loginRapperChallenge, () => {
      return (
        req.body.email ===
          'mc.safesearch@' + config.get<string>('application.domain') &&
        req.body.password === process.env.RAPPER_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.loginAmyChallenge, () => {
      return (
        req.body.email === 'amy@' + config.get<string>('application.domain') &&
        req.body.password === process.env.AMY_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.dlpPasswordSprayingChallenge, () => {
      return (
        req.body.email ===
          'J12934@' + config.get<string>('application.domain') &&
        req.body.password === process.env.DLP_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.oauthUserPasswordChallenge, () => {
      return (
        req.body.email === 'bjoern.kimminich@gmail.com' &&
        req.body.password === process.env.OAUTH_PASSWORD
      )
    })
    challengeUtils.solveIf(challenges.exposedCredentialsChallenge, () => {
      return (
        req.body.email ===
          'testing@' + config.get<string>('application.domain') &&
        req.body.password === process.env.TESTING_PASSWORD
      )
    })
  }

  function verifyPostLoginChallenges (user: { data: User }) {
    challengeUtils.solveIf(challenges.loginAdminChallenge, () => {
      return user.data.id === users.admin.id
    })
    challengeUtils.solveIf(challenges.loginJimChallenge, () => {
      return user.data.id === users.jim.id
    })
    challengeUtils.solveIf(challenges.loginBenderChallenge, () => {
      return user.data.id === users.bender.id
    })
    challengeUtils.solveIf(challenges.ghostLoginChallenge, () => {
      return user.data.id === users.chris.id
    })
    if (
      challengeUtils.notSolved(challenges.ephemeralAccountantChallenge) &&
      user.data.email ===
        'acc0unt4nt@' + config.get<string>('application.domain') &&
      user.data.role === 'accounting'
    ) {
      UserModel.count({
        where: {
          email: 'acc0unt4nt@' + config.get<string>('application.domain')
        }
      })
        .then((count: number) => {
          if (count === 0) {
            challengeUtils.solve(challenges.ephemeralAccountantChallenge)
          }
        })
        .catch(() => {
          throw new Error('Unable to verify challenges! Try again')
        })
    }
  }
}
