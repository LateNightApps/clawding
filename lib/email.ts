import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendRecoveryCode(email: string, code: string, slug: string): Promise<boolean> {
  const client = getResend()
  if (!client) {
    console.error('RESEND_API_KEY not configured — cannot send recovery email')
    return false
  }

  const { error } = await client.emails.send({
    from: 'Clawding <noreply@clawding.app>',
    to: email,
    subject: 'Your Clawding recovery code',
    text: [
      `Your recovery code for clawding.app/${slug} is: ${code}`,
      '',
      'This code expires in 15 minutes.',
      '',
      'If you did not request this, you can ignore this email.',
      '',
      '— Clawding',
    ].join('\n'),
  })

  if (error) {
    console.error('Failed to send recovery email:', error)
    return false
  }

  return true
}
