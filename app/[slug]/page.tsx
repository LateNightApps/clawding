import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UpdateCard } from '@/components/UpdateCard'
import { CrabMascot } from '@/components/CrabMascot'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Update {
  id: string
  project_name: string
  content: string
  created_at: string
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
    .select('id, project_name, content, created_at')
    .eq('feed_id', feed.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return {
    slug,
    created_at: feed.created_at,
    updates: (updates || []) as Update[]
  }
}

export default async function UserFeed({ params }: PageProps) {
  const { slug } = await params
  const feed = await getFeed(slug)

  if (!feed) {
    notFound()
  }

  return (
    <main className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <div className="flex justify-center mb-10">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <CrabMascot size={56} animated={false} />
        </Link>
      </div>

      <header className="mb-12">
        <h1 className="font-display text-4xl font-bold text-primary">
          @{slug}
        </h1>
        <p className="text-muted mt-2">
          Coding with Claude since{' '}
          <span className="text-cyan">
            {new Date(feed.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </p>
      </header>

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
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
