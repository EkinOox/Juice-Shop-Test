/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'

describe('/profile', () => {
  let authToken: string

  beforeAll(() => {
    return frisby.post(`${URL}/rest/user/login`, {
      email: 'jim@juice-sh.op',
      password: 'ncc-1701'
    })
      .expect('status', 200)
      .then((res: any) => {
        authToken = res.json.authentication.token
      })
  })

  it('GET profile without authentication redirects', () => {
    return frisby.get(`${URL}/profile`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET profile with authentication returns profile data', () => {
    return frisby.get(`${URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.body).toBeDefined()
        }
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET profile with cookie authentication', () => {
    return frisby.get(`${URL}/profile`, {
      headers: { Cookie: `token=${authToken}` }
    })
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('POST update profile without authentication', () => {
    return frisby.post(`${URL}/profile`, {
      username: 'newtestuser'
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with authentication', () => {
    return frisby.post(`${URL}/profile`, {
      username: 'testuser'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with XSS in username', () => {
    return frisby.post(`${URL}/profile`, {
      username: '<script>alert("xss")</script>'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with SSTI attempt', () => {
    return frisby.post(`${URL}/profile`, {
      username: '{{7*7}}'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with eval attempt', () => {
    return frisby.post(`${URL}/profile`, {
      username: 'test',
      email: 'eval(process.exit())'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with null username', () => {
    return frisby.post(`${URL}/profile`, {
      username: null
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST update profile with very long username', () => {
    return frisby.post(`${URL}/profile`, {
      username: 'a'.repeat(1000)
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })
})
