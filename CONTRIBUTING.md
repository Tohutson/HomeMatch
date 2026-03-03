# Contributing to HomeMatch

This document is our shared source of truth for how we collaborate on this codebase. Please read it before opening your first pull request.

---

## Table of Contents

- [Branch Strategy](#branch-strategy)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Merge Conflict Guidance](#merge-conflict-guidance)

---

## Branch Strategy

We use three levels of branches:

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only. Never commit directly to this branch. |
| `dev` | Integration branch. All feature work merges here first. Should always be in a working state. |
| `feature/*`, `bug/*`, etc. | Short-lived branches for individual tasks. Branched off `dev`, merged back into `dev` via PR. |

**The flow is:** your branch → `dev` → `main`

`main` is only updated from `dev` when the team agrees a milestone is stable (e.g. before a submission or demo).

---

## Branch Naming

Always branch off `dev` (not `main`) for day-to-day work.

Use one of the following prefixes:

| Prefix | When to use |
|---|---|
| `feature/` | New functionality |
| `bug/` | Fixing a broken or incorrect behaviour |
| `chore/` | Maintenance tasks — dependency updates, config changes, refactoring |
| `docs/` | Documentation only changes |

Follow the prefix with a short, lowercase, hyphen-separated description of the work.

**Examples:**
```
feature/property-search-filters
feature/map-view-integration
bug/listing-price-not-displaying
chore/update-eslint-config
docs/update-setup-instructions
```

---

## Commit Messages

Keep commit messages short and descriptive. Write them in the **imperative mood** — as if completing the sentence *"This commit will…"*

```
# Good
Add property card component
Fix broken image URL on listing page
Update README with database setup steps

# Avoid
added stuff
fix
WIP
```

For more context, add an optional body after a blank line:

```
Fix broken image URL on listing page

The S3 bucket URL was missing a trailing slash, causing images
to 404 on the property detail view.
```

---

## Pull Requests

### Opening a PR

1. Make sure your branch is up to date with `dev` before opening a PR (see [Merge Conflict Guidance](#merge-conflict-guidance) below).
2. Open a PR from your branch **into `dev`**.
3. Fill out the PR description — at minimum include:
   - **What** the PR does
   - **How to test it** (if applicable)
   - Any relevant screenshots for UI changes

### Review Rules

- **1 approval** is required before merging a feature/bug/chore branch into `dev`.
- Don't approve your own PR.
- Try to review open PRs within **24 hours** so teammates aren't blocked.
- Use GitHub's **"Request changes"** if something needs fixing before merge, or **"Approve"** when it's good to go.

### Merging

- Use **"Squash and merge"** when merging feature branches into `dev` — this keeps the `dev` history clean.
- Delete the branch after merging.

---

## Merge Conflict Guidance


**Before opening a PR**, sync your branch with the latest `dev`:

```bash
git checkout dev
git pull origin dev
git checkout your-branch-name
git merge dev
```

Resolve any conflicts in your editor, then:

```bash
git add .
git commit -m "Merge dev into your-branch-name"
git push
```

**Tips for avoiding conflicts in the first place:**
- Pull from `dev` regularly, especially on long-running branches.
- Communicate with teammates if you're both editing the same files.
- Keep branches short-lived — the smaller the PR, the fewer the conflicts.

If you're stuck on a conflict, ask a teammate for help before force-pushing anything.