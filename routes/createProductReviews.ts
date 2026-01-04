/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { reviewsCollection } from '../data/mongodb'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'

export function createProductReviews () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    challengeUtils.solveIf(
      challenges.forgedReviewChallenge,
      () => user?.data?.email !== req.body.author
    )

    // Validate input parameters
    const productId = Number.parseInt(req.params.id)
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' })
    }

    const { author, message } = req.body

    // Validate author and message
    if (!author || typeof author !== 'string' || author.trim().length === 0 || author.length > 100) {
      return res.status(400).json({ error: 'Invalid author name' })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 1000) {
      return res.status(400).json({ error: 'Invalid message content' })
    }

    // Sanitize inputs
    const sanitizedAuthor = author.trim()
    const sanitizedMessage = message.trim()

    try {
      await reviewsCollection.insert({
        product: productId,
        message: sanitizedMessage,
        author: sanitizedAuthor,
        likesCount: 0,
        likedBy: []
      })
      return res.status(201).json({ status: 'success' })
    } catch (err: unknown) {
      return res.status(500).json(utils.getErrorMessage(err))
    }
  }
}
