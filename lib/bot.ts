/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fuzz from 'fuzzball'
import crypto from 'crypto'

interface TrainingData {
  lang: string
  data: Array<{
    intent: string
    utterances: string[]
    answers: Array<{
      action: 'response' | 'function'
      body?: string
      handler?: string
    }>
  }>
}

interface User {
  id: string
  name: string
}

interface BotResponse {
  action: 'response' | 'function' | 'namequery'
  body?: string
  handler?: string
}

export default class Bot {
  private readonly name: string
  private readonly greeting: string
  private readonly trainingData: TrainingData
  private readonly defaultResponse: string
  private readonly users = new Map<string, User>()

  constructor (name: string, greeting: string, trainingData: string, defaultResponse: string) {
    this.name = name
    this.greeting = greeting
    this.trainingData = JSON.parse(trainingData)
    this.defaultResponse = defaultResponse
  }

  async train (): Promise<void> {
    // Training is just parsing the data, no actual ML training needed
    await Promise.resolve()
  }

  get factory () {
    return {
      run: (code: string): any => {
        // Simple evaluation without vm2 - only handle currentUser() calls
        const match = code.match(/currentUser\('([^']+)'\)/)
        if (match) {
          const userId = match[1]
          return this.users.get(userId)?.name ?? false
        }
        return false
      }
    }
  }

  addUser (userId: string, name: string): void {
    this.users.set(userId, { id: userId, name })
  }

  greet (userId: string): string {
    const user = this.users.get(userId)
    if (user) {
      return this.greeting.replace('<customer-name>', user.name)
    }
    return this.greeting
  }

  async respond (query: string, userId: string): Promise<BotResponse> {
    // Find the best matching intent
    let bestMatch = { intent: '', score: 0, answers: [] as any[] }

    for (const intentData of this.trainingData.data) {
      for (const utterance of intentData.utterances) {
        const score = fuzz.ratio(query.toLowerCase(), utterance.toLowerCase())
        if (score > bestMatch.score) {
          bestMatch = {
            intent: intentData.intent,
            score,
            answers: intentData.answers
          }
        }
      }
    }

    // If we have a good match (score > 60), return a random answer
    if (bestMatch.score > 60 && bestMatch.answers.length > 0) {
      const answer = bestMatch.answers[crypto.randomInt(0, bestMatch.answers.length)]
      return {
        action: answer.action,
        body: answer.body,
        handler: answer.handler
      }
    }

    // Default response
    return {
      action: 'response',
      body: this.defaultResponse
    }
  }

  get training () {
    return {
      state: 'trained' // Always trained since we don't do actual ML training
    }
  }
}
