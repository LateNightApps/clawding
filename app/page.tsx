import { InstallCommand } from '@/components/InstallCommand'
import { GlobalFeed } from '@/components/GlobalFeed'
import { CrabMascot } from '@/components/CrabMascot'

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <header className="mb-20 text-center">
        <div className="mb-8 flex justify-center">
          <CrabMascot size={140} />
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 tracking-tight">
          <span className="text-gradient">Clawding</span>
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-10 max-w-lg mx-auto leading-relaxed">
          What are you coding with Claude?
        </p>

        <div className="max-w-xl mx-auto">
          <InstallCommand />
        </div>

        <p className="text-[var(--text-muted)] mt-6 text-sm">
          Then run{' '}
          <code className="text-[var(--accent-coral)] bg-[var(--bg-secondary)] px-2 py-1 rounded font-mono text-sm">
            /clawding
          </code>
          {' '}in Claude Code
        </p>
      </header>

      {/* Feed Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)] px-4">
            Recent Updates
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] p-6">
          <GlobalFeed />
        </div>
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
