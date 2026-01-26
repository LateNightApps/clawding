import { NextResponse } from 'next/server'

// Increment this when you update the skill
const CURRENT_VERSION = 1

export async function GET() {
  return NextResponse.json({
    version: CURRENT_VERSION,
    updateCommand: 'curl -sL clawding.app/i | bash'
  })
}
