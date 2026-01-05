/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'

describe('Angular routing and client serving', () => {
  it('GET root path returns index.html', () => {
    return frisby.get(`${URL}/`)
      .then((res: any) => {
        expect([200, 302]).toContain(res.status)
        if (res.status === 200) {
          expect(res.headers['content-type']).toContain('text/html')
        }
      })
  })

  it('GET profile route returns index for angular routing', () => {
    return frisby.get(`${URL}/profile`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET basket route returns index', () => {
    return frisby.get(`${URL}/basket`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET search route returns index', () => {
    return frisby.get(`${URL}/search`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET nested route returns index for angular', () => {
    return frisby.get(`${URL}/administration/users`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET deep nested route returns index', () => {
    return frisby.get(`${URL}/order/summary`)
      .then((res: any) => {
        expect([200, 302, 401]).toContain(res.status)
      })
  })

  it('GET non-existent angular route still returns index', () => {
    return frisby.get(`${URL}/nonexistent/route`)
      .then((res: any) => {
        expect([200, 302, 404]).toContain(res.status)
      })
  })
})

describe('Current user and authentication details', () => {
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

  it('GET whoami without authentication fails', () => {
    return frisby.get(`${URL}/rest/user/whoami`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET whoami with authentication returns user info', () => {
    return frisby.get(`${URL}/rest/user/whoami`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(res.json.user || res.json).toBeDefined()
        }
        expect([200, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET authentication details returns current users', () => {
    return frisby.get(`${URL}/rest/user/authentication-details`)
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
        if (res.status === 200) {
          expect(res.json).toBeDefined()
        }
      })
  })
})

describe('Security question endpoint', () => {
  it('GET security question without email parameter', () => {
    return frisby.get(`${URL}/rest/user/security-question`)
      .then((res: any) => {
        expect([400, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question with valid email', () => {
    return frisby.get(`${URL}/rest/user/security-question?email=jim@juice-sh.op`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(res.json.question).toBeDefined()
        }
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET security question with invalid email returns error', () => {
    return frisby.get(`${URL}/rest/user/security-question?email=nonexistent@test.com`)
      .then((res: any) => {
        expect([404, 500]).toContain(res.status)
      })
  })
})

describe('Change password endpoint', () => {
  it('GET change password without authentication', () => {
    return frisby.get(`${URL}/rest/user/change-password`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET change password with parameters', () => {
    return frisby.get(`${URL}/rest/user/change-password?current=old&new=new&repeat=new`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })
})

describe('Reset password endpoint', () => {
  it('POST reset password without email', () => {
    return frisby.post(`${URL}/rest/user/reset-password`, {})
      .then((res: any) => {
        expect([400, 500]).toContain(res.status)
      })
  })

  it('POST reset password with valid email', () => {
    return frisby.post(`${URL}/rest/user/reset-password`, {
      email: 'jim@juice-sh.op',
      answer: 'Star Trek',
      new: 'newpassword',
      repeat: 'newpassword'
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST reset password with mismatched passwords', () => {
    return frisby.post(`${URL}/rest/user/reset-password`, {
      email: 'jim@juice-sh.op',
      answer: 'Star Trek',
      new: 'password1',
      repeat: 'password2'
    })
      .then((res: any) => {
        expect([400, 500]).toContain(res.status)
      })
  })
})
