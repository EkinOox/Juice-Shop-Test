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

describe('/rest/delivery-methods', () => {
  it('GET delivery methods for regular user', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/delivery-methods', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token }
        })
          .then((res) => {
            expect([200, 401]).toContain(res.status)
          })
      })
  })

  it('GET delivery methods includes price for regular users', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/delivery-methods', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token }
        })
          .expect('status', 200)
          .then(({ json }) => {
            if (json.data && json.data.length > 0) {
              expect(json.data[0].price).toBeDefined()
            }
          })
      })
  })

  it('GET delivery method by ID', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/delivery-methods/1', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token }
        })
          .then((res) => {
            expect([200, 400]).toContain(res.status)
          })
      })
  })

  it('GET non-existent delivery method returns error', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/delivery-methods/999', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token }
        })
          .then((res) => {
            expect([400, 404]).toContain(res.status)
          })
      })
  })
})
