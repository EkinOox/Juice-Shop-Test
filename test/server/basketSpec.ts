/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import sinon from 'sinon'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { retrieveBasket } from '../../routes/basket'
import { BasketModel } from '../../models/basket'
import { ProductModel } from '../../models/product'
import * as challengeUtils from '../../lib/challengeUtils'
import * as security from '../../lib/insecurity'
import { challenges } from '../../data/datacache'
import type { UserModel } from '../../models/user'

const expect = chai.expect
chai.use(sinonChai)

describe('basket', () => {
  let req: any
  let res: any
  let next: any

  beforeEach(() => {
    req = {
      params: { id: '1' },
      __: sinon.stub().returnsArg(0) // Mock translation function
    }
    res = { json: sinon.spy() }
    next = sinon.spy()
  })

  afterEach(() => {
    sinon.restore() // Restore all stubs after each test
  })

  describe('retrieveBasket', () => {
    it('should retrieve basket with products and translate product names', async () => {
      const mockBasket = {
        id: 1,
        Products: [
          { id: 1, name: 'Apple Juice' },
          { id: 2, name: 'Orange Juice' }
        ]
      } as any // Use any to bypass Sequelize model type checking

      const basketFindOneStub = sinon.stub(BasketModel, 'findOne').resolves(mockBasket)
      const solveIfStub = sinon.stub(challengeUtils, 'solveIf')
      const authenticatedUsersStub = sinon.stub(security.authenticatedUsers, 'from').returns({
        data: { id: 2, bid: 2 } as unknown as UserModel
      })

      retrieveBasket()(req, res, next)

      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(basketFindOneStub).to.have.been.calledWith({
        where: { id: '1' },
        include: [{ model: ProductModel, paranoid: false, as: 'Products' }]
      })

      expect(solveIfStub).to.have.been.calledOnce
      expect(req.__).to.have.been.calledWith('Apple Juice')
      expect(req.__).to.have.been.calledWith('Orange Juice')
      expect(res.json).to.have.been.calledOnce
    })

    it('should handle basket not found', async () => {
      const basketFindOneStub = sinon.stub(BasketModel, 'findOne').resolves(null)
      const solveIfStub = sinon.stub(challengeUtils, 'solveIf')

      retrieveBasket()(req, res, next)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(solveIfStub).to.have.been.calledOnce
      expect(res.json).to.have.been.calledOnce
    })

    it('should handle basket with no products', async () => {
      const mockBasket = {
        id: 1,
        Products: []
      } as any

      const basketFindOneStub = sinon.stub(BasketModel, 'findOne').resolves(mockBasket)
      const solveIfStub = sinon.stub(challengeUtils, 'solveIf')

      retrieveBasket()(req, res, next)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(solveIfStub).to.have.been.calledOnce
      expect(req.__).not.to.have.been.called
      expect(res.json).to.have.been.calledOnce
    })

    it('should handle database errors', async () => {
      const error = new Error('Database error')
      const basketFindOneStub = sinon.stub(BasketModel, 'findOne').rejects(error)

      retrieveBasket()(req, res, next)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(next).to.have.been.calledWith(error)
    })
  })
})
