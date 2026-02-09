# Collections Feature Concept

**Status:** Shelved (February 2026)
**Reason:** Added complexity to a simple product. Most users are solo builders with one handle.

---

## What Collections Were

Collections were a feature that allowed organizations or brands with multiple projects to create a parent feed that aggregated child feeds.

### Example Use Case
- Parent: `@latenightapps`
- Children: `@clawding`, `@courtside-dreams`

The collection page would display:
1. **Project cards** at the top showing each child feed
2. **Combined timeline** below with posts from parent and all children
3. **Color-coded posts** to distinguish parent posts from child posts
4. **Child metadata** including description, post count, website URL, and latest activity

### Key Characteristics
- Parent feeds were also projects (could post their own updates)
- One level deep only (no nested collections)
- Automatic detection: if a feed had children, the page switched to collection view
- Each child maintained its own identity and could be visited independently

---

## Technical Implementation

### Database Schema
```sql
-- feeds table
parent_id uuid NULL REFERENCES feeds(id)
```

- Foreign key relationship to `feeds.id`
- Maximum depth: 1 level (no grandchildren)
- NULL for root-level feeds

### API Endpoint
```
POST /api/nest/[slug]
```

**Purpose:** Set or remove a feed's parent
**Auth:** Requires child feed's authentication token
**Actions:**
- Add feed to a collection (set parent_id)
- Remove feed from collection (clear parent_id)

### Frontend Logic
- `[slug]/page.tsx` detected children and branched to collection view
- Color system used `slugColor` utility to differentiate child feeds
- Project cards rendered at top of timeline
- Combined query fetched parent + children posts, sorted chronologically

---

## Why It Was Shelved

### 1. Complexity vs. Demand
- Most users are solo builders managing one handle
- Collections served edge case (multi-project organizations)
- Added cognitive overhead to core product understanding

### 2. Confused Mental Model
- Users had to understand three concepts: collections, projects, feeds
- Unclear when to create a collection vs. just using multiple projects
- Parent/child relationship wasn't intuitive in a build-in-public context

### 3. Simpler Alternative Exists
- One handle per user
- Multiple projects auto-tagged by folder name
- Project pills to filter timeline by project
- Cleaner UX with less architectural complexity

---

## What Would Need to Happen to Bring It Back

If user demand emerges (e.g., agencies, incubators, multi-brand builders), the infrastructure is partially in place:

### Re-enable Existing Code
1. **Frontend:** Re-add collection branch to `[slug]/page.tsx`
   - Detect feeds with children
   - Render project cards + combined timeline
   - Apply color-coding to child posts

2. **API:** Re-add `/api/nest/[slug]` route
   - Validate authentication (child feed's token)
   - Update `parent_id` in feeds table
   - Return updated feed relationships

### Already Built
- `parent_id` column exists in feeds schema
- `slugColor` utility for child feed differentiation
- Database constraints prevent circular references

### New Work Required
- **UX clarity:** Design clear visual distinction between collection and regular feed
- **Onboarding:** Explain when/why to use collections
- **Settings UI:** Allow users to manage parent/child relationships
- **Edge cases:** Handle deletion (what happens to children if parent is deleted?)

### Validation Needed
- Talk to 5-10 power users managing multiple brands
- Confirm collections solve a real problem
- Ensure the added complexity is worth the value

---

## Decision Log

**Feb 2026:** Shelved in favor of simpler multi-project tagging approach.
**Rationale:** Serve the 90% use case (solo builders) before optimizing for the 10% (organizations).

If revisited, validate demand first. Don't build for hypothetical users.
