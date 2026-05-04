# Deployment Checklist — archly.cloud

Pre-flight checks before deploying platform to production.

---

## Pre-Deployment (1 week before)

### Code Review & Testing
- [ ] All PRs merged and reviewed
- [ ] Unit tests pass: `npm run test`
- [ ] Type check passes: `npm run check-types`
- [ ] No ESLint errors: `npm run lint`
- [ ] Architecture review complete (layers, boundaries)
- [ ] Load testing on staging environment
- [ ] E2E tests pass on staging (Playwright)

### Security Audit
- [ ] No hardcoded secrets in code
- [ ] .env.template reviewed (no actual values)
- [ ] OAuth credentials rotated
- [ ] Database passwords meet security requirements (16+ chars, mixed case, special)
- [ ] SQL injection tests passed
- [ ] XSS/CSRF protection enabled
- [ ] API authentication tokens validated
- [ ] R2 bucket CORS policy correct (only archly.cloud origin)
- [ ] TLS/SSL certificates valid

### Infrastructure & DevOps
- [ ] Docker images build successfully
- [ ] docker-compose.yml tested on staging
- [ ] Database backup strategy defined
- [ ] Disaster recovery plan written
- [ ] Monitoring/alerting set up (Sentry, Datadog, etc.)
- [ ] Log aggregation configured (ELK, Splunk, etc.)
- [ ] CDN cache headers configured
- [ ] Rate limiting configured on API routes

### Documentation
- [ ] ARCHITECTURE.md complete and reviewed
- [ ] COMPARTMENTALIZATION.md reviewed by team
- [ ] DOCKER_SETUP.md tested by new developer
- [ ] README.md updated with deploy instructions
- [ ] Runbook created (incident response)
- [ ] Postmortem process defined

---

## 48 Hours Before Deployment

### Environment Setup
- [ ] Production `.env` file created (secrets in secure vault)
- [ ] Database migrations tested on production clone
- [ ] R2 bucket created and CORS policy applied
- [ ] DNS records prepared (CNAME, A records)
- [ ] SSL/TLS certificate installed
- [ ] Reverse proxy (nginx) configured

### Deployment Infrastructure
- [ ] Production Docker registry configured (Docker Hub, ECR, etc.)
- [ ] Docker images tagged with version
- [ ] docker-compose.yml or K8s manifests prepared
- [ ] Health check endpoints tested
- [ ] Rollback procedure documented
- [ ] Service dependencies verified (collab → postgres → frontend)

### Notifications & Communication
- [ ] Maintenance window announced to users
- [ ] Team on-call schedule confirmed
- [ ] Slack/Discord channels created for incident chat
- [ ] Status page set up (StatusPage.io, Incident.io)
- [ ] Customer support briefed on new features

---

## Day of Deployment

### Pre-Launch (4 hours before)
- [ ] Staging environment fully tested
- [ ] Database backup created
- [ ] Git tag created: `v1.0.0`
- [ ] Changelog generated and reviewed
- [ ] Team standup: confirm everyone understands rollback plan
- [ ] Monitoring dashboards open and watched

### Deployment Steps

**1. Build & Push Docker Images**
```bash
# From project root
docker build -t archly-frontend:1.0.0 -f Dockerfile .
docker build -t archly-collab:1.0.0 -f services/collab/Dockerfile .

docker push archly-frontend:1.0.0
docker push archly-collab:1.0.0
```

**2. Database Migrations**
```bash
# On production server
docker-compose -f docker-compose.yml exec frontend \
  npx prisma migrate deploy
```

**3. Start Services (in order)**
```bash
# Pull latest images
docker-compose -f docker-compose.yml pull

# Start database first
docker-compose -f docker-compose.yml up -d postgres

# Wait for postgres health check
sleep 10

# Start collab server
docker-compose -f docker-compose.yml up -d collab

# Wait for collab health check
sleep 5

# Start frontend
docker-compose -f docker-compose.yml up -d frontend
```

**4. Health Checks**
```bash
# Check all services running
docker-compose ps

# Verify health endpoints
curl https://api.archly.cloud/api/health
curl https://api.archly.cloud/api/db-health
curl https://collab.archly.cloud/health
```

**5. Smoke Tests**
- [ ] Open https://archly.cloud in browser
- [ ] Sign up with test account
- [ ] Create new project
- [ ] Open editor (verify WebSocket connection)
- [ ] Try real-time collaboration (open in 2 browsers)
- [ ] Clone marketplace asset
- [ ] Upload 3D asset to project
- [ ] Export project
- [ ] Verify presence cursors work

### Post-Launch (1 hour after)
- [ ] Monitor error rates (Sentry, Datadog)
- [ ] Check database query performance
- [ ] Verify WebSocket connections stable
- [ ] Review logs for warnings/errors
- [ ] Confirm no increase in API latency
- [ ] Check asset CDN performance

---

## Rollback Procedure (If Issues)

**DO NOT attempt fixes without understanding root cause.**

### Option 1: Rollback to Previous Tag
```bash
# Stop current deployment
docker-compose -f docker-compose.yml down

# Check out previous version
git checkout v0.9.5

# Rebuild and redeploy
docker-compose -f docker-compose.yml up -d
```

