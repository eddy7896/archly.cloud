# Git Workflow & Branch Strategy — archly.cloud

Semantic versioning, release management, and collaborative development workflow.

---

## Branch Structure (Git Flow)

```
main (production)
  ↑
  └─ release/1.x.x (release prep)
       ↑
       └─ develop (integration)
            ↑
            ├─ feature/marketplace (features)
            ├─ feature/presence-engine
            ├─ feature/3d-asset-upload
            ├─ fix/websocket-reconnect (bug fixes)
            ├─ fix/yjs-sync-lag
            ├─ chore/update-deps (maintenance)
            └─ docs/architecture (documentation)
```

---

## Branch Naming Convention

| Type | Pattern | Example | Purpose |
|------|---------|---------|---------|
| Feature | `feature/<name>` | `feature/marketplace` | New feature |
| Bug fix | `fix/<name>` | `fix/websocket-reconnect` | Bug fix |
| Hotfix | `hotfix/<name>` | `hotfix/production-crash` | Urgent prod fix |
| Release | `release/<version>` | `release/1.0.0` | Release prep |
| Chore | `chore/<name>` | `chore/update-deps` | Maintenance |
| Docs | `docs/<name>` | `docs/architecture` | Documentation |

---

## Main Branches (Protected)

### **main** (Production)
- Stable, released code only
- Tagged with semantic versions: `v1.0.0`, `v1.0.1`, `v1.1.0`
- PRs only from `release/*` branches
- Auto-deploy to production on merge
- **Protection rules:**
  - Require PR review (minimum 2)
  - Require status checks pass
  - Dismiss stale PR approvals
  - Require branches up to date before merge

### **develop** (Integration)
- Latest development code
- Merges from feature branches
- Base branch for new features
- **Protection rules:**
  - Require PR review (minimum 1)
  - Require status checks pass
  - Require branches up to date before merge

---

## Feature Development Workflow

### **1. Create Feature Branch** (from develop)

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### **2. Make Changes & Commit**

Commit messages follow convention:

```
type(scope): message

Details go here (optional).

Fixes #123
Co-Authored-By: Name <email>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure (no behavior change)
- `perf:` Performance improvement
- `docs:` Documentation
- `test:` Tests only
- `chore:` Maintenance, deps, config

**Examples:**
```bash
git commit -m "feat(editor): add measure tool"
git commit -m "fix(viewer): prevent tainted canvas on CORS error"
git commit -m "docs(architecture): update layer boundaries"
git commit -m "chore(deps): upgrade react to 19.2.5"
```

### **3. Push to Remote**

```bash
git push -u origin feature/my-feature
```

First push: `-u` flag sets upstream tracking.

### **4. Open Pull Request**

**On GitHub:**
- Title: `[TYPE] Brief description`
- Example: `[feat] Add marketplace clone button`
- Description: What changed, why, how to test
- Link related issues: `Fixes #123`

**PR template:**
```markdown
## Summary
What does this PR do?

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## How to Test
Steps to verify functionality.

## Breaking Changes
Does this break existing APIs?

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors/warnings
```

### **5. Code Review & Merge**

Requirements before merge:
- ✅ 2 approvals (or 1 for non-core changes)
- ✅ All tests pass
- ✅ Architecture review passed (if touching layers)
- ✅ No conflicts with develop

**Merge to develop:**
```bash
# On GitHub: Click "Squash and merge" or "Create a merge commit"
# Strategy: Squash for features, merge commit for bugfixes
```

**Delete branch after merge:**
```bash
# Auto-delete on GitHub (enable in settings)
# Or manual:
git branch -D feature/my-feature
git push origin --delete feature/my-feature
```

---

## Release Process

### **Release Branch** (from develop)

When ready to release (weekly, biweekly, or on-demand):

```bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# Update version in package.json
npm version minor  # or patch, major

# Push release branch
git push -u origin release/1.1.0
```

### **Testing & Bug Fixes on Release**

Only bug fixes & version bumps on release branch:

```bash
git checkout release/1.1.0
# Fix bugs only
git commit -m "fix: critical production bug"
git push origin release/1.1.0
```

### **Merge to main** (via PR)

On GitHub:
- Create PR: `release/1.1.0` → `main`
- Title: `Release 1.1.0`
- Merge via "Create a merge commit" (preserve history)

