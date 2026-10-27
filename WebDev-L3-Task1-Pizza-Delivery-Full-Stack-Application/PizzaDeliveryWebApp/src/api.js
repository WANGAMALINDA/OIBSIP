const API_URL = import.meta.env.VITE_API_URL || ''

export async function api(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'The request could not be completed.')
  return result
}

export function formatPrice(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export const statusLabels = {
  payment_pending: 'Awaiting payment',
  received: 'Order received',
  in_kitchen: 'In kitchen',
  out_for_delivery: 'Sent to delivery',
  cancelled: 'Cancelled',
}
