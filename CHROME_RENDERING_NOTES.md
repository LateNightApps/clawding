# Chrome Scroll Rendering Bug - Reference Notes

Documented Jan 26, 2026. Refer to this if Chrome scroll glitches resurface when adding features to the homepage.

---

## The Problem

On Chrome (not Safari), fast scrolling on the homepage causes white flashes, layout corruption, and elements jumping. The page "locks up" visually. Safari handles the same page fine. The issue is worse on Vercel production than localhost due to HTML streaming from serverless functions.

## Root Causes (in order of impact)

### 1. GPU Compositor Layers (FIXED - biggest impact)

The crab SVG has CSS animations (`crab-wave`, `crab-wobble`, `crab-float`, `crab-pinch`) and the title uses a CSS gradient text effect. Neither was promoted to its own GPU compositor layer, so Chrome was doing **full-page repaints** on every animation frame during scroll.

**Fix:** Added `style={{ willChange: 'transform' }}` to the wrapper `<div>` of the crab and the `<h1>` title in `app/page.tsx`:

```tsx
<div className="mb-4 flex justify-center" style={{ willChange: 'transform' }}>
  <CrabMascot size={140} />
</div>

<h1 className="..." style={{ willChange: 'transform' }}>
```

**Why wrapper divs:** Putting `will-change` on the SVG element itself or on `.crab-animated` didn't help. It needs to be on the containing div that establishes the layer.

**What NOT to use:**
- `will-change: contents` - tells Chrome to watch for content changes, makes things worse
- `content-visibility: auto` - collapsed the crab to zero size
- `contain: layout style paint` - didn't help on the SVG itself

### 2. loading.tsx Skeleton Swap (FIXED - removed permanently)

ANY `app/loading.tsx` file causes Chrome to repaint the entire page when the skeleton is swapped for real content. This was tested with:
- The original skeleton (30+ `animate-pulse` elements) - broke immediately
- A lightweight skeleton (3 static blocks, zero animations) - still broke on simple scroll

**The swap itself is the problem, not the skeleton content.** When Next.js streams the page and replaces the Suspense fallback, Chrome's compositor gets overwhelmed by the DOM replacement.

**Fix:** Deleted `app/loading.tsx` entirely. The page has no loading skeleton.

### 3. Client Component Hydration on Vercel Streaming (FIXED - current workaround)

`<GlobalFeed>` is a `'use client'` component that wraps the homepage feed with Supabase realtime subscriptions. On Vercel, `force-dynamic` pages are streamed as HTML chunks from serverless functions. When Chrome receives streamed HTML and then hydrates client components, the combination triggers compositor repaint storms.

**Fix:** Replaced `<GlobalFeed initialUpdates={updates} />` with server-rendered `<UpdateCard>` components directly in the page:

```tsx
<div className="divide-y divide-border">
  {updates.map(u => (
    <UpdateCard key={u.id} slug={u.slug} project={u.project} ... showSlug />
  ))}
</div>
```

**Trade-off:** The homepage feed does not auto-update in realtime. Users must refresh the page to see new posts. The `/feed` page still has the full realtime GlobalFeed component.

**This is the main area of concern for future work.** If we want to bring back realtime on the homepage, we need to solve the streaming + hydration issue first (see "Future Solutions" below).

### 4. White Compositor Tiles (FIXED)

When Chrome can't paint fast enough, it shows unpainted compositor tiles in the default color (white). On a dark-themed site, this creates visible white flashes.

**Fix:** Inline dark backgrounds on body and the flex-1 content div in `app/layout.tsx`:

```tsx
<body className="min-h-screen flex flex-col" style={{ background: '#050810' }}>
  <div className="flex-1" style={{ background: '#050810' }}>
```

Also added to `globals.css`:
```css
html { background: #050810; }
```

The inline `style` is needed because CSS class-based backgrounds may not be painted in time for compositor tiles.

### 5. Next.js Link Client-Side Navigation (FIXED)

`<Link>` components do SPA-style client-side navigation. When navigating away and pressing the browser back button, Chrome re-renders the page client-side which triggered the same compositor issues.

**Fix:** Changed all `<Link>` tags to `<a>` tags on the homepage and related components:
- `app/page.tsx` (guide link, feed link)
- `components/ActiveCoders.tsx`
- `components/DiscoverProfiles.tsx`
- `components/UpdateCard.tsx`

Full page reloads on navigation avoid the client-side re-render issue.

### 6. Multiple RelativeTime Client Boundaries (MITIGATED)

Each `<RelativeTime>` is a `'use client'` component. With 10 feed items, that's 10 hydration boundaries. Reducing these improved Chrome scroll performance, but the GPU layer fix (root cause #1) was the primary solution.

