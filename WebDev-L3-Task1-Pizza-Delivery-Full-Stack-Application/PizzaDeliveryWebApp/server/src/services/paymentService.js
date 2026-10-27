import { createHmac, timingSafeEqual } from 'node:crypto'

function getCredentials() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  return { keyId: RAZORPAY_KEY_ID, secret: RAZORPAY_KEY_SECRET }
}

export async function createRazorpayOrder({ amount, receipt }) {
  const { keyId, secret } = getCredentials()
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes: { app: 'pizza-delivery' } }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.description || 'Razorpay order creation failed.')
  return { id: result.id, keyId }
}

export function verifyCheckoutSignature(orderId, paymentId, signature) {
  const { secret } = getCredentials()
  const expected = createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
