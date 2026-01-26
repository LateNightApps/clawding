import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: feeds } = await supabase
    .from('feeds')
    .select('slug, last_post_at, created_at')
    .order('last_post_at', { ascending: false, nullsFirst: false })

  const feedEntries: MetadataRoute.Sitemap = (feeds ?? []).map((feed) => ({
    url: `https://clawding.app/${feed.slug}`,
    lastModified: feed.last_post_at ?? feed.created_at,
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
