import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSlug, generateToken, hashToken } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    const validation = validateSlug(slug)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Check if slug is taken
    const { data: existing } = await supabase
      .from('feeds')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: 'slug_taken' }, { status: 409 })
    }

    // Generate and hash token
    const token = generateToken(32)
    const tokenHash = await hashToken(token)

    // Create feed
    const { error } = await supabase
      .from('feeds')
      .insert({ slug, token_hash: tokenHash })

    if (error) {
      console.error('Error creating feed:', error)
      return NextResponse.json({ success: false, error: 'Failed to create feed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slug,
      token
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
