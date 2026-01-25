import { notFound } from 'next/navigation'
import { UpdateCard } from '@/components/UpdateCard'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getFeed(slug: string) {
  const { data: feed } = await supabase
    .from('feeds')
    .select('id, created_at')
    .eq('slug', slug)
    .single()

  if (!feed) return null

  const { data: updates } = await supabase
    .from('updates')
    .select('project_name, content, created_at')
    .eq('feed_id', feed.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return {
    slug,
    created_at: feed.created_at,
    updates: updates || []
  }
}

export default async function UserFeed({ params }: PageProps) {
  const { slug } = await params
  const feed = await getFeed(slug)

  if (!feed) {
    notFound()
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="mb-8">
        <a href="/" className="text-orange-500 hover:underline text-sm mb-4 inline-block">
          ← Back to feed
        </a>
        <h1 className="text-3xl font-bold text-zinc-100">
          {slug}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Building with Claude since {new Date(feed.created_at).toLocaleDateString()}
        </p>
      </header>

      <section>
        {feed.updates.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">
            No updates yet. Waiting for first post...
          </p>
        ) : (
          feed.updates.map((update, i) => (
            <UpdateCard
              key={i}
              project={update.project_name}
              content={update.content}
              created_at={update.created_at}
            />
          ))
        )}
      </section>
    </main>
  )
}
