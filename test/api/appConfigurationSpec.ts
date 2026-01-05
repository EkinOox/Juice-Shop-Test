/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/admin/application-configuration', () => {
  it('GET application configuration returns config object', () => {
    return frisby.get(`${REST_URL}/admin/application-configuration`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then((res: any) => {
        expect(res.json.config).toBeDefined()
      })
  })

  it('GET application configuration contains expected properties', () => {
    return frisby.get(`${REST_URL}/admin/application-configuration`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.config).toHaveProperty('application')
        expect(res.json.config.application).toHaveProperty('name')
        expect(res.json.config.application).toHaveProperty('domain')
      })
  })

  it('GET application configuration is accessible without authentication', () => {
    return frisby.get(`${REST_URL}/admin/application-configuration`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json).toBeDefined()
        expect(res.json.config).toBeDefined()
      })
  })
})
