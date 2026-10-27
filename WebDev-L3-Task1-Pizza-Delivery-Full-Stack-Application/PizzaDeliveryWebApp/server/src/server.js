import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.js'
import { connectDatabase } from './config/database.js'

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })

const port = Number(process.env.PORT || 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

await connectDatabase()

app.listen(port, () => {
  console.info(`API listening at http://localhost:${port}`)
})
