import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })

const [
  { default: app },
  { connectDatabase },
  { initializeAdmin },
  { initializeInventory },
  { releaseExpiredReservations },
  { sendLowStockAlerts },
] = await Promise.all([
  import('./app.js'),
  import('./config/database.js'),
  import('./services/adminSetupService.js'),
  import('./services/inventoryService.js'),
  import('./services/reservationService.js'),
  import('./services/stockAlertService.js'),
])

const port = Number(process.env.PORT || 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

await connectDatabase()
await initializeAdmin()
await initializeInventory()

let maintenanceRunning = false
async function runMaintenance() {
  if (maintenanceRunning) return
  maintenanceRunning = true
  try {
    await releaseExpiredReservations()
    await sendLowStockAlerts()
  } catch (error) {
    console.error('Scheduled maintenance failed:', error)
  } finally {
    maintenanceRunning = false
  }
}

void runMaintenance()
const maintenanceTimer = setInterval(runMaintenance, 5 * 60 * 1000)
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