```bash
# After merge, tag the commit
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

### **Merge Back to develop**

Keep develop up-to-date:

```bash
git checkout develop
git pull origin develop
git merge main --no-ff
git push origin develop
```

---

## Hotfix Process (Emergency Fixes)

For critical production bugs:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix the issue
git commit -m "fix: critical production bug"

# Merge to main
git push -u origin hotfix/critical-bug
# Create PR: hotfix/critical-bug → main
# Merge with squash

# Update version
git checkout main
git pull origin main
npm version patch
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git push origin v1.0.1

# Merge back to develop
git checkout develop
git pull origin develop
git merge main --no-ff
git push origin develop
```

---

## Commit Message Convention

All commits must follow this format (enforced by husky pre-commit hook):

```
type(scope): subject

body

footer
```

**Type:** feat, fix, refactor, perf, docs, test, chore, style, ci  
**Scope:** editor, viewer, core, ui, collab, docker, db, deploy  
**Subject:** Imperative, lowercase, no period, max 50 chars

**Example:**
```
feat(collab): add presence cursor tracking

Implement cursor position broadcasting via Yjs extensions.
Cursors rendered with user color coding in viewer.
Updates broadcast every 100ms to reduce network traffic.

Fixes #456
Co-Authored-By: Team Member <email@example.com>
```

---

## Status Checks (CI/CD)

All PRs require passing checks before merge:

1. **Tests** — Unit + integration tests pass
2. **Linting** — Biome lint & format pass
3. **Type Check** — TypeScript no-emit passes
4. **Build** — Full build succeeds
5. **Architecture** — Layer boundaries validated

**GitHub Actions workflows (setup required):**

```yaml
name: Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run check-types
      - run: npm run lint
      - run: npm run build
```

---

## Semantic Versioning

Follow SemVer 2.0.0: MAJOR.MINOR.PATCH

| Change | Version | Example |
|--------|---------|---------|
| New feature (backward compatible) | Minor | 1.1.0 → 1.2.0 |
| Bug fix (backward compatible) | Patch | 1.0.0 → 1.0.1 |
| Breaking change | Major | 1.0.0 → 2.0.0 |

**Update version:**
```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

---

## Release Notes & Changelog

**CHANGELOG.md format:**

```markdown
# Changelog

## [1.1.0] - 2026-05-10

### Added
- Marketplace clone duplication button
- Presence cursor tracking with user colors
- Real-time collaboration sync via Yjs

### Fixed
- WebSocket reconnection lag after network disconnect
- CORS error on texture loading from R2

### Changed
- Upgraded React to 19.2.5
- Improved Yjs snapshot persistence

### Breaking Changes
- Removed legacy REST API for document sync (use WebSocket)

## [1.0.0] - 2026-05-01

### Added
- Initial release
- Dashboard with project browser
- 3D editor with real-time sync
- PostgreSQL persistence
```

---

## Team Collaboration Rules

### **Code Review**

- Reviews required before merge (1-2 approvals)
- Reviewers focus on:
  - Layer boundaries (no circular imports)
  - Type safety (no `any`, strict mode)
  - Test coverage (new code has tests)
  - Performance (no unnecessary renders, queries)
  - Security (no SQL injection, XSS, hardcoded secrets)

### **Commit Frequency**

- Push to feature branch frequently (prevent conflicts)
- Squash before merge (clean history on develop)
- One PR = one cohesive feature (not random changes)

### **Conflict Resolution**

```bash
# Resolve conflicts locally
git fetch origin
git rebase origin/develop  # or merge
# Fix conflicts in editor
git add .
git commit -m "resolve merge conflicts"
git push origin feature/my-feature
```

### **Force Push**

**✅ OK:**
- On feature branches (not yet merged)
- To rewrite messy commit history

**❌ NEVER:**
- On main, develop, or release branches
- After PR approval (history matters for review)

```bash
# OK (feature branch)
git push -f origin feature/my-feature

# NOT OK
git push -f origin main  # ← BLOCKED by branch protection
```

---

## Local Development Best Practices

### **Always pull before pushing**

```bash
git fetch origin
git rebase origin/feature-name  # Keep history linear
git push origin feature-name
```

### **Keep feature branches small**

- One feature per branch
- Max 3-5 commits per PR
- Easier to review, test, revert

### **Sync with develop frequently**

```bash
git fetch origin
git rebase origin/develop
# Fix any conflicts locally
git push -f origin feature/my-feature  # OK on feature branch
```

### **Clean up local branches**

```bash
# List branches
git branch -a

