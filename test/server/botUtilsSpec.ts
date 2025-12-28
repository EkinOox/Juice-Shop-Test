/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import * as botUtils from '../../lib/botUtils'
import * as security from '../../lib/insecurity'
import { testPasswords } from '../testPasswords'

const expect = chai.expect

describe('botUtils', () => {
  describe('testFunction', () => {
    it('returns static test response', () => {
      expect(botUtils.testFunction('foo', 'bar')).to.deep.equal({
        action: 'response',
        body: testPasswords.botBodyMd5
      })
    })
  })

  describe('couponCode', () => {
    it('response contains a valid 10% coupon code for current date', () => {
      expect(botUtils.couponCode('foo', 'bar')).to.deep.equal({
        action: 'response',
        body: `Oooookay, if you promise to stop nagging me here's a 10% coupon code for you: ${security.generateCoupon(10, new Date())}`
      })
    })
  })
})
