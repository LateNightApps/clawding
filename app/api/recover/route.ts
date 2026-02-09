import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomInt } from 'crypto'
import { hashToken } from '@/lib/utils'
import { parseJsonBody, errorResponse, rateLimit, getClientIp, getRedis, ApiError } from '@/lib/api-utils'
import { sendRecoveryCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed } = await rateLimit(`recover:${ip}`, 5, 3600000)
    if (!allowed) {
      throw new ApiError('Too many requests. Try again later.', 429, 'rate_limited')
    }

    const body = await parseJsonBody<{ email: unknown }>(request)

    if (typeof body.email !== 'string' || !body.email.includes('@') || body.email.length > 254) {
      throw new ApiError('Valid email is required', 400, 'invalid_email')
    }

    const email = body.email.toLowerCase().trim()

    // Rate limit per email: 3 per hour
    const { allowed: emailAllowed } = await rateLimit(`recover-email:${email}`, 3, 3600000)
    if (!emailAllowed) {
      // Generic response to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a recovery code has been sent.',
      })
    }

    const redis = getRedis()
    if (!redis) {
      throw new ApiError('Recovery service unavailable', 503, 'service_unavailable')
    }

    // Find feed(s) with this email
    const [feed] = await db
      .select({ slug: feeds.slug })
      .from(feeds)
      .where(eq(feeds.email, email))
      .limit(1)

    // Generic response whether or not email exists (prevents enumeration)
    if (!feed) {
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a recovery code has been sent.',
      })
    }

    // Generate 6-digit code and hash it before storing
    const code = String(randomInt(100000, 999999))
    const codeHash = await hashToken(code)

    // Store hashed code in Redis with 15-minute TTL
    await redis.set(
      `recovery:${email}`,
      JSON.stringify({ codeHash, slug: feed.slug }),
      { ex: 900 }
    )

    // Send email
    await sendRecoveryCode(email, code, feed.slug)

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a recovery code has been sent.',
    })
  } catch (error) {
    return errorResponse(error)
  }
}
