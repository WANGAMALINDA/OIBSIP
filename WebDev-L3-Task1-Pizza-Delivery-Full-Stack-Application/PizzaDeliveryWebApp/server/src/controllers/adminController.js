import Inventory from '../models/Inventory.js'
import Order from '../models/Order.js'

export async function getInventory(req, res) {
  const inventory = await Inventory.find().sort({ category: 1, name: 1 })
  res.json({ inventory })
}

export async function updateInventory(req, res) {
  const quantity = Number(req.body.quantity)
  const lowStockThreshold = Number(req.body.lowStockThreshold)
  if (
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    !Number.isInteger(lowStockThreshold) ||
    lowStockThreshold < 0
  ) {
    return res.status(400).json({ message: 'Stock and alert threshold must be non-negative whole numbers.' })
  }

  const inventory = await Inventory.findOneAndUpdate(
    { key: req.params.key },
    [{
      $set: {
        quantity,
        lowStockThreshold,
        notificationSent: {
          $cond: [{ $gte: [quantity, lowStockThreshold] }, false, '$notificationSent'],
        },
      },
    }],
    { new: true },
  )
  if (!inventory) return res.status(404).json({ message: 'Inventory item not found.' })
  res.json({ inventory })
}

export async function getAdminDashboard(req, res) {
  const [inventory, orders, counts] = await Promise.all([
    Inventory.find().sort({ category: 1, name: 1 }),
    Order.find({ status: { $ne: 'payment_pending' } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200),
    Order.aggregate([
      { $match: { status: { $nin: ['payment_pending', 'cancelled'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ])
  res.json({
    inventory,
    orders: orders.map((order) => {
      const result = order.toObject()
      if (!result.currency && result.totalPaise !== undefined) {
        result.currency = 'INR'
        result.totalMinorUnits = result.totalPaise
      }
      return result
    }),
    counts,
  })
}
