import cors from 'cors'
import express from 'express'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use('/api/health', healthRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

export default app
