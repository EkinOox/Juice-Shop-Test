/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as frisby from 'frisby'

const URL = 'http://localhost:3000'

describe('/video', () => {
  it('GET promotion video page returns HTML', () => {
    return frisby.get(`${URL}/promotion`)
      .expect('status', 200)
      .expect('header', 'content-type', /text\/html/)
      .expect('bodyContains', 'video')
  })

  it('GET video file with range header returns partial content', () => {
    return frisby.get(`${URL}/video`, {
      headers: { Range: 'bytes=0-1000' }
    })
      .expect('status', 206)
      .expect('header', 'content-type', 'video/mp4')
      .expect('header', 'content-range', /bytes/)
  })

  it('GET video file without range header returns full content', () => {
    return frisby.get(`${URL}/video`)
      .expect('status', 200)
      .expect('header', 'content-type', 'video/mp4')
  })

  it('GET video file with partial range', () => {
    return frisby.get(`${URL}/video`, {
      headers: { Range: 'bytes=1000-2000' }
    })
      .expect('status', 206)
      .expect('header', 'content-range', /bytes 1000-2000/)
  })

  it('GET video file with range without end', () => {
    return frisby.get(`${URL}/video`, {
      headers: { Range: 'bytes=5000-' }
    })
      .expect('status', 206)
      .expect('header', 'content-type', 'video/mp4')
  })
})
