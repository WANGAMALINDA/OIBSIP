import { Router } from 'express'
import {
  createOrderPayment,
  getAllOrders,
  getMenu,
  getMyOrders,
  updateOrderStatus,
  verifyOrderPayment,
} from '../controllers/orderController.js'
import { requireAdmin, requireAuth, requireVerifiedEmail } from '../middleware/auth.js'

const router = Router()

router.get('/menu', getMenu)
router.post('/payments/order', requireAuth, requireVerifiedEmail, createOrderPayment)
router.post('/payments/verify', requireAuth, verifyOrderPayment)
router.get('/orders/mine', requireAuth, getMyOrders)
router.get('/admin/orders', requireAuth, requireAdmin, getAllOrders)
router.patch('/admin/orders/:id/status', requireAuth, requireAdmin, updateOrderStatus)

export default router
