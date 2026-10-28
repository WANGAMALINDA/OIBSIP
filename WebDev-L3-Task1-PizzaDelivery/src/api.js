const API_URL = import.meta.env.VITE_API_URL || ''

export async function api(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_URL}/api${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the API. Start the backend and check that MongoDB is connected.')
  }

  const contentType = response.headers.get('content-type') || ''
  let result = {}
  if (contentType.includes('application/json')) {
    try {
      result = await response.json()
    } catch {
      throw new Error(`The API returned an invalid response (HTTP ${response.status}). Check the backend logs.`)
    }
  }

  if (!response.ok) {
    if (response.status === 502 && !contentType.includes('application/json')) {
      throw new Error('The API server is not reachable. Start it with "npm.cmd run server:dev" and check its terminal for startup errors.')
    }
    const message = typeof result?.message === 'string' && result.message.trim()
      ? result.message
      : `The API returned HTTP ${response.status} for ${path}. Check the backend logs.`
    throw new Error(message)
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`The API returned an unexpected response (HTTP ${response.status}). Check the backend URL and logs.`)
  }

  return result
}

export function formatPrice(minorUnits, currency = 'USD') {
  const locale = {
    USD: 'en-US',
    INR: 'en-IN',
    ZAR: 'en-ZA',
  }[currency] || 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100)
}

export const statusLabels = {
  payment_pending: 'Awaiting payment',
  received: 'Order received',
  in_kitchen: 'In kitchen',
  out_for_delivery: 'Sent to delivery',
  cancelled: 'Cancelled',
}
