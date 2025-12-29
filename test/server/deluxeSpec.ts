/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { type Request, type Response } from 'express'
import { upgradeToDeluxe, deluxeMembershipStatus } from '../../routes/deluxe'
import { UserModel } from '../../models/user'
import { WalletModel } from '../../models/wallet'
import { CardModel } from '../../models/card'
import * as challengeUtils from '../../lib/challengeUtils'
import { challenges } from '../../data/datacache'
import { testPasswords } from '../testPasswords'
import * as security from '../../lib/insecurity'
import * as utils from '../../lib/utils'

chai.use(sinonChai)
const expect = chai.expect

describe('deluxe', () => {
  describe('upgradeToDeluxe', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: sinon.SinonStub

    beforeEach(() => {
      req = {
        body: {}
      }
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      next = sinon.stub()
    })

    afterEach(() => {
      sinon.restore()
    })

    it('should return error when user is not found', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      sinon.stub(UserModel, 'findOne').resolves(null)

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Something went wrong. Please try again!'
      })
    })

    it('should return error when user is not a customer', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      // The query already filters for customers, so if user is not found, it means they're not a customer
      sinon.stub(UserModel, 'findOne').resolves(null)

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Something went wrong. Please try again!'
      })
    })

    it('should return error when wallet has insufficient funds', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      const user = { id: 1, role: 'customer', email: 'test@example.com' }
      const wallet = { balance: 10 }
      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(WalletModel, 'findOne').resolves(wallet as any)

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Insuffienct funds in Wallet'
      })
    })

    it('should successfully upgrade user with wallet payment', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      const user = {
        id: 1,
        role: 'customer',
        email: 'test@example.com',
        update: sinon.stub().resolves({ id: 1, role: 'deluxe', deluxeToken: 'token123' })
      }
      const wallet = { balance: 100 }
      const updatedUser = { id: 1, role: 'deluxe', deluxeToken: 'token123' }

      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(WalletModel, 'findOne').resolves(wallet as any)
      const decrementStub = sinon.stub(WalletModel, 'decrement').resolves()
      sinon.stub(security, 'verify').returns(false)
      sinon.stub(utils, 'jwtFrom').returns('')
      sinon.stub(challengeUtils, 'solveIf')
      sinon.stub(utils, 'queryResultToJson').returns({ status: 'success', data: updatedUser })
      sinon.stub(security, 'authorize').returns('newToken123')
      sinon.stub(security.authenticatedUsers, 'put')

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      void expect(decrementStub).to.have.been.calledWith({ balance: 49 }, { where: { UserId: 1 } })
      expect(user.update).to.have.been.calledWith({
        role: security.roles.deluxe,
        deluxeToken: security.deluxeToken(user.email)
      })
      expect(res.status).to.have.been.calledWith(200)
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        data: {
          confirmation: 'Congratulations! You are now a deluxe member!',
          token: testPasswords.tokenNew
        }
      })
    })

    it('should return error when card is invalid', async () => {
      req.body = { UserId: 1, paymentMode: 'card', paymentId: 123 }
      const user = { id: 1, role: 'customer', email: 'test@example.com' }
      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(CardModel, 'findOne').resolves(null)

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Invalid Card'
      })
    })

    it('should return error when card is expired', async () => {
      req.body = { UserId: 1, paymentMode: 'card', paymentId: 123 }
      const user = { id: 1, role: 'customer', email: 'test@example.com' }
      const card = { id: 123, UserId: 1, expYear: 2020, expMonth: 1 }
      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(CardModel, 'findOne').resolves(card as any)

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Invalid Card'
      })
    })

    it('should successfully upgrade user with card payment', async () => {
      req.body = { UserId: 1, paymentMode: 'card', paymentId: 123 }
      const user = {
        id: 1,
        role: 'customer',
        email: 'test@example.com',
        update: sinon.stub().resolves({ id: 1, role: 'deluxe', deluxeToken: 'token123' })
      }
      const card = { id: 123, UserId: 1, expYear: 2030, expMonth: 12 }
      const updatedUser = { id: 1, role: 'deluxe', deluxeToken: 'token123' }

      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(CardModel, 'findOne').resolves(card as any)
      sinon.stub(security, 'verify').returns(false)
      sinon.stub(utils, 'jwtFrom').returns('')
      sinon.stub(challengeUtils, 'solveIf')
      sinon.stub(utils, 'queryResultToJson').returns({ status: 'success', data: updatedUser })
      sinon.stub(security, 'authorize').returns('newToken123')
      sinon.stub(security.authenticatedUsers, 'put')

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(user.update).to.have.been.calledWith({
        role: security.roles.deluxe,
        deluxeToken: security.deluxeToken(user.email)
      })
      expect(res.status).to.have.been.calledWith(200)
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        data: {
          confirmation: 'Congratulations! You are now a deluxe member!',
          token: testPasswords.tokenNew
        }
      })
    })

    it('should solve freeDeluxeChallenge when conditions are met', async () => {
      req.body = { UserId: 1, paymentMode: 'free' }
      const user = {
        id: 1,
        role: 'customer',
        email: 'test@example.com',
        update: sinon.stub().resolves({ id: 1, role: 'deluxe', deluxeToken: 'token123' })
      }
      const updatedUser = { id: 1, role: 'deluxe', deluxeToken: 'token123' }

      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(security, 'verify').returns(true)
      sinon.stub(utils, 'jwtFrom').returns('valid.jwt.token')
      const solveIfStub = sinon.stub(challengeUtils, 'solveIf')
      sinon.stub(utils, 'queryResultToJson').returns({ status: 'success', data: updatedUser })
      sinon.stub(security, 'authorize').returns('newToken123')
      sinon.stub(security.authenticatedUsers, 'put')

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(solveIfStub).to.have.been.calledWith(challenges.freeDeluxeChallenge, sinon.match.func)
    })

    it('should handle database errors during user update', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      const user = {
        id: 1,
        role: 'customer',
        email: 'test@example.com',
        update: sinon.stub().rejects(new Error('Database error'))
      }
      const wallet = { balance: 100 }

      sinon.stub(UserModel, 'findOne').resolves(user as any)
      sinon.stub(WalletModel, 'findOne').resolves(wallet as any)
      sinon.stub(WalletModel, 'decrement').resolves()

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Something went wrong. Please try again!'
      })
    })

    it('should handle unexpected errors', async () => {
      req.body = { UserId: 1, paymentMode: 'wallet' }
      sinon.stub(UserModel, 'findOne').rejects(new Error('Unexpected error'))
      sinon.stub(utils, 'getErrorMessage').returns('Unexpected error')

      const middleware = upgradeToDeluxe()
      await middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'Something went wrong: Unexpected error'
      })
    })
  })

  describe('deluxeMembershipStatus', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: sinon.SinonStub

    beforeEach(() => {
      req = {}
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      }
      next = sinon.stub()
    })

    afterEach(() => {
      sinon.restore()
    })

    it('should return membership cost for customers', () => {
      sinon.stub(security, 'isCustomer').returns(true)
      sinon.stub(security, 'isDeluxe').returns(false)

      const middleware = deluxeMembershipStatus()
      middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(200)
      expect(res.json).to.have.been.calledWith({
        status: 'success',
        data: { membershipCost: 49 }
      })
    })

    it('should return error for deluxe members', () => {
      sinon.stub(security, 'isCustomer').returns(false)
      sinon.stub(security, 'isDeluxe').returns(true)

      const middleware = deluxeMembershipStatus()
      middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'You are already a deluxe member!'
      })
    })

    it('should return error for non-eligible users', () => {
      sinon.stub(security, 'isCustomer').returns(false)
      sinon.stub(security, 'isDeluxe').returns(false)

      const middleware = deluxeMembershipStatus()
      middleware(req as Request, res as Response, next)

      expect(res.status).to.have.been.calledWith(400)
      expect(res.json).to.have.been.calledWith({
        status: 'error',
        error: 'You are not eligible for deluxe membership!'
      })
    })
  })
})
