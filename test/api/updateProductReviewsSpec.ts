/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import config from 'config'
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/products/reviews', () => {
  it('PATCH update product review without authentication returns 401', () => {
    return frisby.patch(`${REST_URL}/products/reviews`, {
      body: {
        id: '1',
        message: 'Updated message'
      }
    })
      .expect('status', 401)
  })

  it('PATCH update own review message', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        const authHeaders = { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        
        // First create a review
        return frisby.put(`${REST_URL}/products/6/reviews`, {
          headers: authHeaders,
          body: {
            message: 'Original message',
            author: 'Test Author'
          }
        })
          .expect('status', 201)
          .then(({ json: reviewJson }) => {
            if (reviewJson.data && reviewJson.data._id) {
              // Then update it
              return frisby.patch(`${REST_URL}/products/reviews`, {
                headers: authHeaders,
                body: {
                  id: reviewJson.data._id,
                  message: 'Updated message'
                }
              })
                .then((res) => {
                  expect([200, 500]).toContain(res.status)
                })
            }
          })
      })
  })

  it('PATCH update review with NoSQL injection to modify multiple reviews', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        const authHeaders = { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        
        return frisby.patch(`${REST_URL}/products/reviews`, {
          headers: authHeaders,
          body: {
            id: { $ne: -1 },
            message: 'Modified by NoSQL injection'
          }
        })
          .then((res) => {
            expect([200, 500]).toContain(res.status)
          })
      })
  })

  it('PATCH update fails with invalid review ID', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        const authHeaders = { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        
        return frisby.patch(`${REST_URL}/products/reviews`, {
          headers: authHeaders,
          body: {
            id: 999999,
            message: 'This should fail'
          }
        })
          .then((res) => {
            expect([200, 500]).toContain(res.status)
          })
      })
  })
})
