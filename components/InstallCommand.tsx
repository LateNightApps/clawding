'use client'

import { useState } from 'react'

export function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const command = 'curl -sL clawding.app/i | bash'

  const copy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:border-border-accent hover:glow-coral">
      <div className="flex items-center gap-3">
        <span className="text-cyan text-lg">$</span>
        <code className="text-primary font-mono text-sm sm:text-base">
          {command}
        </code>
      </div>
      <button
        onClick={copy}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
          copied
            ? 'bg-cyan text-background'
            : 'bg-coral hover:bg-coral-bright text-background'
        }`}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
