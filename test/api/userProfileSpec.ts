/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { testPasswords } from '../testPasswords'
import config from 'config'

const URL = 'http://localhost:3000'

const jsonHeader = { 'content-type': 'application/json' }
let authHeader: { Cookie: any }

beforeAll(() => {
  return frisby.post(`${URL}/rest/user/login`, {
    headers: jsonHeader,
    body: {
      email: 'jim@juice-sh.op',
      password: testPasswords.jim
    }
  })
    .expect('status', 200)
    .then(({ json }) => {
      authHeader = { Cookie: `token=${json.authentication.token}` }
    })
})

describe('/profile', () => {
  it('GET user profile is forbidden for unauthenticated user', () => {
    return frisby.get(`${URL}/profile`)
      .expect('status', 500)
      .expect('header', 'content-type', /text\/html/)
      .expect('bodyContains', `<h1>${config.get<string>('application.name')} (Express`)
      .expect('bodyContains', 'Error: Blocked illegal activity')
  })

  it('GET user profile of authenticated user', () => {
    return frisby.get(`${URL}/profile`, {
      headers: authHeader
    })
      .expect('status', 200)
      .expect('header', 'content-type', /text\/html/)
      .expect('bodyContains', 'id="email" type="email" name="email" value="jim@juice-sh.op"')
  })

  it('POST update username of authenticated user', () => {
    const form = frisby.formData()
    form.append('username', 'Localhorst')

    return frisby.post(`${URL}/profile`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'], Cookie: authHeader.Cookie },
      body: form,
      redirect: 'manual'
    })
      .expect('status', 302)
  })

  xit('POST update username is forbidden for unauthenticated user', () => { // FIXME runs into "socket hang up"
    const form = frisby.formData()
    form.append('username', 'Localhorst')

    return frisby.post(`${URL}/profile`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'] },
      body: form
    })
      .expect('status', 500)
      .expect('header', 'content-type', /text\/html/)
      .expect('bodyContains', `<h1>${config.get<string>('application.name')} (Express`)
      .expect('bodyContains', 'Error: Blocked illegal activity')
  })

  it('GET user profile with SSTI pattern in username triggers eval', () => {
    // First, update the username to include SSTI pattern
    const form = frisby.formData()
    form.append('username', '#{7*7}')

    return frisby.post(`${URL}/profile`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'], Cookie: authHeader.Cookie },
      body: form,
      redirect: 'manual'
    })
      .expect('status', 302)
      .then(() => {
        // Then try to retrieve the profile
        return frisby.get(`${URL}/profile`, {
          headers: authHeader
        })
          .expect('status', 200)
      })
  })

  it('GET user profile with invalid SSTI code triggers error path', () => {
    // First, update the username to include invalid SSTI pattern
    const form = frisby.formData()
    form.append('username', '#{throw new Error("test")}')

    return frisby.post(`${URL}/profile`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'], Cookie: authHeader.Cookie },
      body: form,
      redirect: 'manual'
    })
      .expect('status', 302)
      .then(() => {
        // Then try to retrieve the profile
        return frisby.get(`${URL}/profile`, {
          headers: authHeader
        })
          .expect('status', 200)
          .expect('bodyContains', '\\#{throw new Error("test")}')
      })
  })

  it('GET user profile with null username triggers error path', () => {
    // First update username to null pattern
    const form = frisby.formData()
    form.append('username', '')

    return frisby.post(`${URL}/profile`, {
      // @ts-expect-error FIXME form.getHeaders() is not found
      headers: { 'Content-Type': form.getHeaders()['content-type'], Cookie: authHeader.Cookie },
      body: form,
      redirect: 'manual'
    })
      .expect('status', 302)
      .then(() => {
        return frisby.get(`${URL}/profile`, {
          headers: authHeader
        })
          .expect('status', 200)
      })
  })
})
