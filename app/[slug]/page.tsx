import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UpdateCard } from '@/components/UpdateCard'
import { CrabMascot } from '@/components/CrabMascot'
import { db } from '@/lib/db'
import { feeds, updates } from '@/lib/db/schema'
import { eq, desc, count, inArray, sql } from 'drizzle-orm'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Update {
  id: string
  project_name: string
  content: string
  created_at: string
  slug?: string
  parentSlug?: string
}

interface ChildFeed {
  id: string
  slug: string
  description: string | null
  websiteUrl: string | null
  postCount: number
  latestProject: string | null
  latestContent: string | null
  latestDate: string | null
}

const PAGE_SIZE = 50

async function getFeed(slug: string) {
  const feedResult = await db
    .select({
      id: feeds.id,
      slug: feeds.slug,
      description: feeds.description,
      parentId: feeds.parentId,
      createdAt: feeds.createdAt,
      xHandle: feeds.xHandle,
      websiteUrl: feeds.websiteUrl,
    })
    .from(feeds)
    .where(eq(feeds.slug, slug))
    .limit(1)

  if (feedResult.length === 0) return null

  const feed = feedResult[0]

  // Get parent info if exists
  let parentSlug: string | null = null
  if (feed.parentId) {
    const parentResult = await db
      .select({ slug: feeds.slug })
      .from(feeds)
      .where(eq(feeds.id, feed.parentId))
      .limit(1)

    if (parentResult.length > 0) {
      parentSlug = parentResult[0].slug
    }
  }

  // Check if feed has children
  const children = await db
    .select({ id: feeds.id, slug: feeds.slug, description: feeds.description })
    .from(feeds)
    .where(eq(feeds.parentId, feed.id))

  const isCollection = children.length > 0

  if (isCollection) {
    // Collection view: get child details with post counts in a single query
    const childFeedsWithCounts = await db
      .select({
        id: feeds.id,
        slug: feeds.slug,
        description: feeds.description,
        websiteUrl: feeds.websiteUrl,
        postCount: sql<number>`(SELECT COUNT(*)::int FROM ${updates} WHERE ${updates.feedId} = ${feeds.id})`,
        latestProject: sql<string | null>`(SELECT ${updates.projectName} FROM ${updates} WHERE ${updates.feedId} = ${feeds.id} ORDER BY ${updates.createdAt} DESC LIMIT 1)`,
        latestContent: sql<string | null>`(SELECT ${updates.content} FROM ${updates} WHERE ${updates.feedId} = ${feeds.id} ORDER BY ${updates.createdAt} DESC LIMIT 1)`,
        latestDate: sql<string | null>`(SELECT ${updates.createdAt}::text FROM ${updates} WHERE ${updates.feedId} = ${feeds.id} ORDER BY ${updates.createdAt} DESC LIMIT 1)`,
      })
      .from(feeds)
      .where(eq(feeds.parentId, feed.id))

    const childFeeds: ChildFeed[] = childFeedsWithCounts.map(c => ({
      id: c.id,
      slug: c.slug,
      description: c.description,
      websiteUrl: c.websiteUrl,
      postCount: c.postCount,
      latestProject: c.latestProject,
      latestContent: c.latestContent,
      latestDate: c.latestDate,
    }))

    // Get aggregated updates from parent + all children
    const allFeedIds = [feed.id, ...children.map(c => c.id)]
    const aggregatedUpdates = await db
      .select({
        id: updates.id,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
        slug: feeds.slug,
      })
      .from(updates)
      .innerJoin(feeds, eq(updates.feedId, feeds.id))
      .where(inArray(updates.feedId, allFeedIds))
      .orderBy(desc(updates.createdAt))
      .limit(PAGE_SIZE)

    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(updates)
      .where(inArray(updates.feedId, allFeedIds))

    return {
      slug: feed.slug,
      feedId: feed.id,
      description: feed.description,
      created_at: feed.createdAt.toISOString(),
      x_handle: feed.xHandle,
      website_url: feed.websiteUrl,
      parentSlug,
      isCollection: true,
      childFeeds,
      updates: aggregatedUpdates.map(u => ({
        id: u.id,
        project_name: u.projectName,
        content: u.content,
        created_at: u.createdAt.toISOString(),
        slug: u.slug,
        parentSlug: feed.slug,
      })),
      totalCount,
    }
  } else {
    // Regular feed view
    const updatesList = await db
      .select({
        id: updates.id,
        projectName: updates.projectName,
        content: updates.content,
        createdAt: updates.createdAt,
      })
      .from(updates)
      .where(eq(updates.feedId, feed.id))
      .orderBy(desc(updates.createdAt))
      .limit(PAGE_SIZE)

    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(updates)
      .where(eq(updates.feedId, feed.id))

    return {
      slug: feed.slug,
      feedId: feed.id,
      description: feed.description,
      created_at: feed.createdAt.toISOString(),
      x_handle: feed.xHandle,
      website_url: feed.websiteUrl,
      parentSlug,
      isCollection: false,
      childFeeds: [],
      updates: updatesList.map(u => ({
        id: u.id,
        project_name: u.projectName,
        content: u.content,
        created_at: u.createdAt.toISOString(),
        slug: feed.slug,
        parentSlug: parentSlug ?? undefined,
      })),
      totalCount,
    }
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

export default async function UserFeed({ params }: PageProps) {
  const { slug } = await params
  const feed = await getFeed(slug)

  if (!feed) {
    notFound()
  }

  const hasMore = feed.totalCount > PAGE_SIZE

  return (
    <main className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <div className="flex justify-center mb-10">
        <a href="/" className="transition-opacity hover:opacity-80">
          <CrabMascot size={56} animated={false} />
        </a>
      </div>

      <header className="mb-12">
        {feed.parentSlug && (
          <div className="mb-4 text-sm">
            <span className="text-muted">Part of </span>
            <Link href={`/${feed.parentSlug}`} className="text-coral hover:text-coral-bright font-medium transition-colors">
              @{feed.parentSlug}
            </Link>
          </div>
        )}

        <h1 className="font-display text-4xl font-bold text-primary">
          @{slug}
        </h1>

        {feed.description && (
          <p className="text-secondary mt-3 text-lg leading-relaxed">
            {feed.description}
          </p>
        )}

        <p className="text-muted mt-2">
          Coding with Claude since{' '}
          <span className="text-cyan">
            {new Date(feed.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
          {feed.totalCount > 0 && (
            <span className="ml-2">
              &middot; {feed.totalCount} {feed.totalCount === 1 ? 'post' : 'posts'}
            </span>
          )}
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

      {feed.isCollection && feed.childFeeds.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold text-primary mb-4">
            Projects
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feed.childFeeds.map((child) => (
              <div
                key={child.id}
                className="bg-surface border border-border rounded-xl p-4 hover:border-border-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/${child.slug}`} className="hover:opacity-80 transition-opacity">
                    <h3 className="font-display font-semibold text-primary">
                      @{child.slug}
                    </h3>
                  </Link>
                  <span className="text-xs text-muted bg-card px-2 py-0.5 rounded">
                    {child.postCount} {child.postCount === 1 ? 'post' : 'posts'}
                  </span>
                </div>
                {child.description && (
                  <p className="text-sm text-secondary mb-2 line-clamp-2">
                    {child.description}
                  </p>
                )}
                {child.websiteUrl && (
                  <a
                    href={child.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan hover:text-primary text-sm transition-colors"
                  >
                    {new URL(child.websiteUrl).hostname.replace('www.', '')}
                  </a>
                )}
                {child.latestContent && (
                  <div className="text-sm mt-3 pt-3 border-t border-border">
                    <p className="text-cyan font-medium truncate">{child.latestProject}</p>
                    <p className="text-muted line-clamp-2 mt-1">{child.latestContent}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-surface rounded-2xl border border-border p-6">
        {feed.isCollection && (
          <h2 className="font-display text-lg font-semibold text-primary mb-6">
            All updates
          </h2>
        )}

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
                slug={update.slug}
                parentSlug={update.parentSlug}
                project={update.project_name}
                content={update.content}
                created_at={update.created_at}
                showSlug={feed.isCollection}
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
