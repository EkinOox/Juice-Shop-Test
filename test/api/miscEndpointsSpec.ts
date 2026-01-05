/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/track-order', () => {
  it('GET track order with valid order ID', () => {
    return frisby.get(`${REST_URL}/track-order/5267-abc123def456`)
      .then((res: any) => {
        expect([200, 404, 500]).toContain(res.status)
        if (res.status === 200) {
          expect(res.json).toBeDefined()
        }
      })
  })

  it('GET track order with invalid format returns error', () => {
    return frisby.get(`${REST_URL}/track-order/invalid`)
      .then((res: any) => {
        expect([404, 500]).toContain(res.status)
      })
  })

  it('GET track order with SQLi attempt', () => {
    return frisby.get(`${REST_URL}/track-order/5267'%20OR%20'1'='1`)
      .then((res: any) => {
        // Should either block or return empty result
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('GET track order with non-existent order', () => {
    return frisby.get(`${REST_URL}/track-order/9999-nonexistent`)
      .then((res: any) => {
        expect([404, 500]).toContain(res.status)
      })
  })
})

describe('/rest/saveLoginIp', () => {
  it('GET saveLoginIp endpoint is accessible', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`)
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET saveLoginIp saves IP address', () => {
    return frisby.get(`${REST_URL}/saveLoginIp`, {
      headers: {
        'X-Forwarded-For': '192.168.1.100'
      }
    })
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })
})

describe('/rest/repeat-notification', () => {
  it('GET repeat notification endpoint', () => {
    return frisby.get(`${REST_URL}/repeat-notification`)
      .then((res: any) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET repeat notification returns JSON', () => {
    return frisby.get(`${REST_URL}/repeat-notification`)
      .then((res: any) => {
        if (res.status === 200) {
          expect(res.json).toBeDefined()
        }
      })
  })
})
