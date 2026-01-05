/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { expect } from 'chai'
import Bot from '../../lib/bot'

const trainingData = JSON.stringify({
  lang: 'en',
  data: [
    {
      intent: 'queries.status',
      utterances: [
        'how are you',
        'how is things',
        'are you alright',
        'how do you do'
      ],
      answers: [
        {
          action: 'response',
          body: 'I am doing very well. Thank you!'
        },
        {
          action: 'response',
          body: 'Great! How can I help you?'
        }
      ]
    },
    {
      intent: 'queries.price',
      utterances: [
        'how much does it cost',
        'what is the price',
        'price please'
      ],
      answers: [
        {
          action: 'function',
          handler: 'productPrice'
        }
      ]
    },
    {
      intent: 'queries.username',
      utterances: [
        'what is my name',
        'who am i',
        'do you know my name'
      ],
      answers: [
        {
          action: 'function',
          handler: 'currentUser'
        }
      ]
    }
  ]
})

describe('Bot', () => {
  let bot: Bot

  beforeEach(async () => {
    bot = new Bot('JuiceBot', 'Hello <customer-name>!', trainingData, 'I don\'t understand')
    await bot.train()
  })

  it('should return trained state after training', () => {
    expect(bot.training.state).to.equal('trained')
  })

  it('should greet user with name when user is added', () => {
    bot.addUser('user123', 'John Doe')
    const greeting = bot.greet('user123')
    expect(greeting).to.equal('Hello John Doe!')
  })

  it('should greet with generic message when user not found', () => {
    const greeting = bot.greet('unknownUser')
    expect(greeting).to.equal('Hello <customer-name>!')
  })

  it('should respond to status query', async () => {
    const response = await bot.respond('how are you', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.be.oneOf([
      'I am doing very well. Thank you!',
      'Great! How can I help you?'
    ])
  })

  it('should respond with function action for price query', async () => {
    const response = await bot.respond('what is the price', 'user123')
    expect(response.action).to.equal('function')
    expect(response.handler).to.equal('productPrice')
  })

  it('should respond with function action for username query', async () => {
    const response = await bot.respond('who am i', 'user123')
    expect(response.action).to.equal('function')
    expect(response.handler).to.equal('currentUser')
  })

  it('should return default response for unknown query', async () => {
    const response = await bot.respond('blah blah random text', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.equal('I don\'t understand')
  })

  it('should match queries with fuzzy matching', async () => {
    const response = await bot.respond('how r u', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.be.a('string')
  })

  it('should return user name through factory.run with currentUser', () => {
    bot.addUser('user456', 'Jane Smith')
    const result = bot.factory.run("currentUser('user456')")
    expect(result).to.equal('Jane Smith')
  })

  it('should return false when factory.run cannot find user', () => {
    const result = bot.factory.run("currentUser('nonExistentUser')")
    expect(result).to.equal(false)
  })

  it('should return false for invalid factory code', () => {
    const result = bot.factory.run('invalid code here')
    expect(result).to.equal(false)
  })

  it('should handle multiple users independently', () => {
    bot.addUser('user1', 'Alice')
    bot.addUser('user2', 'Bob')

    expect(bot.greet('user1')).to.equal('Hello Alice!')
    expect(bot.greet('user2')).to.equal('Hello Bob!')
  })

  it('should select random answer from multiple options', async () => {
    const responses = new Set<string>()

    // Run multiple times to potentially get different random responses
    for (let i = 0; i < 20; i++) {
      const response = await bot.respond('how are you', 'user123')
      if (response.body) {
        responses.add(response.body)
      }
    }

    // Should have gotten at least one response
    expect(responses.size).to.be.greaterThan(0)
  })

  it('should handle low-score matches (below 60) with default response', async () => {
    const response = await bot.respond('completely unrelated query xyz', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.equal('I don\'t understand')
  })

  it('should handle empty query', async () => {
    const response = await bot.respond('', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.equal('I don\'t understand')
  })

  it('should handle queries with special characters', async () => {
    const response = await bot.respond('@#$%^&*()', 'user123')
    expect(response.action).to.equal('response')
    expect(response.body).to.equal('I don\'t understand')
  })

  it('should handle very long queries', async () => {
    const longQuery = 'a'.repeat(1000)
    const response = await bot.respond(longQuery, 'user123')
    expect(response.action).to.equal('response')
  })

  it('factory.run should return false for code without currentUser pattern', () => {
    const result = bot.factory.run('someOtherFunction()')
    expect(result).to.equal(false)
  })

  it('factory.run should handle empty code', () => {
    const result = bot.factory.run('')
    expect(result).to.equal(false)
  })

  it('should preserve multiple user sessions independently', () => {
    bot.addUser('session1', 'User One')
    bot.addUser('session2', 'User Two')
    bot.addUser('session3', 'User Three')

    expect(bot.factory.run("currentUser('session1')")).to.equal('User One')
    expect(bot.factory.run("currentUser('session2')")).to.equal('User Two')
    expect(bot.factory.run("currentUser('session3')")).to.equal('User Three')
  })

  it('should handle answer arrays with single item', async () => {
    const singleAnswerData = JSON.stringify({
      lang: 'en',
      data: [
        {
          intent: 'test.intent',
          utterances: ['test query'],
          answers: [
            {
              action: 'response',
              body: 'Single answer'
            }
          ]
        }
      ]
    })

    const testBot = new Bot('TestBot', 'Hi!', singleAnswerData, 'Default')
    await testBot.train()
    const response = await testBot.respond('test query', 'user1')
    expect(response.body).to.equal('Single answer')
  })
})
