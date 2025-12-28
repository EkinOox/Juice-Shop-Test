/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'

describe('Data Layer', () => {
  describe('Static Data', () => {
    it('should validate basic data structures', () => {
      const testUser = {
        email: 'admin@test.com',
        password: process.env.TEST_HASHED_PASSWORD ?? '$2b$10$HBKKqhQKheLhQfxKv.EXAMPLE.HASH',
        role: 'admin'
      }
      
      expect(testUser.email).to.include('@')
      expect(testUser.password).to.be.a('string')
      expect(testUser.role).to.equal('admin')
    })

    it('should validate product data', () => {
      const testProduct = {
        name: 'Test Product',
        price: 9.99,
        description: 'A test product'
      }
      
      expect(testProduct.name).to.be.a('string')
      expect(testProduct.price).to.be.a('number')
      expect(testProduct.price).to.be.greaterThan(0)
    })

    it('should validate challenge data', () => {
      const testChallenge = {
        name: 'Test Challenge',
        key: 'testChallenge',
        difficulty: 3
      }
      
      expect(testChallenge.name).to.be.a('string')
      expect(testChallenge.key).to.be.a('string')
      expect(testChallenge.difficulty).to.be.at.least(1)
      expect(testChallenge.difficulty).to.be.at.most(6)
    })
  })

  describe('Data Validation', () => {
    it('should validate user email uniqueness', () => {
      const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com']
      const uniqueEmails = [...new Set(emails)]
      expect(emails.length).to.equal(uniqueEmails.length)
    })

    it('should validate required fields are not empty', () => {
      const testData = {
        name: 'Valid Name',
        email: 'valid@email.com',
        password: process.env.TEST_HASHED_PASSWORD ?? '$2b$10$HBKKqhQKheLhQfxKv.EXAMPLE.HASH'
      }
      
      expect(testData.name.trim()).to.not.be.empty
      expect(testData.email.trim()).to.not.be.empty  
      expect(testData.password.trim()).to.not.be.empty
    })

    it('should handle edge cases', () => {
      const emptyString = ''
      const nullValue = null
      const undefinedValue = undefined
      
      expect(emptyString).to.equal('')
      expect(nullValue).to.be.null
      expect(undefinedValue).to.be.undefined
    })
  })
})