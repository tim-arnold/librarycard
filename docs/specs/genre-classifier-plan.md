# Dynamic Genre Management System

## Overview

Transform the static genre classification system into a dynamic, user-manageable system that allows controlled expansion while maintaining consistency across all locations in the LibraryCard application.

## Problem Statement

Currently, the genre classification system in LibraryCard uses a hardcoded list of 47 "curated genres" defined in `src/lib/genreClassifier.ts`. This approach has several limitations:

1. **Static System**: Adding new genres requires code changes and deployments
2. **Inconsistent Coverage**: Some books don't match any curated genres (e.g., "Dreams from My Father" has no curated genres while "The Complete Works of William Shakespeare" does)
3. **No User Control**: Users cannot customize or expand the genre taxonomy for their specific library needs
4. **Maintenance Burden**: Genre mappings are scattered throughout the codebase

## Current Architecture

### Genre Classification Flow
1. **Book Addition**: ISBN → Google Books API → OpenLibrary API → `classifyGenres()` → Database
2. **Genre Classification**: Raw categories/subjects → Pattern matching → Curated genre list  
3. **UI Filtering**: Database → Enhanced genres → Filter dropdown population
4. **Storage**: Enhanced genres stored as JSON in `books.enhanced_genres` column

### Current Data Sources
- **Google Books Categories**: Raw categories like "Fiction / Science Fiction / General" 
- **OpenLibrary Subjects**: Granular subjects like "dragons", "magic", "wizards"
- **Pattern Matching**: Both sources mapped to 47 predefined curated genres

## Proposed Solution

### 1. Database Schema Changes

#### New Tables

```sql
-- Global curated genres table
CREATE TABLE IF NOT EXISTS curated_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Many-to-many relationship between books and curated genres
CREATE TABLE IF NOT EXISTS book_genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_auto_assigned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES curated_genres(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(book_id, genre_id)
);

-- Optional: Genre suggestions from users for admin approval
CREATE TABLE IF NOT EXISTS genre_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggested_name TEXT NOT NULL,
  description TEXT,
  suggested_by TEXT NOT NULL,
  book_id INTEGER, -- Optional: book that prompted the suggestion
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by TEXT,
  reviewed_at DATETIME,
  review_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggested_by) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_curated_genres_name ON curated_genres(name);
CREATE INDEX IF NOT EXISTS idx_curated_genres_active ON curated_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_book_genres_book ON book_genres(book_id);
CREATE INDEX IF NOT EXISTS idx_book_genres_genre ON book_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_genre_suggestions_status ON genre_suggestions(status);
```

### 2. Permission Structure

Based on the existing role system:

- **Super Admins** (`user_role = 'admin'`): 
  - Create, edit, delete curated genres
  - Approve/reject genre suggestions
  - Full genre management access

- **All Location Members** (`location_members` table):
  - Assign existing curated genres to books
  - View all available genres
  - Suggest new genres for admin review

- **Auto-Classification System**:
  - Continues to suggest genres using existing classifier
  - Suggestions marked as `is_auto_assigned = TRUE`

### 3. API Endpoints

#### Public Genre Access
- `GET /api/genres` - Get all active curated genres
- `GET /api/genres/{id}` - Get specific genre details

#### Book-Genre Management
- `GET /api/books/{id}/genres` - Get genres assigned to a book
- `POST /api/books/{id}/genres` - Assign genre to book
- `DELETE /api/books/{id}/genres/{genreId}` - Remove genre from book
- `POST /api/books/{id}/suggest-genres` - Get auto-suggested genres

#### Admin Genre Management (Super Admin Only)
- `POST /api/admin/genres` - Create new curated genre
- `PUT /api/admin/genres/{id}` - Update existing genre
- `DELETE /api/admin/genres/{id}` - Deactivate genre
- `GET /api/admin/genre-suggestions` - Get pending suggestions
- `POST /api/admin/genre-suggestions/{id}/approve` - Approve suggestion
- `POST /api/admin/genre-suggestions/{id}/reject` - Reject suggestion

#### Genre Suggestions (All Users)
- `POST /api/genre-suggestions` - Suggest new genre
- `GET /api/genre-suggestions/my` - Get user's suggestions

### 4. UI Components

#### Enhanced Add Books Flow
- **Auto-Suggestions**: Display classifier-suggested genres as clickable chips
- **Manual Selection**: Searchable dropdown/autocomplete for all available genres
- **Quick Actions**: "Accept All Suggestions", "Choose Different", "Suggest New Genre"
- **Visual Indicators**: Different styling for auto-suggested vs manually selected genres

#### Genre Management Interface (Super Admin)
- **Genre CRUD**: Add, edit, deactivate genres
- **Suggestion Review**: Approve/reject user suggestions
- **Usage Analytics**: See which genres are most commonly used
- **Bulk Operations**: Import/export genre lists

#### Book Details Enhancement
- **Primary Display**: Show assigned curated genres prominently
- **Edit Mode**: Allow genre modification for authorized users
- **Suggestion Mode**: Show auto-suggestions alongside assigned genres

### 5. Migration Strategy

#### Phase 1: Database Setup
1. Create new tables with proper indexes
2. Seed `curated_genres` table with enhanced genre list (see below)
3. Create system user for auto-assignments

#### Enhanced Curated Genres List

Based on analysis of current `CURATED_GENRES` (37 genres) and comparison with industry-standard genre lists, here's the recommended starting set of **45 main genres**:

