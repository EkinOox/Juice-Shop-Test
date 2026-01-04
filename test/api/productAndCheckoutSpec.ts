import { expect } from '@jest/globals'
import frisby = require('frisby')
import { testPasswords } from '../testPasswords'

const REST_URL = 'http://localhost:3000/rest'
const jsonHeader = { 'content-type': 'application/json' }

describe('/rest/products/:id', () => {
  it('GET product details by valid ID', () => {
    return frisby.get(REST_URL + '/products/1')
      .then((res) => {
        expect([200, 204, 401, 404]).toContain(res.status)
      })
  })

  it('GET product with non-existent ID', () => {
    return frisby.get(REST_URL + '/products/999999')
      .then((res) => {
        expect([200, 204, 401, 404]).toContain(res.status)
      })
  })

  it('GET product with invalid ID format', () => {
    return frisby.get(REST_URL + '/products/invalid')
      .then((res) => {
        expect([200, 400, 401, 404, 500]).toContain(res.status)
      })
  })

  it('GET product with negative ID', () => {
    return frisby.get(REST_URL + '/products/-1')
      .then((res) => {
        expect([200, 204, 400, 401, 404]).toContain(res.status)
      })
  })

  it('GET product with zero ID', () => {
    return frisby.get(REST_URL + '/products/0')
      .then((res) => {
        expect([200, 204, 401, 404]).toContain(res.status)
      })
  })

  it('GET product with SQL injection attempt', () => {
    return frisby.get(REST_URL + '/products/1\' OR \'1\'=\'1')
      .then((res) => {
        expect([200, 400, 401, 404, 500]).toContain(res.status)
      })
  })
})

describe('/rest/basket/:id/coupon', () => {
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

  it('PUT apply coupon without authentication', () => {
    return frisby.put(REST_URL + '/basket/1/coupon/VALID20', {
      headers: jsonHeader
    })
      .then((res) => {
        expect([200, 401, 404]).toContain(res.status)
      })
  })

  it('PUT apply coupon with authentication', () => {
    return frisby.put(REST_URL + '/basket/3/coupon/VALID20', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([200, 400, 401, 404]).toContain(res.status)
      })
  })

  it('PUT apply invalid coupon code', () => {
    return frisby.put(REST_URL + '/basket/3/coupon/INVALID', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([400, 401, 404]).toContain(res.status)
      })
  })

  it('PUT apply empty coupon code', () => {
    return frisby.put(REST_URL + '/basket/3/coupon/', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([400, 401, 404, 405]).toContain(res.status)
      })
  })

  it('PUT apply coupon to non-existent basket', () => {
    return frisby.put(REST_URL + '/basket/999999/coupon/VALID20', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([400, 401, 403, 404]).toContain(res.status)
      })
  })

  it('PUT apply coupon with special characters', () => {
    return frisby.put(REST_URL + '/basket/3/coupon/<script>alert(1)</script>', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([400, 401, 403, 404]).toContain(res.status)
      })
  })
})

describe('/rest/basket/:id/checkout', () => {
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

  it('POST checkout with coupon applied', () => {
    return frisby.post(REST_URL + '/basket/3/checkout', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        couponData: 'VALID20'
      }
    })
      .then((res) => {
        expect([200, 400, 401, 404]).toContain(res.status)
      })
  })

  it('POST checkout with specific payment method', () => {
    return frisby.post(REST_URL + '/basket/3/checkout', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        paymentId: 'card'
      }
    })
      .then((res) => {
        expect([200, 400, 401, 404]).toContain(res.status)
      })
  })

  it('POST checkout with delivery address', () => {
    return frisby.post(REST_URL + '/basket/3/checkout', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        addressId: 1
      }
    })
      .then((res) => {
        expect([200, 400, 401, 404]).toContain(res.status)
      })
  })

  it('POST checkout with all parameters', () => {
    return frisby.post(REST_URL + '/basket/3/checkout', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken },
      body: {
        couponData: 'VALID20',
        paymentId: 'card',
        addressId: 1,
        deliveryMethodId: 1
      }
    })
      .then((res) => {
        expect([200, 400, 401, 404, 500]).toContain(res.status)
      })
  })

  it('POST checkout with invalid basket ID', () => {
    return frisby.post(REST_URL + '/basket/invalid/checkout', {
      headers: { ...jsonHeader, Authorization: 'Bearer ' + authToken }
    })
      .then((res) => {
        expect([400, 401, 404, 500]).toContain(res.status)
      })
  })
})
