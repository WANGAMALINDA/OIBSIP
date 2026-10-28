export async function sendEmail({ to, subject, html }) {
  if (process.env.EMAIL_MODE === 'console') {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('EMAIL_MODE=console is only allowed outside production. Configure Resend for production email.')
      error.status = 503
      throw error
    }

    console.info(`\n[Local email preview] To: ${to}\nSubject: ${subject}\n${html}\n`)
    return
  }

  const { RESEND_API_KEY, EMAIL_FROM } = process.env
  if (!RESEND_API_KEY?.startsWith('re_') || !EMAIL_FROM) {
    const error = new Error('Email is not configured. Set a valid Resend API key (starting with re_) and EMAIL_FROM in server/.env.')
    error.status = 503
    throw error
  }

  let response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    })
  } catch {
    const error = new Error('Could not reach the email provider. Check the server network connection and try again.')
    error.status = 503
    throw error
  }

  if (!response.ok) {
    const error = response.status === 401 || response.status === 403
      ? new Error('The email provider rejected its credentials or sender. Check RESEND_API_KEY and EMAIL_FROM in server/.env.')
      : new Error(`Email delivery failed with HTTP ${response.status}. Check the email provider configuration.`)
    error.status = 502
    throw error
  }
}

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}
