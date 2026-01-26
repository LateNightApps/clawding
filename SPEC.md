# Clawding - Build Spec

## What This Is

Clawding is a "code in public" feed for people coding with Claude. One install command, then `/clawding` handles everything - setup, claiming your username, and posting updates about what you're coding with Claude.

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres)
- **Auth:** None - just tokens
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

---

## User Experience

### Install (one command)

```bash
curl -sL clawding.app/i | bash
```

Output:
```
✓ Clawding installed!
  Run /clawding in Claude Code to get started.
```

### First Run (setup happens automatically)

```
> /clawding

Welcome to Clawding! Let's get you set up.

What username do you want?

> brandon

Checking... "brandon" is taken.

Available: brandon99, brandonbuilds, brandoncodes

> brandonbuilds

Claiming brandonbuilds... done!
Saved your credentials.

Your feed: clawding.app/brandonbuilds

What did you build? (or I can look at this session)

> just set this up lol

Posted! clawding.app/brandonbuilds
```

### Every Run After

```
> /clawding

Looking at this session... you added Stripe webhooks.

Posted: "Added Stripe webhook handling for payments"
clawding.app/brandonbuilds
```

Or with a custom message:

```
> /clawding Finally fixed that auth bug

Posted: "Finally fixed that auth bug"
clawding.app/brandonbuilds
```

---

## Install Script

**Hosted at:** `https://clawding.app/i`

```bash
#!/bin/bash
mkdir -p ~/.claude/skills/clawding
curl -so ~/.claude/skills/clawding/SKILL.md https://clawding.app/skill.md
echo "✓ Clawding installed!"
echo "  Run /clawding in Claude Code to get started."
```

---

## The Skill File

**Hosted at:** `https://clawding.app/skill.md`

```markdown
---
name: clawding
description: Post updates about what you're coding with Claude to your public Clawding feed
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
8. Confirm: "Your feed: clawding.app/USERNAME"
9. Ask what they want to post, or offer to summarize the session

## If CLAWDING_TOKEN is set (normal usage):

1. If they provided a message (/clawding Fixed the bug), use that
2. If no message, look at the conversation and write a 1-2 sentence summary
   - Write for humans: "Added user login" not "implemented OAuth2 flow"
3. Get the project name from the current folder/repo
4. POST to https://clawding.app/api/post/$CLAWDING_SLUG:
   - Header: Authorization: Bearer $CLAWDING_TOKEN
   - Body: {"project": "PROJECT", "update": "MESSAGE"}
5. Confirm: "Posted! clawding.app/$CLAWDING_SLUG"

## Error handling:

- If the API returns unauthorized, tell them to run /clawding setup to reconfigure
- If rate limited, tell them they've hit 50 posts/day limit
```

---

## Database Schema (Supabase)

### Table: feeds

```sql
create table feeds (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  token_hash text not null,
  created_at timestamp with time zone default now(),
  last_post_at timestamp with time zone
);

create index idx_feeds_slug on feeds(slug);
```

### Table: updates

```sql
create table updates (
  id uuid default gen_random_uuid() primary key,
  feed_id uuid references feeds(id) on delete cascade,
  project_name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index idx_updates_feed_id on updates(feed_id);
create index idx_updates_created_at on updates(created_at desc);
```

### Row Level Security

```sql
alter table feeds enable row level security;
alter table updates enable row level security;

-- Public read access (anon key can read feeds and updates)
create policy "Allow read feeds" on feeds for select using (true);
create policy "Allow read updates" on updates for select using (true);

-- Block anonymous inserts (API routes use the service role key, which bypasses RLS)
create policy "Deny anon insert feeds" on feeds for insert with check (false);
create policy "Deny anon insert updates" on updates for insert with check (false);
```

---

## API Endpoints

### POST /api/check

Check if a slug is available, suggest alternatives if not.

**Request:**
```json
{"slug": "brandon"}
```

**Response (available):**
```json
{"available": true, "slug": "brandon"}
```

**Response (taken):**
```json
{
  "available": false,
  "slug": "brandon",
  "suggestions": ["brandon99", "brandonbuilds", "brandoncodes"]
}
```

### POST /api/claim

Claim a slug and get a token.

**Request:**
```json
{"slug": "brandonbuilds"}
```

**Response (success):**
```json
{
  "success": true,
  "slug": "brandonbuilds",
  "token": "abc123xyz789"
}
```

**Response (taken):**
```json
{"success": false, "error": "slug_taken"}
```

**Logic:**
1. Validate slug (lowercase, alphanumeric, hyphens, 3-20 chars)
2. Check availability
3. Generate 32-char random token
4. Hash with bcrypt, store hash only
5. Return plain token once

### POST /api/post/[slug]

Post an update.

**Headers:**
```
Authorization: Bearer TOKEN
```

**Request:**
```json
{
  "project": "myapp",
  "update": "Added dark mode"
}
```

**Response:**
```json
{"success": true}
```

**Logic:**
1. Find feed by slug
2. Verify token with bcrypt
3. Rate limit: 50/day per feed
4. Sanitize content
5. Insert update
6. Update last_post_at

### GET /api/feed/[slug]

Get a user's updates.

**Response:**
```json
{
  "slug": "brandon",
  "updates": [
    {"project": "myapp", "content": "Added dark mode", "created_at": "2025-01-25T10:30:00Z"}
  ]
}
```

### GET /api/global

Get recent updates from everyone.

**Response:**
```json
{
  "updates": [
    {"slug": "brandon", "project": "myapp", "content": "Added dark mode", "created_at": "..."},
    {"slug": "sarah", "project": "taskapp", "content": "Fixed login bug", "created_at": "..."}
  ]
}
```

Limit 100, paginate later.

---

## Pages

### / (Home)

- Hero: "What are you coding with Claude?"
- Show install command prominently
- Global feed of recent updates below
- Feels alive - relative timestamps ("2 hours ago")

### /[slug] (User Feed)

- All updates from this user
- Filter by project
- Clean timeline view

---

## File Structure

```
/app
  /page.tsx                    # Home + global feed
  /[slug]/page.tsx             # User feed
  /i/route.ts                  # GET - install script (bash)
  /skill.md/route.ts           # GET - skill file
  /api
    /check/route.ts            # POST - check slug availability
    /claim/route.ts            # POST - claim slug
    /post/[slug]/route.ts      # POST - add update
    /feed/[slug]/route.ts      # GET - user updates
    /global/route.ts           # GET - all updates
/lib
  /supabase.ts
  /utils.ts
/components
  /UpdateCard.tsx
  /GlobalFeed.tsx
```

---

## Security

- Hash tokens with bcrypt
- Never return token_hash
- Sanitize all content
- Rate limit: 50 posts/day per feed
- Rate limit claims by IP
- HTTPS (Vercel default)
- Service role key server-side only

---

## Deploy

1. Create Supabase project
2. Run SQL schema
3. Deploy to Vercel
4. Add env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
5. Done

---

## Future (not MVP)

- Auto-prompt hook after completing work
- Token recovery via email
- Profile bios
- RSS feeds
- Streak system
- Embed widgets
