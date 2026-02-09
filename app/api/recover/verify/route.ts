import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateToken, hashToken, verifyToken } from '@/lib/utils'
import { parseJsonBody, errorResponse, rateLimit, getClientIp, getRedis, ApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed } = await rateLimit(`recover-verify:${ip}`, 10, 3600000)
    if (!allowed) {
      throw new ApiError('Too many attempts. Try again later.', 429, 'rate_limited')
    }

    const body = await parseJsonBody<{ email: unknown; code: unknown }>(request)

    if (typeof body.email !== 'string' || !body.email.includes('@') || body.email.length > 254) {
      throw new ApiError('Valid email is required', 400, 'invalid_email')
    }
    if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) {
      throw new ApiError('A 6-digit code is required', 400, 'invalid_code')
    }

    const email = body.email.toLowerCase().trim()

    // Per-email rate limit: 5 attempts per 15 minutes
    const { allowed: emailAllowed } = await rateLimit(`recover-verify-email:${email}`, 5, 900000)
    if (!emailAllowed) {
      throw new ApiError('Too many attempts. Request a new code.', 429, 'rate_limited')
    }

    const redis = getRedis()
    if (!redis) {
      throw new ApiError('Recovery service unavailable', 503, 'service_unavailable')
    }

    // Look up recovery data from Redis
    const stored = await redis.get(`recovery:${email}`)
    if (!stored) {
      throw new ApiError('Recovery code expired or not found', 400, 'invalid_code')
    }

    const data = typeof stored === 'string' ? JSON.parse(stored) : stored as { codeHash: string; slug: string }

    if (!data || typeof data.codeHash !== 'string' || typeof data.slug !== 'string') {
      throw new ApiError('Invalid recovery data', 400, 'invalid_code')
    }

    // Track failed attempts — delete code after 5 failures
    const failKey = `recovery-fails:${email}`

    // bcrypt.compare is constant-time (no timing attack)
    const valid = await verifyToken(body.code, data.codeHash)
    if (!valid) {
      const fails = await redis.incr(failKey)
      await redis.expire(failKey, 900)
      if (fails >= 5) {
        await redis.del(`recovery:${email}`)
        await redis.del(failKey)
        throw new ApiError('Too many failed attempts. Request a new code.', 429, 'max_attempts')
      }
      throw new ApiError('Invalid recovery code', 400, 'invalid_code')
    }

    // Generate new token
    const token = generateToken(32)
    const tokenHash = await hashToken(token)

    // Update the feed's token hash
    await db
      .update(feeds)
      .set({ tokenHash })
      .where(eq(feeds.slug, data.slug))

    // Delete the recovery key + fail counter (one-time use)
    await redis.del(`recovery:${email}`)
    await redis.del(failKey)

    return NextResponse.json({
      success: true,
      slug: data.slug,
      token,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
