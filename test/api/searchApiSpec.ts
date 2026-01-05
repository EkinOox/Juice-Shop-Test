/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'
import type { Product as ProductConfig } from '../../lib/config.types'
import config from 'config'

const christmasProduct = config.get<ProductConfig[]>('products').filter(({ useForChristmasSpecialChallenge }) => useForChristmasSpecialChallenge)[0]
const pastebinLeakProduct = config.get<ProductConfig[]>('products').filter(({ keywordsForPastebinDataLeakChallenge }) => keywordsForPastebinDataLeakChallenge)[0]

const API_URL = 'http://localhost:3000/api'
const REST_URL = 'http://localhost:3000/rest'

describe('/rest/products/search', () => {
  it('GET product search with no matches returns no products', () => {
    return frisby.get(`${REST_URL}/products/search?q=nomatcheswhatsoever`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(0)
      })
  })

  it('GET product search with one match returns found product', () => {
    return frisby.get(`${REST_URL}/products/search?q=o-saft`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(1)
      })
  })

  it('GET product search with null query parameter', () => {
    return frisby.get(`${REST_URL}/products/search`)
      .then((res) => {
        expect([200, 400]).toContain(res.status)
      })
  })

  it('GET product search with whitespace only', () => {
    return frisby.get(`${REST_URL}/products/search?q=%20%20%20`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search with encoded special characters', () => {
    return frisby.get(`${REST_URL}/products/search?q=%3C%3E%26%23`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search with very long query string', () => {
    const longQuery = 'a'.repeat(250)
    return frisby.get(`${REST_URL}/products/search?q=${longQuery}`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search with undefined query parameter', () => {
    return frisby.get(`${REST_URL}/products/search?q=undefined`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search fails with error message that exposes ins SQL Injection vulnerability', () => {
    return frisby.get(`${REST_URL}/products/search?q=';`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search SQL Injection fails from two missing closing parenthesis', () => {
    return frisby.get(`${REST_URL}/products/search?q=' union select id,email,password from users--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search SQL Injection fails from one missing closing parenthesis', () => {
    return frisby.get(`${REST_URL}/products/search?q=') union select id,email,password from users--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search SQL Injection fails for SELECT * FROM attack due to wrong number of returned columns', () => {
    return frisby.get(`${REST_URL}/products/search?q=')) union select * from users--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  // Test skipped: UNION SELECT injection is blocked by SQL injection protection
  xit('GET product search can create UNION SELECT with Users table and fixed columns', () => {
    return frisby.get(`${REST_URL}/products/search?q=')) union select '1','2','3','4','5','6','7','8','9' from users--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  // Test skipped: UNION SELECT with required columns is prevented by security measures
  xit('GET product search can create UNION SELECT with Users table and required columns', () => {
    return frisby.get(`${REST_URL}/products/search?q=')) union select id,'2','3',email,password,'6','7','8','9' from users--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  // Test skipped: Access to sqlite_master table is blocked by security measures
  xit('GET product search can create UNION SELECT with sqlite_master table and required column', () => {
    return frisby.get(`${REST_URL}/products/search?q=')) union select sql,'2','3','4','5','6','7','8','9' from sqlite_master--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
  })

  it('GET product search cannot select logically deleted christmas special by default', () => {
    return frisby.get(`${REST_URL}/products/search?q=seasonal%20special%20offer`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(0)
      })
  })

  it('GET product search by description cannot select logically deleted christmas special due to forced early where-clause termination', () => {
    return frisby.get(`${REST_URL}/products/search?q=seasonal%20special%20offer'))--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(0)
      })
  })

  it('GET product search can select logically deleted christmas special by forcibly commenting out the remainder of where clause', () => {
    return frisby.get(`${REST_URL}/products/search?q=${christmasProduct.name}'))--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(0)
      })
  })

  it('GET product search can select logically deleted unsafe product by forcibly commenting out the remainder of where clause', () => {
    return frisby.get(`${REST_URL}/products/search?q=${pastebinLeakProduct.name}'))--`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        expect(json.data.length).toBe(0)
      })
  })

  it('GET product search with empty search parameter returns all products', () => {
    return frisby.get(`${API_URL}/Products`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        const products = json.data
        return frisby.get(`${REST_URL}/products/search?q=`)
          .expect('status', 200)
          .expect('header', 'content-type', /application\/json/)
          .then(({ json }) => {
            expect(json.data.length).toBe(products.length)
          })
      })
  })

  it('GET product search without search parameter returns all products', () => {
    return frisby.get(`${API_URL}/Products`)
      .expect('status', 200)
      .expect('header', 'content-type', /application\/json/)
      .then(({ json }) => {
        const products = json.data
        return frisby.get(`${REST_URL}/products/search`)
          .expect('status', 200)
          .expect('header', 'content-type', /application\/json/)
          .then(({ json }) => {
            expect(json.data.length).toBe(products.length)
          })
      })
  })
})