**Fiction Genres (25)**
- Action & Adventure
- Children's Literature
- Classics
- Comedy & Humor
- Contemporary Fiction
- Crime & Mystery
- Dystopian & Post-Apocalyptic
- Fantasy
- Gothic & Horror
- Graphic Novel & Comics
- Historical Fiction
- Literary Fiction
- Magical Realism
- Paranormal & Supernatural
- Poetry
- Psychological Thriller
- Romance
- Science Fiction
- Short Stories
- Thriller & Suspense
- Urban Fantasy
- War Fiction
- Western
- Young Adult
- LGBTQ+ Fiction

**Non-Fiction Genres (20)**
- Art & Design
- Biography & Memoir
- Business & Economics
- Cooking & Food
- Education & Academia
- Essays & Literature
- Health & Fitness
- History
- Philosophy
- Politics & Social Issues
- Psychology
- Reference & How-To
- Religion & Spirituality
- Science & Nature
- Self-Help & Personal Development
- Sports & Recreation
- Technology & Computing
- Travel & Adventure
- True Crime
- Current Events & Journalism

**Key Changes from Current List:**
- **Consolidated sub-genres**: Combined "Mystery & Crime" and similar overlapping categories
- **Added missing classics**: "Classics", "Poetry", "Western", "War Fiction", "Comedy & Humor"
- **Enhanced non-fiction**: Added "Sports", "Psychology", "Education", "Current Events"
- **Simplified specificity**: Removed very specific sub-genres like "Space Opera", "Cozy Mystery", "Paranormal Romance"
- **Modern inclusivity**: Added "LGBTQ+ Fiction" and "Current Events & Journalism"
- **Better organization**: Grouped related genres for easier navigation

#### Phase 2: Data Migration
1. Process all existing `books.enhanced_genres` data
2. Create `book_genres` relationships for existing assignments
3. Mark migrated data as `is_auto_assigned = TRUE`
4. Preserve original data during transition

#### Phase 3: Code Updates
1. Update API endpoints to use new schema
2. Modify UI components for new genre selection
3. Update TypeScript interfaces
4. Maintain backward compatibility during rollout

#### Phase 4: Legacy Cleanup
1. Remove `enhanced_genres` column after successful migration
2. Update `genreClassifier.ts` to work with database genres
3. Remove hardcoded genre lists from codebase

### 6. Technical Implementation Details

#### Updated TypeScript Interfaces
```typescript
export interface CuratedGenre {
  id: number
  name: string
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface BookGenre {
  id: number
  bookId: number
  genreId: number
  assignedBy: string
  assignedAt: string
  isAutoAssigned: boolean
  genre: CuratedGenre
}

export interface EnhancedBook extends Book {
  assignedGenres?: BookGenre[]
  suggestedGenres?: CuratedGenre[]
  // ... other existing fields
}
```

#### Genre Classification Service
- Refactor `genreClassifier.ts` to return suggestions instead of direct assignments
- New `GenreService` class for database operations
- Maintain existing pattern matching for suggestions

#### API Response Format
```json
{
  "id": 123,
  "title": "Book Title",
  "assignedGenres": [
    {
      "id": 1,
      "name": "Science Fiction",
      "isAutoAssigned": true,
      "assignedBy": "system",
      "assignedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "suggestedGenres": [
    {
      "id": 2,
      "name": "Space Opera",
      "description": "Epic science fiction in space settings"
    }
  ]
}
```

## Benefits

### For Users
- **Customizable**: Libraries can tailor genres to their specific collections
- **Intuitive**: Easy genre assignment with suggestions and search
- **Consistent**: Global genre list ensures consistency across locations
- **Flexible**: Support for both auto-classification and manual curation

### For Administrators
- **Controlled Growth**: Admin approval prevents genre proliferation
- **Data Quality**: Centralized management ensures consistent naming
- **Usage Insights**: Analytics on genre usage patterns
- **Scalable**: No code changes needed for new genres

### For Developers
- **Maintainable**: Reduces hardcoded lists in codebase
- **Extensible**: Easy to add new classification sources
- **Testable**: Clear separation of concerns
- **Performant**: Proper indexing and caching strategies

## Future Enhancements

1. **Genre Hierarchies**: Parent-child relationships between genres
2. **Genre Synonyms**: Alternative names for the same genre
3. **Machine Learning**: Improved auto-classification over time
4. **Genre Analytics**: Usage patterns and recommendations
5. **Import/Export**: Bulk genre management tools
6. **Genre Translations**: Multi-language support for genre names

## Risks and Mitigation

### Data Migration Risks
- **Mitigation**: Comprehensive testing with production data snapshots
- **Rollback Plan**: Maintain original data during transition period

### Performance Impact
- **Mitigation**: Proper indexing, caching, and query optimization
- **Monitoring**: Track query performance and user experience

### User Experience Disruption
- **Mitigation**: Gradual rollout with feature flags
- **Training**: Clear documentation and user guidance

## Success Metrics

1. **Genre Coverage**: Percentage of books with assigned genres increases
2. **User Adoption**: Number of users actively managing genres
3. **System Performance**: No degradation in search/filter performance
4. **Genre Quality**: Reduced duplicate or inconsistent genres
5. **User Satisfaction**: Positive feedback on genre management features

## Timeline

- **Week 1-2**: Database schema and migration scripts
- **Week 3-4**: Backend API implementation
- **Week 5-6**: Frontend UI components
- **Week 7-8**: Testing and refinement
- **Week 9**: Deployment and user training

## Conclusion

This dynamic genre management system transforms LibraryCard from a static, hardcoded genre system to a flexible, user-controlled taxonomy that can grow and adapt with each library's needs while maintaining consistency and data quality across the entire application.