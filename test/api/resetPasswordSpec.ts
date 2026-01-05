import { expect } from '@jest/globals'
import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/user/reset-password', () => {
  it('POST password reset with attempt', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        answer: 'test',
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })

  it('POST password reset with wrong security answer', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        answer: 'WrongAnswer',
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([401, 403]).toContain(res.status)
      })
  })

  it('POST password reset with mismatched passwords', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        answer: 'Samuel',
        new: 'password1',
        repeat: 'password2'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST password reset with empty email', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: '',
        answer: 'answer',
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([400, 401, 404]).toContain(res.status)
      })
  })

  it('POST password reset with null values', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: null,
        answer: null,
        new: null,
        repeat: null
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST password reset with missing fields', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op'
      }
    })
      .then((res) => {
        expect([400, 401, 404]).toContain(res.status)
      })
  })

  it('POST password reset with empty new password', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        answer: 'Samuel',
        new: '',
        repeat: ''
      }
    })
      .then((res) => {
        expect([401, 400]).toContain(res.status)
      })
  })

  it('POST password reset with undefined new password', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        answer: 'Samuel',
        new: 'undefined',
        repeat: 'undefined'
      }
    })
      .then((res) => {
        expect([401, 400]).toContain(res.status)
      })
  })

  it('POST password reset with non-existent user', () => {
    return frisby.post(REST_URL + '/user/reset-password', {
      headers: jsonHeader,
      body: {
        email: 'nonexistent@example.com',
        answer: 'answer',
        new: 'newPassword123',
        repeat: 'newPassword123'
      }
    })
      .then((res) => {
        expect([401, 404]).toContain(res.status)
      })
  })
})
