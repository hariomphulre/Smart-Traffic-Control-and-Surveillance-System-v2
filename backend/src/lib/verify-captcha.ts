export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is missing from environment variables')
    return false
  }

  try {
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await res.json()
    return outcome.success === true
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}