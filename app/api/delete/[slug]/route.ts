import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/utils'

export async function DELETE(
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

    // Get most recent post
    const { data: lastPost } = await supabase
      .from('updates')
      .select('id, project_name, content, created_at')
      .eq('feed_id', feed.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastPost) {
      return NextResponse.json({ success: false, error: 'no_posts' }, { status: 404 })
    }

    // Delete it
    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', lastPost.id)

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: {
        project: lastPost.project_name,
        content: lastPost.content,
        created_at: lastPost.created_at
      }
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET to fetch most recent post (for preview before delete)
export async function GET(
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

    // Get most recent post
    const { data: lastPost } = await supabase
      .from('updates')
      .select('id, project_name, content, created_at')
      .eq('feed_id', feed.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastPost) {
      return NextResponse.json({ success: false, error: 'no_posts' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      post: {
        project: lastPost.project_name,
        content: lastPost.content,
        created_at: lastPost.created_at
      }
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
