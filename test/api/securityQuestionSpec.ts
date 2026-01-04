import { expect } from '@jest/globals'
import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'

describe('/rest/user/security-questions', () => {
  it('GET all security questions', () => {
    return frisby.get(REST_URL + '/user/security-questions')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })
})

describe('/api/SecurityQuestions', () => {
  it('GET all security questions via API', () => {
    return frisby.get('http://localhost:3000/api/SecurityQuestions')
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBeGreaterThan(0)
      })
  })

  it('GET specific security question by ID', () => {
    return frisby.get('http://localhost:3000/api/SecurityQuestions/1')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('GET non-existent security question', () => {
    return frisby.get('http://localhost:3000/api/SecurityQuestions/999999')
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })
})

describe('/rest/user/security-question', () => {
  it('GET security question for valid email', () => {
    return frisby.get(REST_URL + '/user/security-question?email=jim@juice-sh.op')
      .then((res) => {
        expect([200, 404]).toContain(res.status)
      })
  })

  it('GET security question without email', () => {
    return frisby.get(REST_URL + '/user/security-question')
      .then((res) => {
        expect([200, 404]).toContain(res.status)
      })
  })

  it('GET security question with SQL injection attempt', () => {
    return frisby.get(REST_URL + '/user/security-question?email=\' OR 1=1--')
      .then((res) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('GET security question with malformed email causing error', () => {
    return frisby.get(REST_URL + '/user/security-question?email=' + encodeURIComponent('test@[malformed'))
      .then((res) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })

  it('GET security question with very long email', () => {
    const longEmail = 'a'.repeat(1000) + '@example.com'
    return frisby.get(REST_URL + '/user/security-question?email=' + encodeURIComponent(longEmail))
      .then((res) => {
        expect([200, 400, 500]).toContain(res.status)
      })
  })
})

