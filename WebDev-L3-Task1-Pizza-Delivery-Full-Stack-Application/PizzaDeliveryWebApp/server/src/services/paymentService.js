import { createHmac, timingSafeEqual } from 'node:crypto'

function getCredentials() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.')
    error.status = 503
    throw error
  }
  if (!RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    const error = new Error('Only a Razorpay test key (starting with rzp_test_) is accepted.')
    error.status = 503
    throw error
  }
  return { keyId: RAZORPAY_KEY_ID, secret: RAZORPAY_KEY_SECRET }
}

export function getRazorpayKeyId() {
  return getCredentials().keyId
}

export async function createRazorpayOrder({ amount, receipt }) {
  const { keyId, secret } = getCredentials()
  const result = await razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount, currency: 'USD', receipt, notes: { app: 'pizza-delivery' } }),
  }, keyId, secret)
  return { id: result.id, keyId }
}

export async function getRazorpayPayment(paymentId) {
  const { keyId, secret } = getCredentials()
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, {}, keyId, secret)
}

export async function refundRazorpayPayment(paymentId) {
  const { keyId, secret } = getCredentials()
  const refund = await razorpayRequest(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: 'POST',
      body: JSON.stringify({ notes: { reason: 'Order reservation expired' } }),
    },
    keyId,
    secret,
  )
  return refund.id
}

async function razorpayRequest(path, options, keyId, secret) {
  let response
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    const error = new Error('Could not reach Razorpay. Check the server network connection and try again.')
    error.status = 503
    throw error
  }

  let result
  try {
    result = await response.json()
  } catch {
    const error = new Error(`Razorpay returned an invalid response (HTTP ${response.status}).`)
    error.status = 502
    throw error
  }

  if (!response.ok) {
    const message = response.status === 401
      ? 'Razorpay rejected the test credentials. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.'
      : result.error?.description || `Razorpay request failed with HTTP ${response.status}.`
    const error = new Error(message)
    error.status = 502
    throw error
  }
  return result
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
