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

    doc.text(`${BasketItem.quantity}x ${req.__(name)} ${req.__('ea.')} ${itemPrice} = ${itemTotal}¤`)
    doc.moveDown()

    totalPrice += itemTotal
    totalPoints += itemBonus
  })

  return { totalPrice, basketProducts, totalPoints }
}

async function getDeliveryMethod (req: Request) {
  const defaultMethod = { deluxePrice: 0, price: 0, eta: 5 }

  if (!req.body.orderDetails?.deliveryMethodId) {
    return defaultMethod
  }

  const deliveryMethodFromModel = await DeliveryModel.findOne({
    where: { id: req.body.orderDetails.deliveryMethodId }
  })

  if (deliveryMethodFromModel == null) {
    return defaultMethod
  }

  return {
    deluxePrice: deliveryMethodFromModel.deluxePrice,
    price: deliveryMethodFromModel.price,
    eta: deliveryMethodFromModel.eta
  }
}

async function handleWalletPayment (req: Request, totalPrice: number, totalPoints: number, next: NextFunction) {
  if (!req.body.UserId) return

  if (req.body.orderDetails?.paymentId === 'wallet') {
    const wallet = await WalletModel.findOne({ where: { UserId: req.body.UserId } })

    if (!wallet || wallet.balance < totalPrice) {
      throw new Error('Insufficient wallet balance.')
    }

    try {
      await WalletModel.decrement({ balance: totalPrice }, { where: { UserId: req.body.UserId } })
    } catch (error) {
      next(error)
      return
    }
  }

  try {
    await WalletModel.increment({ balance: totalPoints }, { where: { UserId: req.body.UserId } })
  } catch (error) {
    next(error)
  }
}

function buildPDFDocument (doc: any, req: Request, appConfig: typeof config, email: string, orderId: string, date: string) {
  doc.font('Times-Roman').fontSize(40).text(appConfig.get<string>('application.name'), { align: 'center' })
  doc.moveTo(70, 115).lineTo(540, 115).stroke()
  doc.moveTo(70, 120).lineTo(540, 120).stroke()
  doc.fontSize(20).moveDown()
  doc.font('Times-Roman').fontSize(20).text(req.__('Order Confirmation'), { align: 'center' })
  doc.fontSize(20).moveDown()
  doc.font('Times-Roman').fontSize(15).text(`${req.__('Customer')}: ${email}`, { align: 'left' })
  doc.font('Times-Roman').fontSize(15).text(`${req.__('Order')} #: ${orderId}`, { align: 'left' })
  doc.moveDown()
  doc.font('Times-Roman').fontSize(15).text(`${req.__('Date')}: ${date}`, { align: 'left' })
  doc.moveDown()
  doc.moveDown()
}

