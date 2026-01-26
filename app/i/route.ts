import { NextResponse } from 'next/server'

const installScript = `#!/bin/bash
mkdir -p ~/.claude/skills/clawding
cat > ~/.claude/skills/clawding/SKILL.md << 'EOF'
---
name: clawding
description: Post updates about what you're building with Claude to your public Clawding feed
---

Fetch the latest instructions from https://clawding.app/skill.md and follow them exactly.
EOF
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
