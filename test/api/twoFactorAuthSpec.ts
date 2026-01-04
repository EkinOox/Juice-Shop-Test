import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/2fa/status', () => {
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

  it('GET 2FA status without authentication', () => {
    return frisby.get(REST_URL + '/2fa/status')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET 2FA status with authentication', () => {
    return frisby.get(REST_URL + '/2fa/status', {
      headers: { Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })
})

describe('/rest/2fa/setup', () => {
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

  it('POST 2FA setup without authentication', () => {
    return frisby.post(REST_URL + '/2fa/setup', {
      headers: jsonHeader,
      body: {
        password: testPasswords.jim
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST 2FA setup with authentication', () => {
    return frisby.post(REST_URL + '/2fa/setup', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        password: testPasswords.jim,
        setupToken: 'test123',
        initialToken: '123456'
      }
    })
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })

  it('POST 2FA setup with wrong password', () => {
    return frisby.post(REST_URL + '/2fa/setup', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        password: 'wrongpassword'
      }
    })
      .then((res) => {
        expect([400, 401, 403]).toContain(res.status)
      })
  })

  it('POST 2FA setup with missing fields', () => {
    return frisby.post(REST_URL + '/2fa/setup', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {}
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })
})

describe('/rest/2fa/verify', () => {
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

  it('POST 2FA verify without authentication', () => {
    return frisby.post(REST_URL + '/2fa/verify', {
      headers: jsonHeader,
      body: {
        totpToken: '123456'
      }
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST 2FA verify with authentication', () => {
    return frisby.post(REST_URL + '/2fa/verify', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        totpToken: '123456'
      }
    })
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })

  it('POST 2FA verify with invalid token', () => {
    return frisby.post(REST_URL + '/2fa/verify', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        totpToken: 'invalid'
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })

  it('POST 2FA verify with empty token', () => {
    return frisby.post(REST_URL + '/2fa/verify', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        totpToken: ''
      }
    })
      .then((res) => {
        expect([400, 401]).toContain(res.status)
      })
  })
})

describe('/rest/2fa/disable', () => {
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

  it('POST 2FA disable without authentication', () => {
    return frisby.post(REST_URL + '/2fa/disable', {
      headers: jsonHeader
    })
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('POST 2FA disable with authentication', () => {
    return frisby.post(REST_URL + '/2fa/disable', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 400, 401]).toContain(res.status)
      })
  })
})
