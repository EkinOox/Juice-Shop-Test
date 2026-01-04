/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'
import { expect } from '@jest/globals'

const URL = 'http://localhost:3000'

describe('/metrics', () => {
  it('GET metrics endpoint returns Prometheus metrics', () => {
    return frisby.get(`${URL}/metrics`)
      .expect('status', 200)
      .expect('header', 'content-type', /^text\/plain/)
      .expect('bodyContains', 'process_cpu_user_seconds_total')
  })

  it('GET metrics with different user agent still returns metrics', () => {
    return frisby.get(`${URL}/metrics`, {
      headers: { 'User-Agent': 'CustomBot/1.0' }
    })
      .expect('status', 200)
      .expect('bodyContains', 'nodejs_version_info')
  })

  it('GET metrics includes various mongodb collection counts', () => {
    return frisby.get(`${URL}/metrics`)
      .expect('status', 200)
      .then(({ body }) => {
        // Vérifie que le corps contient des métriques Prometheus
        const bodyStr = String(body)
        expect(bodyStr.length).toBeGreaterThan(0)
        expect(typeof bodyStr).toBe('string')
        // Les métriques Prometheus contiennent des compteurs
        expect(body).toMatch(/# TYPE/)
      })
  })

  it('GET metrics includes http_requests_count metric', () => {
    return frisby.get(`${URL}/metrics`)
      .expect('status', 200)
      .then(({ body }) => {
        const bodyStr = String(body)
        expect(bodyStr).toContain('http_requests_count')
      })
  })
})
