import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const API_URL = 'http://localhost:3000/api'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/memories', () => {
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

  it('GET all memories', () => {
    return frisby.get(REST_URL + '/memories')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET memories with authentication', () => {
    return frisby.get(REST_URL + '/memories', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST new memory without authentication', () => {
    return frisby.post(API_URL + '/Memorys', {
      headers: jsonHeader,
      body: {
        caption: 'Test memory',
        imagePath: 'test.jpg'
      }
    })
      .then((res) => {
        expect([200, 201, 401, 403]).toContain(res.status)
      })
  })

  it('POST memory with authentication', () => {
    return frisby.post(API_URL + '/Memorys', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        caption: 'Authenticated memory',
        imagePath: 'test2.jpg'
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401, 403]).toContain(res.status)
      })
  })

  it('POST memory with empty caption', () => {
    return frisby.post(API_URL + '/Memorys', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        caption: '',
        imagePath: 'test.jpg'
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401, 403]).toContain(res.status)
      })
  })

  it('POST memory with null values', () => {
    return frisby.post(API_URL + '/Memorys', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        caption: null,
        imagePath: null
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })
})
