import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse, ApiError } from '@/lib/api-utils'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

interface UpdateRow {
  id: string
  project_name: string
  content: string
  created_at: string
  feeds: { slug: string } | { slug: string }[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    )
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)

    const { data: updates, error } = await supabase
      .from('updates')
      .select(`
        id,
        project_name,
        content,
        created_at,
        feeds!inner(slug)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching global feed:', error)
      throw new ApiError('Failed to fetch global feed', 500, 'db_error')
    }

    const mapped = (updates as UpdateRow[] | null)?.map(u => {
      const feed = Array.isArray(u.feeds) ? u.feeds[0] : u.feeds
      return {
        id: u.id,
        slug: feed.slug,
        project: u.project_name,
        content: u.content,
        created_at: u.created_at,
      }
    }) ?? []

    return NextResponse.json({
      updates: mapped,
      hasMore: mapped.length === limit,
      offset,
      limit,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
