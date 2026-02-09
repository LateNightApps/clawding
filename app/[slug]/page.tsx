import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UpdateCard } from '@/components/UpdateCard'
import { CrabMascot } from '@/components/CrabMascot'
import { ProjectFilter } from '@/components/ProjectFilter'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { and, eq, desc, count, sql } from 'drizzle-orm'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ project?: string }>
}

interface ProjectSummary {
  name: string
  count: number
}

const PAGE_SIZE = 50

async function getFeed(slug: string, projectFilter?: string) {
  const feedResult = await db
    .select({
      id: feeds.id,
      slug: feeds.slug,
      description: feeds.description,
      createdAt: feeds.createdAt,
      xHandle: feeds.xHandle,
      websiteUrl: feeds.websiteUrl,
    })
    .from(feeds)
    .where(eq(feeds.slug, slug))
    .limit(1)

  if (feedResult.length === 0) return null

  const feed = feedResult[0]

  // Get distinct projects with counts
  const projects = await db
    .select({
      name: updates.projectName,
      count: sql<number>`count(*)::int`,
    })
    .from(updates)
    .where(eq(updates.feedId, feed.id))
    .groupBy(updates.projectName)
    .orderBy(desc(sql`count(*)`))

  // Get updates, optionally filtered by project
  const conditions = [eq(updates.feedId, feed.id)]
  if (projectFilter) {
    conditions.push(eq(updates.projectName, projectFilter))
  }

  const updatesList = await db
    .select({
      id: updates.id,
      projectName: updates.projectName,
      content: updates.content,
      createdAt: updates.createdAt,
    })
    .from(updates)
    .where(and(...conditions))
    .orderBy(desc(updates.createdAt))
    .limit(PAGE_SIZE)

  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(updates)
    .where(eq(updates.feedId, feed.id))

  // Calculate posting streak (capped to 365-day window)
  const streakWindow = new Date()
  streakWindow.setUTCDate(streakWindow.getUTCDate() - 365)

  const postDates = await db
    .select({ date: sql<string>`DISTINCT DATE(${updates.createdAt} AT TIME ZONE 'UTC')` })
    .from(updates)
    .where(and(eq(updates.feedId, feed.id), sql`${updates.createdAt} >= ${streakWindow}`))
    .orderBy(desc(sql`DATE(${updates.createdAt} AT TIME ZONE 'UTC')`))

  let streak = 0
  if (postDates.length > 0) {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    const firstDate = new Date(postDates[0].date + 'T00:00:00Z')
    if (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime()) {
      streak = 1
      let expected = new Date(firstDate)
      for (let i = 1; i < postDates.length; i++) {
        expected.setUTCDate(expected.getUTCDate() - 1)
        const d = new Date(postDates[i].date + 'T00:00:00Z')
        if (d.getTime() === expected.getTime()) {
          streak++
        } else {
          break
        }
      }
    }
  }

  return {
    slug: feed.slug,
    description: feed.description,
    created_at: feed.createdAt.toISOString(),
    x_handle: feed.xHandle,
    website_url: feed.websiteUrl,
    projects: projects as ProjectSummary[],
    updates: updatesList.map(u => ({
      id: u.id,
      project_name: u.projectName,
      content: u.content,
      created_at: u.createdAt.toISOString(),
    })),
    totalCount,
    streak,
    filteredProject: projectFilter || null,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `@${slug} - Clawding`,
    description: `See what @${slug} is coding with Claude.`,
    openGraph: {
      title: `@${slug} - Clawding`,
      description: `See what @${slug} is coding with Claude.`,
      url: `https://clawding.app/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: `@${slug} - Clawding`,
      description: `See what @${slug} is coding with Claude.`,
    },
  }
}

export default async function UserFeed({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { project } = await searchParams
  const feed = await getFeed(slug, project)

  if (!feed) {
    notFound()
  }

  const hasMore = feed.totalCount > PAGE_SIZE
  const showProjects = feed.projects.length > 1

  return (
    <main className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <div className="flex justify-center mb-10">
        <a href="/" className="transition-opacity hover:opacity-80">
          <CrabMascot size={56} animated={false} />
        </a>
      </div>

      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-primary">
          @{slug}
        </h1>

        {feed.description && (
          <p className="text-secondary mt-3 text-lg leading-relaxed">
            {feed.description}
          </p>
        )}

        <p className="text-muted mt-2">
          <span className="text-cyan">{feed.totalCount}</span> {feed.totalCount === 1 ? 'post' : 'posts'} &middot;{' '}
          <span className="text-cyan">{feed.projects.length}</span> {feed.projects.length === 1 ? 'project' : 'projects'} &middot;{' '}
          <span className="text-cyan">{feed.streak}</span> {feed.streak === 1 ? 'day' : 'days'} streak
        </p>
        {(feed.x_handle || feed.website_url) && (
          <div className="flex items-center gap-4 mt-3">
            {feed.x_handle && (
              <a
                href={`https://x.com/${feed.x_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-primary text-sm transition-colors"
              >
                @{feed.x_handle}
                <span className="text-muted ml-1">on X</span>
              </a>
            )}
            {feed.website_url && (
              <a
                href={feed.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:text-primary text-sm transition-colors"
              >
                {new URL(feed.website_url).hostname.replace('www.', '')}
              </a>
            )}
          </div>
        )}
      </header>

      {showProjects && (
        <ProjectFilter
          slug={slug}
          projects={feed.projects}
          activeProject={feed.filteredProject}
        />
      )}

      <section className="bg-surface rounded-2xl border border-border p-6">
        {feed.updates.length === 0 ? (
          <div className="text-muted text-center py-12">
            <p className="mb-2">No updates yet.</p>
            <p className="text-sm">Waiting for first post...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {feed.updates.map((update) => (
              <UpdateCard
                key={update.id}
                project={update.project_name}
                content={update.content}
                created_at={update.created_at}
                showProject={showProjects}
              />
            ))}
          </div>
        )}
        {hasMore && (
          <div className="text-center pt-4 border-t border-border mt-2">
            <Link
              href={`/feed`}
              className="text-coral hover:text-coral-bright text-sm font-medium transition-colors"
            >
              View all updates &rarr;
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
