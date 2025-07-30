# Library of Congress Integration Specification

**GitHub Issue**: #90  
**Feature**: Add Library of Congress as additional source for books  
**Date**: July 2025  

## Overview

This specification outlines the integration of the Library of Congress (LoC) Search/Retrieval via URL (SRU) API as a third data source for book metadata, alongside the existing Google Books API and OpenLibrary integration. The implementation will use intelligent data merging to provide the highest quality book information and comprehensive cover art selection.

## Current State

### Existing Data Sources
1. **Google Books API** (Primary)
   - Location: `src/lib/bookApi.ts:4-28`, `workers/books/google-cached.ts`
   - Provides: Basic book metadata, ratings, thumbnails
   - Strengths: Cover images, user ratings, comprehensive API

2. **OpenLibrary** (Fallback)
   - Location: `src/lib/bookApi.ts:32-58`, enhanced data in `getCachedEnhancedBookData`
   - Provides: Extended descriptions, subjects, series information
   - Strengths: Detailed subjects for genre classification, series data

### Current Data Flow
```
ISBN Input → Google Books API → OpenLibrary Enhancement → Genre Classification → User
```

## Proposed Integration

### New Data Flow
```
ISBN Input → [Google Books API || OpenLibrary || LoC SRU] → Intelligent Merging → Enhanced Result → User
```

### Library of Congress SRU API

**Base URL**: `http://lx2.loc.gov:210/LCDB`  
**Query Format**: SRU with CQL (Contextual Query Language)  
**Response Format**: MODS (Metadata Object Description Schema) XML

#### Key Endpoints
- **ISBN Search**: `http://lx2.loc.gov:210/LCDB?query=bath.isbn=${isbn}&operation=searchRetrieve&recordSchema=mods`
- **Title Search**: `http://lx2.loc.gov:210/LCDB?query=bath.title="${title}"&operation=searchRetrieve&recordSchema=mods`
- **Author Search**: `http://lx2.loc.gov:210/LCDB?query=bath.author="${author}"&operation=searchRetrieve&recordSchema=mods`

#### Expected Response Structure
```xml
<searchRetrieveResponse>
  <numberOfRecords>1</numberOfRecords>
  <records>
    <record>
      <recordData>
        <mods:mods>
          <mods:titleInfo>
            <mods:title>Book Title</mods:title>
          </mods:titleInfo>
          <mods:name type="personal">
            <mods:namePart>Author Name</mods:namePart>
          </mods:name>
          <mods:subject>
            <mods:topic>Subject Term</mods:topic>
          </mods:subject>
          <mods:identifier type="isbn">9781234567890</mods:identifier>
          <mods:originInfo>
            <mods:dateIssued>2023</mods:dateIssued>
            <mods:publisher>Publisher Name</mods:publisher>
          </mods:originInfo>
          <mods:abstract>Book description</mods:abstract>
        </mods:mods>
      </recordData>
    </record>
  </records>
</searchRetrieveResponse>
```

## Implementation Plan

### 1. Library of Congress API Module

**File**: `workers/books/loc-cached.ts`

```typescript
// Core functions to implement
export async function getCachedLocISBN(isbn: string, env: Env): Promise<LocBookData | null>
export async function getCachedLocSearch(query: string, env: Env): Promise<LocBookData[] | null>
export async function parseModsResponse(modsXml: string): LocBookData
```

**Features**:
- Cached SRU API calls following existing Google Books patterns
- XML MODS response parsing
- Error handling and fallbacks
- Cache invalidation functions

### 2. Enhanced Data Merging System

**File**: `src/lib/bookApi.ts` (Enhanced `fetchEnhancedBookData`)

#### Intelligent Field Selection Strategy

| Field | Priority Order | Logic |
|-------|---------------|-------|
| **Title** | LoC → Google Books → OpenLibrary | LoC most authoritative |
| **Authors** | Cross-validate all sources | Merge and dedupe |
| **Description** | Longest available | Compare lengths, select best |
| **Publication Date** | LoC → Google Books → OpenLibrary | LoC most accurate |
| **Publisher** | LoC → Google Books → OpenLibrary | LoC most authoritative |
| **ISBN** | Original input (validated against all) | Consistency check |
| **Subjects/Categories** | Merge all sources | For genre classification |
| **Series** | OpenLibrary → LoC → Google Books | OpenLibrary has best series data |
| **Page Count** | Google Books → LoC → OpenLibrary | Google Books most reliable |
| **Ratings** | Google Books only | LoC/OpenLibrary don't provide ratings |

