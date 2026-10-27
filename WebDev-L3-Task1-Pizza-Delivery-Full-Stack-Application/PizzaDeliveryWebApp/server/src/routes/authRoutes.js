import { Router } from 'express'
import {
  adminLogin,
  currentUser,
  forgotPassword,
  register,
  resendVerification,
  resetPassword,
  userLogin,
  verifyEmail,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
const resetLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 })

router.post('/register', authLimit, register)
router.post('/login', authLimit, userLogin)
router.post('/admin/login', authLimit, adminLogin)
router.post('/verify-email', verifyEmail)
router.post('/resend-verification', resetLimit, resendVerification)
router.post('/forgot-password', resetLimit, forgotPassword)
router.post('/reset-password', resetLimit, resetPassword)
router.get('/me', requireAuth, currentUser)

export default router
