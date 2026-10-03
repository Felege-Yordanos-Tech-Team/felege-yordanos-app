<!--
  Felege Yordanos App — Pull Request
  Fill in every section. Be descriptive: a reviewer should understand WHAT
  changed, WHY it was needed, and HOW you verified it — without reading the diff.
  Delete any section that genuinely does not apply, and say why.
-->

## Summary

<!-- One or two sentences: what does this PR do, at a glance? -->

## Why this PR / The need

<!--
  What problem, gap, or request prompted this work? What was wrong or missing
  before? Link the issue(s) or discussion(s) this addresses.
  e.g. "Closes #12", "Part of the desktop-layout effort".
-->

## What changed

### ✨ New features

<!-- Bullet each new capability. Reference the commit that adds it. -->
<!-- e.g. - Recurring events (weekly/biweekly/monthly) — abc1234 -->

### 🐛 Fixes

<!-- Bullet each fix: what was broken, and what fixes it. Reference the commit. -->
<!-- e.g. - Dialog missing a11y title caused console errors — def5678 -->

### 💄 / ⚡️ / 🔧 Other (style, perf, chore, refactor)

<!-- Styling, performance, tooling, or housekeeping changes. Reference commits. -->

## Database & migrations

<!--
  Did you change libs/db/src/schema? List the new migration file(s) in
  libs/db/migrations and say whether existing rows are affected.
  Write "None" if this PR touches no schema.
-->

## Permissions

<!--
  Who can see or change what this PR touches? Name the function(s) from
  apps/web/lib/permissions.ts you used or added, and confirm every page and
  server action you added checks it. Write "None" if no data access changed.
-->

## How to test / verification

<!--
  Steps a reviewer can follow to confirm this works, plus what you already
  verified (manual, Playwright, build, lint). Note anything you could NOT test.
-->

## Screenshots / recordings

<!-- Before/after for any UI change. Mobile + desktop where both are affected. -->

## Checklist

- [ ] `pnpm check` passes locally (lint, typecheck, build)
- [ ] Phone and desktop layouts both checked (where applicable)
- [ ] Every new page and server action checks permissions (`lib/permissions.ts`)
- [ ] Schema change has a migration (`pnpm db:generate`) (or no schema change)
- [ ] No secrets, real member data or `.env.local` committed
- [ ] Docs / CLAUDE.md updated if behaviour or architecture changed
- [ ] PR targets `dev` (only maintainers open `dev` -> `main` release PRs)
