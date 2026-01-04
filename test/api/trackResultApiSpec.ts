import { expect } from '@jest/globals'
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
const Joi = frisby.Joi

const REST_URL = 'http://localhost:3000/rest'

describe('/rest/track-order/:id', () => {
  it('GET tracking results for the order id', () => {
    return frisby.get(REST_URL + '/track-order/5267-f9cd5882f54c75a3')
      .expect('status', 200)
      .expect('json', {})
  })

  it('GET all orders by injecting into orderId', () => {
    const product = Joi.object().keys({
      quantity: Joi.number(),
      name: Joi.string(),
      price: Joi.number(),
      total: Joi.number()
    })
    return frisby.get(REST_URL + '/track-order/%27%20%7C%7C%20true%20%7C%7C%20%27')
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .expect('jsonTypes', 'data.*', {
        orderId: Joi.string(),
        email: Joi.string(),
        totalPrice: Joi.number(),
        products: Joi.array().items(product),
        eta: Joi.string(),
        _id: Joi.string()
      })
  })

  it('GET track order with non-existent ID returns empty result', () => {
    return frisby.get(REST_URL + '/track-order/9999-nonexistent')
      .expect('status', 200)
      .expect('json', 'data', [{ orderId: '9999-nonexistent' }])
  })

  it('GET track order with XSS payload for reflected XSS challenge', () => {
    return frisby.get(REST_URL + '/track-order/' + encodeURIComponent('<iframe src="javascript:alert(`xss`)">'))
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET track order with very long ID triggers utils.trunc', () => {
    const longId = 'a'.repeat(100)
    return frisby.get(REST_URL + '/track-order/' + longId)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET track order with special characters', () => {
    return frisby.get(REST_URL + '/track-order/test-!@#$%')
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET track order error handling with invalid query', () => {
    return frisby.get(REST_URL + '/track-order/' + encodeURIComponent('invalid{query}'))
      .then((res) => {
        expect([200, 400]).toContain(res.status)
      })
  })
})
