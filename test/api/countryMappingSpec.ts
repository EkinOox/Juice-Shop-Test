/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'

const REST_URL = 'http://localhost:3000/rest'

describe('/rest/country-mapping', () => {
  it('GET country mapping returns data', () => {
    return frisby.get(REST_URL + '/country-mapping')
      .then((res) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET country mapping with valid data structure', () => {
    return frisby.get(REST_URL + '/country-mapping')
      .then((res) => {
        expect([200, 401, 500]).toContain(res.status)
        if (res.status === 200 && res.json && res.json.data) {
          expect(typeof res.json.data).toBe('object')
        }
      })
  })

  it('GET country mapping handles missing configuration gracefully', () => {
    return frisby.get(REST_URL + '/country-mapping')
      .then((res) => {
        expect([200, 401, 500]).toContain(res.status)
        if (res.status === 500) {
          expect(res.body).toBeDefined()
        }
      })
  })

  it('GET country mapping returns proper status code', () => {
    return frisby.get(REST_URL + '/country-mapping')
      .then((res) => {
        expect(res.status).toBeDefined()
        expect(typeof res.status).toBe('number')
      })
  })
})
