import cors from 'cors'
import express from 'express'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import healthRoutes from './routes/healthRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import { razorpayWebhook } from './controllers/webhookController.js'

const app = express()

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })
  next()
})
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhook)
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
    return res.status(400).json({ message: 'A JSON object is required.' })
  }
  next()
})
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api', orderRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  console.error(error)
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'An unexpected server error occurred.',
  })
})

export default app
