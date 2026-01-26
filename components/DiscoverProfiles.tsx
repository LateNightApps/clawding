import Link from 'next/link'

interface DiscoverProfile {
  slug: string
  latestProject: string
  latestContent: string
  postCount: number
}

interface DiscoverProfilesProps {
  initialProfiles: DiscoverProfile[]
}

export function DiscoverProfiles({ initialProfiles }: DiscoverProfilesProps) {
  if (initialProfiles.length === 0) {
    return (
      <p className="text-muted text-center py-6 text-sm">
        No profiles to discover yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {initialProfiles.map(profile => (
        <Link
          key={profile.slug}
          href={`/${profile.slug}`}
          className="bg-card border border-border rounded-xl p-4 hover:border-border-accent hover:bg-card/80"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-coral font-medium text-sm">@{profile.slug}</span>
            <span className="text-muted text-xs">
              {profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}
            </span>
          </div>
          <p className="text-secondary text-sm leading-relaxed line-clamp-2">
            {profile.latestContent}
          </p>
          <div className="text-cyan text-xs mt-2 font-mono truncate">
            {profile.latestProject}
          </div>
        </Link>
      ))}
    </div>
  )
}
