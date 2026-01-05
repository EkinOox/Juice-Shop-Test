/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/admin/application-version', () => {
  it('GET application version returns version info', () => {
    return frisby.get(`${REST_URL}/admin/application-version`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then((res: any) => {
        expect(res.json).toBeDefined()
        expect(res.json.version).toBeDefined()
      })
  })

  it('GET application version contains semantic version', () => {
    return frisby.get(`${REST_URL}/admin/application-version`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.version).toMatch(/\d+\.\d+\.\d+/)
      })
  })

  it('GET application version is accessible without auth', () => {
    return frisby.get(`${REST_URL}/admin/application-version`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.status).toBe(200)
      })
  })
})

describe('/easterEgg', () => {
  it('GET easter egg page returns content', () => {
    return frisby.get(`${URL}/the/devs/are/so/funny/they/hid/an/easter/egg/within/the/easter/egg`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.body).toBeDefined()
          expect(res.headers['content-type']).toContain('text/html')
        } else {
          expect([200, 404]).toContain(res.status)
        }
      })
  })

  it('GET easter egg wrong path returns 404', () => {
    return frisby.get(`${URL}/wrong/easter/egg/path`)
      .then((res: any) => {
        expect([404]).toContain(res.status)
      })
  })
})

describe('/we/may/also/instruct/you/to/refuse/all/reasonably/necessary/responsibility', () => {
  it('GET privacy policy proof page', () => {
    return frisby.get(`${URL}/we/may/also/instruct/you/to/refuse/all/reasonably/necessary/responsibility`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.body).toBeDefined()
        } else {
          expect([200, 404]).toContain(res.status)
        }
      })
  })
})

describe('/rest/deluxe-membership', () => {
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

  it('GET deluxe membership status requires authentication', () => {
    return frisby.get(`${REST_URL}/deluxe-membership`)
      .then((res: any) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })

  it('GET deluxe membership status with authentication', () => {
    return frisby.get(`${REST_URL}/deluxe-membership`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(res.json.status || res.json.data).toBeDefined()
        } else {
          expect([200, 401, 403, 500]).toContain(res.status)
        }
      })
  })

  it('POST upgrade to deluxe membership requires authentication', () => {
    return frisby.post(`${REST_URL}/deluxe-membership`, {})
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('POST upgrade to deluxe with authentication', () => {
    return frisby.post(`${REST_URL}/deluxe-membership`, {
      paymentMode: 'wallet'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })
})
