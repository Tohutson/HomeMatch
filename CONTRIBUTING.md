# Contributing to HomeMatch

This guide defines the branch, commit, review, and merge workflow for HomeMatch.

## Branch Strategy

Use three branch levels:

| Branch | Purpose |
| --- | --- |
| `main` | Stable milestone code. Do not commit directly to this branch. |
| `dev` | Integration branch for feature work. Keep this branch in a working state. |
| `feature/*`, `bug/*`, `chore/*`, `docs/*` | Short-lived task branches created from `dev` and merged back through pull requests. |

Standard flow:

```text
task branch -> dev -> main
```

Update `main` from `dev` only when the team agrees the milestone is stable.

## Branch Naming

Create day-to-day branches from `dev`.

Use one of these prefixes:

| Prefix | Use case |
| --- | --- |
| `feature/` | New functionality |
| `bug/` | Bug fixes |
| `chore/` | Maintenance, configuration, dependencies, or refactoring |
| `docs/` | Documentation-only changes |

Use a short, lowercase, hyphen-separated description after the prefix:

```text
feature/property-search-filters
bug/listing-price-not-displaying
chore/update-eslint-config
docs/update-setup-instructions
```

## Commit Messages

Write short, descriptive commit messages in the imperative mood:

```text
Add property card component
Fix listing image fallback
Update backend setup instructions
```

Avoid vague messages such as:

```text
fix
updates
misc changes
```

Add a commit body when the reason for the change is not obvious:

```text
Fix listing image fallback

Some listing records do not include a usable image URL. This change
keeps the card layout stable when the API returns an empty photo list.
```

## Pull Requests

Before opening a pull request:

1. Sync your branch with the latest `dev`.
2. Run the relevant tests for the files you changed.
3. Open the pull request into `dev`.

Include in the pull request description:

- What changed
- How the change was tested
- Screenshots for visible UI changes
- Any known limitations or follow-up work

## Review and Merge

- Require at least one approval before merging into `dev`.
- Do not approve your own pull request.
- Use GitHub review states consistently: approve when ready, request changes when required, or comment for non-blocking feedback.
- Use squash merge for task branches into `dev`.
- Delete merged task branches.

## Syncing With `dev`

Before opening a pull request:

```bash
git checkout dev
git pull origin dev
git checkout <your-branch-name>
git merge dev
```

After resolving conflicts:

```bash
git add .
git commit -m "Merge dev into <your-branch-name>"
git push
```

## Local Verification

Run the checks that match your change.

Backend:

```bash
cd backend
./mvnw test
```

Frontend:

```bash
cd frontend
npm run lint
npm test -- --watchAll=false
```

End-to-end:

```bash
docker compose -f docker-compose.e2e.yml up -d
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=e2e
```

In another terminal:

```bash
cd frontend
npm run test:e2e
```

## Conflict Guidance

- Pull from `dev` regularly on long-running branches.
- Communicate with teammates before editing the same files.
- Keep pull requests focused and short-lived.
- Ask another teammate to review difficult conflict resolutions before force-pushing.
