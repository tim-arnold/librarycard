# Migration Archive

This directory contains historical migration files that have been superseded by newer, more refined migrations.

## Archived Files

### `20250709_genre_system_migration_HISTORICAL.sql`
- **Original Location**: Root directory (`migrate_genre_system.sql`)
- **Status**: Successfully executed on 2025-07-09
- **Superseded By**:
  - `migrations/add_dynamic_genre_system.sql`
  - `migrations/seed_curated_genres.sql`
  - `migrations/20250903_fix_curated_genres_system_user_references.sql`
- **Reason Archived**: Content was implemented through proper migration system with subsequent refinements

## Notes

These files are preserved for:
- Historical reference
- Disaster recovery scenarios
- Understanding migration evolution
- Debugging legacy issues

**Do not execute archived migrations** - they may conflict with current schema or have been superseded by better implementations.