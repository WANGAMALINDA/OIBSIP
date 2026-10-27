import Inventory from '../models/Inventory.js'
import { sendEmail } from './emailService.js'

export async function sendLowStockAlerts() {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('ADMIN_EMAIL is not configured for stock alerts.')

  const lowStock = await Inventory.find({
    $expr: { $lt: ['$quantity', '$lowStockThreshold'] },
    notificationSent: false,
  })

  for (const item of lowStock) {
    await sendEmail({
      to: adminEmail,
      subject: `Low pizza inventory: ${item.name}`,
      html: `<p>${item.category} <strong>${item.name}</strong> has ${item.quantity} units remaining. The alert threshold is ${item.lowStockThreshold}.</p>`,
    })
    item.notificationSent = true
    await item.save()
  }
}
