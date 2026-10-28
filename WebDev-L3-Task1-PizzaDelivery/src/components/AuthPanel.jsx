import { useState } from 'react'
import { api } from '../api.js'

export default function AuthPanel({ onLogin, notice, setNotice }) {
  const [mode, setMode] = useState('login')
  const [adminMode, setAdminMode] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setNotice('')
    setNeedsVerification(false)
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const result = await api('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: form.email }),
        })
        setNotice(result.message)
      } else {
        const path = mode === 'register'
          ? '/auth/register'
          : adminMode
            ? '/auth/admin/login'
            : '/auth/login'
        const result = await api(path, {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (mode === 'register') {
          setNotice(result.message)
          setMode('login')
        } else {
          onLogin(result)
        }
      }
    } catch (error) {
      setNotice(error.message)
      setNeedsVerification(error.message.toLowerCase().includes('verify your email'))
    } finally {
      setBusy(false)
    }
  }

  async function resendVerification() {
    setNotice('')
    try {
      const result = await api('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      })
      setNotice(result.message)
      setNeedsVerification(false)
    } catch (error) {
      setNotice(error.message)
    }
  }

  const formTitle = mode === 'register'
    ? 'Create your customer account'
    : mode === 'forgot'
      ? 'Reset your password'
      : adminMode
        ? 'Administrator sign in'
        : 'Sign in to your account'

  return (
    <section className="auth-card">
      <p className="eyebrow">CUSTOMER ORDERS AND ADMIN INVENTORY</p>
      <h1>Pizza, made your way.</h1>
      <p className="muted">Build a pizza, order securely, and follow it from kitchen to delivery.</p>
      <div className="auth-switch" role="group" aria-label="Account type">
        <button
          className={!adminMode ? 'selected' : ''}
          type="button"
          onClick={() => { setAdminMode(false); setMode('login'); setNotice(''); setNeedsVerification(false) }}
        >
          Customer
        </button>
        <button
          className={adminMode ? 'selected' : ''}
          type="button"
          onClick={() => { setAdminMode(true); setMode('login'); setNotice(''); setNeedsVerification(false) }}
        >
          Admin
        </button>
      </div>
      <h2>{formTitle}</h2>
      <form className="form-stack" onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Name
            <input
              autoComplete="name"
              maxLength={100}
              minLength={2}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
        )}
        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        {mode !== 'forgot' && (
          <label>
            Password
            <span className="password-input-wrap">
              <input
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 10 : undefined}
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
        )}
        <button className="button button-primary" disabled={busy} type="submit">
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
        </button>
      </form>
      {notice && <p className="notice" role="status">{notice}</p>}
      {needsVerification && (
        <button className="text-button" type="button" onClick={resendVerification}>
          Send a new verification email
        </button>
      )}
      {!adminMode && (
        <div className="auth-links">
          {mode !== 'register' && (
            <button type="button" className="text-button" onClick={() => { setMode('register'); setNotice('') }}>
              Create an account
            </button>
          )}
          {mode !== 'forgot' && mode !== 'register' && (
            <button type="button" className="text-button" onClick={() => { setMode('forgot'); setNotice('') }}>
              Forgot password?
            </button>
          )}
          {mode !== 'login' && (
            <button type="button" className="text-button" onClick={() => { setMode('login'); setNotice('') }}>
              Back to sign in
            </button>
          )}
        </div>
      )}
    </section>
  )
}
