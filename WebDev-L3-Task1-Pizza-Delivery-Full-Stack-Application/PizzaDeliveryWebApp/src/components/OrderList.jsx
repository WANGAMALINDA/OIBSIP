import { formatPrice, statusLabels } from '../api.js'

export default function OrderList({ orders, admin = false, onStatusChange, busyOrder }) {
  if (!orders.length) {
    return <p className="empty-state">No orders yet. Your paid orders will appear here.</p>
  }

  return (
    <div className="order-list">
      {orders.map((order) => {
        const next = order.status === 'received'
          ? 'in_kitchen'
          : order.status === 'in_kitchen'
            ? 'out_for_delivery'
            : null
        return (
          <article className="order-card" key={order._id}>
            <div className="order-card-heading">
              <div>
                <strong>Order {order._id.slice(-8).toUpperCase()}</strong>
                {admin && <p className="muted">{order.user?.name} · {order.user?.email}</p>}
                <p className="muted">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`status status-${order.status}`}>{statusLabels[order.status] || order.status}</span>
            </div>
            <p>{order.items.base} base · {order.items.sauce} · {order.items.cheese}</p>
            <p className="muted">
              Vegetables: {order.items.vegetables?.length ? order.items.vegetables.join(', ') : 'None'}
            </p>
            <div className="order-card-footer">
              <strong>{formatPrice(order.totalPaise)}</strong>
              {order.refundStatus === 'processed' && <span className="muted">Refund processed</span>}
              {order.refundStatus === 'pending' && <span className="muted">Refund requested</span>}
              {order.refundStatus === 'failed' && <span className="low-stock">Refund needs support</span>}
              {admin && next && (
                <button
                  className="button button-secondary"
                  disabled={busyOrder === order._id}
                  type="button"
                  onClick={() => onStatusChange(order._id, next)}
                >
                  {busyOrder === order._id ? 'Saving…' : `Move to ${statusLabels[next]}`}
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
