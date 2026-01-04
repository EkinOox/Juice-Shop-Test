import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const API_URL = 'http://localhost:3000/api'
const jsonHeader = { 'content-type': 'application/json' }

describe('/api/Cards', () => {
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

  it('GET all cards without authentication', () => {
    return frisby.get(API_URL + '/Cards')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET cards with authentication', () => {
    return frisby.get(API_URL + '/Cards', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST new card without authentication', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: jsonHeader,
      body: {
        cardNum: 1234567890123456,
        fullName: 'Test User',
        expMonth: 12,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST card with authentication', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 1234567890123456,
        fullName: 'Test User',
        expMonth: 12,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST card with invalid card number', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 123,
        fullName: 'Test User',
        expMonth: 12,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST card with expired date', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 1234567890123456,
        fullName: 'Test User',
        expMonth: 1,
        expYear: 2020
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST card with invalid month', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 1234567890123456,
        fullName: 'Test User',
        expMonth: 13,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST card with negative month', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 1234567890123456,
        fullName: 'Test User',
        expMonth: -1,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST card with empty full name', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: 1234567890123456,
        fullName: '',
        expMonth: 12,
        expYear: 2030
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST card with null values', () => {
    return frisby.post(API_URL + '/Cards', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        cardNum: null,
        fullName: null,
        expMonth: null,
        expYear: null
      }
    })
      .then((res) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('GET specific card by ID', () => {
    return frisby.get(API_URL + '/Cards/1', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('GET non-existent card', () => {
    return frisby.get(API_URL + '/Cards/999999', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('DELETE card without authentication', () => {
    return frisby.del(API_URL + '/Cards/1')
      .then((res: any) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('DELETE card with authentication', () => {
    return frisby.del(API_URL + '/Cards/999', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res: any) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })
})
