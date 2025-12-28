import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { b2bOrder } from '../../routes/b2bOrder.ts'
import * as utils from '../../lib/utils'
import crypto from 'crypto'
import { type Request, type Response, type NextFunction } from 'express'

chai.use(sinonChai)
const expect = chai.expect

function makeRes() {
  const res: Partial<Response> = {}
  ;(res as any).status = sinon.stub().returns({ json: sinon.stub() })
  ;(res as any).json = sinon.stub()
  return res as Response
}

describe('routes/b2bOrder', () => {
  let utilStub: sinon.SinonStub
  let randStub: sinon.SinonStub
  beforeEach(() => {
    utilStub = sinon.stub(utils, 'isChallengeEnabled').returns(true)
    randStub = sinon.stub(crypto, 'randomInt').returns(9)
  })
  afterEach(() => {
    utilStub.restore()
    randStub.restore()
  })

  it('returns JSON when challenge enabled and valid input', () => {
    const handler = b2bOrder()
    const req = { body: { cid: 'C1', orderLinesData: '2+3' } } as unknown as Request
    const res = makeRes()
    handler(req, res, ((err?: any) => { expect(err).to.be.undefined }) as NextFunction)
    expect((res.json as any)).to.have.been.called
  })

  it('signals timeout when randomInt triggers', () => {
    (crypto.randomInt as any).returns(1)
    const handler = b2bOrder()
    const req = { body: { cid: 'C2', orderLinesData: '2+3' } } as unknown as Request
    const res = makeRes()
    const next = sinon.spy()
    handler(req, res, next)
    expect((res.status as any)).to.have.been.calledWith(503)
    expect(next).to.have.been.called
  })

  it('rejects invalid format', () => {
    const handler = b2bOrder()
    const req = { body: { cid: 'C3', orderLinesData: 'alert(1)' } } as unknown as Request
    const res = makeRes()
    const next = sinon.spy()
    handler(req, res, next)
    expect(next).to.have.been.called
  })
})