import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, sanitizeContent } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    // Find feed
    const { data: feed } = await supabase
      .from('feeds')
      .select('id, token_hash')
      .eq('slug', slug)
      .single()

    if (!feed) {
      return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 })
    }

    // Verify token
    const valid = await verifyToken(token, feed.token_hash)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    // Rate limit check: 50 posts per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('updates')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feed.id)
      .gte('created_at', oneDayAgo)

    if (count && count >= 50) {
      return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 })
    }

    // Parse body
    const { project, update } = await request.json()

    if (!project || !update) {
      return NextResponse.json({ success: false, error: 'Missing project or update' }, { status: 400 })
    }

    // Sanitize and insert
    const sanitizedProject = sanitizeContent(project).slice(0, 100)
    const sanitizedUpdate = sanitizeContent(update)

    const { error } = await supabase
      .from('updates')
      .insert({
        feed_id: feed.id,
        project_name: sanitizedProject,
        content: sanitizedUpdate
      })

    if (error) {
      console.error('Error creating update:', error)
      return NextResponse.json({ success: false, error: 'Failed to create update' }, { status: 500 })
    }

    // Update last_post_at
    await supabase
      .from('feeds')
      .update({ last_post_at: new Date().toISOString() })
      .eq('id', feed.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
