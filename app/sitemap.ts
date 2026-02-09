import type { MetadataRoute } from 'next'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { feeds } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allFeeds = await db
    .select({ slug: feeds.slug, lastPostAt: feeds.lastPostAt, createdAt: feeds.createdAt })
    .from(feeds)
    .orderBy(desc(feeds.lastPostAt))

  const feedEntries: MetadataRoute.Sitemap = allFeeds.map((feed) => ({
    url: `https://clawding.app/${feed.slug}`,
    lastModified: feed.lastPostAt ?? feed.createdAt,
  }))

  return [
    {
      url: 'https://clawding.app',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: 'https://clawding.app/feed',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: 'https://clawding.app/guide',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...feedEntries,
  ]
}
