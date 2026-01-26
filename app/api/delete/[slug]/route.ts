import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    // Get most recent post
    const { data: lastPost } = await supabase
      .from('updates')
      .select('id, project_name, content, created_at')
      .eq('feed_id', feedId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastPost) {
      throw new ApiError('No posts to delete', 404, 'no_posts')
    }

    // Delete it
    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', lastPost.id)

    if (error) {
      console.error('Error deleting post:', error)
      throw new ApiError('Failed to delete', 500, 'db_error')
    }

    return NextResponse.json({
      success: true,
      deleted: {
        project: lastPost.project_name,
        content: lastPost.content,
        created_at: lastPost.created_at
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// GET to fetch most recent post (for preview before delete)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    // Get most recent post
    const { data: lastPost } = await supabase
      .from('updates')
      .select('id, project_name, content, created_at')
      .eq('feed_id', feedId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastPost) {
      throw new ApiError('No posts found', 404, 'no_posts')
    }

    return NextResponse.json({
      success: true,
      post: {
        project: lastPost.project_name,
        content: lastPost.content,
        created_at: lastPost.created_at
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}
