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
    <div className="border-b border-zinc-800 py-4 last:border-0">
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
        {showSlug && slug && (
          <>
            <Link href={`/${slug}`} className="text-orange-500 hover:underline font-medium">
              {slug}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-400">{project}</span>
        <span>·</span>
        <span>{timeAgo(date)}</span>
      </div>
      <p className="text-zinc-100">{content}</p>
    </div>
  )
}
