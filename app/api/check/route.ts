import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSlug, generateSuggestions } from '@/lib/utils'
import { parseJsonBody, errorResponse, rateLimit, getClientIp, ApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 checks per minute per IP
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`check:${ip}`, 30, 60000)
    if (!allowed) {
      throw new ApiError('Too many requests', 429, 'rate_limited')
    }

    const body = await parseJsonBody<{ slug: unknown }>(request)
    const slug = body.slug

    if (typeof slug !== 'string') {
      throw new ApiError('slug must be a string', 400, 'invalid_slug')
    }

    const validation = validateSlug(slug)
    if (!validation.valid) {
      return NextResponse.json({ available: false, error: validation.error }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('feeds')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({
        available: false,
        slug,
        suggestions: generateSuggestions(slug)
      })
    }

    return NextResponse.json({ available: true, slug })
  } catch (error) {
    return errorResponse(error)
  }
}