**Current state:** RelativeTime is still used (it renders an absolute date server-side, then swaps to relative time after hydration). The GPU layer fix makes this tolerable.

---

## What Was Tested and Didn't Work

| Approach | Result |
|----------|--------|
| ISR (`export const revalidate = 60`) | Broke locally on page load. On Vercel (Chrome), still an "absolute hot mess" |
| `loading.tsx` with minimal skeleton (3 static blocks) | Still broke on simple scroll |
| `GlobalFeed` without realtime subscription | Still broke (hydration itself is the problem) |
| `GlobalFeed` with server-rendered dates (no RelativeTime) | Still broke |
| `content-visibility: auto` on crab | Collapsed to zero size |
| `will-change: contents` | Made things worse |
| `contain: layout style paint` on `.crab-animated` | No effect |

---

## Current Working Configuration

All of these must remain in place:

1. **`will-change: transform`** on crab wrapper div and h1 title (`app/page.tsx`)
2. **No `app/loading.tsx`** - deleted permanently
3. **Server-rendered feed** on homepage (no GlobalFeed client component)
4. **`<a>` tags** instead of `<Link>` on all homepage navigation
5. **Inline `background: #050810`** on body and flex-1 div (`app/layout.tsx`)
6. **`html { background: #050810 }`** in `globals.css`
7. **`export const dynamic = 'force-dynamic'`** on homepage

---

## Remaining Edge Case

Extremely aggressive scrolling (rapidly up and down 25+ times) can still trigger a mild version of the glitch on Chrome. This is a Chrome compositor limitation under extreme stress and is acceptable for production.

---

## How to Diagnose if It Comes Back

1. **Chrome DevTools > More Tools > Rendering > Paint Flashing**: Green rectangles show repaints. Full-page green on every scroll frame = something is forcing full-page repaints.
2. **Chrome DevTools > Rendering > Layout Shift Regions**: Blue rectangles show layout shifts during scroll.
3. **Binary search method**: Remove sections of the homepage one at a time to isolate which component triggers the issue. The order we used: GlobalFeed > loading.tsx > RelativeTime > ActiveCoders > DiscoverProfiles > StatsBar > hero.
4. **Test on localhost vs Vercel**: If it works locally but breaks on Vercel, the issue is related to HTML streaming from serverless functions (force-dynamic) or edge caching behavior.
5. **Test Chrome vs Safari**: Safari's compositor handles streaming HTML much better. If Safari is fine but Chrome breaks, it's a compositor tile/repaint issue.

---

## Rules for Adding Features to the Homepage

Based on these findings, follow these rules when adding new sections or components to the homepage:

1. **Minimize client components.** Every `'use client'` boundary is a hydration point. Prefer server-rendered content. If you need interactivity, keep the client component small and contained.
2. **No loading.tsx.** Do not add `app/loading.tsx` back. If you need loading states, handle them inside individual client components, not at the page level.
3. **No CSS animations without GPU layers.** Any element with CSS animations (keyframes, transitions that run continuously) must have `will-change: transform` on its wrapper div to promote it to a GPU compositor layer.
4. **Use `<a>` tags, not `<Link>`.** On the homepage, use standard anchor tags for navigation to avoid client-side re-render issues with browser back button.
5. **Keep dark inline backgrounds.** The `style={{ background: '#050810' }}` on body and flex-1 div in layout.tsx prevents white compositor tile flashes. Do not remove these.
6. **Test on Chrome on Vercel.** Always test the deployed Vercel build on Chrome. Localhost behaves differently because it doesn't stream HTML the same way.
7. **Avoid many small client components.** If you need 10+ instances of a client component (like RelativeTime in feed items), consider whether it can be server-rendered or consolidated into a single client boundary.

---

## Future Solutions to Explore

If we want to bring back realtime feed updates on the homepage:

1. **Single client wrapper with server-rendered children**: Render all UpdateCards server-side, wrap them in a thin client component that only handles polling/refetch, and use `dangerouslySetInnerHTML` or React Server Components streaming to swap content without full hydration.
2. **Polling via meta refresh or full-page reload**: Add a `<meta http-equiv="refresh" content="60">` to auto-refresh the page every 60 seconds. Simple but effective.
3. **After-load client fetch**: Render the page fully server-side, then have a small client component that fetches new posts via `/api/global` after 30 seconds and appends them to the top (without re-rendering the whole feed).
4. **Static generation with on-demand revalidation**: Use `revalidatePath('/')` from API routes when new posts are created, rather than time-based ISR. This gives static HTML (no streaming) with near-realtime updates.
