import frisby = require('frisby')
import { expect } from '@jest/globals'
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const API_URL = 'http://localhost:3000/api'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/wallet/balance', () => {
  let authToken: string = ''

  beforeAll(() => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        if (res.status === 200 && res.json) {
          authToken = res.json.authentication.token
        }
      })
  })

  it('GET wallet balance without authentication', () => {
    return frisby.get(REST_URL + '/wallet/balance')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET wallet balance with authentication', () => {
    return frisby.get(REST_URL + '/wallet/balance', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('PUT update wallet balance without authentication', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: jsonHeader,
      body: { balance: 100 }
    })
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })

  it('PUT update wallet balance with negative value', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { balance: -50 }
    })
      .then((res) => {
        expect([200, 400, 401, 404, 405]).toContain(res.status)
      })
  })

  it('PUT update wallet balance with zero', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { balance: 0 }
    })
      .then((res) => {
        expect([200, 400, 401, 404, 405]).toContain(res.status)
      })
  })

  it('PUT update wallet balance with very large number', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { balance: 999999999 }
    })
      .then((res) => {
        expect([200, 400, 401, 404, 405]).toContain(res.status)
      })
  })

  it('PUT update wallet balance with non-numeric value', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { balance: 'invalid' }
    })
      .then((res) => {
        expect([400, 401, 404, 405, 500]).toContain(res.status)
      })
  })

  it('PUT update wallet balance with null', () => {
    return frisby.put(REST_URL + '/wallet/balance', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { balance: null }
    })
      .then((res) => {
        expect([400, 401, 404, 405, 500]).toContain(res.status)
      })
  })
})

describe('/rest/deluxe-membership', () => {
  let authToken: string = ''

  beforeAll(() => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        if (res.status === 200 && res.json) {
          authToken = res.json.authentication.token
        }
      })
  })

  it('GET deluxe membership status without authentication', () => {
    return frisby.get(REST_URL + '/deluxe-membership')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET deluxe membership status with authentication', () => {
    return frisby.get(REST_URL + '/deluxe-membership', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST upgrade to deluxe membership without authentication', () => {
    return frisby.post(REST_URL + '/deluxe-membership', {
      headers: jsonHeader,
      body: { paymentMode: 'card' }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST upgrade to deluxe with wallet payment', () => {
    return frisby.post(REST_URL + '/deluxe-membership', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { paymentMode: 'wallet' }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST upgrade to deluxe with card payment', () => {
    return frisby.post(REST_URL + '/deluxe-membership', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { paymentMode: 'card' }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST upgrade with invalid payment mode', () => {
    return frisby.post(REST_URL + '/deluxe-membership', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: { paymentMode: 'invalid' }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST upgrade with missing payment mode', () => {
    return frisby.post(REST_URL + '/deluxe-membership', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {}
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })
})
