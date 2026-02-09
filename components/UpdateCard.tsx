import Link from 'next/link'
import { RelativeTime } from './RelativeTime'

interface UpdateCardProps {
  slug?: string
  parentSlug?: string
  project: string
  content: string
  created_at: string
  showSlug?: boolean
}

export function UpdateCard({ slug, parentSlug, project, content, created_at, showSlug = false }: UpdateCardProps) {
  return (
    <div className="py-5 hover:bg-card/50 -mx-2 px-2 rounded-lg">
      <div className="flex items-center gap-2 text-sm mb-2">
        {showSlug && slug && (
          <Link
            href={`/${slug}`}
            className={`font-medium transition-colors ${
              parentSlug && parentSlug === slug
                ? 'text-coral hover:text-coral-bright'
                : parentSlug
                  ? 'text-cyan hover:text-primary'
                  : 'text-coral hover:text-coral-bright'
            }`}
          >
            @{slug}
          </Link>
        )}
        {project.toLowerCase() !== slug?.toLowerCase() && (
          <>
            {showSlug && slug && <span className="text-muted">/</span>}
            <span className="text-cyan font-medium truncate max-w-[200px]">{project}</span>
          </>
        )}
        <span className="text-muted">&middot;</span>
        <span className="text-muted"><RelativeTime iso={created_at} /></span>
      </div>
      <p className="text-primary leading-relaxed break-words">{content}</p>
    </div>
  )
}
