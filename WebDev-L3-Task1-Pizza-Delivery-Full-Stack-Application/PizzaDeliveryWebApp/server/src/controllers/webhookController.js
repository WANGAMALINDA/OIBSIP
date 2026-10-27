import {
  applyWebhookPayment,
  failWebhookPayment,
} from './orderController.js'
import { verifyWebhookSignature } from '../services/paymentService.js'

export async function razorpayWebhook(req, res) {
  const signature = req.get('x-razorpay-signature')
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ message: 'Webhook signature is invalid.' })
  }

  const event = JSON.parse(req.body.toString('utf8'))
  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    if (payment?.order_id && payment.id) {
      await applyWebhookPayment(payment.order_id, payment.id, payment.amount, payment.currency)
    }
  } else if (event.event === 'payment.failed') {
    const payment = event.payload?.payment?.entity
    if (payment?.order_id) await failWebhookPayment(payment.order_id)
  }
  res.json({ received: true })
}
