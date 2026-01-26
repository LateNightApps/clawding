import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { InstallCommand } from '@/components/InstallCommand'
import { GlobalFeed } from '@/components/GlobalFeed'
import { CrabMascot } from '@/components/CrabMascot'
import { StatsBar } from '@/components/StatsBar'
import { ActiveCoders } from '@/components/ActiveCoders'
import { DiscoverProfiles } from '@/components/DiscoverProfiles'

export const dynamic = 'force-dynamic'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <h2 className="font-display text-lg font-semibold text-primary px-4">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}

interface UpdateRow {
  id: string
  project_name: string
  content: string
  created_at: string
  feeds: { slug: string } | { slug: string }[]
}

async function getHomePageData() {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    globalFeedResult,
    codersCountResult,
    postsCountResult,
    postsTodayResult,
    activeResult,
    feedsResult,
  ] = await Promise.all([
    // Global feed (latest 10)
    supabase
      .from('updates')
      .select('id, project_name, content, created_at, feeds!inner(slug)')
      .order('created_at', { ascending: false })
      .range(0, 9),

    // Stats: total coders
    supabase.from('feeds').select('*', { count: 'exact', head: true }),

    // Stats: total posts
    supabase.from('updates').select('*', { count: 'exact', head: true }),

    // Stats: posts today
    supabase
      .from('updates')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),

    // Active coders (last 7 days)
    supabase
      .from('updates')
      .select('feed_id, feeds!inner(slug)')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000),

    // Discover: all feeds for random selection
    supabase.from('feeds').select('id, slug'),
  ])

  // Map global feed
  const updates = (globalFeedResult.data as UpdateRow[] | null)?.map(u => {
    const feed = Array.isArray(u.feeds) ? u.feeds[0] : u.feeds
    return {
      id: u.id,
      slug: feed.slug,
      project: u.project_name,
      content: u.content,
      created_at: u.created_at,
    }
  }) ?? []

  // Map stats
  const stats = {
    totalCoders: codersCountResult.count ?? 0,
    totalPosts: postsCountResult.count ?? 0,
    postsToday: postsTodayResult.count ?? 0,
  }

  // Map active coders
  const activeCounts = new Map<string, number>()
  for (const row of activeResult.data ?? []) {
    const feed = Array.isArray(row.feeds) ? row.feeds[0] : row.feeds
    const slug = (feed as { slug: string }).slug
    activeCounts.set(slug, (activeCounts.get(slug) ?? 0) + 1)
  }
  const active = Array.from(activeCounts.entries())
    .map(([slug, postCount]) => ({ slug, postCount }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5)

  // Discover profiles: pick 3 random feeds with posts
  const allFeeds = feedsResult.data ?? []
  const shuffled = allFeeds
    .map(f => ({ ...f, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 10)

  const discoverProfiles = []
  for (const candidate of shuffled) {
    if (discoverProfiles.length >= 3) break

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

    discoverProfiles.push({
      slug: candidate.slug,
      latestProject: latestResult.data.project_name,
      latestContent: latestResult.data.content,
      postCount,
    })
  }

  return { updates, stats, active, discoverProfiles }
}

/* BINARY SEARCH: Hero only — all data sections commented out */
export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <header className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <CrabMascot size={140} />
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          <span className="text-gradient">Clawding</span>
        </h1>

        <p className="text-xl md:text-2xl text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
          What are you coding with Claude?
        </p>

        <div className="max-w-xl mx-auto">
          <InstallCommand />
        </div>

        <p className="text-muted mt-6 text-sm">
          Then run{' '}
          <code className="text-coral bg-surface px-2 py-1 rounded font-mono text-sm">
            /clawding
          </code>
          {' '}in Claude Code
          {' '}&middot;{' '}
          <Link
            href="/guide"
            className="text-secondary hover:text-primary transition-colors underline underline-offset-2"
          >
            Read the guide
          </Link>
        </p>
      </header>
    </main>
  )
}
