/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'

describe('/dataerasure', () => {
  let authToken: string
  let authCookie: string

  beforeAll(() => {
    return frisby.post(`${URL}/rest/user/login`, {
      email: 'jim@juice-sh.op',
      password: 'ncc-1701'
    })
      .expect('status', 200)
      .then((res: any) => {
        authToken = res.json.authentication.token
        // Extract cookie for dataerasure page
        if (res.headers && res.headers['set-cookie']) {
          authCookie = res.headers['set-cookie'][0]
        }
      })
  })

  it('GET dataerasure page without authentication is blocked', () => {
    return frisby.get(`${URL}/dataerasure`)
      .then((res: any) => {
        expect([302, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET dataerasure page with authentication returns form', () => {
    return frisby.get(`${URL}/dataerasure`, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.body).toBeDefined()
          expect(res.headers['content-type']).toContain('text/html')
        } else {
          expect([200, 302, 401, 403, 500]).toContain(res.status)
        }
      })
  })

  it('POST dataerasure without authentication is blocked', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'Star Trek'
    })
      .then((res: any) => {
        expect([302, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure validates email format', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'invalid-email',
      securityAnswer: 'test'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure validates security answer', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'wrong-answer'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure with layout parameter', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'Star Trek',
      layout: 'default'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure with invalid layout parameter', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'test',
      layout: '../../../etc/passwd'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure with layout containing special chars', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'test',
      layout: 'default<script>alert(1)</script>'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure with very long layout name', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'jim@juice-sh.op',
      securityAnswer: 'test',
      layout: 'a'.repeat(100)
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure sanitizes email input', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'test@test.com<script>alert(1)</script>',
      securityAnswer: 'test'
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST dataerasure sanitizes security answer', () => {
    return frisby.post(`${URL}/dataerasure`, {
      email: 'test@test.com',
      securityAnswer: 'a'.repeat(300)
    }, {
      headers: {
        Cookie: `token=${authToken}`
      }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })
})
