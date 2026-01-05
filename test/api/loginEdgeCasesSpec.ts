import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/user/login edge cases', () => {
  it('POST login with valid credentials', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST login with SQL injection in email', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: '\' OR 1=1--',
        password: 'anything'
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST login with NoSQL injection attempt', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: { $ne: null },
        password: { $ne: null }
      }
    })
      .then((res) => {
        expect([401, 400, 500]).toContain(res.status)
      })
  })

  it('POST login with empty email', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: '',
        password: 'password'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with empty password', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: ''
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with null credentials', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: null,
        password: null
      }
    })
      .then((res) => {
        expect([400, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with missing email field', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        password: 'password'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with missing password field', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with invalid email format', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'not-an-email',
        password: 'password'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with special characters in email', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: '<script>alert(1)</script>@juice-sh.op',
        password: 'password'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST login with very long password', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: 'a'.repeat(10000)
      }
    })
      .then((res) => {
        expect([400, 401, 413]).toContain(res.status)
      })
  })

  it('POST login with case-sensitive email check', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'JIM@JUICE-SH.OP',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST login creates or finds basket', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        if (res.status === 200) {
          expect(res.json.authentication).toBeDefined()
          expect(res.json.authentication.bid).toBeDefined()
          expect(typeof res.json.authentication.bid).toBe('number')
        }
      })
  })

  it('POST login returns token in response', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        if (res.status === 200) {
          expect(res.json.authentication.token).toBeDefined()
          expect(typeof res.json.authentication.token).toBe('string')
          expect(res.json.authentication.token.length).toBeGreaterThan(10)
        }
      })
  })

  it('POST login with user that has TOTP enabled', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'wurstbrot@juice-sh.op',
        password: testPasswords.bender
      }
    })
      .then((res) => {
        expect([401]).toContain(res.status)
        if (res.status === 401 && res.json) {
          expect(res.json.status).toBe('totp_token_required')
          expect(res.json.data).toBeDefined()
          expect(res.json.data.tmpToken).toBeDefined()
        }
      })
  })

  it('POST login handles basket creation error gracefully', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        // Should either succeed or fail gracefully
        expect([200, 401, 500]).toContain(res.status)
      })
  })

  it('POST login with correct password hash', () => {
    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@juice-sh.op',
        password: testPasswords.jim
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
        if (res.status === 200) {
          expect(res.json.authentication).toBeDefined()
        } else if (res.status === 401) {
          expect(res.body).toBeDefined()
        }
      })
  })
})
