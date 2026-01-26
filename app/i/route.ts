import { NextResponse } from 'next/server'

const installScript = `#!/bin/bash
mkdir -p ~/.claude/skills/clawding
curl -sLo ~/.claude/skills/clawding/SKILL.md https://clawding.app/skill.md
echo ""
echo "✓ Clawding installed!"
echo ""
echo "  Type /clawding now to claim your username and start posting."
echo ""
`

export async function GET() {
  return new NextResponse(installScript, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
