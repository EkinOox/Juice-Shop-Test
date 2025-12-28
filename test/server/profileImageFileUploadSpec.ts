/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import fs from 'node:fs/promises'
import { type Request, type Response } from 'express'
import fileType from 'file-type'
import { profileImageFileUpload } from '../../routes/profileImageFileUpload'
import { UserModel } from '../../models/user'
import * as security from '../../lib/insecurity'
import * as utils from '../../lib/utils'
import logger from '../../lib/logger'

chai.use(sinonChai)
const expect = chai.expect

describe('profileImageFileUpload', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: sinon.SinonStub

  beforeEach(() => {
    req = {
      file: {
        buffer: Buffer.from('fake image data'),
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100,
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      } as any,
      cookies: { token: 'valid-token' },
      socket: { remoteAddress: '127.0.0.1' } as any
    }
    res = {
      status: sinon.stub().returnsThis(),
      location: sinon.stub().returnsThis(),
      redirect: sinon.stub() as any
    }
    next = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should return error when no file buffer is provided', async () => {
    req.file = {
      buffer: undefined as any,
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 100,
      destination: '',
      filename: '',
      path: '',
      stream: null as any
    } as any

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(res.status).to.have.been.calledWith(500)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Illegal file type')))
  })

  it('should return error when file type cannot be determined', async () => {
    sinon.stub(fileType, 'fromBuffer').resolves(undefined)

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(res.status).to.have.been.calledWith(500)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Illegal file type')))
  })

  it('should return error when file is not an image', async () => {
    const fileTypeResult = { mime: 'application/pdf', ext: 'pdf' } as any
    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(false)

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(res.status).to.have.been.calledWith(415)
    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Profile image upload does not accept this file type: application/pdf')))
  })

  it('should return error when user is not authenticated', async () => {
    const fileTypeResult = { mime: 'image/jpeg', ext: 'jpg' } as any
    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(true)
    sinon.stub(security.authenticatedUsers, 'get').returns(undefined)

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error).and(sinon.match.has('message', 'Blocked illegal activity by 127.0.0.1')))
  })

  it('should successfully upload and update profile image', async () => {
    const fileTypeResult = { mime: 'image/png', ext: 'png' } as any
    const loggedInUser = { data: { id: 1 } } as any
    const user = {
      update: sinon.stub().resolves()
    }

    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(true)
    sinon.stub(security.authenticatedUsers, 'get').returns(loggedInUser)
    sinon.stub(fs, 'writeFile').resolves()
    sinon.stub(UserModel, 'findByPk').resolves(user as any)
    sinon.stub(process.env, 'BASE_PATH').value('/juice-shop')

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(fs.writeFile).to.have.been.calledWith(
      'frontend/dist/frontend/assets/public/images/uploads/1.png',
      Buffer.from('fake image data')
    )
    expect(user.update).to.have.been.calledWith({
      profileImage: 'assets/public/images/uploads/1.png'
    })
    expect(res.location).to.have.been.calledWith('/juice-shop/profile')
    expect(res.redirect).to.have.been.calledWith('/juice-shop/profile')
  })

  it('should handle file write errors gracefully', async () => {
    const fileTypeResult = { mime: 'image/jpeg', ext: 'jpg' } as any
    const loggedInUser = { data: { id: 1 } } as any
    const user = {
      update: sinon.stub().resolves()
    }

    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(true)
    sinon.stub(security.authenticatedUsers, 'get').returns(loggedInUser)
    sinon.stub(fs, 'writeFile').rejects(new Error('Write failed'))
    sinon.stub(logger, 'warn')
    sinon.stub(UserModel, 'findByPk').resolves(user as any)
    sinon.stub(process.env, 'BASE_PATH').value('/juice-shop')

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(logger.warn).to.have.been.calledWith('Error writing file: Write failed')
    expect(user.update).to.have.been.calledWith({
      profileImage: 'assets/public/images/uploads/1.jpg'
    })
    expect(res.location).to.have.been.calledWith('/juice-shop/profile')
    expect(res.redirect).to.have.been.calledWith('/juice-shop/profile')
  })

  it('should handle user update errors', async () => {
    const fileTypeResult = { mime: 'image/gif', ext: 'gif' } as any
    const loggedInUser = { data: { id: 1 } } as any
    const updateError = new Error('Database update failed')

    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(true)
    sinon.stub(security.authenticatedUsers, 'get').returns(loggedInUser)
    sinon.stub(fs, 'writeFile').resolves()
    sinon.stub(UserModel, 'findByPk').resolves({
      update: sinon.stub().rejects(updateError)
    } as any)

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(next).to.have.been.calledWith(updateError)
  })

  it('should handle case when user is not found after upload', async () => {
    const fileTypeResult = { mime: 'image/webp', ext: 'webp' } as any
    const loggedInUser = { data: { id: 1 } } as any

    sinon.stub(fileType, 'fromBuffer').resolves(fileTypeResult)
    sinon.stub(utils, 'startsWith').returns(true)
    sinon.stub(security.authenticatedUsers, 'get').returns(loggedInUser)
    sinon.stub(fs, 'writeFile').resolves()
    sinon.stub(UserModel, 'findByPk').resolves(null)
    sinon.stub(process.env, 'BASE_PATH').value('/juice-shop')

    const middleware = profileImageFileUpload()
    await middleware(req as Request, res as Response, next)

    expect(res.location).to.have.been.calledWith('/juice-shop/profile')
    expect(res.redirect).to.have.been.calledWith('/juice-shop/profile')
  })
})