#### Merging Algorithm
```typescript
interface DataMergingResult {
  primaryData: BookData
  sourceAttribution: {
    title: 'loc' | 'google' | 'openlibrary'
    description: 'loc' | 'google' | 'openlibrary'
    // ... other fields
  }
  allSources: {
    google?: GoogleBookData
    openLibrary?: OpenLibraryData
    loc?: LocBookData
  }
}

async function mergeBookData(
  google: GoogleBookData | null,
  openLibrary: OpenLibraryData | null, 
  loc: LocBookData | null
): Promise<DataMergingResult>
```

### 3. Comprehensive Cover Selection System

#### Current Cover Sources
- **Google Books**: `thumbnail`, `small`, `medium`, `large`, `extraLarge`
- **OpenLibrary**: `https://covers.openlibrary.org/b/id/{cover_id}-{size}.jpg`

#### Extended Cover Sources
- **Library of Congress**: MODS may include `<mods:url>` elements for cover images
- **Enhanced Discovery**: Use ISBN to query additional cover sources

#### Implementation
```typescript
interface CoverOption {
  source: 'google' | 'openlibrary' | 'loc' | 'external'
  url: string
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'extraLarge'
  metadata: {
    width?: number
    height?: number
    quality?: 'low' | 'medium' | 'high'
  }
}

async function aggregateAllCovers(
  isbn: string,
  title: string,
  author: string
): Promise<CoverOption[]>
```

**Enhanced CoverSelectionModal**:
- Group covers by source with source attribution
- Sort by quality/size within each source
- Allow users to preview all options
- Maintain existing selection workflow

### 4. Type System Updates

**File**: `workers/types/index.ts`

```typescript
// Library of Congress specific types
export interface LocBookData {
  isbn: string
  title: string
  authors: string[]
  description?: string
  subjects: string[]
  publisher?: string
  publishedDate?: string
  lccn?: string // Library of Congress Control Number
  series?: string
  language?: string
  physicalDescription?: string
  notes?: string[]
}

export interface LocSearchResponse {
  numberOfRecords: number
  records: LocRecord[]
}

export interface ModsData {
  titleInfo: { title: string }[]
  name: { namePart: string, type?: string }[]
  subject: { topic: string }[]
  identifier: { value: string, type: string }[]
  originInfo: { 
    dateIssued?: string
    publisher?: string
  }
  abstract?: string
  physicalDescription?: string
  note?: string[]
}
```

**File**: `src/lib/types.ts` (Enhanced EnhancedBook)

```typescript
export interface EnhancedBook extends Book {
  // ... existing fields
  
  // Source attribution
  sourceAttribution?: {
    title: DataSource
    description: DataSource
    publishedDate: DataSource
    publisher: DataSource
  }
  
  // Library of Congress specific
  lccn?: string
  locSubjects?: string[]
  
  // Enhanced cover system
  allCovers?: CoverOption[]
  coverSources?: ('google' | 'openlibrary' | 'loc')[]
}

type DataSource = 'google' | 'openlibrary' | 'loc'
```

### 5. Worker Orchestration

**File**: `workers/books/index.ts`

#### Concurrent API Strategy
```typescript
async function getEnhancedBookData(isbn: string, env: Env) {
  // Concurrent calls to all three sources
  const [googleData, openLibraryData, locData] = await Promise.allSettled([
    getCachedGoogleBooksISBN(isbn, env),
    getCachedOpenLibraryISBN(isbn, env), // New function
    getCachedLocISBN(isbn, env)
  ])
  
  // Intelligent merging
  return mergeBookData(
    googleData.status === 'fulfilled' ? googleData.value : null,
    openLibraryData.status === 'fulfilled' ? openLibraryData.value : null,
    locData.status === 'fulfilled' ? locData.value : null
  )
}
```

#### Performance Considerations
- **Timeout Management**: 5-second timeout per source
- **Fallback Strategy**: If primary sources fail, degrade gracefully
- **Cache Strategy**: 24-hour TTL for LoC data (stable/authoritative)
- **Error Handling**: Log but don't fail if one source is unavailable

