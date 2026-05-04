# Version Control Setup — archly.cloud

GitHub remote configuration, branch protection, CI/CD, and release automation.

---

## Remote Configuration

### Current Setup

```bash
$ git remote -v
origin  https://github.com/eddy7896/archly.cloud.git (fetch)
origin  https://github.com/eddy7896/archly.cloud.git (push)
```

**Repository:** https://github.com/eddy7896/archly.cloud.git  
**Owner:** eddy7896  
**Branches:**
- `main` — Production (protected)
- `develop` — Integration (protected)
- `feature/*` — Features (temporary)
- `hotfix/*` — Emergency fixes (temporary)
- `release/*` — Release prep (temporary)

---

## Branch Protection Rules

### Apply These to GitHub Settings

**Settings → Branches → Branch protection rules**

#### **main Branch Protection**

1. **Require pull request reviews before merging**
   - Number of required reviews: 2
   - Dismiss stale pull request approvals: ✅

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Status checks required:
     - `lint-and-type-check` ✅
     - `test` ✅
     - `build` ✅

3. **Require a pull request before merging**
   - Require approvals: ✅
   - Require conversation resolution before merging: ✅

4. **Restrict who can push to matching branches**
   - Allow force pushes: ❌
   - Allow deletions: ❌

#### **develop Branch Protection**

1. **Require pull request reviews**
   - Number of required reviews: 1

2. **Require status checks**
   - Same as main

3. **Restrict force pushes**
   - Allow force pushes: ❌
   - Allow deletions: ❌

---

## GitHub Settings Checklist

### Repository Settings

**General**
- [ ] Require status checks: ✅
- [ ] Auto-delete head branches: ✅
- [ ] Allow auto-merge: ❌ (manual control)

**Pull Requests**
- [ ] Allow squash merging: ✅
- [ ] Allow merge commits: ✅
- [ ] Allow rebase merging: ❌
- [ ] Suggest updating pull request branches: ✅
- [ ] Always suggest updating branch: ✅
- [ ] Auto-merge is not enabled

**Issues**
- [ ] Enable issue templates
- [ ] Enable discussion categories

**Code Security & Analysis**
- [ ] Enable Dependabot alerts: ✅
- [ ] Enable Dependabot security updates: ✅
- [ ] Enable secret scanning: ✅
- [ ] Enable CodeQL: ✅

---

## Setup Local Git Hooks

### Install Husky (Commit Message Validation)

```bash
npm install husky @commitlint/cli @commitlint/config-conventional lint-staged -D
npx husky install
```

### Pre-commit Hook (Linting)

Already configured in `.husky/pre-commit`:
```bash
npx lint-staged
```

Runs biome lint & format on staged files.

### Commit Message Hook (Conventional Format)

Already configured in `.husky/commit-msg`:
```bash
npx commitlint --edit "$1"
```

Validates commit message format.

### Configuration Files

- **`.commitlintrc.json`** — Commit message rules
- **`.lintstagedrc.json`** — Staged file linting
- **`.husky/pre-commit`** — Pre-commit hook
- **`.husky/commit-msg`** — Commit message hook

---

## CI/CD Pipeline (GitHub Actions)

### Workflows Included

**`.github/workflows/ci.yml`** — Runs on push/PR to main & develop

1. **Lint & Type Check** (2 min)
   - `npm run lint`
   - `npm run check-types`

2. **Tests** (5 min)
   - `npm run test`
   - Upload coverage to Codecov

3. **Build** (5 min)
   - `npm run build`
   - All packages & apps

4. **Docker Build** (10 min, main/develop only)
   - Build frontend image
   - Build collab server image
   - Cache intermediate layers

### Status Checks Required for Merge

- ✅ lint-and-type-check
- ✅ test
- ✅ build

If any fail, PR cannot be merged (even with approvals).

### How to Trigger Manually

```bash
# CI runs automatically on push
git push origin feature/my-feature

# To rerun (if transient failure):
# Go to GitHub → Actions → Re-run job
```

---

## Release Workflow

### Automated Release (via GitHub Actions)

**Option 1: Manual Tag → Auto-Release**

```bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# Update version in package.json
npm version minor

# Push branch
git push -u origin release/1.1.0
```

On GitHub:
1. Create PR: `release/1.1.0` → `main`
2. Wait for all checks to pass
3. Get 2 approvals
4. Merge (use "Create a merge commit")

After merge:
```bash
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
```

### Manual Release Notes

Edit `.github/releases/v1.1.0.md`:

```markdown
## What's New in 1.1.0

### 🎉 Features
- Add marketplace clone button (#123)
- Real-time presence cursors (#456)

### 🐛 Bug Fixes
- Fix WebSocket reconnection lag (#789)
- Fix CORS error on texture loading (#101)

### 📦 Dependencies
- Upgrade React to 19.2.5
- Update Yjs to 13.6.8

### 🚀 Performance
- Improve Yjs snapshot persistence time by 30%
- Reduce WebSocket message size by 15%

### 📚 Docs
- Update architecture guide for new layers
- Add Docker deployment guide

### ⚠️ Breaking Changes
- Removed legacy REST sync API (use WebSocket)
```

---

## Preventing Common Mistakes

### Accidentally Commit Secrets

**Husky pre-commit hook prevents:**
- API keys in `.env` (already in .gitignore)
- Private keys in files (check before commit)

