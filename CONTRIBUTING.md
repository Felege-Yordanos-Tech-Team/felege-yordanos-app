# Contributing

Thanks for helping build the Felege Yordanos Sunday School app. This guide is for everyone on the team, whether this is your first project or your hundredth.

If anything here is unclear, ask in the team group. Asking early is always better than being stuck alone.

## 1. Set up your computer (once)

Follow **Getting Started** in the [README](README.md). You need Node 22, pnpm and Docker Desktop. When `pnpm dev` runs and you can sign in as `admin@felege.test` / `password123`, you are ready.

## 2. The workflow

```
pick an issue  ->  branch from dev  ->  small commits  ->  pull request into dev  ->  CI + review  ->  merge
```

1. **Pick an issue** on GitHub and assign yourself, so two people don't do the same work. New to the project? Start with an issue labeled `good first issue`.
2. **Create a branch from the latest `dev`** (`dev` is the default branch).
   Members of the GitHub organization push branches to this repo directly.
   Everyone else forks the repo and opens the pull request from their fork:
   ```bash
   git checkout dev
   git pull
   git checkout -b feat/12-songbook-search
   ```
   Names: `feat/<issue>-<short-name>` for features, `fix/...` for bugs, `chore/...` or `docs/...` for the rest.
3. **Commit in small steps.** We use [Conventional Commits](https://www.conventionalcommits.org/) with an emoji, for example
   `feat(songbook): ✨ add search by lyrics`. AI coding tools in this repo know the format (`.claude/skills/convential-commits.md`).
4. **Before you push, run:**
   ```bash
   pnpm check
   ```
   It runs lint, typecheck and a production build: the same checks CI runs.
5. **Open a pull request into `dev`** (never into `main`). Fill in the template. Add screenshots for any UI change, phone and desktop.
6. **CI must be green, and one teammate must approve.** Changes to security-sensitive files (auth, permissions, database schema, CI) also need a maintainer (see `.github/CODEOWNERS`).
7. **Merge** once approved. Delete your branch.

### Branches and environments

| Branch | What it is |
|---|---|
| `feat/*`, `fix/*`, ... | your work in progress |
| `dev` | integration branch, deploys automatically to **staging** (https://staging.felegeyordanos.org) |
| `main` | **production** (https://app.felegeyordanos.org), deploys automatically; only maintainers merge `dev` into `main` after testing on staging |

`dev` and `main` are locked: nobody can push to them directly. Every change arrives through a pull request that passes CI and has one approving review. Only maintainers can merge into `main`.

## 3. Rules that keep the app safe

These are not optional. Reviewers will ask for changes if they are missed.

- **Every page and every server action checks permissions** with a function from `apps/web/lib/permissions.ts`. Hiding a button is not security. If you need a new rule, add it there.
- **Never trust the browser.** Take the user from `requireUser()`, never from a form field. Re-load rows from the database before changing them.
- **Validate every input** in server actions with zod.
- **Database changes go through migrations.** Edit `libs/db/src/schema/`, run `pnpm db:generate`, commit the new file. Never edit a migration that is already merged. CI fails if you forget.
- **No secrets or real member data in git.** Use `.env.local` (git-ignored) and the seed data. Screenshots in issues and PRs must not show real people's details.
- **Client components never import `@felege-yordanos/db/server`.** Data is loaded on the server.

How a feature is built (pages, server actions, permissions) is described in [CLAUDE.md](CLAUDE.md) under "How Features Are Built". The songbook (`apps/web/app/(member)/songbook`, `apps/web/app/(admin)/admin/songs`) is the reference implementation: copy its patterns.

## 4. Definition of done

- [ ] It does what the issue asks, for the right roles only
- [ ] Works on a phone and on desktop
- [ ] `pnpm check` passes
- [ ] Tested by signing in as the relevant test accounts (member, dept head, admin)
- [ ] PR template filled in, with screenshots for UI changes

## 5. Using AI coding tools

AI tools (Claude Code and others) are welcome. `CLAUDE.md` gives them the project rules.

- **You are responsible for every line you submit.** Read the whole diff before you open a PR.
- Be able to explain your change in the review. If you can't, ask the AI to explain it to you first.
- Don't let AI tools change unrelated files, install new packages or edit migrations without a reason you can explain.

## 6. Reviewing a pull request

You don't need to be an expert to review. Check:

1. Does it do what the issue asks? Pull the branch and try it with the test accounts.
2. Do new pages and actions check permissions? Try as a role that should NOT have access.
3. Is it understandable? Ask questions in comments; that is part of reviewing.
4. Be kind and specific: suggest, don't command.

## 7. Getting help

- Stuck for more than 30 minutes? Post in the team group: what you tried, what you expected, the error message.
- Not sure how big a change should be? Smaller is better. Ask before starting anything that touches many files.
