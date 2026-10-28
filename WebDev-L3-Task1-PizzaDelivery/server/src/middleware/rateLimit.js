export function rateLimit({ windowMs, max }) {
  const requests = new Map()

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    let entry = requests.get(key)

    if (!entry || entry.expiresAt <= now) {
      entry = { count: 0, expiresAt: now + windowMs }
      requests.set(key, entry)
    }

    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.expiresAt - now) / 1000)))
      return res.status(429).json({ message: 'Too many requests. Please wait and try again.' })
    }

    entry.count += 1
    if (requests.size > 10000) {
      for (const [address, bucket] of requests) {
        if (bucket.expiresAt <= now) requests.delete(address)
      }
    }
    next()
  }
}
