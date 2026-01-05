/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '@jest/globals'
import frisby = require('frisby')

const URL = 'http://localhost:3000'
const REST_URL = `${URL}/rest`

describe('/rest/captcha', () => {
  it('GET captcha returns a mathematical expression', () => {
    return frisby.get(`${REST_URL}/captcha`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then((res: any) => {
        expect(res.json).toBeDefined()
        expect(res.json.captcha).toBeDefined()
        expect(res.json.answer).toBeDefined()
      })
  })

  it('GET captcha contains captchaId', () => {
    return frisby.get(`${REST_URL}/captcha`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.captchaId).toBeDefined()
        expect(typeof res.json.captchaId).toBe('number')
      })
  })

  it('GET captcha expression uses valid operators', () => {
    return frisby.get(`${REST_URL}/captcha`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.captcha).toMatch(/[0-9+\-*]+/)
      })
  })
})

describe('/rest/image-captcha', () => {
  it('GET image captcha returns captcha data', () => {
    return frisby.get(`${REST_URL}/image-captcha`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then((res: any) => {
        expect(res.json).toBeDefined()
        expect(res.json.captcha).toBeDefined()
      })
  })

  it('GET image captcha returns base64 encoded image', () => {
    return frisby.get(`${REST_URL}/image-captcha`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.image).toBeDefined()
        expect(res.json.image).toContain('data:image/')
      })
  })

  it('GET image captcha contains answer and captchaId', () => {
    return frisby.get(`${REST_URL}/image-captcha`)
      .expect('status', 200)
      .then((res: any) => {
        expect(res.json.answer).toBeDefined()
        expect(res.json.captchaId).toBeDefined()
      })
  })
})
