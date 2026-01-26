import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, sanitizeContent, sanitizeProjectName } from '@/lib/utils'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError('Unauthorized', 401, 'unauthorized')
    }

    const token = authHeader.slice(7)

    // Find feed
    const { data: feed } = await supabase
      .from('feeds')
      .select('id, token_hash')
      .eq('slug', slug)
      .single()

    if (!feed) {
      throw new ApiError('Feed not found', 404, 'not_found')
    }

    // Verify token
    const valid = await verifyToken(token, feed.token_hash)
    if (!valid) {
      throw new ApiError('Unauthorized', 401, 'unauthorized')
    }

    // Rate limit check: 50 posts per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('updates')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feed.id)
      .gte('created_at', oneDayAgo)

    if (count && count >= 50) {
      throw new ApiError('Daily post limit reached (50/day)', 429, 'rate_limited')
    }

    // Parse body with size limit
    const { project, update } = await parseJsonBody<{ project: string; update: string }>(request)

    if (!project || !update) {
      throw new ApiError('Missing project or update', 400, 'missing_fields')
    }

    if (typeof project !== 'string' || typeof update !== 'string') {
      throw new ApiError('Invalid field types', 400, 'invalid_fields')
    }

    // Sanitize and insert
    const sanitizedProject = sanitizeProjectName(project)
    const sanitizedUpdate = sanitizeContent(update)

    if (!sanitizedProject || !sanitizedUpdate) {
      throw new ApiError('Project and update cannot be empty', 400, 'empty_fields')
    }

    const { error } = await supabase
      .from('updates')
      .insert({
        feed_id: feed.id,
        project_name: sanitizedProject,
        content: sanitizedUpdate
      })

    if (error) {
      console.error('Error creating update:', error)
      throw new ApiError('Failed to create update', 500, 'db_error')
    }

    // Update last_post_at
    await supabase
      .from('feeds')
      .update({ last_post_at: new Date().toISOString() })
      .eq('id', feed.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
