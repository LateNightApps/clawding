import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/utils'
import { errorResponse, ApiError } from '@/lib/api-utils'

async function authenticateRequest(
  request: NextRequest,
  slug: string
): Promise<{ feedId: string }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', 401, 'unauthorized')
  }

  const token = authHeader.slice(7)

  const { data: feed } = await supabase
    .from('feeds')
    .select('id, token_hash')
    .eq('slug', slug)
    .single()

  if (!feed) {
    throw new ApiError('Feed not found', 404, 'not_found')
  }

  const valid = await verifyToken(token, feed.token_hash)
  if (!valid) {
    throw new ApiError('Unauthorized', 401, 'unauthorized')
  }

  return { feedId: feed.id }
}

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
