/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'

describe('Error Handler', () => {
  it('GET non-existent API endpoint returns error', () => {
    return frisby.get(`${URL}/api/NonExistentEndpoint`)
      .then((res) => {
        expect([404, 500]).toContain(res.status)
      })
  })

  it('GET non-existent route with JSON accept header', () => {
    return frisby.get(`${URL}/api/invalid-endpoint`, {
      headers: { Accept: 'application/json' }
    })
      .then((res) => {
        expect([404, 500]).toContain(res.status)
        if (res.json) {
          expect(res.json).toBeDefined()
        }
      })
  })

  it('GET non-existent route with HTML accept header', () => {
    return frisby.get(`${URL}/invalid-page`, {
      headers: { Accept: 'text/html' }
    })
      .then((res) => {
        expect([404, 500]).toContain(res.status)
      })
  })
})
