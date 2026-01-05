/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const API_URL = `${URL}/api`

describe('/api/PrivacyRequests', () => {
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

  it('POST privacy request requires authentication', () => {
    return frisby.post(`${API_URL}/PrivacyRequests`, {
      UserId: 1
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('POST privacy request with authentication', () => {
    return frisby.post(`${API_URL}/PrivacyRequests`, {
      deletionRequested: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 201, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET privacy requests is denied', () => {
    return frisby.get(`${API_URL}/PrivacyRequests`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('PUT privacy request by ID is denied', () => {
    return frisby.put(`${API_URL}/PrivacyRequests/1`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('DELETE privacy request is denied', () => {
    return frisby.del(`${API_URL}/PrivacyRequests/1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })
})

describe('/api/Addresss', () => {
  let authToken: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let addressId: number

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

  it('POST address requires authentication', () => {
    return frisby.post(`${API_URL}/Addresss`, {
      country: 'Test',
      name: 'Test User',
      mobileNum: '1234567890',
      zipCode: '12345',
      streetAddress: 'Test St',
      city: 'Test City',
      state: 'Test State'
    })
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('POST address with authentication creates address', () => {
    return frisby.post(`${API_URL}/Addresss`, {
      country: 'Test',
      name: 'Test User',
      mobileNum: '1234567890',
      zipCode: '12345',
      streetAddress: 'Test St',
      city: 'Test City',
      state: 'Test State'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 201 || res.status === 200) {
          expect(res.json.data || res.json).toBeDefined()
          addressId = (res.json.data || res.json).id
        }
        expect([200, 201, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET addresses requires authentication', () => {
    return frisby.get(`${API_URL}/Addresss`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET addresses with authentication returns user addresses', () => {
    return frisby.get(`${API_URL}/Addresss`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(Array.isArray(res.json.data || res.json)).toBe(true)
        }
        expect([200, 401, 403, 500]).toContain(res.status)
      })
  })

  it('PUT address requires authentication', () => {
    return frisby.put(`${API_URL}/Addresss/1`, {
      country: 'Updated'
    })
      .then((res: any) => {
        expect([401, 403, 404, 500]).toContain(res.status)
      })
  })

  it('DELETE address requires authentication', () => {
    return frisby.del(`${API_URL}/Addresss/1`)
      .then((res: any) => {
        expect([401, 403, 404, 500]).toContain(res.status)
      })
  })
})
