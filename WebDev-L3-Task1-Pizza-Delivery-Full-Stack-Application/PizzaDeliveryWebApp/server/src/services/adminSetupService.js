import User from '../models/User.js'
import { hashPassword, verifyPassword } from '../config/security.js'

export async function initializeAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
    console.warn('Admin sign-in is disabled until a valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters are configured.')
    return false
  }

  const existing = await User.findOne({ email }).select('+passwordHash')
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('ADMIN_EMAIL belongs to a non-admin account; choose a different admin email.')
    }

    if (!(await verifyPassword(password, existing.passwordHash))) {
      existing.passwordHash = await hashPassword(password)
      await existing.save()
      console.info('Admin password synchronized with ADMIN_PASSWORD from server/.env.')
    }

    return true
  }

  await User.create({
    name: 'Administrator',
    email,
    passwordHash: await hashPassword(password),
    role: 'admin',
    emailVerified: true,
  })
  return true
}
