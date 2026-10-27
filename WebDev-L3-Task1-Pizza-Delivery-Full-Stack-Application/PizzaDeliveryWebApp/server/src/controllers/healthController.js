import mongoose from 'mongoose'

export function getHealth(req, res) {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
}
