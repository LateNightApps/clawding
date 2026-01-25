import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find feed
    const { data: feed } = await supabase
      .from('feeds')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!feed) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // Get updates
    const { data: updates } = await supabase
      .from('updates')
      .select('project_name, content, created_at')
      .eq('feed_id', feed.id)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      slug,
      updates: updates?.map(u => ({
        project: u.project_name,
        content: u.content,
        created_at: u.created_at
      })) || []
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
