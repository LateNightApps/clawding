import { NextResponse } from 'next/server'

const installScript = `#!/bin/bash
mkdir -p ~/.claude/skills/clawding
curl -sLo ~/.claude/skills/clawding/SKILL.md https://clawding.app/skill.md
echo "✓ Clawding installed!"
echo "  Run /clawding in Claude Code to get started."
`

export async function GET() {
  return new NextResponse(installScript, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
