import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse } from '@/lib/api-utils'

interface UpdateRow {
  id: string
  project_name: string
  content: string
  created_at: string
  feeds: { slug: string } | { slug: string }[]
}

export async function GET() {
  try {
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
      .limit(100)

    if (error) {
      console.error('Error fetching global feed:', error)
      throw error
    }

    return NextResponse.json({
      updates: (updates as UpdateRow[] | null)?.map(u => {
        const feed = Array.isArray(u.feeds) ? u.feeds[0] : u.feeds
        return {
          id: u.id,
          slug: feed.slug,
          project: u.project_name,
          content: u.content,
          created_at: u.created_at
        }
      }) || []
    })
  } catch (error) {
    return errorResponse(error)
  }
}
