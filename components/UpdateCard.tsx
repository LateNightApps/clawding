import Link from 'next/link'
import { RelativeTime } from './RelativeTime'
import { slugColor } from '@/lib/utils'

interface UpdateCardProps {
  slug?: string
  project: string
  content: string
  created_at: string
  showSlug?: boolean
  showProject?: boolean
}

export function UpdateCard({ slug, project, content, created_at, showSlug = false, showProject = false }: UpdateCardProps) {
  const projectColor = showProject ? slugColor(project) : undefined

  return (
    <div className="py-5 hover:bg-card/50 -mx-2 px-2 rounded-lg">
      <div className="flex items-center gap-2 text-sm mb-2">
        {showSlug && slug && (
          <Link
            href={`/${slug}`}
            className="text-coral hover:text-coral-bright font-medium transition-colors"
          >
            @{slug}
          </Link>
        )}
        {showProject && (
          <span
            className="font-medium truncate max-w-[200px]"
            style={projectColor ? { color: projectColor } : undefined}
          >
            {project}
          </span>
        )}
        {!showProject && !showSlug && (
          <span className="text-cyan font-medium truncate max-w-[200px]">{project}</span>
        )}
        <span className="text-muted">&middot;</span>
        <span className="text-muted"><RelativeTime iso={created_at} /></span>
      </div>
      <p className="text-primary leading-relaxed break-words">{content}</p>
    </div>
  )
}
