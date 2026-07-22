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
  Any new/changed Supabase migrations or RLS policies? List the migration
  files and whether existing rows/one-off records are affected. Write "None"
  if this PR touches no schema.
-->

## How to test / verification

<!--
  Steps a reviewer can follow to confirm this works, plus what you already
  verified (manual, Playwright, build, lint). Note anything you could NOT test.
-->

## Screenshots / recordings

<!-- Before/after for any UI change. Mobile + desktop where both are affected. -->

## Reviewer checklist

- [ ] Builds locally (`npx nx build web`) and lint passes (`npx nx lint web`)
- [ ] Mobile and desktop layouts both verified (where applicable)
- [ ] No new console errors/warnings introduced
- [ ] Migrations are additive / backwards-compatible (or breaking change is called out above)
- [ ] Docs / CLAUDE.md updated if behavior or architecture changed
- [ ] Commit messages are descriptive and reference relevant issues
