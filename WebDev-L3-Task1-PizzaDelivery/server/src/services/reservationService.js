import Order from '../models/Order.js'
import { restoreInventory, withTransaction } from './inventoryService.js'

export async function releaseExpiredReservations() {
  const expiredIds = await Order.find({
    status: 'payment_pending',
    reservationExpiresAt: { $lte: new Date() },
  }).distinct('_id')

  for (const id of expiredIds) {
    await withTransaction(async (session) => {
      const order = await Order.findOneAndUpdate(
        { _id: id, status: 'payment_pending', reservationExpiresAt: { $lte: new Date() } },
        { $set: { status: 'cancelled' } },
        { new: true, session },
      )
      if (order) await restoreInventory(order.inventoryItems, session)
    })
  }
}