export function placeOrder () {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    BasketModel.findOne({ where: { id }, include: [{ model: ProductModel, paranoid: false, as: 'Products' }] })
      .then(async (basket: BasketModel | null) => {
        if (basket == null) {
          next(new Error(`Basket with id=${id} does not exist.`))
          return
        }

        const customer = security.authenticatedUsers.from(req)
        const email = customer?.data?.email ?? ''
        const orderId = security.hash(email).slice(0, 4) + '-' + utils.randomHexString(16)
        const pdfFile = `order_${orderId}.pdf`
        const doc = new PDFDocument()
        const date = new Date().toJSON().slice(0, 10)
        const fileWriter = doc.pipe(fs.createWriteStream(path.join('ftp/', pdfFile)))

        fileWriter.on('finish', async () => {
          void basket.update({ coupon: null })
          await BasketItemModel.destroy({ where: { BasketId: id } })
          res.json({ orderConfirmation: orderId })
        })

        buildPDFDocument(doc, req, config, email, orderId, date)

        const { totalPrice: initialPrice, basketProducts, totalPoints } = processBasketProducts(basket, req, doc, next)
        let totalPrice = initialPrice

        doc.moveDown()
        const discount = calculateApplicableDiscount(basket, req) ?? 0
        let discountAmount = '0'

        if (discount > 0) {
          discountAmount = (totalPrice * (discount / 100)).toFixed(2)
          doc.text(discount + '% discount from coupon: -' + discountAmount + '¤')
          doc.moveDown()
          totalPrice -= parseFloat(discountAmount)
        }

        const deliveryMethod = await getDeliveryMethod(req)
        const deliveryAmount = security.isDeluxe(req) ? deliveryMethod.deluxePrice : deliveryMethod.price
        totalPrice += deliveryAmount

        doc.text(`${req.__('Delivery Price')}: ${deliveryAmount.toFixed(2)}¤`)
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(20).text(`${req.__('Total Price')}: ${totalPrice.toFixed(2)}¤`)
        doc.moveDown()
        doc.font('Helvetica-Bold').fontSize(15).text(`${req.__('Bonus Points Earned')}: ${totalPoints}`)
        doc.font('Times-Roman').fontSize(15).text(`(${req.__('The bonus points from this order will be added 1:1 to your wallet ¤-fund for future purchases!')}`)
        doc.moveDown()
        doc.moveDown()
        doc.font('Times-Roman').fontSize(15).text(req.__('Thank you for your order!'))

        challengeUtils.solveIf(challenges.negativeOrderChallenge, () => { return totalPrice < 0 })

        try {
          await handleWalletPayment(req, totalPrice, totalPoints, next)
        } catch (error) {
          next(error)
          return
        }

        void db.ordersCollection.insert({
          promotionalAmount: discountAmount,
          paymentId: req.body.orderDetails?.paymentId ?? null,
          addressId: req.body.orderDetails?.addressId ?? null,
          orderId,
          delivered: false,
          email: email ? email.replaceAll(/[aeiou]/gi, '*') : undefined,
          totalPrice,
          products: basketProducts,
          bonus: totalPoints,
          deliveryPrice: deliveryAmount,
          eta: deliveryMethod.eta.toString()
        }).then(() => {
          doc.end()
        })
      }).catch((error: unknown) => {
        next(error)
      })
  }
}

function calculateApplicableDiscount (basket: BasketModel, req: Request) {
  if (security.discountFromCoupon(basket.coupon ?? undefined)) {
    const discount = security.discountFromCoupon(basket.coupon ?? undefined)
    challengeUtils.solveIf(challenges.forgedCouponChallenge, () => { return (discount ?? 0) >= 80 })
    console.log(discount)
    return discount
  } else if (req.body.couponData) {
    const couponData = Buffer.from(req.body.couponData, 'base64').toString().split('-')
    const couponCode = couponData[0]
    const couponDate = Number(couponData[1])
    const campaign = campaigns[couponCode as keyof typeof campaigns]

    if (campaign && couponDate == campaign.validOn) { // eslint-disable-line eqeqeq
      challengeUtils.solveIf(challenges.manipulateClockChallenge, () => { return campaign.validOn < new Date().getTime() })
      return campaign.discount
    }
  }
  return 0
}

const campaigns = {
  WMNSDY2019: { validOn: new Date('Mar 08, 2019 00:00:00 GMT+0100').getTime(), discount: 75 },
  WMNSDY2020: { validOn: new Date('Mar 08, 2020 00:00:00 GMT+0100').getTime(), discount: 60 },
  WMNSDY2021: { validOn: new Date('Mar 08, 2021 00:00:00 GMT+0100').getTime(), discount: 60 },
  WMNSDY2022: { validOn: new Date('Mar 08, 2022 00:00:00 GMT+0100').getTime(), discount: 60 },
  WMNSDY2023: { validOn: new Date('Mar 08, 2023 00:00:00 GMT+0100').getTime(), discount: 60 },
  ORANGE2020: { validOn: new Date('May 04, 2020 00:00:00 GMT+0100').getTime(), discount: 50 },
  ORANGE2021: { validOn: new Date('May 04, 2021 00:00:00 GMT+0100').getTime(), discount: 40 },
  ORANGE2022: { validOn: new Date('May 04, 2022 00:00:00 GMT+0100').getTime(), discount: 40 },
  ORANGE2023: { validOn: new Date('May 04, 2023 00:00:00 GMT+0100').getTime(), discount: 40 }
}
