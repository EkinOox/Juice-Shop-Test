/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import config from 'config'
import { type Request, type Response } from 'express'

export function retrieveAppConfiguration () {
  return (_req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Configuration not available in production' })
    } else {
      res.json({ config })
    }
  }
}
