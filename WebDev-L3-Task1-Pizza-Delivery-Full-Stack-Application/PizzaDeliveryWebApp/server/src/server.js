import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.js'
import { connectDatabase } from './config/database.js'
import { initializeAdmin } from './services/adminSetupService.js'
import { initializeInventory } from './services/inventoryService.js'
import { releaseExpiredReservations } from './services/reservationService.js'
import { sendLowStockAlerts } from './services/stockAlertService.js'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })

const port = Number(process.env.PORT || 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

await connectDatabase()
await initializeAdmin()
await initializeInventory()

const maintenanceTimer = setInterval(async () => {
  try {
    await releaseExpiredReservations()
    await sendLowStockAlerts()
  } catch (error) {
    console.error('Scheduled maintenance failed:', error)
  }
}, 5 * 60 * 1000)
maintenanceTimer.unref()

const server = app.listen(port, () => {
  console.info(`API listening at http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearInterval(maintenanceTimer)
    server.close(() => process.exit(0))
  })
}
