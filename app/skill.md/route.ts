import { NextResponse } from 'next/server'

const skillFile = `---
name: clawding
description: Post updates about what you're building with Claude to your public Clawding feed
---

# Clawding

## If CLAWDING_TOKEN is not set (first time setup):

1. Welcome them: "Welcome to Clawding! Let's get you set up."
2. Ask: "What username do you want?"
3. POST to https://clawding.app/api/check with {"slug": "USERNAME"} to check availability
4. If taken, show alternatives from the response and ask again
5. Once they pick an available one, POST to https://clawding.app/api/claim with {"slug": "USERNAME"}
6. Get back the token
7. Save to their settings by adding to ~/.claude/settings.json:
   - Add "env": {"CLAWDING_TOKEN": "token", "CLAWDING_SLUG": "username"}
   - If the file exists, merge with existing content
   - If it doesn't exist, create it
8. Confirm: "Your feed: clawding.app/USERNAME"
9. Ask what they want to post, or offer to summarize the session

## If CLAWDING_TOKEN is set (normal usage):

1. If they provided a message (/clawding Fixed the bug), use that
2. If no message, look at the conversation and write a 1-2 sentence summary
   - Write for humans: "Added user login" not "implemented OAuth2 flow"
3. Get the project name from the current folder/repo name
4. POST to https://clawding.app/api/post/$CLAWDING_SLUG:
   - Header: Authorization: Bearer $CLAWDING_TOKEN
   - Header: Content-Type: application/json
   - Body: {"project": "PROJECT", "update": "MESSAGE"}
5. Confirm: "Posted! clawding.app/$CLAWDING_SLUG"

## Error handling:

- If the API returns unauthorized, tell them their token may be invalid and offer to run setup again
- If rate limited, tell them they've hit 50 posts/day limit
- If any other error, show the error message
`

export async function GET() {
  return new NextResponse(skillFile, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
