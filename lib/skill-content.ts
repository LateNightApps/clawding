export const skillContent = `---
name: clawding
description: Post updates about what you're building with Claude to your public Clawding feed
---

# Clawding

Clawding uses a config file at ~/.config/clawding.json to store your feeds and tokens.

## Config file format

\`\`\`json
{
  "feeds": {
    "slug-name": "token-value"
  },
  "projects": {
    "folder-name": "slug-name"
  },
  "default": "slug-name"
}
\`\`\`

- "feeds": maps feed slugs to their auth tokens
- "projects": maps project folder names to feed slugs (so the right feed is auto-selected)
- "default": the feed to use when no project match is found

---

## Step 1: Load config

1. Try to read ~/.config/clawding.json
2. If the file exists and has valid JSON with a "feeds" object that has at least one entry, config is loaded. Proceed to Step 2.
3. If the file does not exist or is empty or has no feeds, check for legacy env vars:
   - If CLAWDING_TOKEN and CLAWDING_SLUG are set, migrate them:
     a. Create ~/.config directory if it doesn't exist
     b. Write ~/.config/clawding.json with: {"feeds": {"$CLAWDING_SLUG": "$CLAWDING_TOKEN"}, "projects": {}, "default": "$CLAWDING_SLUG"}
     c. Remove CLAWDING_TOKEN and CLAWDING_SLUG from ~/.claude/settings.json env object
     d. Tell user: "Migrated your Clawding config to ~/.config/clawding.json"
     e. Proceed to Step 2.
   - If no legacy env vars either, this is a first-time setup. Go to "First time setup" below.

---

## Step 2: Determine the command

Parse what the user typed after /clawding:

- "/clawding" (no args) → Go to "Post an update"
- "/clawding new" → Go to "Add a new feed"
- "/clawding feeds" → Go to "List feeds"
- "/clawding link FEEDNAME" → Go to "Link project to feed"
- "/clawding default FEEDNAME" → Go to "Change default feed"
- "/clawding delete" → Go to "Delete last post"
- "/clawding profile" → Go to "Update profile"
- "/clawding describe SLUG DESCRIPTION" → Go to "Set feed description"
- "/clawding email EMAIL" → Go to "Set recovery email"
- "/clawding recover" → Go to "Recover account"
- "/clawding @FEEDNAME any message here" → Go to "Post an update" with feed forced to FEEDNAME and message set to everything after @FEEDNAME
- "/clawding any other text" → Go to "Post an update" with message set to the text

---

## First time setup

1. Welcome them: "Welcome to Clawding! Let's get you set up."
2. Ask: "What name do you want for your feed?"
3. POST to https://clawding.app/api/check with {"slug": "NAME"} to check availability
4. If taken, show alternatives from the response and ask again
5. Once they pick an available one, ask: "What's your email? (for token recovery if you ever lose it)"
   - If they skip, warn: "No worries — but if you lose your token, there's no way to recover it. You can always set one later with /clawding email YOUR_EMAIL"
6. POST to https://clawding.app/api/claim with {"slug": "NAME", "email": "EMAIL"} (omit email field if they skipped)
7. Get back the token from the response
8. Create ~/.config directory if it doesn't exist
9. Write ~/.config/clawding.json with: {"feeds": {"NAME": "TOKEN"}, "projects": {}, "default": "NAME"}
10. Confirm: "Your feed is at clawding.app/NAME"
    - If they provided an email: "Recovery email saved! If you ever lose your token, run /clawding recover."
11. Then ask what they want to post, or offer to summarize what was done in this session. Follow the "Post an update" flow.
12. After the first post is confirmed, show available commands:
    - "/clawding                  Post an update (or I'll summarize your session)"
    - "/clawding Fixed the bug    Post with a custom message"
    - "/clawding profile          Set your description, X handle, or website"
    - "/clawding delete           Delete your last post"
    - "/clawding feeds            See all your feeds"
    - "/clawding new              Create another feed"
    - "/clawding recover          Recover if you lose your token"

---

## Post an update

1. Resolve which feed to post to (in this order):
   a. If a feed was forced via @FEEDNAME syntax, use that feed. If that slug is not in the config feeds, tell the user and stop.
   b. Get the current project folder name (basename of the working directory or repo name).
   c. Check config "projects" map — if the folder name has a mapping, use that feed.
   d. Check if the folder name exactly matches a feed slug in the config — if so, use that feed.
   e. If there is only one feed in the config, use it.
   f. If there are multiple feeds and no match, ask the user which feed to use. Show a numbered list of their feeds. After they pick, save the mapping to the "projects" object in ~/.config/clawding.json so they are never asked again for this project. Tell them: "Linked [folder-name] → [feed-slug]. This project will auto-post to clawding.app/[feed-slug] from now on."

2. Get the message:
   a. If a message was provided (from args), use it.
   b. If no message, look at the conversation and write a 1-2 sentence summary.
      - Write for humans: "Added user login" not "Implemented OAuth2 authentication flow"

3. Get the project name from the current folder or repo name.

4. Show the user what will be posted:
   - "Ready to post to clawding.app/SLUG"
   - "Project: PROJECT_NAME"
   - "Update: MESSAGE"
   - Options:
     1. Post this
     2. Write my own (let them type a custom message)
     3. Cancel

5. POST to https://clawding.app/api/post/SLUG:
   - Header: Authorization: Bearer TOKEN (from config feeds for this slug)
   - Header: Content-Type: application/json
   - Body: {"project": "PROJECT_NAME", "update": "MESSAGE"}

6. Confirm: "Posted! View at clawding.app/SLUG"

---

## Add a new feed

1. Ask: "What name do you want for your new feed?"
2. POST to https://clawding.app/api/check with {"slug": "NAME"} to check availability
3. If taken, show alternatives from the response and ask again
4. Once they pick an available one, POST to https://clawding.app/api/claim with {"slug": "NAME"}
5. Get back the token
6. Read ~/.config/clawding.json, add the new slug and token to the "feeds" object, write it back
7. Confirm: "Added feed: clawding.app/NAME"
8. Show all their feeds: "Your feeds: SLUG1, SLUG2 (default: DEFAULT)"
9. Ask if they want to link the current project to this new feed. If yes, save the mapping to the "projects" object.

---

## List feeds

1. Read the config
2. Show all feeds with their URLs:
   - "Your feeds:"
   - For each feed: "  - clawding.app/SLUG" (mark which is default)
3. If there are project mappings, show them:
   - "Project mappings:"
   - For each mapping: "  - FOLDER → SLUG"

---

## Link project to feed

1. The FEEDNAME is the argument after "link"
2. If FEEDNAME is not in the config feeds, tell the user that feed doesn't exist and show their feeds
3. Get the current project folder name
4. Read ~/.config/clawding.json, set projects[folder-name] = FEEDNAME, write it back
5. Confirm: "Linked [folder-name] → clawding.app/FEEDNAME"

---

## Change default feed

1. The FEEDNAME is the argument after "default"
2. If FEEDNAME is not in the config feeds, tell the user that feed doesn't exist and show their feeds
3. Read ~/.config/clawding.json, set "default" to FEEDNAME, write it back
4. Confirm: "Default feed set to clawding.app/FEEDNAME"

---

## Delete last post

1. Resolve which feed to use (same logic as "Post an update" step 1, but without a forced feed)
2. GET https://clawding.app/api/delete/SLUG:
   - Header: Authorization: Bearer TOKEN
3. If no posts exist, tell them: "No posts to delete on clawding.app/SLUG."
4. Show the post:
   - "Your most recent post on clawding.app/SLUG:"
   - "Project: PROJECT_NAME"
   - "Update: CONTENT"
   - "Posted: TIME"
5. Ask: "Delete this post? (yes/no)"
6. If yes, DELETE https://clawding.app/api/delete/SLUG:
   - Header: Authorization: Bearer TOKEN
7. Confirm: "Deleted!"

---

## Update profile

1. Resolve which feed to update (same logic as "Post an update" step 1, but without a forced feed)
2. Ask for their X handle (optional — they can skip by saying "skip" or "none"):
   - "What's your X handle? (optional, press enter to skip)"
3. Ask for their website URL (optional — they can skip):
   - "What's your website URL? (optional, press enter to skip, must start with https://)"
4. PATCH to https://clawding.app/api/profile/SLUG:
   - Header: Authorization: Bearer TOKEN
   - Header: Content-Type: application/json
   - Body: include only the fields they provided, e.g. {"x_handle": "handle"} or {"website_url": "https://example.com"} or both
   - To clear a field, send it as empty string: {"x_handle": ""}
5. Confirm what was saved: "Profile updated for clawding.app/SLUG"
   - Show what was set (e.g. "X: @handle" and/or "Website: example.com")

---

## Set feed description

1. Parse the arguments: SLUG is the first argument after "describe", DESCRIPTION is everything after SLUG.
2. If SLUG is not in the config feeds, tell the user: "You don't own a feed called SLUG" and show their feeds.
3. If no DESCRIPTION provided, ask: "What's the one-liner description for clawding.app/SLUG?"
4. PATCH to https://clawding.app/api/profile/SLUG:
   - Header: Authorization: Bearer TOKEN (use SLUG's token from config)
   - Header: Content-Type: application/json
   - Body: {"description": "DESCRIPTION"}
5. Confirm: "Description set for clawding.app/SLUG"
   - Show: "Description: DESCRIPTION"

To clear a description: \`/clawding describe SLUG ""\` (empty string)
- PATCH with body: {"description": ""}
- Confirm: "Description cleared for clawding.app/SLUG"

---

## Set recovery email

1. The EMAIL is the argument after "email"
2. Resolve which feed to update (same logic as "Post an update" step 1, but without a forced feed)
3. PATCH to https://clawding.app/api/profile/SLUG:
   - Header: Authorization: Bearer TOKEN
   - Header: Content-Type: application/json
   - Body: {"email": "EMAIL"}
4. If success, confirm: "Recovery email set for clawding.app/SLUG"
   - "If you ever lose your token, run /clawding recover to get a new one."
5. To clear: /clawding email "" → sends {"email": ""}

---

## Recover account

1. Ask the user: "What email did you set for recovery?"
2. POST to https://clawding.app/api/recover with {"email": "EMAIL"}
3. Tell the user: "If that email is on file, a 6-digit code was sent. Check your inbox. The code expires in 15 minutes."
4. Ask: "Enter the 6-digit code from your email:"
5. POST to https://clawding.app/api/recover/verify with {"email": "EMAIL", "code": "CODE"}
6. If success, get back {slug, token} from the response
7. Read ~/.config/clawding.json, update (or add) the slug's token in the "feeds" object, write it back
8. Confirm: "Recovered! Your feed: clawding.app/SLUG"
9. If the code is wrong, tell them and let them try again (up to 5 attempts, then the code is invalidated and they must request a new one)

---

## Error handling

- If the API returns 401 unauthorized, tell them their token may be invalid. Offer to recover with /clawding recover (if they set a recovery email) or reclaim with /clawding new.
- If rate limited (429), tell them they have hit the 50 posts/day limit.
- If the config file is corrupted or unreadable JSON, tell the user and offer to reset it by running setup again. Back up the old file first.
- If any other error, show the error message from the API response.

---

## Important rules

- Always read the config file fresh before writing to it (never cache across operations).
- When writing the config file, preserve all existing data — only modify the specific field being changed.
- Never display tokens to the user.
- The guide is at clawding.app/guide if the user needs help.`
