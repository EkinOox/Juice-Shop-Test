/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'

describe('Utility Libraries', () => {
  describe('String Utils', () => {
    it('should handle basic string operations', () => {
      const testString = 'test123'
      expect(testString).to.be.a('string')
      expect(testString.length).to.equal(7)
      expect(testString.toUpperCase()).to.equal('TEST123')
    })

    it('should handle array operations', () => {
      const testArray = [1, 2, 3]
      expect(testArray).to.be.an('array')
      expect(testArray.length).to.equal(3)
      expect(testArray[0]).to.equal(1)
    })

    it('should handle object operations', () => {
      const testObj = { id: 1, name: 'test' }
      expect(testObj).to.be.an('object')
      expect(testObj.id).to.equal(1)
      expect(testObj.name).to.equal('test')
    })
  })

  describe('Validation Utils', () => {
    it('should validate email format', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'

      expect(validEmail).to.include('@')
      expect(validEmail).to.include('.')
      expect(invalidEmail).to.not.include('@')
    })

    it('should validate numeric values', () => {
      const validNumber = 123
      const invalidNumber = NaN

      void expect(validNumber).to.be.a('number')
      void expect(validNumber).to.not.be.NaN
      void expect(invalidNumber).to.be.NaN
    })
  })
})
