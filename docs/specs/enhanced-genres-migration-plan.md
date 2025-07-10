# Enhanced Genres Migration Plan

## Problem Summary

The "Curated Genres" section in the frontend is showing raw, unprocessed genre data instead of properly classified genres. Examples of problematic data:
- "Fiction, science fiction, genetic engineering"
- "Authurian romances---history and criticism"

These appear in both the "More Details" modal and the genre filter dropdown, making the filtering experience poor.

## Root Cause

**Historical data issue**: The `enhanced_genres` database column contains raw categories/subjects from Google Books/OpenLibrary instead of properly classified genres from the `CURATED_GENRES` list (34 predefined genres in `src/lib/genreClassifier.ts`).

This likely happened during early development before the classification system (`classifyGenres()` function) was fully implemented.

## Current System Overview

### How Genre Classification Should Work:
1. **Raw data sources**: Google Books categories + OpenLibrary subjects
2. **Classification**: `classifyGenres()` maps raw data to 34 curated genres
3. **Storage**: Properly classified genres stored in `enhanced_genres` column
4. **Display**: Frontend shows clean, curated genres

### What's Actually Happening:
1. **Legacy data**: `enhanced_genres` contains raw, unprocessed strings
2. **No re-processing**: Existing books bypass classification
3. **Display bug**: Raw data appears as "Curated Genres"

## Solution: Safe Migration Approach

### Phase 1: Analysis & Preview (SAFE - Read Only)
**File**: `migrations/preview_genre_cleanup.js`

```bash
node migrations/preview_genre_cleanup.js
```

**What it does**:
- ✅ Read-only analysis
- Identifies problematic `enhanced_genres` patterns
- Shows exact counts and examples
- No changes made

**Patterns detected**:
- Contains commas (raw categories)
- Contains "Fiction /" patterns  
- Contains dashes, brackets, "criticism", etc.
- Very long strings (>200 chars)

### Phase 2: Selective Cleanup (SAFE - Preserves Good Data)
**File**: `migrations/update_enhanced_genres.sql`

```sql
npx wrangler d1 execute [your-db] --file=migrations/update_enhanced_genres.sql
```

**What it does**:
- ✅ Creates backup table first
- ✅ Only clears obviously wrong `enhanced_genres`
- ✅ Preserves clean, properly classified genres
- ✅ Preserves original `categories` and `subjects` data
- ✅ Can be reversed using backup

### Phase 3: Re-classification (Automatic)
**When it happens**:
- New books: Automatically classified via `fetchEnhancedBookData()`
- Existing books: Currently no automatic re-classification

**Future Enhancement Options**:
1. Add re-classification logic to book loading
2. Manual re-scan of existing books
3. Background job to process cleared books

## Files Created

### Migration Scripts:
- `migrations/preview_genre_cleanup.js` - Preview script (read-only)
- `migrations/update_enhanced_genres.sql` - SQL cleanup migration
- `migrations/reclassify_enhanced_genres.js` - Full re-classification script (complex)
- `migrations/reclassify_enhanced_genres_simple.js` - Simplified re-classification

### Worker Extensions:
- `workers/admin-migration/index.ts` - Migration-specific API endpoints

## Recommended Execution Plan

### Step 1: Account Setup
- Switch to personal account with API access
- Update email in `preview_genre_cleanup.js` to your personal admin email

### Step 2: Preview & Analysis
```bash
# Update the admin email first
node migrations/preview_genre_cleanup.js
```

### Step 3: Review Results
- Check how many books are affected
- Review examples of problematic data
- Confirm the cleanup scope

### Step 4: Execute Migration (if satisfied)
```bash
npx wrangler d1 execute [your-database-name] --file=migrations/update_enhanced_genres.sql
```

### Step 5: Verify Results
- Check genre filter dropdown is cleaner
- Verify "Curated Genres" section shows fewer/cleaner items
- Confirm problematic raw genres are gone

## Safety Features

### Backup & Recovery:
- SQL migration creates `enhanced_genres_backup` table
- Can restore with: `UPDATE books SET enhanced_genres = (SELECT enhanced_genres FROM enhanced_genres_backup WHERE enhanced_genres_backup.id = books.id)`

### Selective Processing:
- Only clears obviously problematic data
- Preserves properly formatted genres
- Non-destructive to source data

### Validation:
- Preview script shows exactly what will be affected
- SQL migration reports affected book counts
- Can verify results before and after

## Expected Outcomes

### Immediate:
- Cleaner "Curated Genres" section in More Details modal
- Improved genre filter dropdown (fewer noise options)
- Removal of obvious raw data strings

### Long-term:
- Better genre filtering experience
- Consistent genre classification for new books
- Foundation for future genre management enhancements

## Configuration Notes

### API Endpoints:
- Base URL: `https://librarycard-api-production.tim-arnold.workers.dev`
- Authentication: Bearer token with admin email
- Existing endpoints: `/api/books` (used by preview script)

### Database:
- Table: `books`
- Column: `enhanced_genres` (JSON array)
- Backup table: `enhanced_genres_backup` (created by migration)

### Classification System:
- Function: `classifyGenres()` in `src/lib/genreClassifier.ts`
- Source: 34 predefined genres in `CURATED_GENRES` constant
- Input: Google Books categories + OpenLibrary subjects
- Output: Max 5 curated genres

## Alternative Approaches Considered

1. **Full re-classification migration**: More complex, higher risk
2. **Clear all and regenerate**: Requires modifying book loading logic
3. **Real-time classification**: Would add overhead to every book load

The chosen approach (selective cleanup) balances safety with effectiveness.