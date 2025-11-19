# Useful Git Commands for This Project

## Viewing Changes

### See what files changed in recent commits
```bash
git log --oneline -10                    # Last 10 commits
git diff HEAD~5 HEAD --stat              # Files changed in last 5 commits
git show HEAD --stat                     # Files changed in last commit
```

### See actual code changes
```bash
git diff HEAD~1 HEAD                    # Changes in last commit
git diff HEAD~5 HEAD                     # Changes in last 5 commits
git show HEAD                            # Full details of last commit
```

### See what changed in a specific file
```bash
git log --oneline -- backend/src/sla/sla.service.ts
git show HEAD:backend/src/sla/sla.service.ts
```

### See all changes since a specific date
```bash
git log --since="2024-01-01" --oneline
git diff --since="2024-01-01"
```

## After Pulling Changes

### 1. Check if dependencies changed
```bash
# Check if package.json changed
git diff HEAD~1 HEAD -- backend/package.json
git diff HEAD~1 HEAD -- frontend/package.json
```

### 2. If package.json changed, rebuild containers
```bash
# Rebuild backend (if backend/package.json changed)
docker-compose build backend

# Rebuild frontend (if frontend/package.json changed)
docker-compose build frontend

# Or rebuild everything
docker-compose build
```

### 3. Restart services
```bash
# Restart all services
docker-compose restart

# Or restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### 4. Check if database migrations needed
```bash
# Check if any new entities were added
git diff HEAD~5 HEAD -- backend/src/**/*.entity.ts
```

### 5. View new documentation
```bash
# See new docs
ls -la docs/
cat PROJECT_COMPLETION_SUMMARY.md
```

## Quick Status Check

```bash
# See current status
git status

# See what branch you're on
git branch

# See recent commits
git log --oneline --graph -10

# See what's different from remote
git fetch
git log HEAD..origin/main --oneline
```

