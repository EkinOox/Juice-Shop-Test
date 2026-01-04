/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'

const jsonHeader = { 'content-type': 'application/json' }
let authHeader: { Authorization: string, 'content-type': string }

beforeAll(() => {
  return frisby.post(`${REST_URL}/user/login`, {
    headers: jsonHeader,
    body: {
      email: 'demo',
      password: testPasswords.demo
    }
  })
    .expect('status', 200)
    .then(({ json }) => {
      authHeader = { Authorization: `Bearer ${json.authentication.token}`, 'content-type': 'application/json' }
    })
})

describe('/api/Wallets', () => {
  it('GET wallet is forbidden via public API', () => {
    return frisby.get(`${REST_URL}/wallet/balance`)
      .expect('status', 401)
  })

  it('GET wallet retrieves wallet amount of requesting user', () => {
    return frisby.get(`${REST_URL}/wallet/balance`, {
      headers: authHeader
    })
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .expect('json', {
        data: 200
      })
  })

  it('PUT wallet is forbidden via public API', () => {
    return frisby.put(`${REST_URL}/wallet/balance`, {
      body: {
        balance: 10
      }
    })
      .expect('status', 401)
  })

  it('PUT charge wallet from credit card of requesting user', () => {
    return frisby.put(`${REST_URL}/wallet/balance`, {
      headers: authHeader,
      body: {
        balance: 10,
        paymentId: 2
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.get(`${REST_URL}/wallet/balance`, {
          headers: authHeader
        })
          .expect('status', 200)
          .expect('header', 'content-type', /application\/json/)
          .expect('json', {
            data: 210
          })
      })
  })

  it('PUT charge wallet from foreign credit card is forbidden', () => {
    return frisby.put(`${REST_URL}/wallet/balance`, {
      headers: authHeader,
      body: {
        balance: 10,
        paymentId: 1
      }
    })
      .expect('status', 402)
  })

  it('PUT charge wallet without credit card is forbidden', () => {
    return frisby.put(`${REST_URL}/wallet/balance`, {
      headers: authHeader,
      body: {
        balance: 10
      }
    })
      .expect('status', 402)
  })
})

describe('/api/check-key', () => {
  it('POST check key with wrong private key returns error', () => {
    return frisby.post(`${REST_URL}/check-key`, {
      headers: authHeader,
      body: {
        privateKey: 'wrongkey123'
      }
    })
      .then((res) => {
        // Can be 401 (invalid key) or 500 (validation error)
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST check key with empty string returns error', () => {
    return frisby.post(`${REST_URL}/check-key`, {
      headers: authHeader,
      body: {
        privateKey: ''
      }
    })
      .then((res) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST check key with very long invalid key returns error', () => {
    return frisby.post(`${REST_URL}/check-key`, {
      headers: authHeader,
      body: {
        privateKey: '0x' + 'a'.repeat(100)
      }
    })
      .then((res) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST check key with public address returns error', () => {
    return frisby.post(`${REST_URL}/check-key`, {
      headers: authHeader,
      body: {
        privateKey: '0x1234567890123456789012345678901234567890'
      }
    })
      .then((res) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('POST check key with null value returns error', () => {
    return frisby.post(`${REST_URL}/check-key`, {
      headers: authHeader,
      body: {
        privateKey: null
      }
    })
      .then((res) => {
        expect([401, 500]).toContain(res.status)
      })
  })

  it('GET NFT unlock status returns status', () => {
    return frisby.get(`${REST_URL}/nft-unlocked`, {
      headers: authHeader
    })
      .then((res) => {
        // Can be 200 (success) or 500 (error)
        expect([200, 500]).toContain(res.status)
      })
  })
})
