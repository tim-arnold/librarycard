---
name: Database Migration Process Improvement
about: Improve the error-prone manual migration process
title: 'Improve database migration deployment process to prevent errors and missed migrations'
labels: ['enhancement', 'database', 'devops', 'priority-high']
assignees: ''
---

## Problem Description

The current database migration process is error-prone and requires manual tracking of multiple SQL files:

1. **Manual Migration Tracking**: Developer must manually identify which migration files exist for a feature
2. **Multiple Files Per Feature**: A single feature can require multiple migration files (e.g., `add_dynamic_genre_system.sql` + `add_genre_requests.sql`)
3. **No Migration State Tracking**: No automated way to know which migrations have been applied
4. **Error-Prone Deployment**: Easy to miss migrations or apply them in wrong order
5. **Manual GitHub Actions**: Must manually enter migration filenames in workflow dispatch

## Current Problematic Workflow

1. Developer creates feature with multiple migration files
2. During deployment, must remember all migration files that need to be applied
3. Must manually run GitHub Actions workflow for each file individually
4. Easy to miss migrations leading to runtime errors like "no such column"

## Proposed Solutions

### Option 1: Single Migration Per Feature
- Combine all migrations for a feature into a single file
- Naming convention: `YYYYMMDD_feature-name.sql`

### Option 2: Automated Migration Runner
- Create a migration tracking table in the database
- Script that automatically applies all pending migrations in order
- Add migration status tracking and rollback capabilities

### Option 3: Enhanced GitHub Actions Workflow
- Automatically detect new migration files since last deployment
- Apply all pending migrations in a single workflow run
- Better error handling and rollback on failure

## Acceptance Criteria

- [ ] Developer should not need to manually track migration files
- [ ] Single deployment action should apply all necessary migrations
- [ ] System should prevent applying migrations out of order
- [ ] Clear error messages when migrations fail
- [ ] Ability to see migration status/history

## Impact

**Priority: High** - Current process already caused deployment issues and runtime errors

## Additional Context

Recent example: Genre management feature required two migrations but only one was applied, causing "no such column: bg.assigned_by" error in staging.