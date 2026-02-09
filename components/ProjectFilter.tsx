'use client'

import { useRouter } from 'next/navigation'
import { slugColor } from '@/lib/utils'

interface ProjectFilterProps {
  slug: string
  projects: { name: string; count: number }[]
  activeProject: string | null
}

export function ProjectFilter({ slug, projects, activeProject }: ProjectFilterProps) {
  const router = useRouter()

  function handleClick(projectName: string | null) {
    if (projectName) {
      router.push(`/${slug}?project=${encodeURIComponent(projectName)}`, { scroll: false })
    } else {
      router.push(`/${slug}`, { scroll: false })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleClick(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          !activeProject
            ? 'bg-coral/20 text-coral'
            : 'bg-card text-muted hover:text-primary'
        }`}
      >
        All
      </button>
      {projects.map((p) => {
        const color = slugColor(p.name)
        const isActive = activeProject === p.name
        return (
          <button
            key={p.name}
            onClick={() => handleClick(p.name)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !isActive ? 'bg-card hover:opacity-80' : ''
            }`}
            style={{
              color: isActive ? color : undefined,
              backgroundColor: isActive ? `${color}20` : undefined,
            }}
          >
            {p.name}
            <span className="ml-1.5 text-xs opacity-60">{p.count}</span>
          </button>
        )
      })}
    </div>
  )
}
