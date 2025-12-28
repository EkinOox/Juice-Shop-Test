/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { testPasswords } from '../testPasswords'
import { challenges } from '../../data/datacache'
import { type Challenge } from 'data/types'
import { continueCode } from '../../routes/continueCode'

const expect = chai.expect
chai.use(sinonChai)

describe('continueCode', () => {
  let req: any
  let res: any

  beforeEach(() => {
    req = {}
    res = { json: sinon.spy() }
  })

  it('should be empty when no challenges are solved', () => {
    challenges.scoreBoardChallenge = { solved: false } as unknown as Challenge
    challenges.adminSectionChallenge = { solved: false } as unknown as Challenge

    continueCode()(req, res)
    expect(res.json).to.have.been.calledWith({ continueCode: undefined })
  })

  it('should be hashid value of IDs of solved challenges', () => {
    challenges.scoreBoardChallenge = { id: 1, solved: true } as unknown as Challenge
    challenges.adminSectionChallenge = { id: 2, solved: true } as unknown as Challenge
    challenges.continueCodeChallenge = { id: 3, solved: false } as unknown as Challenge

    continueCode()(req, res)
    expect(res.json).to.have.been.calledWith({ continueCode: testPasswords.continueCode })
  })
})
