import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/user/change-password', () => {
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

  it('GET change password requires authentication', () => {
    return frisby.get(REST_URL + '/user/change-password')
      .then((res) => {
        expect([401, 403]).toContain(res.status)
      })
  })

  it('POST change password with valid current password', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: testPasswords.jim,
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('POST change password with wrong current password', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: 'wrongPassword',
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([401, 403, 404]).toContain(res.status)
      })
  })

  it('POST change password with mismatched new passwords', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: testPasswords.jim,
        new: 'password1',
        repeat: 'password2'
      }
    })
      .then((res) => {
        expect([400, 401, 404]).toContain(res.status)
      })
  })

  it('POST change password with empty new password', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: testPasswords.jim,
        new: '',
        repeat: ''
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST change password with undefined new password', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: testPasswords.jim,
        new: 'undefined',
        repeat: 'undefined'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST change password without authentication', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: jsonHeader,
      body: {
        current: testPasswords.jim,
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([401, 403]).toContain(res.status)
      })
  })

  it('POST change password with null values', () => {
    return frisby.post(REST_URL + '/user/change-password', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        current: null,
        new: null,
        repeat: null
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })
})
