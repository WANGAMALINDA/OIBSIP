import User from '../models/User.js'
import { createToken, createOneTimeToken, hashOneTimeToken, hashPassword, verifyPassword } from '../config/security.js'
import { sendEmail } from '../services/emailService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified }
}

function createLoginResponse(user) {
  return { token: createToken({ sub: user.id, role: user.role }), user: publicUser(user) }
}

export async function register(req, res) {
  const { name, email, password } = req.body
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' })
  }
  if (typeof email !== 'string' || !emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 10 and 128 characters.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: 'An account with that email already exists.' })
  }

  const verificationToken = createOneTimeToken()
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    emailVerificationTokenHash: hashOneTimeToken(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  })

  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}?verify=${verificationToken}`
  await sendEmail({
    to: user.email,
    subject: 'Verify your pizza delivery account',
    html: `<p>Hi ${user.name},</p><p><a href="${verificationUrl}">Verify your email address</a>. This link expires in one hour.</p>`,
  })
  res.status(201).json({ message: 'Account created. Check your email to verify it before signing in.' })
}

export async function verifyEmail(req, res) {
  const { token } = req.body
  if (typeof token !== 'string' || token.length > 200) {
    return res.status(400).json({ message: 'Verification link is invalid or expired.' })
  }
  const user = await User.findOne({
    emailVerificationTokenHash: hashOneTimeToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt')
  if (!user) return res.status(400).json({ message: 'Verification link is invalid or expired.' })

  user.emailVerified = true
  user.emailVerificationTokenHash = undefined
  user.emailVerificationExpiresAt = undefined
  await user.save()
  res.json({ message: 'Email verified. You can now sign in.' })
}

async function login(req, res, requiredRole) {
  const { email, password } = req.body
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' })
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  if (!user || !(await verifyPassword(password, user.passwordHash)) || user.role !== requiredRole) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }
  if (requiredRole === 'user' && !user.emailVerified) {
    return res.status(403).json({ message: 'Please verify your email before signing in.' })
  }
  res.json(createLoginResponse(user))
}

export async function userLogin(req, res) {
  await login(req, res, 'user')
}

export async function adminLogin(req, res) {
  await login(req, res, 'admin')
}

export async function currentUser(req, res) {
  res.json({ user: publicUser(req.user) })
}

export async function forgotPassword(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' })

  const user = await User.findOne({ email, role: 'user' })
  if (user) {
    const token = createOneTimeToken()
    user.passwordResetTokenHash = hashOneTimeToken(token)
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await user.save()
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}?reset=${token}`
    await sendEmail({
      to: user.email,
      subject: 'Reset your pizza delivery password',
      html: `<p><a href="${resetUrl}">Reset your password</a>. This link expires in 30 minutes.</p>`,
    })
  }
  res.json({ message: 'If that account exists, a password reset email has been sent.' })
}

export async function resetPassword(req, res) {
  const { token, password } = req.body
  if (typeof token !== 'string' || token.length > 200 || typeof password !== 'string' || password.length < 10 || password.length > 128) {
    return res.status(400).json({ message: 'A valid reset link and a password of 10–128 characters are required.' })
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashOneTimeToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
    role: 'user',
  }).select('+passwordResetTokenHash +passwordResetExpiresAt')
  if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired.' })

  user.passwordHash = await hashPassword(password)
  user.passwordResetTokenHash = undefined
  user.passwordResetExpiresAt = undefined
  await user.save()
  res.json({ message: 'Password reset. You can now sign in.' })
}
