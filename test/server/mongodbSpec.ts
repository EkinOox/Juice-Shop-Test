/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'
import { reviewsCollection, ordersCollection } from '../../data/mongodb'

describe('MongoDB InMemoryCollection', () => {
  describe('reviewsCollection', () => {
    it('should insert a document with auto-generated _id', async () => {
      const doc = { product: 1, message: 'Great product!', author: 'user1' }
      const result = await reviewsCollection.insert(doc)
      
      expect(result).to.have.property('_id')
      expect(result._id).to.be.a('number')
      expect(result.product).to.equal(1)
      expect(result.message).to.equal('Great product!')
    })

    it('should find all documents when no query provided', async () => {
      await reviewsCollection.insert({ product: 1, rating: 5 })
      await reviewsCollection.insert({ product: 2, rating: 4 })
      
      const results = await reviewsCollection.find()
      expect(results).to.be.an('array')
      expect(results.length).to.be.at.least(2)
    })

    it('should find documents matching query', async () => {
      const doc1 = await reviewsCollection.insert({ product: 101, rating: 5, author: 'alice' })
      await reviewsCollection.insert({ product: 102, rating: 4, author: 'bob' })
      
      const results = await reviewsCollection.find({ product: 101 })
      expect(results).to.be.an('array')
      const found = results.find(r => r._id === doc1._id)
      expect(found).to.exist
      expect(found?.product).to.equal(101)
    })

    it('should find one document matching query', async () => {
      const doc = await reviewsCollection.insert({ product: 103, rating: 3 })
      
      const result = await reviewsCollection.findOne({ product: 103 })
      expect(result).to.exist
      expect(result?._id).to.equal(doc._id)
      expect(result?.rating).to.equal(3)
    })

    it('should return null when findOne finds no match', async () => {
      const result = await reviewsCollection.findOne({ product: 999999 })
      expect(result).to.be.null
    })

    it('should update documents with $set', async () => {
      const doc = await reviewsCollection.insert({ product: 104, rating: 2, message: 'Bad' })
      
      const updateResult = await reviewsCollection.update(
        { _id: doc._id },
        { $set: { rating: 5, message: 'Actually good!' } }
      )
      
      expect(updateResult.modified).to.equal(1)
      
      const updated = await reviewsCollection.findOne({ _id: doc._id })
      expect(updated?.rating).to.equal(5)
      expect(updated?.message).to.equal('Actually good!')
    })

    it('should update documents without $set', async () => {
      const doc = await reviewsCollection.insert({ product: 105, rating: 3 })
      
      await reviewsCollection.update(
        { _id: doc._id },
        { rating: 4, newField: 'added' }
      )
      
      const updated = await reviewsCollection.findOne({ _id: doc._id })
      expect(updated?.rating).to.equal(4)
      expect(updated?.newField).to.equal('added')
    })

    it('should count all documents', async () => {
      const initialCount = await reviewsCollection.count()
      
      await reviewsCollection.insert({ product: 106, rating: 5 })
      await reviewsCollection.insert({ product: 107, rating: 4 })
      
      const newCount = await reviewsCollection.count()
      expect(newCount).to.equal(initialCount + 2)
    })

    it('should count documents matching query', async () => {
      await reviewsCollection.insert({ product: 108, rating: 5, category: 'A' })
      await reviewsCollection.insert({ product: 109, rating: 5, category: 'A' })
      await reviewsCollection.insert({ product: 110, rating: 5, category: 'B' })
      
      const count = await reviewsCollection.count({ category: 'A' })
      expect(count).to.be.at.least(2)
    })

    it('should filter by multiple query fields', async () => {
      await reviewsCollection.insert({ product: 111, rating: 5, author: 'charlie' })
      await reviewsCollection.insert({ product: 111, rating: 4, author: 'dave' })
      
      const results = await reviewsCollection.find({ product: 111, rating: 5 })
      expect(results).to.be.an('array')
      const found = results.find(r => r.author === 'charlie')
      expect(found).to.exist
    })

    it('should return empty array for non-matching query', async () => {
      const results = await reviewsCollection.find({ nonExistentField: 'impossible' })
      expect(results).to.be.an('array')
      expect(results.length).to.equal(0)
    })

    it('should find with empty query object', async () => {
      const results = await reviewsCollection.find({})
      expect(results).to.be.an('array')
    })

    it('should update multiple matching documents', async () => {
      await reviewsCollection.insert({ status: 'pending', group: 'testGroup1' })
      await reviewsCollection.insert({ status: 'pending', group: 'testGroup1' })
      
      const result = await reviewsCollection.update(
        { group: 'testGroup1' },
        { $set: { status: 'approved' } }
      )
      
      expect(result.modified).to.be.at.least(2)
    })

    it('should handle update with options', async () => {
      const doc = await reviewsCollection.insert({ product: 112, value: 10 })
      
      await reviewsCollection.update(
        { _id: doc._id },
        { value: 20 },
        { upsert: true }
      )
      
      const updated = await reviewsCollection.findOne({ _id: doc._id })
      expect(updated?.value).to.equal(20)
    })
  })

  describe('ordersCollection', () => {
    it('should insert order document', async () => {
      const order = { orderId: 'ORD-001', totalPrice: 99.99, cid: '123' }
      const result = await ordersCollection.insert(order)
      
      expect(result).to.have.property('_id')
      expect(result.orderId).to.equal('ORD-001')
      expect(result.totalPrice).to.equal(99.99)
    })

    it('should find orders by cid', async () => {
      await ordersCollection.insert({ orderId: 'ORD-002', cid: 'cust123' })
      
      const results = await ordersCollection.find({ cid: 'cust123' })
      expect(results).to.be.an('array')
      const found = results.find(o => o.orderId === 'ORD-002')
      expect(found).to.exist
    })

    it('should update order status', async () => {
      const order = await ordersCollection.insert({ orderId: 'ORD-003', status: 'pending' })
      
      await ordersCollection.update(
        { _id: order._id },
        { $set: { status: 'shipped' } }
      )
      
      const updated = await ordersCollection.findOne({ _id: order._id })
      expect(updated?.status).to.equal('shipped')
    })

    it('should count orders', async () => {
      const count = await ordersCollection.count()
      expect(count).to.be.a('number')
      expect(count).to.be.at.least(0)
    })

    it('should return null for non-existent order', async () => {
      const result = await ordersCollection.findOne({ orderId: 'NON-EXISTENT' })
      expect(result).to.be.null
    })
  })
})
