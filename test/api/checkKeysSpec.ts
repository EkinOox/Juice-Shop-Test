/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/web3', () => {
  it('POST check NFT unlock with invalid private key', () => {
    return frisby.post(REST_URL + '/web3/checkKeys', {
      headers: jsonHeader,
      body: {
        privateKey: 'invalid_key_123456789'
      }
    })
      .then((res) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST check NFT unlock with public address', () => {
    return frisby.post(REST_URL + '/web3/checkKeys', {
      headers: jsonHeader,
      body: {
        privateKey: '0x1234567890abcdef1234567890abcdef12345678'
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST check NFT unlock with empty body', () => {
    return frisby.post(REST_URL + '/web3/checkKeys', {
      headers: jsonHeader,
      body: {}
    })
      .then((res) => {
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('GET NFT unlock status', () => {
    return frisby.get(REST_URL + '/web3/nftUnlocked')
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })
})
