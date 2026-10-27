import { useEffect, useState } from 'react'
import { api } from './api.js'
import AdminDashboard from './components/AdminDashboard.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import './App.css'

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem('pizza-session') || 'null')
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState(readSession)
  const [notice, setNotice] = useState('')
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(location.search).get('reset'))
  const [resetPassword, setResetPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    const verificationToken = query.get('verify')
    if (verificationToken) {
      api('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: verificationToken }),
      })
        .then((result) => setNotice(result.message))
        .catch((error) => setNotice(error.message))
        .finally(() => {
          query.delete('verify')
          const suffix = query.toString()
          history.replaceState(null, '', `${location.pathname}${suffix ? `?${suffix}` : ''}`)
        })
    }

    const saved = readSession()
    if (saved) {
      api('/auth/me', { token: saved.token })
        .then((result) => {
          const updated = { token: saved.token, user: result.user }
          localStorage.setItem('pizza-session', JSON.stringify(updated))
          setSession(updated)
        })
        .catch(() => {
          localStorage.removeItem('pizza-session')
          setSession(null)
        })
    }
  }, [])

  function handleLogin(result) {
    const nextSession = { token: result.token, user: result.user }
    localStorage.setItem('pizza-session', JSON.stringify(nextSession))
    setSession(nextSession)
    setNotice('')
  }

  function logout() {
    localStorage.removeItem('pizza-session')
    setSession(null)
    setNotice('')
  }

  async function submitPasswordReset(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    try {
      const result = await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      })
      setNotice(result.message)
      setResetToken(null)
      setResetPassword('')
      history.replaceState(null, '', location.pathname)
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (resetToken) {
    return (
      <div className="app-shell auth-shell">
        <section className="auth-card">
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h1>Choose a new password</h1>
          <form className="form-stack" onSubmit={submitPasswordReset}>
            <label>
              New password
              <input
                autoComplete="new-password"
                minLength={10}
                required
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
              />
            </label>
            <button className="button button-primary" disabled={busy} type="submit">
              {busy ? 'Saving…' : 'Reset password'}
            </button>
          </form>
          {notice && <p className="notice" role="status">{notice}</p>}
        </section>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app-shell auth-shell">
        <AuthPanel onLogin={handleLogin} notice={notice} setNotice={setNotice} />
      </div>
    )
  }

  if (session.user.role === 'admin') {
    return <AdminDashboard onLogout={logout} token={session.token} />
  }

  return <UserDashboard onLogout={logout} token={session.token} user={session.user} />
}

export default App
