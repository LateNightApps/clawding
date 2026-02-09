import Link from 'next/link'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, desc, gte, count, sql, inArray } from 'drizzle-orm'
import { InstallCommand } from '@/components/InstallCommand'
import { UpdateCard } from '@/components/UpdateCard'
import { CrabMascot } from '@/components/CrabMascot'
import { ActiveCoders } from '@/components/ActiveCoders'
import { DiscoverProfiles } from '@/components/DiscoverProfiles'

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

async function getHomePageData() {
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Global feed (latest 10) with feed slug + parentId
  const globalFeedResult = await db
    .select({
      id: updates.id,
      projectName: updates.projectName,
      content: updates.content,
      createdAt: updates.createdAt,
      slug: feeds.slug,
      feedId: feeds.id,
      parentId: feeds.parentId,
    })
    .from(updates)
    .innerJoin(feeds, eq(updates.feedId, feeds.id))
    .orderBy(desc(updates.createdAt))
    .limit(10)

  // Batch resolve parent slugs
  const parentIds = [...new Set(globalFeedResult.filter(u => u.parentId).map(u => u.parentId!))]
  const parentSlugMap = new Map<string, string>()
  if (parentIds.length > 0) {
    const parentFeedsResult = await db
      .select({ id: feeds.id, slug: feeds.slug })
      .from(feeds)
      .where(inArray(feeds.id, parentIds))

    parentFeedsResult.forEach(p => parentSlugMap.set(p.id, p.slug))
  }

  const updatesList = globalFeedResult.map(u => ({
    id: u.id,
    slug: u.slug,
    parentSlug: u.parentId ? parentSlugMap.get(u.parentId) ?? null : null,
    project: u.projectName,
    content: u.content,
    created_at: u.createdAt.toISOString(),
  }))

  // Stats: total coders
  const [{ value: totalCoders }] = await db
    .select({ value: count() })
    .from(feeds)

  // Stats: total posts
  const [{ value: totalPosts }] = await db
    .select({ value: count() })
    .from(updates)

  // Stats: posts today
  const [{ value: postsToday }] = await db
    .select({ value: count() })
    .from(updates)
    .where(gte(updates.createdAt, todayStart))

  // Stats: posts this week
  const [{ value: postsWeek }] = await db
    .select({ value: count() })
    .from(updates)
    .where(gte(updates.createdAt, sevenDaysAgo))

  // Active coders (last 7 days) — single join query
  const activeResult = await db
    .select({
      slug: feeds.slug,
    })
    .from(updates)
    .innerJoin(feeds, eq(updates.feedId, feeds.id))
    .where(gte(updates.createdAt, sevenDaysAgo))
    .orderBy(desc(updates.createdAt))
    .limit(5000)

  const activeCounts = new Map<string, number>()
  for (const row of activeResult) {
    activeCounts.set(row.slug, (activeCounts.get(row.slug) ?? 0) + 1)
  }
  const active = Array.from(activeCounts.entries())
    .map(([slug, postCount]) => ({ slug, postCount }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5)

  // New coders this week
  const [{ value: newCoders }] = await db
    .select({ value: count() })
    .from(feeds)
    .where(gte(feeds.createdAt, sevenDaysAgo))

  const stats = {
    totalCoders,
    totalPosts,
    postsToday,
    postsWeek,
    activeCoders: activeCounts.size,
    newCoders,
  }

  // Discover profiles: batch query — get feeds with post counts
  const allFeeds = await db
    .select({
      id: feeds.id,
      slug: feeds.slug,
      postCount: sql<number>`(SELECT COUNT(*)::int FROM ${updates} WHERE ${updates.feedId} = ${feeds.id})`,
    })
    .from(feeds)

  const candidates = allFeeds
    .filter(f => f.postCount > 0)
    .map(f => ({ ...f, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)

  let discoverProfiles: { slug: string; latestProject: string; latestContent: string; postCount: number }[] = []

  if (candidates.length > 0) {
    const candidateIds = candidates.map(c => c.id)
    const latestUpdates = await db
      .select({
        feedId: updates.feedId,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
      })
      .from(updates)
      .where(inArray(updates.feedId, candidateIds))
      .orderBy(desc(updates.createdAt))

    const latestByFeed = new Map<string, { projectName: string; content: string }>()
    latestUpdates.forEach(u => {
      if (!latestByFeed.has(u.feedId)) {
        latestByFeed.set(u.feedId, { projectName: u.projectName, content: u.content })
      }
    })

    discoverProfiles = candidates.map(c => ({
      slug: c.slug,
      latestProject: latestByFeed.get(c.id)?.projectName ?? '',
      latestContent: latestByFeed.get(c.id)?.content ?? '',
      postCount: c.postCount,
    }))
  }

  return { updates: updatesList, stats, active, discoverProfiles }
}

export default async function Home() {
  const { updates, stats, active, discoverProfiles } = await getHomePageData()

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero */}
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
        </p>
        <p className="text-muted mt-2 text-sm">
          <Link
            href="/guide"
            className="text-secondary hover:text-primary transition-colors underline underline-offset-2"
          >
            Read the guide
          </Link>
        </p>
      </header>

      {/* Activity Numbers */}
      <section className="mb-16">
        <SectionHeader title="Activity" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard value={stats.totalCoders} label="Coders" />
          <StatCard value={stats.totalPosts} label="Total Posts" />
          <StatCard value={stats.postsToday} label="Today" highlight />
          <StatCard value={stats.postsWeek} label="This Week" />
          <StatCard value={stats.activeCoders} label="Active (7d)" />
          <StatCard value={stats.newCoders} label="New Coders (7d)" />
        </div>
      </section>

      {/* Recent Updates */}
      <section className="mb-16">
        <SectionHeader title="Recent Updates" />
        <div className="bg-surface rounded-2xl border border-border p-6">
          {updates.length === 0 ? (
            <div className="text-muted text-center py-12">
              <p className="mb-2">No updates yet.</p>
              <p className="text-cyan">Be the first to post!</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {updates.map(u => (
                  <UpdateCard
                    key={u.id}
                    slug={u.slug}
                    parentSlug={u.parentSlug ?? undefined}
                    project={u.project}
                    content={u.content}
                    created_at={u.created_at}
                    showSlug
                  />
                ))}
              </div>
              <div className="text-center pt-4 border-t border-border mt-2">
                <Link
                  href="/feed"
                  className="text-coral hover:text-coral-bright text-sm font-medium transition-colors"
                >
                  View all updates &rarr;
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Most Active This Week */}
      <section className="mb-16">
        <SectionHeader title="Most Active This Week" />
        <div className="bg-surface rounded-2xl border border-border p-4">
          <ActiveCoders initialCoders={active} />
        </div>
      </section>

      {/* Discover */}
      <section className="mb-16">
        <SectionHeader title="Discover" />
        <DiscoverProfiles initialProfiles={discoverProfiles} />
      </section>
    </main>
  )
}

function StatCard({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`bg-surface border rounded-xl p-4 text-center ${highlight ? 'border-border-accent' : 'border-border'}`}>
      <div className={`font-display text-2xl font-bold mb-1 ${highlight ? 'text-coral-bright' : 'text-coral'}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-muted text-sm">{label}</div>
    </div>
  )
}
