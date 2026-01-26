import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse } from '@/lib/api-utils'

interface ActiveCoder {
  slug: string
  postCount: number
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Safety cap: even at extreme scale, 5000 recent posts is enough to
    // determine the top 5 most active users in the last week.
    const { data, error } = await supabase
      .from('updates')
      .select('feed_id, feeds!inner(slug)')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) throw error

    // Aggregate post counts per slug
    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const feed = Array.isArray(row.feeds) ? row.feeds[0] : row.feeds
      const slug = (feed as { slug: string }).slug
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }

    const active: ActiveCoder[] = Array.from(counts.entries())
      .map(([slug, postCount]) => ({ slug, postCount }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 5)

    return NextResponse.json({ active }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