### Option 2: Database Rollback
```bash
# If migration caused issues
docker-compose exec frontend npx prisma migrate resolve --rolled-back <migration_name>
docker-compose exec frontend npx prisma migrate deploy --to <last_stable_migration>
```

### Option 3: Blue-Green Deployment (if available)
- Keep v0.9.5 running on "blue" infrastructure
- Switch DNS/load balancer back to blue
- Debug v1.0.0 on "green" infrastructure offline

---

## Incident Response

### If Services Go Down

1. **Assess:** Which services affected?
   - Frontend only → static assets still cached, users can view old projects
   - Collab only → real-time sync broken, but editing still works (will sync later)
   - PostgreSQL → all services degraded

2. **Immediate Actions:**
   ```bash
   # Check logs
   docker-compose logs --tail=50 frontend
   docker-compose logs --tail=50 collab
   docker-compose logs --tail=50 postgres

   # Restart service
   docker-compose restart frontend
   # Wait for health check

   # If still down, check resources
   docker stats
   # If high memory, increase Docker allocation
   ```

3. **If Database Corrupted:**
   ```bash
   # Restore from backup
   docker-compose down
   docker volume rm archly-postgres_data
   # Restore backup.sql from secure storage
   docker-compose up -d postgres
   # Restore with psql
   docker-compose exec postgres psql -U archly archly < backup.sql
   ```

4. **Notify Users:** Update status page, tweet, email

5. **Post-Incident:** Write postmortem (what happened, why, what to prevent next time)

---

## Monitoring Post-Deployment

### Metrics to Watch (First 24 Hours)

**Backend Health:**
- [ ] CPU usage < 80% on all containers
- [ ] Memory usage stable
- [ ] PostgreSQL query time < 100ms (p95)
- [ ] WebSocket connections stable (count shouldn't spike)

**User Experience:**
- [ ] API response time < 200ms (p95)
- [ ] WebSocket latency < 50ms
- [ ] Error rate < 0.1%
- [ ] No 5xx errors

**Feature-Specific:**
- [ ] Real-time sync updates flow correctly
- [ ] Presence cursors appear/disappear correctly
- [ ] Asset uploads complete successfully
- [ ] Marketplace clone button works
- [ ] Exports complete without error

**Business Metrics:**
- [ ] User signups trending normal
- [ ] Project creation rate normal
- [ ] No increase in user complaints (Slack, email)
- [ ] No degradation in feature adoption

---

## Post-Deployment (Day 1-7)

- [ ] Monitor error logs for new issues
- [ ] Gather user feedback via in-app survey
- [ ] Check performance analytics (speed, errors)
- [ ] Review database growth (is data accumulating correctly?)
- [ ] Verify backups are running on schedule
- [ ] Run security scan on deployed infrastructure
- [ ] Update documentation if deploy process changed
- [ ] Schedule postmortem if any issues occurred

---

## Environment Checklist

### Production .env.local
```env
# Database
POSTGRES_USER=archly_prod
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://archly_prod:<password>@postgres-prod:5432/archly_prod

# Frontend
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://archly.cloud
NEXT_PUBLIC_API_URL=https://api.archly.cloud
NEXT_PUBLIC_WS_URL=wss://collab.archly.cloud

# Auth
BETTER_AUTH_SECRET=<random-32-char-secret>
GOOGLE_CLIENT_ID=<prod-google-id>
GOOGLE_CLIENT_SECRET=<prod-google-secret>
GITHUB_CLIENT_ID=<prod-github-id>
GITHUB_CLIENT_SECRET=<prod-github-secret>

# Storage
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_BUCKET=archly-assets-prod
R2_ACCESS_KEY_ID=<prod-key>
R2_SECRET_ACCESS_KEY=<prod-secret>
R2_PUBLIC_URL=https://cdn.archly.cloud

# Logging
LOG_LEVEL=info
SENTRY_DSN=<sentry-prod-dsn>
```

---

## Success Criteria

Deployment is successful when:

1. ✅ All services healthy (health checks passing)
2. ✅ No critical errors in logs
3. ✅ All smoke tests pass
4. ✅ User-facing features work (signup, editor, marketplace)
5. ✅ Real-time collaboration working (WebSocket connected)
6. ✅ Performance metrics baseline or better
7. ✅ No user reports of issues after 1 hour
8. ✅ Database backups running
9. ✅ Monitoring/alerting working

---

## Contacts & Escalation

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Deployment Lead | — | — | @— |
| Database Admin | — | — | @— |
| Infrastructure | — | — | @— |
| Frontend Lead | — | — | @— |
| CTO (escalation) | — | — | @— |

---

## Post-Deployment Retrospective (Day 7)

- [ ] What went well?
- [ ] What was hard?
- [ ] What broke and how did we fix it?
- [ ] What would we do differently next time?
- [ ] Action items for next deployment

**Output:** Update DOCKER_SETUP.md, DEPLOYMENT_CHECKLIST.md, and runbook based on findings.
