/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import locales from '../data/static/locales.json'
import fs from 'node:fs'
import { type Request, type Response, type NextFunction } from 'express'

async function calcPercentage (fileContent: any, enContent: any): Promise<number> {
  const totalStrings = Object.keys(enContent).length
  let differentStrings = 0

  for (const key in fileContent) {
    if (Object.prototype.hasOwnProperty.call(fileContent, key) && fileContent[key] !== enContent[key]) {
      differentStrings++
    }
  }

  return (differentStrings / totalStrings) * 100
}

async function processLanguageFile (fileName: string, enContent: any): Promise<any> {
  const content = await fs.promises.readFile('frontend/dist/frontend/assets/i18n/' + fileName, 'utf-8')
  const fileContent = JSON.parse(content)
  const percentage = await calcPercentage(fileContent, enContent)
  const key = fileName.substring(0, fileName.indexOf('.'))
  const locale = locales.find((l) => l.key === key)

  return {
    key,
    lang: fileContent.LANGUAGE,
    icons: locale?.icons,
    shortKey: locale?.shortKey,
    percentage,
    gauge: (percentage > 90 ? 'full' : (percentage > 70 ? 'three-quarters' : (percentage > 50 ? 'half' : (percentage > 30 ? 'quarter' : 'empty'))))
  }
}

export function getLanguageList () {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enContent = JSON.parse(await fs.promises.readFile('frontend/dist/frontend/assets/i18n/en.json', 'utf-8'))
      const languageFiles = await fs.promises.readdir('frontend/dist/frontend/assets/i18n/')

      const languagePromises = languageFiles.map(async (fileName) => {
        if (fileName === 'en.json' || fileName === 'tlh_AA.json') {
          return null
        }
        return await processLanguageFile(fileName, enContent)
      })

      const languageResults = await Promise.all(languagePromises)
      const languages = languageResults.filter(lang => lang !== null)

      languages.push({
        key: 'en',
        icons: ['gb', 'us'],
        shortKey: 'EN',
        lang: 'English',
        percentage: 100,
        gauge: 'full'
      })

      languages.sort((a, b) => a.lang.localeCompare(b.lang))
      res.status(200).json(languages)
    } catch (err: any) {
      next(new Error(`Error processing language files: ${err.message}`))
    }
  }
}
