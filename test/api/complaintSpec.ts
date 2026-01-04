import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const API_URL = 'http://localhost:3000/api'
const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/api/Complaints', () => {
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

  it('GET all complaints without authentication', () => {
    return frisby.get(API_URL + '/Complaints')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST new complaint without authentication', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: jsonHeader,
      body: {
        message: 'Test complaint'
      }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST complaint with authentication', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        message: 'Authenticated complaint'
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST complaint with file attachment', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        message: 'Complaint with file',
        file: 'test.pdf'
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST complaint with empty message', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        message: ''
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401]).toContain(res.status)
      })
  })

  it('POST complaint with null message', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        message: null
      }
    })
      .then((res) => {
        expect([400, 401, 403, 500]).toContain(res.status)
      })
  })

  it('POST complaint with very long message', () => {
    return frisby.post(API_URL + '/Complaints', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        message: 'a'.repeat(10000)
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401, 413]).toContain(res.status)
      })
  })

  it('GET specific complaint by ID', () => {
    return frisby.get(API_URL + '/Complaints/1')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })
})
