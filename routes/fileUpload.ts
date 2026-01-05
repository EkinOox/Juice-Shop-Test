/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import os from 'node:os'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import yaml from 'js-yaml'
import libxml from 'libxmljs2'
import unzipper from 'unzipper'
import { type NextFunction, type Request, type Response } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'
import * as utils from '../lib/utils'

function ensureFileIsPassed ({ file }: Request, res: Response, next: NextFunction) {
  if (file != null) {
    next()
  } else {
    return res.status(400).json({ error: 'File is not passed' })
  }
}

function processZipEntry (entry: any, next: NextFunction) {
  const fileName = path.basename(entry.path)
  const absolutePath = path.resolve('uploads/complaints/' + fileName)

  challengeUtils.solveIf(challenges.fileWriteChallenge, () => {
    return absolutePath === path.resolve('ftp/legal.md')
  })

  if (absolutePath.includes(path.resolve('.'))) {
    entry.pipe(fs.createWriteStream('uploads/complaints/' + fileName).on('error', next))
  } else {
    entry.autodrain()
  }
}

async function writeAndExtractZip (buffer: Buffer, tempFile: string, next: NextFunction): Promise<void> {
  await fsPromises.writeFile(tempFile, buffer)

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(tempFile)
      .pipe(unzipper.Parse())
      .on('entry', (entry: any) => {
        processZipEntry(entry, next)
      })
      .on('error', (err: unknown) => {
        next(err)
        reject(err)
      })
      .on('close', () => {
        resolve()
      })
  })
}

function handleZipFileUpload ({ file }: Request, res: Response, next: NextFunction) {
  if (!utils.endsWith(file?.originalname.toLowerCase(), '.zip')) {
    next()
    return
  }

  if (!file?.buffer || !utils.isChallengeEnabled(challenges.fileWriteChallenge)) {
    res.status(204).end()
    return
  }

  const buffer = file.buffer
  const filename = file.originalname.toLowerCase()
  const tempFile = path.join(os.tmpdir(), filename)

  writeAndExtractZip(buffer, tempFile, next)
    .then(() => res.status(204).end())
    .catch(() => res.status(204).end())
}

function checkUploadSize ({ file }: Request, res: Response, next: NextFunction) {
  if (file != null) {
    challengeUtils.solveIf(challenges.uploadSizeChallenge, () => { return file?.size > 100000 })
  }
  next()
}

function checkFileType ({ file }: Request, res: Response, next: NextFunction) {
  const fileType = file?.originalname.substring(file.originalname.lastIndexOf('.') + 1).toLowerCase()
  challengeUtils.solveIf(challenges.uploadTypeChallenge, () => {
    return !(fileType === 'pdf' || fileType === 'xml' || fileType === 'zip' || fileType === 'yml' || fileType === 'yaml')
  })
  next()
}

function handleXmlUpload ({ file }: Request, res: Response, next: NextFunction) {
  if (!utils.endsWith(file?.originalname.toLowerCase(), '.xml')) {
    next()
    return
  }

  challengeUtils.solveIf(challenges.deprecatedInterfaceChallenge, () => { return true })

  const hasBuffer = file?.buffer != null
  const isChallengeEnabled = utils.isChallengeEnabled(challenges.deprecatedInterfaceChallenge)

  if (!hasBuffer || !isChallengeEnabled) {
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'))
    return
  }

  const data = file.buffer.toString()
  try {
    const xmlDoc = libxml.parseXml(data, { noblanks: true, noent: false, nocdata: true })
    const xmlString = xmlDoc.toString(false)
    challengeUtils.solveIf(challenges.xxeFileDisclosureChallenge, () => {
      return (utils.matchesEtcPasswdFile(xmlString) || utils.matchesSystemIniFile(xmlString))
    })
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(xmlString, 400) + ' (' + file.originalname + ')'))
  } catch (err: any) {
    const isTimeout = utils.contains(err.message, 'Script execution timed out')

    if (isTimeout) {
      if (challengeUtils.notSolved(challenges.xxeDosChallenge)) {
        challengeUtils.solve(challenges.xxeDosChallenge)
      }
      res.status(503)
      next(new Error('Sorry, we are temporarily not available! Please try again later.'))
    } else {
      res.status(410)
      next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + err.message + ' (' + file.originalname + ')'))
    }
  }
}

function handleYamlUpload ({ file }: Request, res: Response, next: NextFunction) {
  const isYaml = utils.endsWith(file?.originalname.toLowerCase(), '.yml') ||
                 utils.endsWith(file?.originalname.toLowerCase(), '.yaml')

  if (!isYaml) {
    res.status(204).end()
    return
  }

  challengeUtils.solveIf(challenges.deprecatedInterfaceChallenge, () => { return true })

  const hasBuffer = file?.buffer != null
  const isChallengeEnabled = utils.isChallengeEnabled(challenges.deprecatedInterfaceChallenge)

  if (!hasBuffer || !isChallengeEnabled) {
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons (' + file?.originalname + ')'))
    return
  }

  const data = file.buffer.toString()
  try {
    const yamlString = JSON.stringify(yaml.load(data))
    res.status(410)
    next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + utils.trunc(yamlString, 400) + ' (' + file.originalname + ')'))
  } catch (err: any) {
    const isLengthError = utils.contains(err.message, 'Invalid string length') ||
                          utils.contains(err.message, 'Script execution timed out')

    if (isLengthError) {
      if (challengeUtils.notSolved(challenges.yamlBombChallenge)) {
        challengeUtils.solve(challenges.yamlBombChallenge)
      }
      res.status(503)
      next(new Error('Sorry, we are temporarily not available! Please try again later.'))
    } else {
      res.status(410)
      next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + err.message + ' (' + file.originalname + ')'))
    }
  }
}

export {
  ensureFileIsPassed,
  handleZipFileUpload,
  checkUploadSize,
  checkFileType,
  handleXmlUpload,
  handleYamlUpload
}
