import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/saveLoginIp', () => {
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

  it('POST save login IP with authentication', () => {
    return frisby.post(REST_URL + '/saveLoginIp', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST save login IP without authentication', () => {
    return frisby.post(REST_URL + '/saveLoginIp', {
      headers: jsonHeader
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST save login IP with custom IP header', () => {
    return frisby.post(REST_URL + '/saveLoginIp', {
      headers: { 
        ...jsonHeader, 
        Authorization: 'Bearer ' + authToken,
        'X-Forwarded-For': '192.168.1.100'
      }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST save login IP with true-client-ip header', () => {
    return frisby.post(REST_URL + '/saveLoginIp', {
      headers: { 
        ...jsonHeader, 
        Authorization: 'Bearer ' + authToken,
        'True-Client-IP': '10.0.0.1'
      }
    })
      .then((res) => {
        expect([200, 201, 401]).toContain(res.status)
      })
  })

  it('POST save login IP with array of IPs in true-client-ip header', () => {
    return frisby.post(REST_URL + '/saveLoginIp', {
      headers: { 
        ...jsonHeader, 
        Authorization: 'Bearer ' + authToken,
        'True-Client-IP': ['10.0.0.1', '192.168.1.1']
      }
    })
      .then((res) => {
        expect([200, 201]).toContain(res.status)
      })
  })
})
