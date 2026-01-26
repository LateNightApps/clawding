import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse } from '@/lib/api-utils'

interface DiscoverProfile {
  slug: string
  latestProject: string
  latestContent: string
  postCount: number
}

export async function GET() {
  try {
    // Step 1: Get all feeds (bounded — one row per user)
    const { data: feeds, error: feedsError } = await supabase
      .from('feeds')
      .select('id, slug')

    if (feedsError) throw feedsError
    if (!feeds || feeds.length === 0) {
      return NextResponse.json({ profiles: [] })
    }

    // Step 2: Shuffle and pick candidates (pick more than 3 in case some have 0 posts)
    const candidates = feeds
      .map(f => ({ ...f, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 10)

    // Step 3: For each candidate, get post count and latest post
    const profiles: DiscoverProfile[] = []

    for (const candidate of candidates) {
      if (profiles.length >= 3) break

      const [countResult, latestResult] = await Promise.all([
        supabase
          .from('updates')
          .select('*', { count: 'exact', head: true })
          .eq('feed_id', candidate.id),
        supabase
          .from('updates')
          .select('project_name, content')
          .eq('feed_id', candidate.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ])

      const postCount = countResult.count ?? 0
      if (postCount === 0 || !latestResult.data) continue

      profiles.push({
        slug: candidate.slug,
        latestProject: latestResult.data.project_name,
        latestContent: latestResult.data.content,
        postCount,
      })
    }

    return NextResponse.json({ profiles }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
