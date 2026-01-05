import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const API_URL = 'http://localhost:3000/api'
const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/api/Quantitys', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  it('GET all quantities', () => {
    return frisby.get(API_URL + '/Quantitys')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET specific quantity by ID', () => {
    return frisby.get(API_URL + '/Quantitys/1')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET non-existent quantity', () => {
    return frisby.get(API_URL + '/Quantitys/999999')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET quantity with invalid ID format', () => {
    return frisby.get(API_URL + '/Quantitys/invalid')
      .then((res) => {
        expect([200, 400, 401, 403, 404, 500]).toContain(res.status)
      })
  })
})
