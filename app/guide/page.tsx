import type { Metadata } from 'next'
import Link from 'next/link'
import { CrabMascot } from '@/components/CrabMascot'

export const metadata: Metadata = {
  title: 'Guide - Clawding',
  description: 'Learn how to install, set up, and use Clawding to share what you\'re coding with Claude.',
  openGraph: {
    title: 'Guide - Clawding',
    description: 'Learn how to install, set up, and use Clawding to share what you\'re coding with Claude.',
    url: 'https://clawding.app/guide',
  },
  twitter: {
    card: 'summary',
    title: 'Guide - Clawding',
    description: 'Learn how to install, set up, and use Clawding to share what you\'re coding with Claude.',
  },
}

function SectionDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12" />
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
      <code className="text-sm font-mono text-primary">{children}</code>
    </pre>
  )
}

function CommandRow({ command, description }: { command: string; description: string }) {
  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-4">
        <code className="text-coral font-mono text-sm">{command}</code>
      </td>
      <td className="py-3 text-secondary text-sm">{description}</td>
    </tr>
  )
}

export default function GuidePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <div className="flex justify-center mb-10">
        <a href="/" className="transition-opacity hover:opacity-80">
          <CrabMascot size={56} animated={false} />
        </a>
      </div>

      <header className="mb-12">
        <h1 className="font-display text-4xl font-bold text-primary mb-4">
          Guide
        </h1>
        <p className="text-secondary text-lg leading-relaxed">
          Everything you need to know about using Clawding.
        </p>
      </header>

      {/* Install */}
      <section aria-labelledby="install">
        <h2 id="install" className="font-display text-2xl font-semibold text-primary mb-4">
          Install
        </h2>
        <p className="text-secondary mb-4">
          One command. Works on macOS and Linux.
        </p>
        <CodeBlock>curl -sL clawding.app/i | bash</CodeBlock>
        <p className="text-muted text-sm mt-3">
          This installs a skill file to <code className="text-coral font-mono">~/.claude/skills/clawding/</code> so
          that <code className="text-coral font-mono">/clawding</code> is available in every Claude Code session.
        </p>
      </section>

      <SectionDivider />

      {/* First time setup */}
      <section aria-labelledby="setup">
        <h2 id="setup" className="font-display text-2xl font-semibold text-primary mb-4">
          First time setup
        </h2>
        <p className="text-secondary mb-4">
          After installing, run <code className="text-coral bg-surface px-2 py-0.5 rounded font-mono text-sm">/clawding</code> in
          Claude Code. It will walk you through picking a name for your feed.
        </p>
        <CodeBlock>{`> /clawding

Welcome to Clawding! Let's get you set up.

What name do you want for your feed?

> brandon

Checking... "brandon" is taken.
Available: brandon99, brandonbuilds, brandoncodes

> brandonbuilds

You're all set! Your feed is at clawding.app/brandonbuilds`}</CodeBlock>
        <p className="text-muted text-sm mt-3">
          Your credentials are saved to <code className="text-coral font-mono">~/.config/clawding.json</code>.
          You only do this once.
        </p>
      </section>

      <SectionDivider />

      {/* Posting */}
      <section aria-labelledby="posting">
        <h2 id="posting" className="font-display text-2xl font-semibold text-primary mb-4">
          Posting updates
        </h2>
        <p className="text-secondary mb-4">
          Run <code className="text-coral bg-surface px-2 py-0.5 rounded font-mono text-sm">/clawding</code> at
          any point during a coding session. Claude will summarize what you&apos;ve been working on, or you can
          write your own message.
        </p>
        <CodeBlock>{`> /clawding

Looking at this session... you added Stripe webhooks.

Posted: "Added Stripe webhook handling for payments"
clawding.app/brandonbuilds`}</CodeBlock>
        <p className="text-secondary mt-4 mb-4">
          You can also pass a message directly:
        </p>
        <CodeBlock>{`> /clawding Finally fixed that auth bug

Posted: "Finally fixed that auth bug"
clawding.app/brandonbuilds`}</CodeBlock>
      </section>

      <SectionDivider />

      {/* Multiple feeds */}
      <section aria-labelledby="feeds">
        <h2 id="feeds" className="font-display text-2xl font-semibold text-primary mb-4">
          Multiple feeds
        </h2>
        <p className="text-secondary mb-4">
          A feed is just a name and a URL. It can represent anything &mdash; you, a product, a brand, a team.
          Most people use one feed for everything. You can create more if you want separate feeds for different things.
        </p>

        <h3 className="font-display text-lg font-semibold text-primary mb-3 mt-8">
          Adding a new feed
        </h3>
        <CodeBlock>{`> /clawding new

What name do you want for your new feed?

> myproduct

Added feed: clawding.app/myproduct
Your feeds: brandonbuilds (default), myproduct`}</CodeBlock>

        <h3 className="font-display text-lg font-semibold text-primary mb-3 mt-8">
          How auto-detection works
        </h3>
        <p className="text-secondary mb-4">
          When you post, Clawding figures out which feed to use automatically:
        </p>
        <ol className="text-secondary space-y-2 mb-4 list-decimal list-inside">
          <li>If the current project folder is linked to a feed, it uses that feed.</li>
          <li>If the folder name matches a feed name exactly, it uses that feed.</li>
          <li>If you only have one feed, it uses that.</li>
          <li>If none of the above match, it asks you once and remembers your choice.</li>
        </ol>

        <h3 className="font-display text-lg font-semibold text-primary mb-3 mt-8">
          Linking a project to a feed
        </h3>
        <p className="text-secondary mb-4">
          You can manually link any project folder to a specific feed. Run this from inside the project:
        </p>
        <CodeBlock>{`> /clawding link myproduct

Linked my-project-folder → clawding.app/myproduct`}</CodeBlock>
        <p className="text-muted text-sm mt-3">
          Once linked, every <code className="text-coral font-mono">/clawding</code> from that folder automatically posts
          to the linked feed. No need to specify it each time.
        </p>

        <h3 className="font-display text-lg font-semibold text-primary mb-3 mt-8">
          Posting to a specific feed
        </h3>
        <p className="text-secondary mb-4">
          Use the <code className="text-coral font-mono">@</code> prefix to target a feed directly:
        </p>
        <CodeBlock>{`> /clawding @myproduct Shipped the new dashboard

Posted to clawding.app/myproduct`}</CodeBlock>
      </section>

      <SectionDivider />

      {/* Commands reference */}
      <section aria-labelledby="commands">
        <h2 id="commands" className="font-display text-2xl font-semibold text-primary mb-4">
          Commands
        </h2>
        <div className="bg-surface rounded-2xl border border-border p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-muted text-sm font-medium">Command</th>
                <th className="pb-3 text-muted text-sm font-medium">What it does</th>
              </tr>
            </thead>
            <tbody>
              <CommandRow
                command="/clawding"
                description="Post an update (auto-detects feed or uses default)"
              />
              <CommandRow
                command="/clawding message"
                description="Post a specific message"
              />
              <CommandRow
                command="/clawding @feed message"
                description="Post to a specific feed"
              />
              <CommandRow
                command="/clawding new"
                description="Create a new feed"
              />
              <CommandRow
                command="/clawding feeds"
                description="List all your feeds and project mappings"
              />
              <CommandRow
                command="/clawding link feedname"
                description="Link current project folder to a feed"
              />
              <CommandRow
                command="/clawding default feedname"
                description="Change your default feed"
              />
              <CommandRow
                command="/clawding delete"
                description="Delete your most recent post"
              />
            </tbody>
          </table>
        </div>
      </section>

      <SectionDivider />

      {/* FAQ */}
      <section aria-labelledby="faq">
        <h2 id="faq" className="font-display text-2xl font-semibold text-primary mb-6">
          FAQ
        </h2>

        <div className="space-y-8">
          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              Where are my credentials stored?
            </h3>
            <p className="text-secondary">
              In <code className="text-coral font-mono">~/.config/clawding.json</code>. This file contains your
              feed names, tokens, and project mappings. It stays on your machine.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              What if I lose my token?
            </h3>
            <p className="text-secondary">
              Tokens can&apos;t be recovered &mdash; they&apos;re hashed on the server. You would need to
              claim a new feed name. Keep your config file backed up if this is a concern.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              Is there a post limit?
            </h3>
            <p className="text-secondary">
              50 posts per day per feed. This resets at midnight UTC.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              Do I need to reinstall to get updates?
            </h3>
            <p className="text-secondary">
              No. The installed skill file fetches the latest instructions from the server each time
              you run <code className="text-coral font-mono">/clawding</code>. Updates happen automatically.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">
              Can I use Clawding on multiple machines?
            </h3>
            <p className="text-secondary">
              Yes. Install on each machine and copy your <code className="text-coral font-mono">~/.config/clawding.json</code> file
              to the new machine. Your feeds and tokens will carry over.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider />

      <div className="text-center">
        <Link
          href="/"
          className="text-coral hover:text-coral-bright text-sm font-medium transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </main>
  )
}
