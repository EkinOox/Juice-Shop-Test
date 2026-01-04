/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import config from 'config'
import { testPasswords } from '../testPasswords'

const jsonHeader = { 'content-type': 'application/json' }
const REST_URL = 'http://localhost:3000/rest'

describe('/rest/order-history', () => {
  it('GET own previous orders', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/order-history', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        })
          .expect('status', 200)
          .then(({ json }) => {
            expect(json.data[0].totalPrice).toBe(8.96)
            expect(json.data[0].delivered).toBe(false)
            expect(json.data[0].products[0].quantity).toBe(3)
            expect(json.data[0].products[0].name).toBe('Apple Juice (1000ml)')
            expect(json.data[0].products[0].price).toBe(1.99)
            expect(json.data[0].products[0].total).toBe(5.97)
            expect(json.data[0].products[1].quantity).toBe(1)
            expect(json.data[0].products[1].name).toBe('Orange Juice (1000ml)')
            expect(json.data[0].products[1].price).toBe(2.99)
            expect(json.data[0].products[1].total).toBe(2.99)
            expect(json.data[1].totalPrice).toBe(26.97)
            expect(json.data[1].delivered).toBe(true)
            expect(json.data[1].products[0].quantity).toBe(3)
            expect(json.data[1].products[0].name).toBe('Eggfruit Juice (500ml)')
            expect(json.data[1].products[0].price).toBe(8.99)
            expect(json.data[1].products[0].total).toBe(26.97)
          })
      })
  })
})

describe('/rest/order-history/orders', () => {
  it('GET all orders is forbidden for customers', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/order-history/orders', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        })
          .expect('status', 403)
      })
  })

  it('GET all orders is forbidden for admin', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/order-history/orders', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        })
          .expect('status', 403)
      })
  })

  it('GET all orders for accountant', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/order-history/orders', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        })
          .expect('status', 200)
      })
  })

  it('GET order history without authentication', () => {
    return frisby.get(REST_URL + '/order-history')
      .then((res) => {
        expect([401, 500]).toContain(res.status)
      })
  })
})

describe('/rest/order-history/:id/delivery-status', () => {
  it('PUT delivery status is forbidden for admin', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@' + config.get<string>('application.domain'),
        password: testPasswords.admin
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/1/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            delivered: false
          }
        })
          .expect('status', 403)
      })
  })

  it('PUT delivery status is forbidden for customer', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get<string>('application.domain'),
        password: testPasswords.jim
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/1/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            delivered: false
          }
        })
          .expect('status', 403)
      })
  })

  it('PUT delivery status is allowed for accountant', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/1/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            delivered: false
          }
        })
          .expect('status', 200)
      })
  })

  it('PUT toggle delivery status from false to true', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/1/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            deliveryStatus: false
          }
        })
          .expect('status', 200)
          .then(() => {
            return frisby.put(REST_URL + '/order-history/1/delivery-status', {
              headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
              body: {
                deliveryStatus: true
              }
            })
              .expect('status', 200)
          })
      })
  })

  it('PUT delivery status update with different order IDs', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/2/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            delivered: true
          }
        })
          .expect('status', 200)
      })
  })

  it('GET all orders for accountant to test mongodb find without query', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.get(REST_URL + '/order-history/orders', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' }
        })
          .expect('status', 200)
          .then(({ json }) => {
            expect(json.status).toBe('success')
            expect(Array.isArray(json.data)).toBe(true)
          })
      })
  })

  it('PUT delivery status with $set update mechanism', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'accountant@' + config.get<string>('application.domain'),
        password: testPasswords.accountant
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.put(REST_URL + '/order-history/1/delivery-status', {
          headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
          body: {
            deliveryStatus: true
          }
        })
          .expect('status', 200)
          .then(() => {
            return frisby.put(REST_URL + '/order-history/1/delivery-status', {
              headers: { Authorization: 'Bearer ' + jsonLogin.authentication.token, 'content-type': 'application/json' },
              body: {
                deliveryStatus: false
              }
            })
              .expect('status', 200)
          })
      })
  })
})
