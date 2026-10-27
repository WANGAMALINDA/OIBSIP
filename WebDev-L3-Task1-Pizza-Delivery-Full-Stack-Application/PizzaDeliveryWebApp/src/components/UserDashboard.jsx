import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import OrderList from './OrderList.jsx'
import PizzaBuilder from './PizzaBuilder.jsx'

export default function UserDashboard({ user, token, onLogout }) {
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState('')

  const refreshOrders = useCallback(async () => {
    try {
      const result = await api('/orders/mine', { token })
      setOrders(result.orders)
    } catch (error) {
      setNotice(error.message)
    }
  }, [token])

  useEffect(() => {
    refreshOrders()
    const timer = window.setInterval(refreshOrders, 5000)
    return () => window.clearInterval(timer)
  }, [refreshOrders])

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">PIZZA DELIVERY</p>
          <h1>Welcome, {user.name}</h1>
          <p className="muted">Your orders refresh automatically while you follow their progress.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={onLogout}>Sign out</button>
      </header>
      {notice && <p className="notice" role="status">{notice}</p>}
      {!user.emailVerified && (
        <p className="notice">Verify your email address to place an order. Check your inbox for the verification link.</p>
      )}
      <PizzaBuilder
        onOrder={refreshOrders}
        setNotice={setNotice}
        token={token}
      />
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ORDER TRACKING</p>
            <h2>Your orders</h2>
          </div>
          <span className="muted">Updates every 5 seconds</span>
        </div>
        <OrderList orders={orders} />
      </section>
    </main>
  )
}
