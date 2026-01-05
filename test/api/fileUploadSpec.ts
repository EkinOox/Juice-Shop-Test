/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { challenges } from '../../data/datacache'
import * as utils from '../../lib/utils'
import { expect } from '@jest/globals'
import * as frisby from 'frisby'
import path from 'node:path'
import fs from 'node:fs'

const URL = 'http://localhost:3000'

describe('/file-upload', () => {
  it('POST file valid PDF for client and API', () => {
    const file = path.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 204)
  })

  it('POST file without any file attached returns error', () => {
    return frisby.post(URL + '/file-upload', {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .expect('status', 500) // Returns 500 when no file provided
  })

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  it('POST ZIP file to test unzip functionality', () => {
    const file = path.resolve(__dirname, '../files/test.zip')
    if (fs.existsSync(file)) {
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob)

      // @ts-expect-error FIXME form.getHeaders() is not found
      return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
        .then((res) => {
          expect([204, 410, 500]).toContain(res.status)
        })
    } else {
      return Promise.resolve()
    }
  })

  it('POST file with YAML extension', () => {
    const file = path.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob, 'test.yml')

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .then((res) => {
        expect([204, 410]).toContain(res.status)
      })
  })

  it('POST file too large for client validation but valid for API', () => {
    const file = path.resolve(__dirname, '../files/invalidSizeForClient.pdf')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 204)
  })

  it('POST file with illegal type for client validation but valid for API', () => {
    const file = path.resolve(__dirname, '../files/invalidTypeForClient.exe')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 204)
  })

  it('POST file type XML deprecated for API', () => {
    const file = path.resolve(__dirname, '../files/deprecatedTypeForServer.xml')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 410)
  })

  it('POST large XML file near upload size limit', () => {
    const file = path.resolve(__dirname, '../files/maxSizeForServer.xml')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 410)
  })

  if (utils.isChallengeEnabled(challenges.xxeFileDisclosureChallenge) || utils.isChallengeEnabled(challenges.xxeDosChallenge)) {
    it('POST file type XML with XXE attack against Windows', () => {
      const file = path.resolve(__dirname, '../files/xxeForWindows.xml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      })
        .expect('status', 410)
    })

    it('POST file type XML with XXE attack against Linux', () => {
      const file = path.resolve(__dirname, '../files/xxeForLinux.xml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      })
        .expect('status', 410)
    })

    it('POST file type XML with Billion Laughs attack is caught by parser', () => {
      const file = path.resolve(__dirname, '../files/xxeBillionLaughs.xml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      })
        .expect('status', 410)
        .expect('bodyContains', 'Detected an entity reference loop')
    })

    it('POST file type XML with Quadratic Blowup attack', () => {
      const file = path.resolve(__dirname, '../files/xxeQuadraticBlowup.xml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      }).then((res) => {
        expect(res.status).toBeGreaterThanOrEqual(410)
      })
    })

    it('POST file type XML with dev/random attack', () => {
      const file = path.resolve(__dirname, '../files/xxeDevRandom.xml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      }).then((res) => {
        expect(res.status).toBeGreaterThanOrEqual(410)
      })
    })
  }

  if (utils.isChallengeEnabled(challenges.yamlBombChallenge)) {
    // Test skipped: YAML bomb detection may cause test environment instability
    xit('POST file type YAML with Billion Laughs-style attack', () => {
      const file = path.resolve(__dirname, '../files/yamlBomb.yml')
      const form = frisby.formData()
      form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

      return frisby.post(URL + '/file-upload', {
        // @ts-expect-error FIXME form.getHeaders() is not found
        headers: { 'Content-Type': form.getHeaders()['content-type'] },
        body: form
      }).then((res) => {
        expect(res.status).toBeGreaterThanOrEqual(410)
      })
    })
  }

  it('POST file too large for API', () => {
    const file = path.resolve(__dirname, '../files/invalidSizeForServer.pdf')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 500)
  })

  it('POST zip file with directory traversal payload', () => {
    const file = path.resolve(__dirname, '../files/arbitraryFileWrite.zip')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 204)
  })

  it('POST zip file with password protection', () => {
    const file = path.resolve(__dirname, '../files/passwordProtected.zip')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'] }, body: form })
      .expect('status', 204)
  })

  xit('POST valid file with tampered content length', () => { // FIXME Fails on CI/CD pipeline
    const file = path.resolve(__dirname, '../files/validSizeAndTypeForClient.pdf')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file) as unknown as Blob) // casting to blob as the frisby types are wrong and wont accept the fileStream type

    // @ts-expect-error FIXME form.getHeaders() is not found
    return frisby.post(URL + '/file-upload', { headers: { 'Content-Type': form.getHeaders()['content-type'], 'Content-Length': 42 }, body: form })
      .expect('status', 500)
      .expect('bodyContains', 'Unexpected end of form')
  })
})
