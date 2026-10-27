import User from '../models/User.js'
import { hashPassword } from '../config/security.js'

export async function initializeAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to create the admin account.')
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.')
  }

  const existing = await User.findOne({ email }).select('+passwordHash')
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('ADMIN_EMAIL belongs to a non-admin account; choose a different admin email.')
    }
    return
  }

  await User.create({
    name: 'Administrator',
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
    emailVerified: true,
  })
}
