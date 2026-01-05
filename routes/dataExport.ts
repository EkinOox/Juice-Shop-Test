/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from 'express'

import * as challengeUtils from '../lib/challengeUtils'
import { type ProductModel } from '../models/product'
import { MemoryModel } from '../models/memory'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'
import * as db from '../data/mongodb'
import logger from '../lib/logger'
import * as utils from '../lib/utils'

export function dataExport () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))

    if (!loggedInUser?.data?.email || !loggedInUser.data.id) {
      next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
      return
    }

    const username = loggedInUser.data.username
    const email = loggedInUser.data.email
    const updatedEmail = email.replace(/[aeiou]/gi, '*')

    const userData = {
      username,
      email,
      orders: [] as Array<{
        orderId: string
        totalPrice: number
        products: ProductModel[]
        bonus: number
        eta: string
      }>,
      reviews: [] as Array<{
        message: string
        author: string
        productId: number
        likesCount: number
        likedBy: string
      }>,
      memories: [] as Array<{
        imageUrl: string
        caption: string
      }>
    }

    const memories = await MemoryModel.findAll({ where: { UserId: req.body.UserId } })
    memories.forEach((memory: MemoryModel) => {
      userData.memories.push({
        imageUrl: req.protocol + '://' + req.get('host') + '/' + memory.imagePath,
        caption: memory.caption
      })
    })

    try {
      const orders = await db.ordersCollection.find({ email: updatedEmail })

      if (orders.length > 0) {
        orders.forEach(order => {
          userData.orders.push({
            orderId: order.orderId,
            totalPrice: order.totalPrice,
            products: [...order.products],
            bonus: order.bonus,
            eta: order.eta
          })
        })
      }

      const reviews = await db.reviewsCollection.find({ author: email })

      if (reviews.length > 0) {
        reviews.forEach(review => {
          userData.reviews.push({
            message: review.message,
            author: review.author,
            productId: review.product,
            likesCount: review.likesCount,
            likedBy: review.likedBy
          })
        })
      }

      const emailHash = security.hash(email).slice(0, 4)
      for (const order of userData.orders) {
        challengeUtils.solveIf(challenges.dataExportChallenge, () => {
          return order.orderId.split('-')[0] !== emailHash
        })
      }

      res.status(200).send({
        userData: JSON.stringify(userData, null, 2),
        confirmation: 'Your data export will open in a new Browser window.'
      })
    } catch (error) {
      logger.warn(`Error retrieving data for ${updatedEmail}: ${utils.getErrorMessage(error)}`)
      next(error)
    }
  }
}
