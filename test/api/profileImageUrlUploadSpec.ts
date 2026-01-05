/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import frisby = require('frisby')

const API_URL = 'http://localhost:3000/profile/image/url'
const REST_URL = 'http://localhost:3000/rest'

describe('/profile/image/url', () => {
  it('POST with invalid URL format', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'not-a-valid-url'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with private IP address (localhost)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'http://localhost:3000/some-image.jpg'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with private IP address (192.168.x.x)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'http://192.168.1.1/image.jpg'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with private IP address (10.x.x.x)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'http://10.0.0.1/image.jpg'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with file:// protocol (blocked)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'file:///etc/passwd'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with ftp:// protocol (blocked)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'ftp://example.com/image.jpg'
          }
        })
          .expect('status', 302)
      })
  })

  it('POST without authentication (blocked)', () => {
    return frisby.post(API_URL, {
      body: {
        imageUrl: 'http://example.com/image.jpg'
      }
    })
      .expect('status', 500)
  })

  it('POST with empty imageUrl', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: ''
          }
        })
          .expect('status', 302)
      })
  })

  it('POST with valid external image URL', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(API_URL, {
          headers: {
            Cookie: 'token=' + json.authentication.token
          },
          body: {
            imageUrl: 'http://example.com/test.jpg'
          }
        })
          .expect('status', 302)
      })
  })
})
