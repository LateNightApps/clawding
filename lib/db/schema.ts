import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const feeds = pgTable('feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull(),
  tokenHash: text('token_hash').notNull(),
  xHandle: text('x_handle'),
  websiteUrl: text('website_url'),
  description: text('description'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('idx_feeds_slug').on(table.slug),
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
