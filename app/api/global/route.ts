import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface UpdateWithFeed {
  project_name: string
  content: string
  created_at: string
  feeds: { slug: string }
}

export async function GET() {
  try {
    const { data: updates } = await supabase
      .from('updates')
      .select(`
        project_name,
        content,
        created_at,
        feeds!inner(slug)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      updates: (updates as UpdateWithFeed[] | null)?.map(u => ({
        slug: u.feeds.slug,
        project: u.project_name,
        content: u.content,
        created_at: u.created_at
      })) || []
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
