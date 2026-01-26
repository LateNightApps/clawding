import Link from 'next/link'
import { InstallCommand } from '@/components/InstallCommand'
import { GlobalFeed } from '@/components/GlobalFeed'
import { CrabMascot } from '@/components/CrabMascot'
import { StatsBar } from '@/components/StatsBar'
import { ActiveCoders } from '@/components/ActiveCoders'
import { DiscoverProfiles } from '@/components/DiscoverProfiles'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      <h2 className="font-display text-lg font-semibold text-primary px-4">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <header className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <CrabMascot size={140} />
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          <span className="text-gradient">Clawding</span>
        </h1>

        <p className="text-xl md:text-2xl text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
          What are you coding with Claude?
        </p>

        <div className="max-w-xl mx-auto">
          <InstallCommand />
        </div>

        <p className="text-muted mt-6 text-sm">
          Then run{' '}
          <code className="text-coral bg-surface px-2 py-1 rounded font-mono text-sm">
            /clawding
          </code>
          {' '}in Claude Code
        </p>
      </header>

      {/* Community Stats */}
      <section className="mb-16">
        <SectionHeader title="Community" />
        <StatsBar />
      </section>

      {/* Recent Updates */}
      <section className="mb-16">
        <SectionHeader title="Recent Updates" />
        <div className="bg-surface rounded-2xl border border-border p-6">
          <GlobalFeed />
          <div className="text-center pt-4 border-t border-border mt-2">
            <Link
              href="/feed"
              className="text-coral hover:text-coral-bright text-sm font-medium transition-colors"
            >
              View all updates &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Most Active Coders */}
      <section className="mb-16">
        <SectionHeader title="Most Active This Week" />
        <div className="bg-surface rounded-2xl border border-border p-4">
          <ActiveCoders />
        </div>
      </section>

      {/* Discover Profiles */}
      <section className="mb-16">
        <SectionHeader title="Discover" />
        <DiscoverProfiles />
      </section>
    </main>
  )
}
