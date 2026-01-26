import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('base64url').slice(0, length)
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10)
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash)
}

const RESERVED_SLUGS = [
  'api', 'admin', 'settings', 'i', 'skill', 'login', 'logout', 'signup',
  'register', 'auth', 'oauth', 'callback', 'webhook', 'webhooks', 'feed',
  'feeds', 'global', 'check', 'claim', 'post', 'delete', 'update', 'updates',
  'user', 'users', 'profile', 'profiles', 'help', 'about', 'terms', 'privacy',
  'static', 'assets', 'public', 'src', 'app', 'lib', 'components', 'health',
  'guide', 'docs', 'blog'
]

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: 'Slug is required' }
  }
  if (slug.length < 3 || slug.length > 20) {
    return { valid: false, error: 'Slug must be 3-20 characters' }
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' }
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: 'This username is reserved' }
  }
  return { valid: true }
}

export function sanitizeContent(content: string): string {
  // Remove control characters and null bytes, but don't HTML-escape
  // React handles XSS protection automatically when rendering
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 500)
}

export function sanitizeProjectName(name: string): string {
  return name
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 100)
}

export function validateXHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle) {
    return { valid: true }
  }
  const cleaned = handle.startsWith('@') ? handle.slice(1) : handle
  if (cleaned.length === 0) {
    return { valid: false, error: 'X handle cannot be empty' }
  }
  if (cleaned.length > 15) {
    return { valid: false, error: 'X handle must be 15 characters or fewer' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
    return { valid: false, error: 'X handle can only contain letters, numbers, and underscores' }
  }
  return { valid: true }
}

export function cleanXHandle(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1) : handle
}

export function validateWebsiteUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: true }
  }
  if (url.length > 200) {
    return { valid: false, error: 'Website URL must be 200 characters or fewer' }
  }
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'Website URL must start with https://' }
  }
  try {
    new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  return { valid: true }
}

export function generateSuggestions(slug: string): string[] {
  const suffixes = ['dev', 'codes', 'builds', 'ships', '99', 'io', 'hq']
  return suffixes
    .map(suffix => `${slug}${suffix}`)
    .filter(s => s.length <= 20)
    .slice(0, 3)
}
