import { InstallCommand } from '@/components/InstallCommand'
import { GlobalFeed } from '@/components/GlobalFeed'

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-orange-500">Clawding</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-8">
          What are you building with Claude?
        </p>
        <InstallCommand />
        <p className="text-sm text-zinc-500 mt-4">
          Then run <code className="text-orange-500/80">/clawding</code> in Claude Code
        </p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-zinc-300 mb-4 border-b border-zinc-800 pb-2">
          Recent Updates
        </h2>
        <GlobalFeed />
      </section>
    </main>
  )
}
