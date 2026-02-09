import { NextResponse } from 'next/server'
import { skillContent } from '@/lib/skill-content'

export async function GET() {
  return new NextResponse(skillContent, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  })
}
