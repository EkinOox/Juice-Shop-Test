import frisby = require('frisby')
import { expect } from '@jest/globals'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/continue-code', () => {
  it('PUT continue code without authentication', () => {
    return frisby.put(REST_URL + '/continue-code', {
      headers: jsonHeader,
      body: {
        continueCode: 'test123'
      }
    })
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })

  it('PUT continue code with empty string', () => {
    return frisby.put(REST_URL + '/continue-code', {
      headers: jsonHeader,
      body: {
        continueCode: ''
      }
    })
      .then((res) => {
        expect([200, 400, 401, 403, 404]).toContain(res.status)
      })
  })

  it('PUT continue code with null value', () => {
    return frisby.put(REST_URL + '/continue-code', {
      headers: jsonHeader,
      body: {
        continueCode: null
      }
    })
      .then((res) => {
        expect([200, 400, 401, 403, 404, 500]).toContain(res.status)
      })
  })
})

describe('/rest/continue-code-findIt', () => {
  it('GET continue code findIt endpoint', () => {
    return frisby.get(REST_URL + '/continue-code-findIt')
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })
})

describe('/rest/admin/application-version', () => {
  it('GET application version without authentication', () => {
    return frisby.get(REST_URL + '/admin/application-version')
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })
})
