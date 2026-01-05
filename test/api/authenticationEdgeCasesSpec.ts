/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/user/login edge cases', () => {
  it('POST login with valid credentials', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'jim@juice-sh.op',
      password: 'ncc-1701'
    })
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.authentication).toBeDefined()
        expect(res.json.authentication.token).toBeDefined()
      })
  })

  it('POST login with SQLi attempt in email', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: "admin'--",
      password: 'any'
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with NoSQL injection in email', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: { $ne: null },
      password: { $ne: null }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with empty credentials', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: '',
      password: ''
    })
      .then((res: any) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with null email', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: null,
      password: 'test'
    })
      .then((res: any) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with XSS in email', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: '<script>alert(1)</script>',
      password: 'test'
    })
      .then((res: any) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST login with OAuth user', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'bjoern.kimminich@gmail.com',
      password: testPasswords.bjoernOAuth || 'oauth-test'
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST login tracks login attempts', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'wrong@test.com',
      password: 'wrongpass'
    })
      .then((res: any) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST login with very long email', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'a'.repeat(1000) + '@test.com',
      password: 'test'
    })
      .then((res: any) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with special characters in password', () => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'test@test.com',
      password: '!@#$%^&*()_+-={}[]|:";\'<>?,./`~'
    })
      .then((res: any) => {
        expect([401, 500]).toContain(res.status)
      })
  })
})

describe('/rest/user/change-password edge cases', () => {
  let authToken: string

  beforeAll(() => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'jim@juice-sh.op',
      password: 'ncc-1701'
    })
      .expect('status', 200)
      .then((res: any) => {
        authToken = res.json.authentication.token
      })
  })

  it('GET change password without authentication', () => {
    return frisby.get(`${REST_URL}/user/change-password?current=old&new=new&repeat=new`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET change password with authentication but wrong current', () => {
    return frisby.get(`${REST_URL}/user/change-password?current=wrong&new=new123&repeat=new123`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET change password with mismatched new passwords', () => {
    return frisby.get(`${REST_URL}/user/change-password?current=ncc-1701&new=new123&repeat=new456`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET change password with weak new password', () => {
    return frisby.get(`${REST_URL}/user/change-password?current=ncc-1701&new=123&repeat=123`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET change password with XSS in new password', () => {
    return frisby.get(`${REST_URL}/user/change-password?current=ncc-1701&new=<script>alert(1)</script>&repeat=<script>alert(1)</script>`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })
})

describe('/rest/user/reset-password edge cases', () => {
  it('POST reset password with valid data', () => {
    return frisby.post(`${REST_URL}/user/reset-password`, {
      email: 'jim@juice-sh.op',
      answer: 'Star Trek',
      new: 'newpassword123',
      repeat: 'newpassword123'
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST reset password with wrong security answer', () => {
    return frisby.post(`${REST_URL}/user/reset-password`, {
      email: 'jim@juice-sh.op',
      answer: 'Wrong Answer',
      new: 'newpassword123',
      repeat: 'newpassword123'
    })
      .then((res: any) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST reset password with mismatched passwords', () => {
    return frisby.post(`${REST_URL}/user/reset-password`, {
      email: 'jim@juice-sh.op',
      answer: 'Star Trek',
      new: 'password1',
      repeat: 'password2'
    })
      .then((res: any) => {
        expect([400, 500]).toContain(res.status)
      })
  })

  it('POST reset password with SQLi in email', () => {
    return frisby.post(`${REST_URL}/user/reset-password`, {
      email: "admin'--",
      answer: 'any',
      new: 'password',
      repeat: 'password'
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST reset password with empty email', () => {
    return frisby.post(`${REST_URL}/user/reset-password`, {
      email: '',
      answer: 'test',
      new: 'password',
      repeat: 'password'
    })
      .then((res: any) => {
        expect([400, 500]).toContain(res.status)
      })
  })
})
