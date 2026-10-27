import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Inventory from '../models/Inventory.js'
import { getOrderItems, menu } from '../data/menu.js'
import {
  reserveInventory,
  restoreInventory,
  withTransaction,
} from '../services/inventoryService.js'
import {
  createRazorpayOrder,
  verifyCheckoutSignature,
} from '../services/paymentService.js'

const nextStatus = {
  received: 'in_kitchen',
  in_kitchen: 'out_for_delivery',
}

export async function getMenu(req, res) {
  res.json({ menu })
}

export async function createOrderPayment(req, res) {
  const parsed = getOrderItems(req.body)
  const orderId = new mongoose.Types.ObjectId()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await withTransaction(async (session) => {
    await reserveInventory(parsed.inventoryItems, session)
    await Order.create(
      [{
        _id: orderId,
        user: req.user._id,
        ...parsed,
        status: 'payment_pending',
        reservationExpiresAt: expiresAt,
      }],
      { session },
    )
  })

  try {
    const paymentOrder = await createRazorpayOrder({
      amount: parsed.totalPaise,
      receipt: orderId.toString(),
    })
    await Order.updateOne(
      { _id: orderId },
      { $set: { razorpayOrderId: paymentOrder.id } },
    )
    res.status(201).json({
      orderId: orderId.toString(),
      amount: parsed.totalPaise,
      currency: 'INR',
      razorpayOrderId: paymentOrder.id,
      razorpayKeyId: paymentOrder.keyId,
      expiresAt,
    })
  } catch (error) {
    await withTransaction(async (session) => {
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: 'payment_pending' },
        { $set: { status: 'cancelled' } },
        { new: true, session },
      )
      if (order) await restoreInventory(order.inventoryItems, session)
    })
    throw error
  }
}

export async function verifyOrderPayment(req, res) {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
  if ([orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature].some((value) => typeof value !== 'string')) {
    return res.status(400).json({ message: 'Payment verification details are incomplete.' })
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id })
  if (!order || order.razorpayOrderId !== razorpayOrderId) {
    return res.status(404).json({ message: 'Order not found.' })
  }
  if (order.status !== 'payment_pending') {
    return res.status(409).json({ message: 'This order is no longer awaiting payment.' })
  }
  if (!verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return res.status(400).json({ message: 'Payment signature is invalid.' })
  }

  const { getRazorpayPayment } = await import('../services/paymentService.js')
  const payment = await getRazorpayPayment(razorpayPaymentId)
  if (
    payment.order_id !== razorpayOrderId ||
    payment.amount !== order.totalPaise ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured'
  ) {
    return res.status(409).json({ message: 'Payment has not been captured for this order.' })
  }

  const updated = await markOrderPaid(order, razorpayPaymentId)
  res.json({ message: 'Payment confirmed.', order: updated })
}

async function markOrderPaid(order, paymentId) {
  return withTransaction(async (session) => {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: 'payment_pending' },
      {
        $set: {
          status: 'received',
          razorpayPaymentId: paymentId,
          reservationExpiresAt: undefined,
        },
      },
      { new: true, session },
    )
    if (!updated) {
      const latest = await Order.findById(order._id).session(session)
      if (latest?.status === 'received' && latest.razorpayPaymentId === paymentId) return latest
      const error = new Error('Order reservation expired before payment was confirmed.')
      error.status = 409
      throw error
    }
    return updated
  })
}

export async function applyWebhookPayment(orderId, paymentId, amount, currency) {
  const order = await Order.findOne({ razorpayOrderId: orderId })
  if (!order || order.totalPaise !== amount || currency !== 'INR') return
  await markOrderPaid(order, paymentId)
}

export async function failWebhookPayment(razorpayOrderId) {
  if (!razorpayOrderId) return
  await withTransaction(async (session) => {
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId, status: 'payment_pending' },
      { $set: { status: 'cancelled' } },
      { new: true, session },
    )
    if (order) await restoreInventory(order.inventoryItems, session)
  })
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50)
  res.json({ orders })
}

export async function getAllOrders(req, res) {
  const orders = await Order.find({ status: { $ne: 'payment_pending' } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(200)
  res.json({ orders })
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body
  if (!Object.values(nextStatus).includes(status)) {
    return res.status(400).json({ message: 'Choose the next valid order status.' })
  }
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: Object.keys(nextStatus).find((current) => nextStatus[current] === status) },
    { $set: { status } },
    { new: true, runValidators: true },
  )
  if (!order) return res.status(404).json({ message: 'Order not found or cannot be updated.' })
  res.json({ order })
}
