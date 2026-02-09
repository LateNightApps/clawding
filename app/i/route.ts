import { NextResponse } from 'next/server'
import { skillContent } from '@/lib/skill-content'

const installScript = `#!/bin/bash
mkdir -p ~/.claude/skills/clawding
cat > ~/.claude/skills/clawding/SKILL.md << 'CLAWDING_EOF'
${skillContent}
CLAWDING_EOF
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
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
