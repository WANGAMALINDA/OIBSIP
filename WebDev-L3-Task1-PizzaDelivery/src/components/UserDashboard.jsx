import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { openRazorpayCheckout } from '../paymentCheckout.js'
import OrderList from './OrderList.jsx'
import PizzaBuilder from './PizzaBuilder.jsx'

export default function UserDashboard({ user, token, onLogout }) {
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState('')
  const [busyOrder, setBusyOrder] = useState(null)

  const refreshOrders = useCallback(async () => {
    try {
      const result = await api('/orders/mine', { token })
      setOrders(result.orders)
    } catch (error) {
      setNotice(error.message)
    }
  }, [token])

  async function resumePayment(order) {
    setBusyOrder(order._id)
    setNotice('')
    try {
      const paymentOrder = await api(`/payments/orders/${order._id}/resume`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      })
      await openRazorpayCheckout({
        order: paymentOrder,
        token,
        description: `${order.items.base} pizza`,
        onSuccess: (result) => {
          setNotice(result.message)
          void refreshOrders()
          setBusyOrder(null)
        },
        onFailure: (error) => {
          setNotice(error.message)
          setBusyOrder(null)
        },
        onDismiss: () => setBusyOrder(null),
      })
      setNotice(`Continue payment for order ${order._id.slice(-8).toUpperCase()}.`)
    } catch (error) {
      setNotice(error.message)
      setBusyOrder(null)
      void refreshOrders()
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(refreshOrders, 0)
    const timer = window.setInterval(refreshOrders, 5000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
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
        <OrderList busyOrder={busyOrder} onResumePayment={resumePayment} orders={orders} />
      </section>
    </main>
  )
}
