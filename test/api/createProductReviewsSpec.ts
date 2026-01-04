/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import frisby = require('frisby')

const REST_URL = 'http://localhost:3000/rest'

describe('/rest/products/:id/reviews', () => {
  it('POST review with empty author name', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: '',
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid author name')
      })
  })

  it('POST review with author name only whitespace', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: '   ',
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid author name')
      })
  })

  it('POST review with author name too long (>100 chars)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'a'.repeat(101),
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid author name')
      })
  })

  it('POST review with empty message', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: ''
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid message content')
      })
  })

  it('POST review with message only whitespace', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: '   '
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid message content')
      })
  })

  it('POST review with message too long (>1000 chars)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: 'a'.repeat(1001)
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid message content')
      })
  })

  it('POST review with invalid product ID (NaN)', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/invalid/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid product ID')
      })
  })

  it('POST review with negative product ID', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/-1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid product ID')
      })
  })

  it('POST review with author not a string type', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 12345,
            message: 'This is a test review'
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid author name')
      })
  })

  it('POST review with message not a string type', () => {
    return frisby.post(REST_URL + '/user/login', {
      body: {
        email: 'jim@juice-sh.op',
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json }) => {
        return frisby.post(REST_URL + '/products/1/reviews', {
          headers: {
            Authorization: 'Bearer ' + json.authentication.token
          },
          body: {
            author: 'Test Author',
            message: 12345
          }
        })
          .expect('status', 400)
          .expect('json', 'error', 'Invalid message content')
      })
  })
})
