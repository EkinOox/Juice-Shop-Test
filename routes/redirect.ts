/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'

export function performRedirect () {
  return ({ query }: Request, res: Response, next: NextFunction) => {
    const target: string = query.to as string
    const urlMap: { [key: string]: string } = {
      github: 'https://github.com/juice-shop/juice-shop',
      blockchain: 'https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm',
      dash: 'https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW',
      etherscan: 'https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6',
      spreadshirt_com: 'http://shop.spreadshirt.com/juiceshop',
      spreadshirt_de: 'http://shop.spreadshirt.de/juiceshop',
      stickeryou: 'https://www.stickeryou.com/products/owasp-juice-shop/794',
      leanpub: 'http://leanpub.com/juice-shop'
    }
    const toUrl = urlMap[target]
    if (toUrl) {
      challengeUtils.solveIf(challenges.redirectCryptoCurrencyChallenge, () => { return target === 'dash' || target === 'blockchain' || target === 'etherscan' })
      challengeUtils.solveIf(challenges.redirectChallenge, () => { return isUnintendedRedirect(target) })
      res.redirect(toUrl)
    } else {
      res.status(406)
      next(new Error('Unrecognized target for redirect: ' + target))
    }
  }
}

function isUnintendedRedirect (target: string) {
  const allowedTargets = ['github', 'blockchain', 'dash', 'etherscan', 'spreadshirt_com', 'spreadshirt_de', 'stickeryou', 'leanpub']
  return !allowedTargets.includes(target)
}
