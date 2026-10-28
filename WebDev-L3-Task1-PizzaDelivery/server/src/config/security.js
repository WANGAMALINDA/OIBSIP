import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters.')
  }
  return secret
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 64)
  return `${salt}:${key.toString('hex')}`
}

export async function verifyPassword(password, storedHash) {
  const [salt, storedKey] = storedHash.split(':')
  if (!salt || !storedKey) return false
  const key = await scrypt(password, salt, 64)
  const expected = Buffer.from(storedKey, 'hex')
  return expected.length === key.length && timingSafeEqual(expected, key)
}

export function createToken(payload, expiresInSeconds = 60 * 60 * 24) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  ).toString('base64url')
  const content = `${header}.${body}`
  const signature = createHmac('sha256', getJwtSecret()).update(content).digest('base64url')
  return `${content}.${signature}`
}

export function verifyToken(token) {
  const [header, body, signature] = token.split('.')
  if (!header || !body || !signature) throw new Error('Invalid token.')
  const content = `${header}.${body}`
  const expected = createHmac('sha256', getJwtSecret()).update(content).digest()
  const received = Buffer.from(signature, 'base64url')
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error('Invalid token.')
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired.')
  }
  return payload
}

export function createOneTimeToken() {
  return randomBytes(32).toString('hex')
}

export function hashOneTimeToken(token) {
  return createHmac('sha256', getJwtSecret()).update(token).digest('hex')
}
