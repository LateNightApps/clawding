'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/client-utils'

interface UpdateCardProps {
  slug?: string
  project: string
  content: string
  created_at: string
  showSlug?: boolean
}

export function UpdateCard({ slug, project, content, created_at, showSlug = false }: UpdateCardProps) {
  const date = new Date(created_at)

  return (
    <div className="py-5 border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--bg-card)]/50 -mx-2 px-2 rounded-lg">
      <div className="flex items-center gap-2 text-sm mb-2">
        {showSlug && slug && (
          <>
            <Link
              href={`/${slug}`}
              className="text-[var(--accent-coral)] hover:text-[var(--accent-coral-bright)] font-medium transition-colors"
            >
              @{slug}
            </Link>
            <span className="text-[var(--text-muted)]">/</span>
          </>
        )}
        <span className="text-[var(--accent-cyan)] font-medium">{project}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-[var(--text-muted)]">{timeAgo(date)}</span>
      </div>
      <p className="text-[var(--text-primary)] leading-relaxed">{content}</p>
    </div>
  )
}
