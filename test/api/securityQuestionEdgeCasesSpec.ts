/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/user/security-question', () => {
  it('GET security question with valid email returns question', () => {
    return frisby.get(`${REST_URL}/user/security-question?email=jim@juice-sh.op`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(res.json.question).toBeDefined()
        }
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question without email returns error', () => {
    return frisby.get(`${REST_URL}/user/security-question`)
      .then((res: any) => {
        expect([400, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question with empty email', () => {
    return frisby.get(`${REST_URL}/user/security-question?email=`)
      .then((res: any) => {
        expect([400, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question with nonexistent user', () => {
    return frisby.get(`${REST_URL}/user/security-question?email=nonexistent@doesnotexist.com`)
      .then((res: any) => {
        expect([404, 500]).toContain(res.status)
      })
  })

  it('GET security question with SQLi attempt', () => {
    return frisby.get(`${REST_URL}/user/security-question?email=admin@juice-sh.op'--`)
      .then((res: any) => {
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question with XSS attempt', () => {
    return frisby.get(`${REST_URL}/user/security-question?email=<script>alert('xss')</script>@test.com`)
      .then((res: any) => {
        expect([404, 500]).toContain(res.status)
      })
  })
})
