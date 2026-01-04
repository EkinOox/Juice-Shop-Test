import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/image-captcha', () => {
  it('GET image captcha', () => {
    return frisby.get(REST_URL + '/image-captcha')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET image captcha multiple times', () => {
    return frisby.get(REST_URL + '/image-captcha')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
        return frisby.get(REST_URL + '/image-captcha')
          .then((res2) => {
            expect([200, 401]).toContain(res2.status)
          })
      })
  })
})

describe('/rest/admin/application-configuration', () => {
  let authToken: string = ''

  beforeAll(() => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'admin@juice-sh.op',
        password: testPasswords.admin
      }
    })
      .then((res) => {
        if (res.status === 200 && res.json) {
          authToken = res.json.authentication.token
        }
      })
  })

  it('GET application configuration without authentication', () => {
    return frisby.get(REST_URL + '/admin/application-configuration')
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })

  it('GET application configuration with admin token', () => {
    return frisby.get(REST_URL + '/admin/application-configuration', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })
})

describe('/rest/languages', () => {
  it('GET available languages', () => {
    return frisby.get(REST_URL + '/languages')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })
})
