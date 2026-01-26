import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sanitizeContent, sanitizeProjectName } from '@/lib/utils'
import { parseJsonBody, errorResponse, ApiError } from '@/lib/api-utils'
import { authenticateRequest } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { feedId } = await authenticateRequest(request, slug)

    // Rate limit check: 50 posts per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('updates')
      .select('*', { count: 'exact', head: true })
      .eq('feed_id', feedId)
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
        feed_id: feedId,
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
      .eq('id', feedId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
