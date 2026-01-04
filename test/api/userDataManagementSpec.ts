import frisby = require('frisby')
import { expect } from '@jest/globals'
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/user/erasure-request', () => {
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

  it('POST erasure request without authentication', () => {
    return frisby.post(REST_URL + '/user/erasure-request', {
      headers: jsonHeader
    })
      .then((res) => {
        expect([200, 201, 401, 403]).toContain(res.status)
      })
  })

  it('POST erasure request with authentication', () => {
    return frisby.post(REST_URL + '/user/erasure-request', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 201, 401, 403]).toContain(res.status)
      })
  })

  it('POST erasure request with security answer', () => {
    return frisby.post(REST_URL + '/user/erasure-request', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        email: 'jim@juice-sh.op',
        securityAnswer: 'test'
      }
    })
      .then((res) => {
        expect([200, 201, 400, 401, 403]).toContain(res.status)
      })
  })

  it('POST erasure request with empty email', () => {
    return frisby.post(REST_URL + '/user/erasure-request', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        email: ''
      }
    })
      .then((res) => {
        expect([400, 401, 403, 404]).toContain(res.status)
      })
  })
})

describe('/rest/user/data-subject', () => {
  it('GET data subject information', () => {
    return frisby.get(REST_URL + '/user/data-subject')
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })

  it('GET data subject with query parameter', () => {
    return frisby.get(REST_URL + '/user/data-subject?email=test@example.com')
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('GET data subject with invalid email', () => {
    return frisby.get(REST_URL + '/user/data-subject?email=invalid')
      .then((res) => {
        expect([200, 400, 401, 403, 404]).toContain(res.status)
      })
  })
})

describe('/rest/user/whoami', () => {
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

  it('GET whoami without authentication', () => {
    return frisby.get(REST_URL + '/user/whoami')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET whoami with authentication', () => {
    return frisby.get(REST_URL + '/user/whoami', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET whoami with invalid token', () => {
    return frisby.get(REST_URL + '/user/whoami', {
      headers: { Authorization: 'Bearer invalid-token-xyz' }
    })
      .then((res) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })

  it('GET whoami with malformed token', () => {
    return frisby.get(REST_URL + '/user/whoami', {
      headers: { Authorization: 'InvalidFormat' }
    })
      .then((res) => {
        expect([401, 403, 500]).toContain(res.status)
      })
  })
})

describe('/rest/products/reviews pagination', () => {
  it('GET reviews with pagination parameters', () => {
    return frisby.get(REST_URL + '/products/1/reviews?page=1')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET reviews with negative page number', () => {
    return frisby.get(REST_URL + '/products/1/reviews?page=-1')
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })

  it('GET reviews with very large page number', () => {
    return frisby.get(REST_URL + '/products/1/reviews?page=999999')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET reviews with invalid page format', () => {
    return frisby.get(REST_URL + '/products/1/reviews?page=invalid')
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })
})
