// Field selection system for optimizing API response sizes
// Reduces payload by only sending needed fields for specific UI contexts

import type { EnhancedBook } from './types'

// Define base field sets without circular references
const GRID_FIELDS = [
  'id',
  'title',
  'authors',
  'isbn',  // Essential book identifier, needed for MoreDetailsModal
  'thumbnail',
  'status',
  'shelf_id',  // Essential for book grouping by location
  'shelf_name',
  'location_name',
  'userRating',
  'averageRating',
  'ratingCount',
  'enhancedGenres',
  'assignedGenres',
  'series',
  'seriesNumber',
  'publishedDate',
  'checked_out_by_name',
  'checked_out_date',
  'tags',
  // Additional fields needed by BookGrid component and MoreDetailsModal
  'description',
  'extendedDescription',
  'subjects',
  'categories',  // Google Books categories, needed for MoreDetailsModal
  'pageCount',
  'publisherInfo',
  'openLibraryKey'
] as const

const DETAIL_ADDITIONAL_FIELDS = [
  'googleAverageRating',
  'googleRatingCount',
  'alternative_covers',
  'selected_cover_source'
] as const

const FULL_ADDITIONAL_FIELDS = [
  'checked_out_by',
  'due_date',
  'userReview',
  'ratingUpdatedAt',
  'lccn',
  'locSubjects',
  'classification',
  'language',
  'physicalDescription',
  'notes',
  'sourceAttribution',
  'allCovers',
  'coverSources',
  'suggestedGenres'
] as const

// Define field sets for different UI contexts
export const FIELD_SETS = {
  // Essential fields for book grid/list display (~60% reduction in payload)
  grid: GRID_FIELDS,
  
  // Additional fields for detailed view
  detail: [...GRID_FIELDS, ...DETAIL_ADDITIONAL_FIELDS] as const,
  
  // Full fields including admin/metadata (for admin users or search)
  full: [...GRID_FIELDS, ...DETAIL_ADDITIONAL_FIELDS, ...FULL_ADDITIONAL_FIELDS] as const,
  
  // Minimal fields for search results/autocomplete
  search: [
    'id',
    'title',
    'authors',
    'thumbnail',
    'isbn',
    'publishedDate'
  ] as const,
} as const

export type FieldSet = keyof typeof FIELD_SETS
export type GridFields = typeof FIELD_SETS.grid[number]
export type DetailFields = typeof FIELD_SETS.detail[number] 
export type FullFields = typeof FIELD_SETS.full[number]
export type SearchFields = typeof FIELD_SETS.search[number]

// Type-safe book interfaces for each field set
export type GridBook = Pick<EnhancedBook, GridFields>
export type DetailBook = Pick<EnhancedBook, DetailFields>
export type FullBook = Pick<EnhancedBook, FullFields>
export type SearchBook = Pick<EnhancedBook, SearchFields>

// Utility to filter book objects to specific field sets
export function selectBookFields<T extends FieldSet>(
  book: EnhancedBook, 
  fieldSet: T
): T extends 'grid' ? GridBook : 
   T extends 'detail' ? DetailBook :
   T extends 'search' ? SearchBook :
   FullBook {
  const fields = FIELD_SETS[fieldSet]
  const selectedBook: Record<string, unknown> = {}
  
  for (const field of fields) {
    if (field in book) {
      selectedBook[field] = book[field as keyof EnhancedBook]
    }
  }
  
  return selectedBook as T extends 'grid' ? GridBook : T extends 'detail' ? DetailBook : T extends 'search' ? SearchBook : FullBook
}

// Filter array of books
export function selectBooksFields<T extends FieldSet>(
  books: EnhancedBook[], 
  fieldSet: T
): Array<T extends 'grid' ? GridBook : 
          T extends 'detail' ? DetailBook :
          T extends 'search' ? SearchBook :
          FullBook> {
  return books.map(book => selectBookFields(book, fieldSet)) as Array<T extends 'grid' ? GridBook : T extends 'detail' ? DetailBook : T extends 'search' ? SearchBook : FullBook>
}

// Generate URL query parameter for field selection
export function getFieldsParam(fieldSet: FieldSet): string {
  return FIELD_SETS[fieldSet].join(',')
}

// Parse fields parameter from URL
export function parseFieldsParam(fieldsParam: string): string[] {
  return fieldsParam.split(',').filter(Boolean)
}

// Determine optimal field set based on context
export function getOptimalFieldSet(context: {
  viewMode: 'grid' | 'list' | 'detail'
  userRole: string
  isAdmin: boolean
  hasSearchQuery: boolean
}): FieldSet {
  const { viewMode, isAdmin, hasSearchQuery } = context
  
  if (hasSearchQuery) {
    return 'search'
  }
  
  if (viewMode === 'detail') {
    return isAdmin ? 'full' : 'detail'
  }
  
  // Grid and list views use same optimized fields
  return 'grid'
}

// Calculate approximate payload reduction
export function estimatePayloadReduction(
  bookCount: number, 
  fromFieldSet: FieldSet = 'full', 
  toFieldSet: FieldSet = 'grid'
): {
  originalFields: number
  optimizedFields: number
  reductionPercent: number
  originalSize: string
  optimizedSize: string
} {
  const originalFields = FIELD_SETS[fromFieldSet].length
  const optimizedFields = FIELD_SETS[toFieldSet].length
  const reductionPercent = Math.round((1 - optimizedFields / originalFields) * 100)
  
  // Rough estimate: ~100 bytes per field on average
  const avgBytesPerField = 100
  const originalSize = formatBytes(bookCount * originalFields * avgBytesPerField)
  const optimizedSize = formatBytes(bookCount * optimizedFields * avgBytesPerField)
  
  return {
    originalFields,
    optimizedFields,
    reductionPercent,
    originalSize,
    optimizedSize
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Development helper to show payload statistics
export function logPayloadStats(
  books: EnhancedBook[], 
  fieldSet: FieldSet = 'grid'
) {
  if (process.env.NODE_ENV !== 'development') return
  
  const stats = estimatePayloadReduction(books.length, 'full', fieldSet)
  
  console.group(`📊 Payload Optimization Stats (${fieldSet} fields)`)
  console.log(`📚 Books: ${books.length}`)
  console.log(`📦 Fields: ${stats.optimizedFields}/${stats.originalFields} (${stats.reductionPercent}% reduction)`)
  console.log(`💾 Estimated size: ${stats.optimizedSize} (was ${stats.originalSize})`)
  console.log(`🎯 Field set: ${FIELD_SETS[fieldSet].join(', ')}`)
  console.groupEnd()
}