**If you commit a secret:**
```bash
# Immediately notify team
# Rotate the secret
# Use git-secrets or BFG to remove from history
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push -f origin main  # ONLY if needed, breaks branch protection
```

### Accidental Force Push to main

**Git branch protection prevents this:**
```bash
git push -f origin main
# Error: protected branch cannot be force pushed
```

### Large Files Committed

**Pre-commit hook should catch, but if missed:**
```bash
# Check file size
ls -lh large-file.bin

# If > 100MB, use git-lfs
git lfs install
git lfs track "*.glb" "*.blend"
git add .gitattributes
git add large-file.bin
git commit -m "add: large 3d model"
```

---

## Team Collaboration Setup

### Add Collaborators

**GitHub → Settings → Collaborators → Add people**

Recommended roles:
- **Maintainers:** Can merge PRs, manage releases
- **Developers:** Can create branches, open PRs
- **Reviewers:** Can review & approve, cannot merge

### Code Review Workflow

1. **Author opens PR**
   ```bash
   git push -u origin feature/my-feature
   # Create PR on GitHub
   ```

2. **Reviewers requested** (auto-assigned based on CODEOWNERS)
   ```
   # .github/CODEOWNERS
   * @eddy7896 @team
   /packages/core/ @core-maintainers
   /packages/viewer/ @viewer-maintainers
   ```

3. **Reviewers request changes or approve**
   - Changes requested → Author pushes fixes
   - Approved → Author can merge (if main, needs 2 approvals)

4. **All checks pass → Merge**
   - Main: 2 approvals + all checks
   - Develop: 1 approval + all checks

5. **Branch auto-deleted**
   ```bash
   git fetch -p  # Update local after remote delete
   ```

---

## Monitoring & Alerts

### GitHub Notifications

Enable in **Settings → Notifications**:
- [ ] Pull request reviews: ✅
- [ ] Pull request comments: ✅
- [ ] Workflow runs: ✅ (failures only)

### Branch Status Badge

Add to README.md:
```markdown
[![CI](https://github.com/eddy7896/archly.cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/eddy7896/archly.cloud/actions)
```

### Slack Integration (Optional)

**GitHub → Settings → Integrations → Slack**

Get notifications for:
- PR reviews
- Failed checks
- Branch protection violations

---

## Troubleshooting

### Commit Hook Blocked My Commit

Husky pre-commit hook failed (linting error):

```bash
# Fix the error
npm run lint:fix

# Try again
git add .
git commit -m "feat(scope): message"
```

### Commit Message Rejected

Commitlint validation failed:

```bash
# Invalid: "add new feature"
# Valid:   "feat(editor): add new tool"

git commit -m "feat(editor): add new tool"
```

### PR Blocked by Status Checks

CI job failed (tests, linting, build):

```bash
# See which check failed
# Click "Details" on GitHub PR

# Fix locally
npm run test  # See which test failed
# Fix test
git commit -m "fix: failing test"
git push origin feature-name
# CI reruns automatically
```

### Can't Merge PR (Branch Out of Date)

```bash
# Local: Rebase & push
git fetch origin
git rebase origin/develop
git push -f origin feature-name

# On GitHub: Click "Update branch" button
```

### Need to Skip CI (Rare)

Add to commit message (only hotfixes):
```bash
git commit -m "fix: critical production bug [skip ci]"
```

⚠️ Should be very rare. Branch protection still requires reviews.

---

## Release Checklist

Before tagging release:

- [ ] All PRs merged from release branch
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Merge commit to main (not squash)
- [ ] CI pipeline passing on main
- [ ] Tag created: `git tag -a v1.1.0 -m "Release 1.1.0"`
- [ ] Tag pushed: `git push origin v1.1.0`
- [ ] Release notes published on GitHub
- [ ] Notification sent to team (Slack)
- [ ] Docker images built & pushed (CI handles)

---

## Commands Reference

```bash
# Setup
git clone https://github.com/eddy7896/archly.cloud.git
git checkout develop
npx husky install

# Feature workflow
git checkout -b feature/my-feature origin/develop
git commit -m "feat(scope): description"
git push -u origin feature/my-feature

# Update after review
git add .
git commit -m "fix: review feedback"
git push origin feature/my-feature

# After merge
git checkout develop
git pull origin develop
git branch -d feature/my-feature
git push origin --delete feature/my-feature

# Release
git checkout -b release/1.1.0 origin/develop
npm version minor
git push -u origin release/1.1.0
# Create PR on GitHub, merge to main
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
git checkout develop
git merge main
git push origin develop

# Hotfix
git checkout -b hotfix/critical origin/main
git commit -m "fix: critical bug"
git push -u origin hotfix/critical
# Create PR on GitHub, merge to main
npm version patch
git tag -a v1.0.1 -m "Hotfix 1.0.1"
git push origin v1.0.1
git checkout develop
git merge main
git push origin develop
```

---

## Summary

✅ Remote: `https://github.com/eddy7896/archly.cloud.git`  
✅ Branches: `main` (protected), `develop` (protected), feature/* (temporary)  
✅ Git hooks: Husky (linting, commit validation)  
✅ CI/CD: GitHub Actions (lint, test, build, Docker)  
✅ Release: Semantic versioning with tags  
✅ Team: Code review, branch protection, status checks  

Ready for collaborative development.
