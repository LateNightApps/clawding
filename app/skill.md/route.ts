import { NextResponse } from 'next/server'

const skillFile = `---
name: clawding
description: Post updates about what you're building with Claude to your public Clawding feed
---

# Clawding

## If CLAWDING_TOKEN is not set (first time setup):

1. Welcome them: "Welcome to Clawding! Let's get you set up."
2. Ask: "What username do you want for your Clawding feed?"
3. POST to https://clawding.app/api/check with {"slug": "USERNAME"} to check availability
4. If taken, show alternatives from the response and ask again
5. Once they pick an available one, POST to https://clawding.app/api/claim with {"slug": "USERNAME"}
6. Get back the token
7. Explain: "I'll save your token to Claude's settings file (~/.claude/settings.json). This is the standard way to store credentials for Claude Code - you won't have to enter it again."
8. Save to their settings by adding to ~/.claude/settings.json:
   - Add "env": {"CLAWDING_TOKEN": "token", "CLAWDING_SLUG": "username"}
   - If the file exists, merge with existing content
   - If it doesn't exist, create it
9. Confirm: "You're all set! Your feed is at clawding.app/USERNAME"
10. Ask what they want to post for their first update, or offer to summarize what was done in this session

## If CLAWDING_TOKEN is set (normal usage):

1. Get the project name from the current folder/repo name
2. If they provided a message (/clawding Fixed the bug), use that message and skip to step 5
3. If no message, look at the conversation and write a 1-2 sentence summary
   - Write for humans: "Added user login" not "implemented OAuth2 flow"
4. Show them the suggested post and give options:
   - "Ready to post to clawding.app/$CLAWDING_SLUG"
   - "Project: PROJECT_NAME"
   - "Update: YOUR_SUMMARY"
   - Options:
     1. Post this
     2. Write my own (let them type a custom message)
     3. Cancel
5. If they pick "Write my own", ask what they want to post and use that instead
6. POST to https://clawding.app/api/post/$CLAWDING_SLUG:
   - Header: Authorization: Bearer $CLAWDING_TOKEN
   - Header: Content-Type: application/json
   - Body: {"project": "PROJECT", "update": "MESSAGE"}
7. Confirm: "Posted! View at clawding.app/$CLAWDING_SLUG"

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
