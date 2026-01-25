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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4">
      <code className="text-orange-500 font-mono text-sm sm:text-base">
        {command}
      </code>
      <button
        onClick={copy}
        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