### 6. Cache Strategy

**Cache Keys**:
- `loc:books:isbn:${isbn}` - LoC ISBN lookup
- `loc:books:search:${query}` - LoC search results
- `enhanced:book:v2:${isbn}` - New enhanced book data with all sources

**TTL Strategy**:
- **LoC Data**: 24 hours (authoritative, changes rarely)
- **Enhanced Merged Data**: 12 hours (balance between freshness and performance)
- **Cover Aggregation**: 48 hours (cover images change very rarely)

## Testing Strategy

### Unit Tests
1. **LoC API Integration**
   - Valid ISBN responses
   - Invalid ISBN handling
   - XML parsing accuracy
   - Error conditions

2. **Data Merging Logic**
   - Field priority selection
   - Cross-validation accuracy
   - Edge case handling (missing data)
   - Source attribution correctness

3. **Cover Aggregation**
   - All sources represented
   - Duplicate removal
   - Quality sorting
   - URL validation

### Integration Tests
1. **Full Book Lookup Flow**
   - End-to-end ISBN lookup
   - Performance benchmarks
   - Cache hit/miss scenarios
   - Fallback behavior

2. **Cover Selection Workflow**
   - Modal displays all options
   - User selection persistence
   - Source attribution accuracy

### Test ISBNs
- `9780136089599` - Well-covered book across all sources
- `9780262033848` - Academic book (LoC strong)
- `9781234567890` - Invalid ISBN (error handling)
- `9780486280615` - Classic book (OpenLibrary strong)

## Monitoring and Analytics

### Metrics to Track
- **Source Success Rates**: Which sources provide data most reliably
- **Data Quality Scores**: Completeness metrics per source
- **Performance Impact**: API call duration, cache hit rates
- **User Preferences**: Which covers are selected most often by source

### Logging Strategy
```typescript
// Example log structure
{
  isbn: "9780136089599",
  sources: {
    google: { success: true, responseTime: 245, dataScore: 8.5 },
    openLibrary: { success: true, responseTime: 890, dataScore: 7.2 },
    loc: { success: false, error: "timeout", responseTime: 5000 }
  },
  mergeStrategy: {
    title: "loc",
    description: "google", 
    publishedDate: "loc"
  },
  coversFound: 12,
  cacheHit: false
}
```

## Rollout Plan

### Phase 1: Core Integration (Week 1)
- [ ] LoC API module implementation
- [ ] Basic data merging
- [ ] Type system updates
- [ ] Unit tests

### Phase 2: Enhanced Features (Week 2)
- [ ] Comprehensive cover aggregation
- [ ] Advanced merging algorithms
- [ ] Performance optimization
- [ ] Integration tests

### Phase 3: Production Deployment (Week 3)
- [ ] Staging environment testing
- [ ] Performance monitoring setup
- [ ] Production deployment
- [ ] User feedback collection

## Risk Mitigation

### API Reliability
- **Risk**: LoC SRU API downtime or rate limiting
- **Mitigation**: Robust fallback to existing sources, comprehensive caching

### Performance Impact
- **Risk**: Additional API calls slow down book lookups
- **Mitigation**: Concurrent requests, aggressive caching, timeouts

### Data Quality
- **Risk**: Conflicting data between sources
- **Mitigation**: Clear priority rules, validation logic, source attribution

### XML Parsing Complexity
- **Risk**: MODS XML parsing errors
- **Mitigation**: Robust XML parsing, extensive error handling, fallback to simpler parsing

## Success Metrics

1. **Data Quality Improvement**: 15% increase in complete book records
2. **Cover Options**: 3x more cover options available per book
3. **User Satisfaction**: Positive feedback on enhanced book data
4. **Performance**: No increase in average response time
5. **Reliability**: 99.5% successful book lookups maintained

## Future Enhancements

1. **Additional Sources**: WorldCat, publishers' APIs
2. **Machine Learning**: Quality scoring algorithms
3. **User Feedback**: Data quality ratings from users
4. **Bulk Operations**: Enhanced bulk book processing with multi-source data

---

**Implementation Timeline**: 3 weeks  
**Estimated Effort**: 40-50 hours  
**Priority**: Medium-High (significant UX improvement)  
**Dependencies**: None (additive feature)