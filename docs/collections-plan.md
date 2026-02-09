# Feature Plan: Clawding — Neon Migration + Collections

Created: 2026-02-07

## Vision
- **App:** Clawding (existing app at ~/Desktop/apps/clawding)
- **Migration:** Supabase → Neon + Drizzle ORM
- **Feature:** Collections — parent/child feed nesting
- **Why:** Unify all apps on Neon, add Drizzle for type-safe queries, then build collections on the new data layer

## Scope

### Migration (Supabase → Neon + Drizzle)
Every file that imports `@/lib/supabase` gets rewritten to use Drizzle ORM.

### Collections (new feature on top)
Parent/child feed nesting with collection pages, child badges, homepage de-duplication.

## File Inventory — What Changes

### NEW FILES (create)
| File | Purpose | Size |
|------|---------|------|
| `lib/db/schema.ts` | Drizzle schema (feeds + updates tables, with parent_id + description) | ~50 lines |
| `lib/db/index.ts` | Neon + Drizzle client setup | ~15 lines |
| `app/api/nest/[slug]/route.ts` | POST — set/remove feed parent | ~60 lines |
| `drizzle.config.ts` | Drizzle Kit config for migrations | ~10 lines |

### REPLACE FILES (rewrite entirely)
| File | Current | New |
|------|---------|-----|
| `lib/supabase.ts` | DELETE — no longer needed | — |
| `lib/supabase-browser.ts` | DELETE — unused | — |
| `lib/auth.ts` | Supabase query → Drizzle query | ~40 lines |

### MODIFY FILES (Supabase → Drizzle queries + Collections)
| File | Changes |
|------|---------|
| `app/api/check/route.ts` | Replace supabase.from().select() with Drizzle select |
| `app/api/claim/route.ts` | Replace supabase.from().insert() with Drizzle insert |
| `app/api/post/[slug]/route.ts` | Replace all supabase queries with Drizzle |
| `app/api/profile/[slug]/route.ts` | Replace queries + add `description` field support |
| `app/api/feed/[slug]/route.ts` | Replace queries + add parent/children/childUpdates to response |
| `app/api/global/route.ts` | Replace queries + add `parent_slug` to response |
| `app/api/delete/[slug]/route.ts` | Replace all supabase queries with Drizzle |
| `app/api/health/route.ts` | Replace connectivity check with Drizzle sql`` |
| `app/api/stats/route.ts` | Replace count queries with Drizzle |
| `app/api/active/route.ts` | Replace queries with Drizzle |
| `app/api/discover/route.ts` | Replace queries with Drizzle |
| `app/[slug]/page.tsx` | Replace queries + add collection view (if has children) + child badge (if has parent) |
| `app/page.tsx` | Replace queries + show parent/child format in feed |
| `app/feed/page.tsx` | No changes (client-side, calls /api/global which handles the change) |
| `components/UpdateCard.tsx` | Add `parentSlug` prop for "Parent / child" display |
| `package.json` | Remove @supabase/supabase-js, add @neondatabase/serverless + drizzle-orm + drizzle-kit |
| `.env.local` | Remove SUPABASE vars, add DATABASE_URL |

### UNTOUCHED FILES (no supabase imports, no changes needed)
- `lib/utils.ts` — pure utility functions, no DB calls
- `lib/api-utils.ts` — ApiError, rateLimit, etc. No DB calls
- `components/CrabMascot.tsx`, `RelativeTime.tsx`, `InstallCommand.tsx`, `ActiveCoders.tsx`, `DiscoverProfiles.tsx`, `StatsBar.tsx`
- `app/layout.tsx`, `app/error.tsx`, `app/not-found.tsx`
- `app/guide/page.tsx`
- `app/i/route.ts`, `app/skill.md/route.ts`

## Drizzle Schema (lib/db/schema.ts)

```typescript
import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const feeds = pgTable('feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull(),
  tokenHash: text('token_hash').notNull(),
  xHandle: text('x_handle'),
  websiteUrl: text('website_url'),
  description: text('description'),           // NEW: collection card description
  parentId: uuid('parent_id'),                 // NEW: self-ref for collections
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('idx_feeds_slug').on(table.slug),
  index('idx_feeds_parent_id').on(table.parentId),
])

export const updates = pgTable('updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  projectName: text('project_name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_updates_feed_id').on(table.feedId),
  index('idx_updates_created_at').on(table.createdAt),
])
```

## DB Client (lib/db/index.ts)

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

## Collections API

### POST /api/nest/[slug]
- Auth: Bearer token (must own [slug])
- Body: `{ "parent": "parent-slug" }` or `{ "parent": null }`
- Validates: parent exists, parent is not itself a child, [slug] has no children
- Updates feeds.parent_id

### PATCH /api/profile/[slug] — add description
- Body (optional): `{ "description": "text" }`
- Max 200 chars. Empty string clears.

### GET /api/feed/[slug] — enhanced response
- If has parent: include `parent: { slug, description }`
- If has children: include `children: [{ slug, description, lastPostAt, postCount }]`
- If has children: include `childUpdates` (aggregated, limit 50)

### GET /api/global — enhanced response
- Each update includes `parent_slug` if feed has a parent

## UI Changes

### /[slug] — Collection View
If feed has children: show showcase cards grid + aggregated feed below
If feed has parent: show "Part of [parent]" badge at top

### Homepage — Parent/Child Format
Child posts render as "Parent / child: content" via UpdateCard parentSlug prop

## Data Migration

1. Export feeds + updates from Supabase as JSON via API
2. Insert into Neon via Drizzle
3. Preserve all IDs, timestamps, token hashes

## Environment Variables

Remove:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Add:
- `DATABASE_URL=postgresql://user:password@host/database?sslmode=require`

## Dependencies

Remove: `@supabase/supabase-js`
Add: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`

## Build Order (for /parallel)

### Phase 1: Foundation (sequential, must be first)
- Install deps (npm install)
- Create `lib/db/schema.ts` + `lib/db/index.ts` + `drizzle.config.ts`
- Run `drizzle-kit push` to create tables in Neon
- Export data from Supabase, import into Neon
- Delete `lib/supabase.ts` + `lib/supabase-browser.ts`
- Rewrite `lib/auth.ts` to use Drizzle
- Update `.env.local` + `package.json`

### Phase 2: Backend Worker (parallel)
Rewrite ALL API routes from Supabase to Drizzle:
- `app/api/check/route.ts`
- `app/api/claim/route.ts`
- `app/api/post/[slug]/route.ts`
- `app/api/profile/[slug]/route.ts` (+ add description)
- `app/api/feed/[slug]/route.ts` (+ add parent/children)
- `app/api/global/route.ts` (+ add parent_slug)
- `app/api/delete/[slug]/route.ts`
- `app/api/health/route.ts`
- `app/api/stats/route.ts`
- `app/api/active/route.ts`
- `app/api/discover/route.ts`
- NEW: `app/api/nest/[slug]/route.ts`

### Phase 3: Frontend Worker (parallel with Phase 2)
Rewrite pages + components:
- `app/page.tsx` (homepage — Drizzle queries + parent/child format)
- `app/[slug]/page.tsx` (feed page — Drizzle queries + collection view + child badge)
- `components/UpdateCard.tsx` (add parentSlug prop)

### Phase 4: CLI Skill (after Phase 2)
- Update `~/.claude/skills/clawding/SKILL.md` — add nest + describe commands

### Phase 5: Build Check + Verify
- `npm run build`
- Run auditor agents
