# Book Cover Selection Feature Specification

**GitHub Issue**: [#46](https://github.com/tim-arnold/libarycard/issues/46)  
**Created**: July 13, 2025  
**Status**: Planning  

## Problem Statement

Currently, when adding books to LibraryCard, the system automatically selects cover images from Google Books API. However, these covers often don't match the actual editions in users' libraries, leading to visual inconsistencies in the catalog.

### User Feedback
> "The images coming from google books are rarely a match to the editions in the library."

### Current Limitations
- Single cover image per book automatically selected
- No user choice in cover selection
- Google Books API returns first result only
- Covers may not match physical book editions

## Proposed Solution

Leverage Google Books API's existing support for multiple editions to allow users with `can_add_books` permission to choose from different cover images for the same book.

### Key Discovery
Google Books API provides access to different editions of books through search queries. Example: [Calico Joe editions](https://www.google.com/books/edition/Calico_Joe/FmPKzh4f9y8C?kptab=editions). We can use `intitle:"Title"+inauthor:Author` searches to find multiple editions with different covers.

## Technical Approach

### 1. Google Books API Integration

**Current Implementation** (`src/lib/bookApi.ts`):
```typescript
// Takes only first result
const bookInfo = data.items[0].volumeInfo
```

**Enhanced Implementation**:
```typescript
// Search for multiple editions
const query = `intitle:"${title}"+inauthor:${author}`;
const response = await fetch(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=20`);
```

**Available Image Sizes**:
- `smallThumbnail`: ~80px wide
- `thumbnail`: ~128px wide  
- `small`: ~300px wide
- `medium`: ~575px wide
- `large`: ~800px wide
- `extraLarge`: ~1280px wide

### 2. Database Schema Changes

**New Fields** (add to books table):
```sql
ALTER TABLE books ADD COLUMN alternative_covers TEXT; -- JSON array
ALTER TABLE books ADD COLUMN selected_cover_source TEXT; -- metadata
ALTER TABLE books ADD COLUMN cover_selection_date TEXT; -- timestamp
```

**Example Data Structure**:
```json
{
  "alternative_covers": [
    {
      "source": "google_books",
      "google_id": "FmPKzh4f9y8C",
      "isbn": "9780553801507",
      "publisher": "Bantam",
      "publishedDate": "2012",
      "thumbnail": "https://books.google.com/books/content?id=...",
      "small": "https://books.google.com/books/content?id=...",
      "medium": "https://books.google.com/books/content?id=..."
    }
  ],
  "selected_cover_source": {
    "source": "google_books",
    "google_id": "FmPKzh4f9y8C",
    "selection_reason": "user_selected"
  }
}
```

### 3. API Endpoints

#### New Endpoint: `/api/books/editions`
```typescript
GET /api/books/editions?title=${title}&author=${author}

Response: {
  "editions": [
    {
      "id": "google_books_id",
      "isbn": "9780553801507",
      "title": "Calico Joe",
      "authors": ["John Grisham"],
      "publisher": "Bantam",
      "publishedDate": "2012",
      "covers": {
        "thumbnail": "url",
        "small": "url", 
        "medium": "url"
      },
      "pageCount": 208,
      "description": "..."
    }
  ]
}
```

#### Enhanced Endpoint: `/api/books` (POST/PUT)
Add support for `selectedCover` parameter in book creation/update.

### 4. Frontend Components

#### Cover Selection Modal
**Component**: `src/components/CoverSelectionModal.tsx`

**Features**:
- Grid layout of available covers
- Large preview on hover/click
- Edition metadata display (publisher, year, ISBN)
- "Use This Cover" action buttons
- Search/filter functionality

**Props**:
```typescript
interface CoverSelectionModalProps {
  title: string;
  author: string;
  currentCover?: string;
  onCoverSelect: (cover: CoverOption) => void;
  onClose: () => void;
  open: boolean;
}
```

#### Enhanced Book Components

**AddBooks Enhancement**:
- Add "Choose Different Cover" button after initial book selection
- Integrate cover selection into existing workflow

**Book Editing Enhancement**:
- Add cover selection to book edit forms
- Show current cover with "Change Cover" option

### 5. Permission System Integration

**Required Permission**: `can_add_books`

**Implementation**:
```typescript
// Check permission before showing cover selection
const canSelectCover = userPermissions.includes('can_add_books');
```

**UI Behavior**:
- Hide cover selection UI for users without permission
- Show read-only cover display for unauthorized users

## User Experience Flow

### 1. Book Addition Flow
```
1. User searches for book → existing search results
2. User selects book → book preview modal 
3. [NEW] "Choose Different Cover" button appears
4. Click opens Cover Selection Modal
5. User browses editions and selects cover
6. Modal closes, selected cover shown in preview
7. User confirms book addition as normal
```

### 2. Book Editing Flow
```
1. User opens book details/edit
2. [NEW] "Change Cover" button near current cover
3. Click opens Cover Selection Modal
4. User selects new cover
5. Book updated with new cover
```

### 3. Default Behavior
- **Unchanged**: Books without cover selection use first Google Books result
- **Backward Compatible**: Existing books continue working normally
- **Progressive Enhancement**: Cover selection is optional feature

## Implementation Timeline

### Phase 1: Backend Foundation (Day 1)
- [ ] Database schema updates and migration
- [ ] `/api/books/editions` endpoint implementation
- [ ] Enhanced Google Books API integration
- [ ] Unit tests for edition fetching

### Phase 2: Core UI Components (Day 2)
- [ ] `CoverSelectionModal` component
- [ ] Integration with existing AddBooks workflow
- [ ] Permission checking and UI gating
- [ ] Cover caching and performance optimization

### Phase 3: Book Management Integration (Day 3)
- [ ] Book editing cover selection
- [ ] Enhanced book preview with cover options
- [ ] UI/UX polish and responsive design
- [ ] End-to-end testing

### Phase 4: Testing & Deployment (Day 4)
- [ ] Comprehensive testing across browsers
- [ ] Performance testing with API rate limits
- [ ] Documentation updates
- [ ] Staging deployment and user testing

## Technical Considerations

### Performance
- **API Caching**: Cache edition results for popular titles
- **Lazy Loading**: Load cover selection only when requested
- **Image Optimization**: Use appropriate cover sizes for context
- **Rate Limiting**: Respect Google Books API limits

### Error Handling
- **API Failures**: Graceful fallback to existing behavior
- **Missing Covers**: Show placeholder or text-only options
- **Network Issues**: Retry logic and offline indicators
- **Permission Errors**: Clear messaging about access requirements

### Browser Compatibility
- **Modern Browsers**: Full feature support
- **Fallback**: Essential functionality for older browsers
- **Mobile**: Touch-friendly cover selection interface
- **Accessibility**: Screen reader support and keyboard navigation

## Testing Requirements

### Unit Tests
- [ ] Edition fetching from Google Books API
- [ ] Cover selection persistence
- [ ] Permission validation
- [ ] Database schema changes

### Integration Tests
- [ ] End-to-end book addition with cover selection
- [ ] Book editing with cover changes
- [ ] Permission enforcement
- [ ] API error handling

### User Acceptance Testing
- [ ] Cover selection improves catalog visual accuracy
- [ ] Feature is intuitive and discoverable
- [ ] Performance is acceptable
- [ ] Permission system works correctly

## Success Metrics

### Functionality
- [ ] Users can select from multiple cover options
- [ ] Cover selection works in both add and edit flows
- [ ] Feature respects permission system
- [ ] Backward compatibility maintained

### Performance  
- [ ] Cover selection loads within 2 seconds
- [ ] No impact on existing book addition speed
- [ ] API rate limits respected
- [ ] Caching reduces repeated requests

### User Experience
- [ ] Feature is discoverable by users with permission
- [ ] Cover selection interface is intuitive
- [ ] Selected covers improve catalog appearance
- [ ] No broken functionality for any user type

## Future Enhancements

### Potential Additions
- **Upload Custom Covers**: Allow users to upload their own images
- **Bulk Cover Update**: Select covers for multiple books at once
- **Cover History**: Track and revert cover changes
- **Community Covers**: Share cover selections between users
- **Auto-Suggestions**: ML-based cover recommendations

### API Integrations
- **OpenLibrary**: Alternative cover source integration
- **WorldCat**: Academic/library catalog covers
- **Publisher APIs**: Direct publisher cover access

## Dependencies

### External
- **Google Books API**: Primary data source (existing)
- **React**: UI framework (existing)
- **Material-UI**: Component library (existing)

### Internal
- **Permission System**: User capability checking (existing)
- **Book Management**: Core book CRUD operations (existing)
- **Database**: D1 database with schema updates (new)

## Risk Assessment

### Low Risk
- **API Integration**: Building on existing Google Books usage
- **UI Components**: Following established patterns
- **Permission System**: Using existing authorization

### Medium Risk
- **Database Changes**: Schema migration needs testing
- **Performance**: API rate limits and caching strategy
- **User Adoption**: Feature discoverability

### Mitigation Strategies
- **Staging Testing**: Comprehensive testing before production
- **Gradual Rollout**: Feature flag for controlled deployment
- **Fallback Behavior**: Robust error handling and graceful degradation
- **Documentation**: Clear user guides and admin instructions

---

**Specification Version**: 1.0  
**Last Updated**: July 13, 2025  
**Review Required**: Before Phase 1 implementation