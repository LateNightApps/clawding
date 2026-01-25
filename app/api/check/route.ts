import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSlug, generateSuggestions } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
