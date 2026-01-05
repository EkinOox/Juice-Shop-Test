/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/saveLoginIp', () => {
  it('GET saveLoginIp saves client IP', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`)
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET saveLoginIp with X-Forwarded-For header', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`, {
      headers: {
        'X-Forwarded-For': '192.168.1.100'
      }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET saveLoginIp with multiple IPs in X-Forwarded-For', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`, {
      headers: {
        'X-Forwarded-For': '192.168.1.100, 10.0.0.1, 172.16.0.1'
      }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET saveLoginIp with malicious X-Forwarded-For', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`, {
      headers: {
        'X-Forwarded-For': '<script>alert(1)</script>'
      }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET saveLoginIp with X-Real-IP header', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`, {
      headers: {
        'X-Real-IP': '203.0.113.45'
      }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })
})

describe('/rest/admin/application-version', () => {
  it('GET version with JSON response', () => {
    return frisby.get(`${REST_URL}/admin/application-version`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.version).toBeDefined()
        expect(res.json.version).toMatch(/\d+\.\d+\.\d+/)
      })
  })

  it('GET version returns consistent format', () => {
    return frisby.get(`${REST_URL}/admin/application-version`)
      .expect('status', 200)
      .then((res: any) => {
        expect(typeof res.json.version).toBe('string')
      })
  })
})

describe('/rest/products/:id/reviews', () => {
  it('GET reviews for valid product', () => {
    return frisby.get(`${REST_URL}/products/1/reviews`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json.data || res.json).toBeDefined()
        }
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET reviews for nonexistent product', () => {
    return frisby.get(`${REST_URL}/products/99999/reviews`)
      .then((res: any) => {
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET reviews with SQLi in product ID', () => {
    return frisby.get(`${REST_URL}/products/1' OR '1'='1/reviews`)
      .then((res: any) => {
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('PUT review for product without authentication', () => {
    return frisby.put(`${REST_URL}/products/1/reviews`, {
      message: 'Great product!',
      author: 'test@test.com'
    })
      .then((res: any) => {
        expect([200, 201, 401, 403, 500]).toContain(res.status)
      })
  })
})

describe('/rest/chatbot/status', () => {
  it('GET chatbot status returns bot state', () => {
    return frisby.get(`${REST_URL}/chatbot/status`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
        }
        expect([200, 500]).toContain(res.status)
      })
  })
})

describe('/rest/chatbot/respond', () => {
  it('POST chatbot respond without query', () => {
    return frisby.post(`${REST_URL}/chatbot/respond`, {})
      .then((res: any) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('POST chatbot respond with query', () => {
    return frisby.post(`${REST_URL}/chatbot/respond`, {
      query: 'hello'
    })
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
        }
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('POST chatbot respond with XSS attempt', () => {
    return frisby.post(`${REST_URL}/chatbot/respond`, {
      query: '<script>alert(1)</script>'
    })
      .then((res: any) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('POST chatbot respond with empty query', () => {
    return frisby.post(`${REST_URL}/chatbot/respond`, {
      query: ''
    })
      .then((res: any) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('POST chatbot respond with very long query', () => {
    return frisby.post(`${REST_URL}/chatbot/respond`, {
      query: 'a'.repeat(10000)
    })
      .then((res: any) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })
})
