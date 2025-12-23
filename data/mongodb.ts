/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

// Simple in-memory database replacement for MarsDB
class InMemoryCollection {
  private data: Map<string, any> = new Map()
  private nextId = 1

  async insert(doc: any): Promise<any> {
    const id = this.nextId++
    const document = { ...doc, _id: id }
    this.data.set(id.toString(), document)
    return document
  }

  async find(query: any = {}): Promise<any[]> {
    const results = Array.from(this.data.values())
    if (Object.keys(query).length === 0) {
      return results
    }
    // Simple filtering - only supports basic equality
    return results.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false
      }
      return true
    })
  }

  async findOne(query: any): Promise<any | null> {
    const results = await this.find(query)
    return results.length > 0 ? results[0] : null
  }

  async update(query: any, update: any, options?: any): Promise<any> {
    const results = await this.find(query)
    for (const item of results) {
      if (update.$set) {
        Object.assign(item, update.$set)
      } else {
        Object.assign(item, update)
      }
    }
    return { modified: results.length, original: results }
  }

  async count(query: any = {}): Promise<number> {
    const results = await this.find(query)
    return results.length
  }
}

export const reviewsCollection = new InMemoryCollection()
export const ordersCollection = new InMemoryCollection()