# Delete merged branches
git branch -d feature/old-feature

# Delete unmerged (force)
git branch -D feature/abandoned

# Prune deleted remote branches
git fetch -p
```

---

## Emergency Procedures

### **Accidental commit to main**

```bash
# Revert the commit
git revert HEAD
git push origin main

# Create PR to review
# Notify team on Slack
```

### **Sensitive data committed**

```bash
# Remove from history (BFG Repo-Cleaner)
bfg --delete-files <file>
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Alert security team
# Rotate all credentials
# Force push (will need override)
git push -f origin main
```

### **Broken build on main**

```bash
# Revert immediately
git revert HEAD
git push origin main

# Fix locally on hotfix branch
git checkout -b hotfix/broken-build
# Fix issue
git push origin hotfix/broken-build
# Create PR, merge back to main
```

---

## GitHub Settings

### **Branch Protection (main)**

- Require pull request reviews before merging: ✅ 2
- Dismiss stale pull request approvals: ✅
- Require status checks: ✅
- Require branches up to date before merge: ✅
- Allow force pushes: ❌
- Allow deletions: ❌

### **Branch Protection (develop)**

- Require pull request reviews: ✅ 1
- Require status checks: ✅
- Allow force pushes: ❌
- Allow deletions: ❌

### **Auto-Delete Head Branches**

Enable: ✅ (auto-delete after PR merge)

### **Squash & Merge Settings**

- Default merge method: Squash (for features) or Merge (for releases)
- Auto-merge: ❌ (manual review required)

---

## Commands Cheat Sheet

```bash
# Setup
git clone https://github.com/eddy7896/archly.cloud.git
cd editor
git checkout develop

# Feature workflow
git checkout -b feature/my-feature
git add .
git commit -m "feat(scope): description"
git push -u origin feature/my-feature
# (Create PR on GitHub)

# Sync with develop
git fetch origin
git rebase origin/develop
git push -f origin feature/my-feature

# Update after review
git add .
git commit -m "fix: review feedback"
git push origin feature/my-feature

# After merge, cleanup
git checkout develop
git pull origin develop
git branch -d feature/my-feature
git push origin --delete feature/my-feature

# Release
git checkout -b release/1.1.0 origin/develop
npm version minor
git push -u origin release/1.1.0
# (Create PR: release/1.1.0 → main)
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0

# Hotfix (critical bug)
git checkout -b hotfix/critical origin/main
git commit -m "fix: critical bug"
git push -u origin hotfix/critical
# (Create PR: hotfix/critical → main)
git checkout main
git pull origin main
npm version patch
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git push origin v1.0.1
git checkout develop
git merge main
git push origin develop
```

---

## Troubleshooting

### **"Your branch is ahead by X commits"**

Push to remote:
```bash
git push origin feature-name
```

### **"Please commit your changes before merging"**

Stash changes:
```bash
git stash
git fetch origin
git rebase origin/develop
git stash pop
```

### **"Conflict in file X"**

Resolve locally:
```bash
# Edit file to resolve conflict
# Remove <<<, ===, >>>
git add .
git rebase --continue
git push -f origin feature-name
```

### **"Need to squash commits before merge"**

Interactive rebase:
```bash
git rebase -i HEAD~5  # Last 5 commits
# Change "pick" to "squash" for commits to combine
# Save and edit final commit message
git push -f origin feature-name
```

### **"Accidentally pushed to main"**

Revert immediately:
```bash
git revert HEAD
git push origin main
# Alert team
```

---

## Team Workflow Summary

1. Create feature branch from develop
2. Make commits with conventional format
3. Push to remote & open PR
4. Code review (1-2 approvals)
5. Merge to develop (squash)
6. Delete feature branch
7. On release: Create release branch, bump version, merge to main, tag
8. Hotfixes: Branch from main, merge back to main + develop

**Key rules:**
- main = production (tagged releases only)
- develop = integration (always deployable)
- feature branches = temporary (deleted after merge)
- Commit messages = conventional format
- Semantic versioning = MAJOR.MINOR.PATCH
