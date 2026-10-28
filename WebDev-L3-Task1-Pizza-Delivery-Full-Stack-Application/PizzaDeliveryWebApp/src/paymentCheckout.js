import { api } from './api.js'

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your connection and try again.'))
    document.body.appendChild(script)
  })
}

export async function openRazorpayCheckout({ order, token, description, onSuccess, onFailure, onDismiss }) {
  await loadRazorpay()
  const checkout = new window.Razorpay({
    key: order.razorpayKeyId,
    amount: order.amount,
    currency: order.currency,
    name: 'Pizza Delivery',
    description,
    order_id: order.razorpayOrderId,
    prefill: { name: '', email: '' },
    theme: { color: '#b63e24' },
    handler: async (payment) => {
      try {
        const result = await api('/payments/verify', {
          token,
          method: 'POST',
          body: JSON.stringify({
            orderId: order.orderId,
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpaySignature: payment.razorpay_signature,
          }),
        })
        onSuccess(result)
      } catch (error) {
        onFailure(error)
      }
    },
    modal: { ondismiss: onDismiss },
  })
  checkout.on('payment.failed', (event) => {
    onFailure(new Error(event.error?.description || 'Payment was not completed. Your reserved stock will be released automatically.'))
  })
  checkout.open()
}
