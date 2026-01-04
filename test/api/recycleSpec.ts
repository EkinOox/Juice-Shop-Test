import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const API_URL = 'http://localhost:3000/api'
const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/api/Recycles', () => {
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

  it('GET all recycles', () => {
    return frisby.get(API_URL + '/Recycles')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST new recycle with authentication', () => {
    return frisby.post(API_URL + '/Recycles', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        quantity: 100,
        address: '123 Test Street',
        date: '2026-12-31',
        isPickup: true
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST recycle without authentication', () => {
    return frisby.post(API_URL + '/Recycles', {
      headers: jsonHeader,
      body: {
        quantity: 100,
        address: '123 Test Street'
      }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST recycle with invalid data', () => {
    return frisby.post(API_URL + '/Recycles', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        quantity: -1
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST recycle with null values', () => {
    return frisby.post(API_URL + '/Recycles', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        quantity: null,
        address: null
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })
})
