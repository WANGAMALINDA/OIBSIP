import { useCallback, useEffect, useState } from 'react'
import { api, formatPrice } from '../api.js'
import OrderList from './OrderList.jsx'

export default function AdminDashboard({ token, onLogout }) {
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [notice, setNotice] = useState('')
  const [busyItem, setBusyItem] = useState('')
  const [busyOrder, setBusyOrder] = useState('')

  const refresh = useCallback(async (showError = false) => {
    try {
      const result = await api('/admin/dashboard', { token })
      setInventory(result.inventory)
      setOrders(result.orders)
    } catch (error) {
      if (showError) setNotice(error.message)
    }
  }, [token])

  useEffect(() => {
    refresh(true)
    const timer = window.setInterval(() => refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function saveInventory(item, form) {
    setBusyItem(item.key)
    setNotice('')
    try {
      await api(`/admin/inventory/${encodeURIComponent(item.key)}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({
          quantity: Number(form.get('quantity')),
          lowStockThreshold: Number(form.get('threshold')),
        }),
      })
      setNotice(`${item.name} stock updated.`)
      await refresh()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusyItem('')
    }
  }

  async function changeStatus(orderId, status) {
    setBusyOrder(orderId)
    setNotice('')
    try {
      await api(`/admin/orders/${orderId}/status`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await refresh()
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusyOrder('')
    }
  }

  const categories = [...new Set(inventory.map((item) => item.category))]

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">PIZZA DELIVERY</p>
          <h1>Admin dashboard</h1>
        </div>
        <button className="button button-secondary" type="button" onClick={onLogout}>Sign out</button>
      </header>
      {notice && <p className="notice" role="status">{notice}</p>}
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LIVE STOCK</p>
            <h2>Inventory</h2>
            <p className="muted">Set current units and the low-stock email threshold. Refreshes every 10 seconds.</p>
          </div>
        </div>
        <div className="inventory-groups">
          {categories.map((category) => (
            <section className="inventory-group" key={category}>
              <h3>{category.charAt(0).toUpperCase() + category.slice(1)}s</h3>
              <div className="inventory-list">
                {inventory.filter((item) => item.category === category).map((item) => (
                  <form
                    className="inventory-row"
                    key={item.key}
                    onSubmit={(event) => {
                      event.preventDefault()
                      saveInventory(item, new FormData(event.currentTarget))
                    }}
                  >
                    <div className="inventory-name">
                      <strong>{item.name}</strong>
                      <span className={item.quantity < item.lowStockThreshold ? 'low-stock' : 'muted'}>
                        {item.quantity < item.lowStockThreshold ? 'Below alert threshold' : `${item.quantity} units`}
                      </span>
                    </div>
                    <label>
                      Stock
                      <input defaultValue={item.quantity} min="0" name="quantity" required type="number" />
                    </label>
                    <label>
                      Alert below
                      <input defaultValue={item.lowStockThreshold} min="0" name="threshold" required type="number" />
                    </label>
                    <button className="button button-secondary" disabled={busyItem === item.key} type="submit">
                      {busyItem === item.key ? 'Saving…' : 'Update'}
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LIVE ORDER QUEUE</p>
            <h2>Orders</h2>
          </div>
          <span className="muted">{orders.length} shown</span>
        </div>
        <OrderList admin busyOrder={busyOrder} onStatusChange={changeStatus} orders={orders} />
      </section>
    </main>
  )
}
