export async function sendEmail({ to, subject, html }) {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error('Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Email delivery failed (${response.status}): ${detail}`)
  }
}
