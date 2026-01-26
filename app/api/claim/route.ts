import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSlug, generateToken, hashToken, generateSuggestions } from '@/lib/utils'
import { parseJsonBody, errorResponse, rateLimit, getClientIp, ApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 claims per hour per IP
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`claim:${ip}`, 5, 3600000)
    if (!allowed) {
      throw new ApiError('Too many registration attempts. Try again later.', 429, 'rate_limited')
    }

    const { slug } = await parseJsonBody<{ slug: string }>(request)

    const validation = validateSlug(slug)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Generate and hash token
    const token = generateToken(32)
    const tokenHash = await hashToken(token)

    // Try to insert directly - let the unique constraint handle race conditions
    const { error } = await supabase
      .from('feeds')
      .insert({ slug, token_hash: tokenHash })

    if (error) {
      // Handle unique constraint violation (race condition or already taken)
      if (error.code === '23505') {
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
