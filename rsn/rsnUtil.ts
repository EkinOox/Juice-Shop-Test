import fs from 'node:fs'
import colors from 'colors/safe'
import { diffLines, structuredPatch } from 'diff'

import { retrieveCodeSnippet } from '../routes/vulnCodeSnippet'

const fixesPath = 'data/static/codefixes'
const cacheFile = 'rsn/cache.json'

type CacheData = Record<string, {
  added: number[]
  removed: number[]
}>

function readFiles () {
  const files = fs.readdirSync(fixesPath)
  const keys = files.filter((file: string) => !file.endsWith('.info.yml') && !file.endsWith('.editorconfig'))
  return keys
}

function writeToFile (json: CacheData) {
  fs.writeFileSync(cacheFile, JSON.stringify(json, null, '\t'))
}

function getDataFromFile () {
  const data = fs.readFileSync(cacheFile).toString()
  return JSON.parse(data)
}

function filterString (text: string) {
  text = text.replace(/\r/g, '')
  return text
}

function processAddedLines (diff: any[], snippet: any, data: CacheData, val: string): number {
  let line = 0

  for (const part of diff) {
    if (!part.count || part.removed) {
      continue
    }

    const prev = line
    line += part.count

    if (!part.added) {
      continue
    }

    for (let i = 0; i < part.count; i++) {
      const lineNum = prev + i + 1
      const isVulnLine = snippet.vulnLines.includes(lineNum)
      const isNeutralLine = snippet.neutralLines.includes(lineNum)

      if (!isVulnLine && !isNeutralLine) {
        process.stdout.write(colors.red(colors.inverse(lineNum + '')))
        process.stdout.write(' ')
        data[val].added.push(lineNum)
      } else if (isVulnLine) {
        process.stdout.write(colors.red(colors.bold(lineNum + ' ')))
      } else if (isNeutralLine) {
        process.stdout.write(colors.red(lineNum + ' '))
      }
    }
  }

  return line
}

function processRemovedLines (diff: any[], snippet: any, data: CacheData, val: string) {
  let line = 0
  let norm = 0

  for (const part of diff) {
    if (!part.count) {
      continue
    }

    if (part.added) {
      norm--
      continue
    }

    const prev = line
    line += part.count

    if (!part.removed) {
      continue
    }

    let temp = norm
    for (let i = 0; i < part.count; i++) {
      const lineNum = prev + i + 1 - norm
      const isVulnLine = snippet.vulnLines.includes(lineNum)
      const isNeutralLine = snippet.neutralLines.includes(lineNum)

      if (!isVulnLine && !isNeutralLine) {
        process.stdout.write(colors.green(colors.inverse(lineNum + '')))
        process.stdout.write(' ')
        data[val].removed.push(lineNum)
      } else if (isVulnLine) {
        process.stdout.write(colors.green(colors.bold(lineNum + ' ')))
      } else if (isNeutralLine) {
        process.stdout.write(colors.green(lineNum + ' '))
      }
      temp++
    }
    norm = temp
  }
}

const checkDiffs = async (keys: string[]) => {
  const data: CacheData = keys.reduce((prev, curr) => {
    return {
      ...prev,
      [curr]: {
        added: [],
        removed: []
      }
    }
  }, {})

  for (const val of keys) {
    try {
      const snippet = await retrieveCodeSnippet(val.split('_')[0])
      if (snippet == null) continue

      process.stdout.write(val + ': ')
      const fileData = fs.readFileSync(fixesPath + '/' + val).toString()
      const diff = diffLines(filterString(fileData), filterString(snippet.snippet))

      processAddedLines(diff, snippet, data, val)
      processRemovedLines(diff, snippet, data, val)

      process.stdout.write('\n')
    } catch (err) {
      console.log(err)
    }
  }

  return data
}

async function seePatch (file: string) {
  const fileData = fs.readFileSync(fixesPath + '/' + file).toString()
  const snippet = await retrieveCodeSnippet(file.split('_')[0])
  if (snippet == null) return
  const patch = structuredPatch(file, file, filterString(snippet.snippet), filterString(fileData))
  console.log(colors.bold(file + '\n'))
  for (const hunk of patch.hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith('-')) {
        console.log(colors.red(line))
      } else if (line.startsWith('+')) {
        console.log(colors.green(line))
      } else {
        console.log(line)
      }
    }
  }
  console.log('---------------------------------------')
}

function checkData (data: CacheData, fileData: CacheData) {
  const filesWithDiff = []
  for (const key in data) {
    const fileDataValueAdded = fileData[key].added.sort((a, b) => a - b)
    const dataValueAdded = data[key].added.sort((a, b) => a - b)
    const fileDataValueRemoved = fileData[key].added.sort((a, b) => a - b)
    const dataValueAddedRemoved = data[key].added.sort((a, b) => a - b)
    if (fileDataValueAdded.length === dataValueAdded.length && fileDataValueRemoved.length === dataValueAddedRemoved.length) {
      if (!dataValueAdded.every((val: number, ind: number) => fileDataValueAdded[ind] === val)) {
        console.log(colors.red(key))
        filesWithDiff.push(key)
      }
      if (!dataValueAddedRemoved.every((val: number, ind: number) => fileDataValueRemoved[ind] === val)) {
        console.log(colors.red(key))
        filesWithDiff.push(key)
      }
    } else {
      console.log(colors.red(key))
      filesWithDiff.push(key)
    }
  }
  return filesWithDiff
}

export {
  checkDiffs,
  writeToFile,
  getDataFromFile,
  readFiles,
  seePatch,
  checkData
}
