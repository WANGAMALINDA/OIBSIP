import { useState } from 'react'
import { api, formatPrice } from '../api.js'

const steps = ['Choose a base', 'Choose a sauce', 'Choose a cheese', 'Add vegetables']
const fields = ['base', 'sauce', 'cheese', 'vegetables']

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load Razorpay checkout. Check your connection and try again.'))
    document.body.appendChild(script)
  })
}

export default function PizzaBuilder({ token, onOrder, setNotice }) {
  const [menu, setMenu] = useState(null)
  const [items, setItems] = useState({ base: '', sauce: '', cheese: '', vegetables: [] })
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  async function ensureMenu() {
    if (menu) return menu
    const result = await api('/menu')
    const first = {
      base: result.menu.bases[0]?.name || '',
      sauce: result.menu.sauces[0]?.name || '',
      cheese: result.menu.cheeses[0]?.name || '',
      vegetables: [],
    }
    setMenu(result.menu)
    setItems(first)
    return result.menu
  }

  async function beginOrder() {
    setBusy(true)
    setNotice('')
    try {
      const currentMenu = await ensureMenu()
      const order = await api('/payments/order', {
        token,
        method: 'POST',
        body: JSON.stringify(items),
      })
      await loadRazorpay()
      const checkout = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Pizza Delivery',
        description: `${items.base} pizza`,
        order_id: order.razorpayOrderId,
        prefill: { name: '', email: '' },
        theme: { color: '#b63e24' },
        handler: async (payment) => {
          try {
            const result = await api('/payments/verify', {
              token,
              method: 'POST',
              body: JSON.stringify({
                orderId: order.orderId,
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            })
            setNotice(result.message)
            onOrder()
          } catch (error) {
            setNotice(error.message)
          } finally {
            setBusy(false)
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      })
      checkout.on('payment.failed', (event) => {
        setNotice(event.error?.description || 'Payment was not completed. Your reserved stock will be released automatically.')
        setBusy(false)
      })
      checkout.open()
      setNotice(`Order total: ${formatPrice(order.amount)}. Complete the Razorpay checkout to confirm.`)
    } catch (error) {
      setNotice(error.message)
      setBusy(false)
    }
  }

  async function showBuilder() {
    setNotice('')
    try {
      await ensureMenu()
    } catch (error) {
      setNotice(error.message)
    }
  }

  if (!menu) {
    return (
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MADE TO ORDER</p>
            <h2>Build your pizza</h2>
            <p className="muted">Choose your base, sauce, cheese, and vegetables.</p>
          </div>
          <button className="button button-primary" type="button" onClick={showBuilder}>Start building</button>
        </div>
      </section>
    )
  }

  const activeField = fields[step]
  const options = menu[activeField]
  const totalPaise = ['bases', 'sauces', 'cheeses']
    .map((group) => menu[group].find((item) => item.name === items[fields[['bases', 'sauces', 'cheeses'].indexOf(group)]])?.pricePaise || 0)
    .reduce((sum, price) => sum + price, 0) +
    items.vegetables.reduce(
      (sum, vegetable) => sum + (menu.vegetables.find((item) => item.name === vegetable)?.pricePaise || 0),
      0,
    )

  function choose(name) {
    if (activeField === 'vegetables') {
      setItems({
        ...items,
        vegetables: items.vegetables.includes(name)
          ? items.vegetables.filter((vegetable) => vegetable !== name)
          : [...items.vegetables, name],
      })
    } else {
      setItems({ ...items, [activeField]: name })
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CUSTOM PIZZA</p>
          <h2>{steps[step]}</h2>
          <p className="muted">Step {step + 1} of {steps.length}</p>
        </div>
        <strong className="price">{formatPrice(totalPaise)}</strong>
      </div>
      <div className="step-track" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((label, index) => (
          <button
            className={index === step ? 'step active' : index < step ? 'step complete' : 'step'}
            key={label}
            type="button"
            onClick={() => setStep(index)}
          >
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </div>
      <fieldset className="option-grid">
        <legend className="visually-hidden">{steps[step]}</legend>
        {options.map((option) => {
          const checked = activeField === 'vegetables'
            ? items.vegetables.includes(option.name)
            : items[activeField] === option.name
          return (
            <label className={checked ? 'option-card checked' : 'option-card'} key={option.name}>
              <input
                checked={checked}
                name={activeField}
                onChange={() => choose(option.name)}
                type={activeField === 'vegetables' ? 'checkbox' : 'radio'}
              />
              <span>
                <strong>{option.name}</strong>
                <small>{option.pricePaise ? `+${formatPrice(option.pricePaise)}` : 'Included'}</small>
              </span>
            </label>
          )
        })}
      </fieldset>
      {step === 3 && (
        <div className="summary">
          <h3>Order summary</h3>
          <p>{items.base} base · {items.sauce} · {items.cheese}</p>
          <p>Vegetables: {items.vegetables.length ? items.vegetables.join(', ') : 'None'}</p>
          <p className="summary-total">Total <strong>{formatPrice(totalPaise)}</strong></p>
          <p className="muted">Stock is reserved for 15 minutes while payment is completed.</p>
        </div>
      )}
      <div className="builder-actions">
        <button className="button button-secondary" disabled={step === 0 || busy} type="button" onClick={() => setStep(step - 1)}>
          Back
        </button>
        {step < 3 ? (
          <button className="button button-primary" type="button" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <button className="button button-primary" disabled={busy} type="button" onClick={beginOrder}>
            {busy ? 'Opening checkout…' : 'Pay with Razorpay'}
          </button>
        )}
      </div>
    </section>
  )
}
