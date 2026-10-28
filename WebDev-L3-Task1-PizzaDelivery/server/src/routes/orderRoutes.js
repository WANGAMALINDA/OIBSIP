import { Router } from 'express'
import {
  createOrderPayment,
  getAllOrders,
  hideCancelledOrder,
  getMenu,
  getMyOrders,
  resumeOrderPayment,
  updateOrderStatus,
  verifyOrderPayment,
} from '../controllers/orderController.js'
import { requireAdmin, requireAuth, requireVerifiedEmail } from '../middleware/auth.js'

const router = Router()

router.get('/menu', getMenu)
router.post('/payments/order', requireAuth, requireVerifiedEmail, createOrderPayment)
router.post('/payments/orders/:id/resume', requireAuth, resumeOrderPayment)
router.post('/payments/verify', requireAuth, verifyOrderPayment)
router.get('/orders/mine', requireAuth, getMyOrders)
router.delete('/orders/mine/:id', requireAuth, hideCancelledOrder)
router.get('/admin/orders', requireAuth, requireAdmin, getAllOrders)
router.patch('/admin/orders/:id/status', requireAuth, requireAdmin, updateOrderStatus)

export default router
