import User from '../models/User.js'
import { verifyToken } from '../config/security.js'

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.get('authorization') || ''
    const [scheme, token] = authorization.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Please sign in to continue.' })
    }

    const payload = verifyToken(token)
    const user = await User.findById(payload.sub).select('_id name email role emailVerified')
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' })
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: error.message === 'Token expired.' ? 'Session expired.' : 'Invalid session.' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access is required.' })
  }
  next()
}

export function requireVerifiedEmail(req, res, next) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ message: 'Verify your email before ordering.' })
  }
  next()
}
