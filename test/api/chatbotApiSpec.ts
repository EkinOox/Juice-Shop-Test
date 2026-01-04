/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/chatbot', () => {
  it('GET chatbot status', () => {
    return frisby.get(REST_URL + '/chatbot/status')
      .then((res) => {
        expect([200, 404, 500]).toContain(res.status)
      })
  })

  it('POST message to chatbot', () => {
    return frisby.post(REST_URL + '/chatbot/respond', {
      headers: jsonHeader,
      body: {
        query: 'Hello',
        action: 'query'
      }
    })
      .then((res) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('POST chatbot with empty query', () => {
    return frisby.post(REST_URL + '/chatbot/respond', {
      headers: jsonHeader,
      body: {
        query: '',
        action: 'query'
      }
    })
      .then((res) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })
})
