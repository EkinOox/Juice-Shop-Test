/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as utils from '../../lib/utils'
import { expect } from '@jest/globals'

describe('utils.ts functions', () => {
  it('toMMMYY formats date correctly', () => {
    const date = new Date('2025-01-15')
    const result = utils.toMMMYY(date)
    expect(result).toBe('JAN25')
  })

  it('toMMMYY formats December correctly', () => {
    const date = new Date('2024-12-25')
    const result = utils.toMMMYY(date)
    expect(result).toBe('DEC24')
  })

  it('toISO8601 formats date with single digit month and day', () => {
    const date = new Date('2025-03-05')
    const result = utils.toISO8601(date)
    expect(result).toBe('2025-03-05')
  })

  it('toISO8601 formats date with double digit month and day', () => {
    const date = new Date('2025-11-25')
    const result = utils.toISO8601(date)
    expect(result).toBe('2025-11-25')
  })

  it('randomHexString generates string of correct length', () => {
    const result = utils.randomHexString(16)
    expect(result.length).toBe(16)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('randomHexString generates string of odd length', () => {
    const result = utils.randomHexString(7)
    expect(result.length).toBe(7)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('unquote removes surrounding double quotes', () => {
    const result = utils.unquote('"test"')
    expect(result).toBe('test')
  })

  it('unquote returns string without quotes unchanged', () => {
    const result = utils.unquote('test')
    expect(result).toBe('test')
  })

  it('unquote handles string with only opening quote', () => {
    const result = utils.unquote('"test')
    expect(result).toBe('"test')
  })

  it('trunc shortens string with ellipsis when exceeding length', () => {
    const result = utils.trunc('This is a very long string', 10)
    expect(result).toBe('This is a...')
  })

  it('trunc returns string unchanged when within length', () => {
    const result = utils.trunc('Short', 10)
    expect(result).toBe('Short')
  })

  it('trunc removes newlines from string', () => {
    const result = utils.trunc('Line1\nLine2\rLine3', 100)
    expect(result).toBe('Line1Line2Line3')
  })

  it('parseJsonCustom parses simple JSON object', () => {
    const result = utils.parseJsonCustom('{"key":"value"}')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('key')
    expect(result[0]).toHaveProperty('value')
  })

  it('parseJsonCustom handles nested objects', () => {
    const result = utils.parseJsonCustom('{"outer":{"inner":"value"}}')
    expect(result.length).toBeGreaterThan(0)
  })

  it('matchesSystemIniFile detects Windows system.ini content', () => {
    const content = '; for 16-bit app support'
    const result = utils.matchesSystemIniFile(content)
    expect(result).toBe(true)
  })

  it('matchesSystemIniFile returns false for non-matching content', () => {
    const content = 'This is just some regular text'
    const result = utils.matchesSystemIniFile(content)
    expect(result).toBe(false)
  })

  it('matchesEtcPasswdFile detects /etc/passwd content with colon format', () => {
    const content = 'root:x:0:0:root:/root:/bin/bash'
    const result = utils.matchesEtcPasswdFile(content)
    expect(result).toBe(true)
  })

  it('matchesEtcPasswdFile detects /etc/passwd with consultation note', () => {
    const content = 'Note that this file is consulted directly'
    const result = utils.matchesEtcPasswdFile(content)
    expect(result).toBe(true)
  })

  it('matchesEtcPasswdFile returns false for non-matching content', () => {
    const content = 'This is just some regular text'
    const result = utils.matchesEtcPasswdFile(content)
    expect(result).toBe(false)
  })

  it('extractFilename extracts filename from URL', () => {
    const result = utils.extractFilename('http://example.com/path/to/file.pdf')
    expect(result).toBe('file.pdf')
  })

  it('extractFilename handles URL with query parameters', () => {
    const result = utils.extractFilename('http://example.com/file.pdf?param=value')
    expect(result).toBe('file.pdf')
  })

  it('extractFilename handles encoded characters', () => {
    const result = utils.extractFilename('http://example.com/My%20File.pdf')
    expect(result).toBe('My File.pdf')
  })

  it('toSimpleIpAddress converts IPv6 ::ffff: prefix', () => {
    const result = utils.toSimpleIpAddress('::ffff:192.168.1.1')
    expect(result).toBe('192.168.1.1')
  })

  it('toSimpleIpAddress converts ::1 to 127.0.0.1', () => {
    const result = utils.toSimpleIpAddress('::1')
    expect(result).toBe('127.0.0.1')
  })

  it('toSimpleIpAddress returns IPv6 unchanged', () => {
    const result = utils.toSimpleIpAddress('2001:db8::1')
    expect(result).toBe('2001:db8::1')
  })

  it('startsWith returns true for matching prefix', () => {
    const result = utils.startsWith('http://example.com', 'http')
    expect(result).toBe(true)
  })

  it('startsWith returns false for non-matching prefix', () => {
    const result = utils.startsWith('ftp://example.com', 'http')
    expect(result).toBe(false)
  })

  it('endsWith returns true for matching suffix', () => {
    const result = utils.endsWith('file.pdf', '.pdf')
    expect(result).toBe(true)
  })

  it('endsWith returns false for non-matching suffix', () => {
    const result = utils.endsWith('file.pdf', '.txt')
    expect(result).toBe(false)
  })

  it('contains returns true when element is in string', () => {
    const result = utils.contains('Hello World', 'World')
    expect(result).toBe(true)
  })

  it('contains returns false when element is not in string', () => {
    const result = utils.contains('Hello World', 'Universe')
    expect(result).toBe(false)
  })

  it('containsEscaped detects escaped quotes', () => {
    const result = utils.containsEscaped('Some \\"quoted\\" text', '"quoted"')
    expect(result).toBe(true)
  })

  it('containsOrEscaped returns true for direct match', () => {
    const result = utils.containsOrEscaped('Hello "World"', '"World"')
    expect(result).toBe(true)
  })

  it('containsOrEscaped returns true for escaped match', () => {
    const result = utils.containsOrEscaped('Hello \\"World\\"', '"World"')
    expect(result).toBe(true)
  })
})
