/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs from 'node:fs'
import path from 'node:path'
import config from 'config'
import PDFDocument from 'pdfkit'
import { type Request, type Response, type NextFunction } from 'express'

import { challenges, products } from '../data/datacache'
import * as challengeUtils from '../lib/challengeUtils'
import { BasketItemModel } from '../models/basketitem'
import { DeliveryModel } from '../models/delivery'
import { QuantityModel } from '../models/quantity'
import { ProductModel } from '../models/product'
import { BasketModel } from '../models/basket'
import { WalletModel } from '../models/wallet'
import * as security from '../lib/insecurity'
import * as utils from '../lib/utils'
import * as db from '../data/mongodb'

interface Product {
  quantity: number
  id?: number
  name: string
  price: number
  total: number
  bonus: number
}

async function updateProductQuantity (basketItem: any, next: NextFunction) {
  try {
    const product = await QuantityModel.findOne({ where: { ProductId: basketItem.ProductId } })
    if (product) {
      const newQuantity = product.quantity - basketItem.quantity
      await QuantityModel.update({ quantity: newQuantity }, { where: { ProductId: basketItem.ProductId } })
    }
  } catch (error) {
    next(error)
  }
}

function calculateItemPrice (req: Request, deluxePrice: number, price: number): number {
  return security.isDeluxe(req) ? deluxePrice : price
}

function processBasketProducts (basket: BasketModel, req: Request, doc: any, next: NextFunction) {
  let totalPrice = 0
  const basketProducts: Product[] = []
  let totalPoints = 0

  basket.Products?.forEach(({ BasketItem, price, deluxePrice, name, id }) => {
    if (BasketItem == null) return

    challengeUtils.solveIf(challenges.christmasSpecialChallenge, () => {
      return BasketItem.ProductId === products.christmasSpecial.id
    })

    void updateProductQuantity(BasketItem, next)

    const itemPrice = calculateItemPrice(req, deluxePrice, price)
    const itemTotal = itemPrice * BasketItem.quantity
    const itemBonus = Math.round(itemPrice / 10) * BasketItem.quantity

    basketProducts.push({
      quantity: BasketItem.quantity,
      id,
      name: req.__(name),
      price: itemPrice,
      total: itemTotal,
      bonus: itemBonus
    })

