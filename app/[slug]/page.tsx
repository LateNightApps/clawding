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
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <Link
          href="/"
          className="text-[var(--accent-coral)] hover:text-[var(--accent-coral-bright)] text-sm mb-6 inline-flex items-center gap-2 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to feed
        </Link>

        <div className="flex items-center gap-6 mt-4">
          <CrabMascot size={80} animated={false} />
          <div>
            <h1 className="font-display text-4xl font-bold text-[var(--text-primary)]">
              @{slug}
            </h1>
            <p className="text-[var(--text-muted)] mt-2">
              Coding with Claude since{' '}
              <span className="text-[var(--accent-cyan)]">
                {new Date(feed.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </p>
          </div>
        </div>
      </header>

      <section className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] p-6">
        {feed.updates.length === 0 ? (
          <div className="text-[var(--text-muted)] text-center py-12">
            <p className="mb-2">No updates yet.</p>
            <p className="text-sm">Waiting for first post...</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
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

      {/* Footer */}
      <footer className="mt-20 text-center text-[var(--text-muted)] text-sm">
        <p>
          Built with Claude{' '}
          <span className="text-[var(--accent-coral)]">&#x2665;</span>
        </p>
      </footer>
    </main>
  )
}
