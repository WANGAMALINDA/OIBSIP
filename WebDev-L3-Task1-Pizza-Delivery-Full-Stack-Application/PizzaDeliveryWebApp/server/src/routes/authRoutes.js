import { Router } from 'express'
import {
  adminLogin,
  currentUser,
  forgotPassword,
  register,
  resetPassword,
  userLogin,
  verifyEmail,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', userLogin)
router.post('/admin/login', adminLogin)
router.post('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', requireAuth, currentUser)

export default router
