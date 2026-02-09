# Clawding - Build Spec

## What This Is

Clawding is a "code in public" feed for people coding with Claude. One install command, then `/clawding` handles everything - setup, claiming your username, and posting updates about what you're coding with Claude.

## Tech Stack

- **Frontend:** Next.js 16 (App Router)
- **Database:** Neon (Postgres) + Drizzle ORM
- **Auth:** None - just tokens (bcrypt hashed)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS v4
- **Rate Limiting:** Upstash Redis
- **Email:** Resend (for token recovery codes)

## Verification Checklist

To verify the build is correct after restart:
1. `npm run build` should pass with 0 errors
2. `npm run dev` → homepage should load with existing feeds/posts from Neon
3. Test `/api/health` → should return `{ "status": "healthy" }`
4. Existing feeds should still have all their posts

## User Experience

### Install (one command)

```bash
curl -sL clawding.app/i | bash
```

Output:
```
✓ Clawding installed!
  Type /clawding now to claim your username and start posting.
```

### First Run (setup happens automatically)

```
> /clawding

Welcome to Clawding! Let's get you set up.

What name do you want for your feed?

> brandon

Checking... "brandon" is taken.

Available: brandon99, brandonbuilds, brandoncodes

> brandonbuilds

What's your email? (for token recovery if you ever lose it)

> brandon@email.com

Claiming brandonbuilds... done!
Recovery email saved!

Your feed is at clawding.app/brandonbuilds

What did you build? (or I can summarize this session)

> just set this up lol

Posted! View at clawding.app/brandonbuilds

Here's what you can do:
  /clawding                  Post an update (or I'll summarize your session)
  /clawding Fixed the bug    Post with a custom message
  /clawding profile          Set your description, X handle, or website
  /clawding delete           Delete your last post
  /clawding feeds            See all your feeds
  /clawding new              Create another feed
  /clawding recover          Recover if you lose your token
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

## Database Schema (Neon + Drizzle)

### Table: feeds

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| slug | text | Unique, not null |
| token_hash | text | bcrypt hash, not null |
| x_handle | text | Optional |
| website_url | text | Optional |
| description | text | Optional, max 200 chars |
| email | text | Optional, for token recovery |
| created_at | timestamptz | Default now() |
| last_post_at | timestamptz | Updated on each post |

Indexes: `idx_feeds_slug` (unique)

### Table: updates

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| feed_id | uuid | FK → feeds.id, cascade delete |
| project_name | text | Not null |
| content | text | Not null, max 500 chars |
| created_at | timestamptz | Default now() |

Indexes: `idx_updates_feed_id`, `idx_updates_created_at`

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

Claim a slug and get a token. Optionally set a recovery email.

**Request:**
```json
{"slug": "brandonbuilds", "email": "brandon@email.com"}
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

### PATCH /api/profile/[slug]

Update a feed's profile (description, X handle, website, email).

**Headers:**
```
Authorization: Bearer TOKEN
```

**Request:**
```json
{
  "x_handle": "clawding",
  "website_url": "https://clawding.app",
  "description": "Building cool stuff with Claude",
  "email": "me@example.com"
}
```

**Response:**
```json
{"success": true, "updated": ["x_handle", "website_url", "description", "email"]}
```

**Logic:**
1. Authenticate via token
2. Validate x_handle (alphanumeric + underscores, max 15 chars, strip leading @)
3. Validate website_url (must be https://, max 200 chars)
4. Validate description (max 200 chars, sanitized)
5. Validate email (must contain @, max 254 chars)
6. All fields optional — send only what you want to change
7. Send empty string to clear a field

### GET /api/feed/[slug]

Get a user's updates.

**Response:**
```json
{
  "slug": "brandon",
  "x_handle": "brandon",
  "website_url": "https://brandon.dev",
  "description": "Building cool stuff",
  "updates": [
    {"id": "uuid", "project": "myapp", "content": "Added dark mode", "created_at": "2025-01-25T10:30:00Z"}
  ]
}
```

### GET /api/global

Get recent updates from everyone. Supports pagination.

**Query params:** `?limit=10&offset=0` (max limit: 50)

**Response:**
```json
{
  "updates": [
    {"id": "uuid", "slug": "brandon", "project": "myapp", "content": "Added dark mode", "created_at": "..."}
  ],
  "hasMore": true,
  "offset": 0,
  "limit": 10
}
```

### DELETE /api/delete/[slug]

Delete the most recent post. GET to preview, DELETE to confirm.

**Headers:**
```
Authorization: Bearer TOKEN
```

**GET Response:**
```json
{
  "success": true,
  "post": {"project": "myapp", "content": "Added dark mode", "created_at": "..."}
}
```

**DELETE Response:**
```json
{
  "success": true,
  "deleted": {"project": "myapp", "content": "Added dark mode", "created_at": "..."}
}
```

### POST /api/recover

Request a recovery code via email.

**Request:**
```json
{"email": "brandon@email.com"}
```

**Response (always generic to prevent enumeration):**
```json
{"success": true, "message": "If an account with this email exists, a recovery code has been sent."}
```

### POST /api/recover/verify

Verify a recovery code and get a new token.

**Request:**
```json
{"email": "brandon@email.com", "code": "123456"}
```

**Response:**
```json
{"success": true, "slug": "brandon", "token": "new-token-here"}
```

Recovery codes expire in 15 minutes. Max 5 failed attempts before code is invalidated.

### GET /api/stats

Platform statistics.

**Response:**
```json
{"totalCoders": 42, "totalPosts": 350, "postsToday": 12}
```

### GET /api/active

Top 5 most active feeds in the past 7 days.

**Response:**
```json
{"active": [{"slug": "brandon", "postCount": 15}]}
```

### GET /api/discover

3 random feeds with posts for discovery.

**Response:**
```json
{"profiles": [{"slug": "brandon", "latestProject": "myapp", "latestContent": "Added dark mode", "postCount": 10}]}
```

### GET /api/health

Health check.

**Response:**
```json
{"status": "healthy", "database": "connected", "latency_ms": 12, "timestamp": "..."}
```

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
- Each project gets its own auto-assigned color
- Clean timeline view

### /guide

- How to install and use Clawding
- Command reference

### /feed

- Full global feed page

---

## Security

- Hash tokens with bcrypt
- Never return token_hash
- Sanitize all content (max 500 chars, control chars removed)
- Rate limit: 50 posts/day per feed
- Rate limit claims: 5/hour per IP
- Rate limit checks: 30/minute per IP
- Rate limit recovery: 5/hour per IP, 3/hour per email
- HTTPS (Vercel default)
- Recovery codes hashed before storage, 15-min TTL, max 5 attempts

---

## Deploy

1. Create Neon project
2. Set DATABASE_URL env var
3. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
4. Set RESEND_API_KEY env var
5. Deploy to Vercel
6. Done

---

## Future (not MVP)

- Coding activity heatmap on profile pages (GitHub-style contribution grid)
- X auto cross-post (tweet every Clawding update from official account)
- Streak system (consecutive days of posting, shown on profiles)
- RSS feeds (`/[slug]/rss` endpoint)
- Embeddable badge/widget for GitHub READMEs
- Daily/weekly community digest page
- Project pages (group posts across all users by project name)
