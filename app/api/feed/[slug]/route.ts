import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse, ApiError } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find feed
    const { data: feed } = await supabase
      .from('feeds')
      .select('id, x_handle, website_url')
      .eq('slug', slug)
      .single()

    if (!feed) {
      throw new ApiError('Feed not found', 404, 'not_found')
    }

    // Get updates
    const { data: updates, error } = await supabase
      .from('updates')
      .select('id, project_name, content, created_at')
      .eq('feed_id', feed.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching feed:', error)
      throw error
    }

    return NextResponse.json({
      slug,
      x_handle: feed.x_handle ?? null,
      website_url: feed.website_url ?? null,
      updates: updates?.map(u => ({
        id: u.id,
        project: u.project_name,
        content: u.content,
        created_at: u.created_at
      })) || []
    })
  } catch (error) {
    return errorResponse(error)
  }
}
