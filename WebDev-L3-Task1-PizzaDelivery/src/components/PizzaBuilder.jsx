import { useState } from 'react'
import { api, formatPrice } from '../api.js'
import { openRazorpayCheckout } from '../paymentCheckout.js'

const steps = ['Choose a base', 'Choose a sauce', 'Choose a cheese', 'Add vegetables']
const fields = ['base', 'sauce', 'cheese', 'vegetables']
const menuGroups = {
  base: 'bases',
  sauce: 'sauces',
  cheese: 'cheeses',
  vegetables: 'vegetables',
}

export default function PizzaBuilder({ token, onOrder, setNotice }) {
  const [menu, setMenu] = useState(null)
  const [items, setItems] = useState({ base: '', sauce: '', cheese: '', vegetables: [] })
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  async function ensureMenu() {
    if (menu) return menu
    const result = await api('/menu')
    const optionGroups = result.menu
    if (!optionGroups || Object.values(menuGroups).some((group) => !Array.isArray(optionGroups[group]))) {
      throw new Error('The menu response is incomplete. Check the backend menu endpoint.')
    }

    const first = {
      base: optionGroups.bases[0]?.name || '',
      sauce: optionGroups.sauces[0]?.name || '',
      cheese: optionGroups.cheeses[0]?.name || '',
      vegetables: [],
    }
    setMenu(optionGroups)
    setItems(first)
    return optionGroups
  }

  async function beginOrder() {
    setBusy(true)
    setNotice('')
    try {
      await ensureMenu()
      const order = await api('/payments/order', {
        token,
        method: 'POST',
        body: JSON.stringify(items),
      })
      await openRazorpayCheckout({
        order: { ...order, currency: order.currency || 'USD' },
        token,
        description: `${items.base} pizza`,
        onSuccess: (result) => {
          setNotice(result.message)
          onOrder()
          setBusy(false)
        },
        onFailure: (error) => {
          setNotice(error.message)
          setBusy(false)
        },
        onDismiss: () => setBusy(false),
      })
      setNotice(`Order total: ${formatPrice(order.amount, order.currency || 'USD')}. Complete the Razorpay checkout to confirm.`)
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
  const options = menu[menuGroups[activeField]] || []
  const priceOf = (group, selected) =>
    menu[group].find((item) => item.name === selected)?.priceMinorUnits || 0
  const totalMinorUnits =
    priceOf('bases', items.base) +
    priceOf('sauces', items.sauce) +
    priceOf('cheeses', items.cheese) +
    items.vegetables.reduce(
      (sum, vegetable) => sum + priceOf('vegetables', vegetable),
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
        <strong className="price">{formatPrice(totalMinorUnits)}</strong>
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
            <label className={`${checked ? 'option-card checked' : 'option-card'}${option.available ? '' : ' unavailable'}`} key={option.name}>
              <input
                checked={checked}
                name={activeField}
                onChange={() => choose(option.name)}
                disabled={!option.available}
                type={activeField === 'vegetables' ? 'checkbox' : 'radio'}
              />
              <span>
                <strong>{option.name}</strong>
                <small>
                  {!option.available
                    ? 'Out of stock'
                    : option.priceMinorUnits
                      ? `+${formatPrice(option.priceMinorUnits)}`
                      : 'Included'}
                </small>
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
          <p className="summary-total">Total <strong>{formatPrice(totalMinorUnits)}</strong></p>
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
