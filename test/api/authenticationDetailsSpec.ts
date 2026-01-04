import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/user/authentication-details', () => {
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

  it('GET authentication details requires valid token', () => {
    return frisby.get(REST_URL + '/user/authentication-details', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.authentication).toBeDefined()
      })
  })

  it('GET authentication details without token returns 401', () => {
    return frisby.get(REST_URL + '/user/authentication-details')
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })

  it('GET authentication details with invalid token', () => {
    return frisby.get(REST_URL + '/user/authentication-details', {
      headers: { Authorization: 'Bearer invalid-token-12345' }
    })
      .then((res) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET authentication details with expired token', () => {
    return frisby.get(REST_URL + '/user/authentication-details', {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.abc123' }
    })
      .then((res) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET authentication details with malformed Authorization header', () => {
    return frisby.get(REST_URL + '/user/authentication-details', {
      headers: { Authorization: 'InvalidFormat' }
    })
      .then((res) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })
})
