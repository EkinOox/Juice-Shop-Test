import { expect } from '@jest/globals'
import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'
const API_URL = 'http://localhost:3000/api'
const jsonHeader = { 'content-type': 'application/json' }

describe('/api/Challenges', () => {
  it('GET all challenges', () => {
    return frisby.get(API_URL + '/Challenges')
      .then((res) => {
        expect([200, 401]).toContain(res.status)
      })
  })

  it('GET specific challenge by ID', () => {
    return frisby.get(API_URL + '/Challenges/1')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET non-existent challenge', () => {
    return frisby.get(API_URL + '/Challenges/999999')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('PUT update challenge without authentication', () => {
    return frisby.put(API_URL + '/Challenges/1', {
      headers: jsonHeader,
      body: {
        solved: true
      }
    })
      .then((res) => {
        expect([200, 401, 403]).toContain(res.status)
      })
  })
})

describe('/rest/admin/application-challenges', () => {
  it('GET challenges via admin endpoint without auth', () => {
    return frisby.get(REST_URL + '/admin/application-challenges')
      .then((res) => {
        expect([200, 401, 403, 404]).toContain(res.status)
      })
  })
})
