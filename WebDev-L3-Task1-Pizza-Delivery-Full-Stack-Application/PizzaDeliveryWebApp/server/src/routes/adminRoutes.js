import { Router } from 'express'
import { getAdminDashboard, getInventory, updateInventory } from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)
router.get('/dashboard', getAdminDashboard)
router.get('/inventory', getInventory)
router.patch('/inventory/:key', updateInventory)

export default router
