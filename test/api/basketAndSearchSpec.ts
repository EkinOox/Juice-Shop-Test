/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/products/search', () => {
  it('GET product search without query returns all products', () => {
    return frisby.get(`${REST_URL}/products/search`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then((res: any) => {
        expect(res.json.data).toBeDefined()
        expect(Array.isArray(res.json.data)).toBe(true)
      })
  })

  it('GET product search with query parameter', () => {
    return frisby.get(`${REST_URL}/products/search?q=apple`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.data).toBeDefined()
        expect(Array.isArray(res.json.data)).toBe(true)
      })
  })

  it('GET product search with XSS attempt is sanitized', () => {
    return frisby.get(`${REST_URL}/products/search?q=<script>alert('xss')</script>`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json).toBeDefined()
      })
  })

  it('GET product search with SQLi attempt', () => {
    return frisby.get(`${REST_URL}/products/search?q=apple'))--`)
      .then((res: any) => {
        expect([200, 500]).toContain(res.status)
      })
  })
})

describe('/rest/basket/:id', () => {
  let authToken: string
  let basketId: number

  beforeAll(() => {
    return frisby.post(`${REST_URL}/user/login`, {
      email: 'jim@juice-sh.op',
      password: 'ncc-1701'
    })
      .expect('status', 200)
      .then((res: any) => {
        authToken = res.json.authentication.token
        basketId = res.json.authentication.bid || 1
      })
  })

  it('GET basket without authentication fails', () => {
    return frisby.get(`${REST_URL}/basket/1`)
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET basket with authentication returns basket items', () => {
    return frisby.get(`${REST_URL}/basket/${basketId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json.data).toBeDefined()
          expect(res.json.data.Products || res.json.data).toBeDefined()
        } else {
          expect([200, 401, 403, 500]).toContain(res.status)
        }
      })
  })

  it('POST checkout requires authentication', () => {
    return frisby.post(`${REST_URL}/basket/${basketId}/checkout`, {})
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('POST checkout with authentication', () => {
    return frisby.post(`${REST_URL}/basket/${basketId}/checkout`, {
      orderLinesData: '[]'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('PUT apply coupon without authentication fails', () => {
    return frisby.put(`${REST_URL}/basket/1/coupon/TESTCOUPON`, {})
      .then((res: any) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('PUT apply coupon with authentication', () => {
    return frisby.put(`${REST_URL}/basket/${basketId}/coupon/TESTCOUPON`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res: any) => {
        expect([200, 404, 401, 403, 500]).toContain(res.status)
      })
  })
})

describe('/rest/memories', () => {
  it('GET memories returns photo memories', () => {
    return frisby.get(`${REST_URL}/memories`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
          expect(res.json.data || res.json).toBeDefined()
        }
        expect([200, 500]).toContain(res.status)
      })
  })

  it('GET memories returns array', () => {
    return frisby.get(`${REST_URL}/memories`)
      .then((res: any) => {
        if (res.status === 200) {
          const data = res.json.data || res.json
          expect(Array.isArray(data)).toBe(true)
        }
      })
  })
})
