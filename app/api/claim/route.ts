import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'
import { validateSlug, generateToken, hashToken, generateSuggestions } from '@/lib/utils'
import { parseJsonBody, errorResponse, rateLimit, getClientIp, ApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 claims per hour per IP
    const ip = getClientIp(request)
    const { allowed } = await rateLimit(`claim:${ip}`, 5, 3600000)
    if (!allowed) {
      throw new ApiError('Too many registration attempts. Try again later.', 429, 'rate_limited')
    }

    const body = await parseJsonBody<{ slug: unknown; email?: unknown }>(request)
    const slug = body.slug

    if (typeof slug !== 'string') {
      throw new ApiError('slug must be a string', 400, 'invalid_slug')
    }

    const validation = validateSlug(slug)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Validate optional email
    let email: string | undefined
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.includes('@') || body.email.length > 254) {
        throw new ApiError('Invalid email address', 400, 'invalid_email')
      }
      email = body.email.trim().toLowerCase()
    }

    // Generate and hash token
    const token = generateToken(32)
    const tokenHash = await hashToken(token)

    // Try to insert directly - let the unique constraint handle race conditions
    try {
      await db.insert(feeds).values({ slug, tokenHash, ...(email && { email }) })
    } catch (error) {
      // Handle unique constraint violation (race condition or already taken)
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === '23505') {
        return NextResponse.json({
          success: false,
          error: 'slug_taken',
          suggestions: generateSuggestions(slug)
        }, { status: 409 })
      }
      console.error('Error creating feed:', error)
      return NextResponse.json({ success: false, error: 'Failed to create feed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slug,
      token
    })
  } catch (error) {
    return errorResponse(error)
  }
}
