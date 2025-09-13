export interface Book {
  id: string
  isbn: string
  title: string
  authors: string[]
  description?: string
  thumbnail?: string
  publishedDate?: string
  categories?: string[]
  shelf_id?: number
  tags?: string[]
  added_by?: string
  location_name?: string
  shelf_name?: string
  status?: string // 'available', 'checked_out'
  checked_out_by?: string
  checked_out_by_name?: string
  checked_out_date?: string
  due_date?: string
}

// Shared interface for Google Books API items (used across components)
export interface GoogleBookItem {
  id: string
  isbn?: string
  title: string
  authors?: string[]
  description?: string
  covers?: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
    extraLarge?: string
  }
  publishedDate?: string
  categories?: string[]
  publisher?: string
  pageCount?: number
  averageRating?: number
  ratingsCount?: number
  source?: 'google' | 'openlibrary' | 'loc'
  sourceDisplayName?: string
  classification?: string
  lccn?: string
  language?: string
  // Legacy support for existing Google Books API format
  volumeInfo?: {
    title: string
    authors?: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    categories?: string[]
    publisher?: string
    pageCount?: number
    averageRating?: number
    ratingsCount?: number
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

export interface EnhancedBook extends Book {
  enhancedGenres?: string[]
  assignedGenres?: CuratedGenre[]  // New: Assigned curated genres (simplified for display)
  suggestedGenres?: CuratedGenre[] // New: Auto-suggested genres
  series?: string
  seriesNumber?: string
  current_series?: Series[] // New series system: which series this book belongs to
  openLibraryKey?: string
  extendedDescription?: string
  subjects?: string[]
  publisherInfo?: string
  pageCount?: number
  // Rating system fields
  userRating?: number | null      // Current user's rating (1-5 stars)
  userReview?: string | null      // Current user's review text
  userReviewStatus?: 'pending' | 'approved' | 'rejected' | null  // Current user's review moderation status
  userReviewRejectionReason?: string | null  // Reason for review rejection (if applicable)
  averageRating?: number | null   // Library-specific average rating
  ratingCount?: number            // Number of library-specific ratings
  googleAverageRating?: number | null  // Google Books average rating (for More Details)
  googleRatingCount?: number           // Google Books rating count (for More Details)
  ratingUpdatedAt?: string        // Last rating update timestamp
  // Cover selection fields
  alternative_covers?: CoverOption[]      // JSON array of cover options
  selected_cover_source?: CoverMetadata     // JSON metadata about selected cover
  
  // Library of Congress specific fields
  lccn?: string                   // Library of Congress Control Number
  locSubjects?: string[]          // LoC subject headings
  classification?: string         // Library classification number
  language?: string               // Language of the book
  physicalDescription?: string    // Physical format details
  notes?: string[]               // Additional notes from LoC
  
  // Multi-source data attribution
  sourceAttribution?: SourceAttribution
  allCovers?: EnhancedCoverOption[]  // All covers from all sources
  coverSources?: DataSource[]        // Which sources provided covers
}

// Rating-specific interfaces
export interface BookRating {
  id: number
  bookId: number
  userId: string
  rating: number
  reviewText?: string | null
  userName?: string
  createdAt: string
  updatedAt: string
  reviewStatus?: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  reviewRejectionReason?: string
}

export interface RateBookRequest {
  rating: number // 1-5
  reviewText?: string
  bookId: number
  userId: string
}

export interface BookRatingsResponse {
  userRating: number | null
  userReview?: string | null
  userReviewStatus?: 'pending' | 'approved' | 'rejected' | null
  averageRating: number | null
  ratingCount: number
  locationId: number
  allRatings?: BookRating[]  // For showing all reviews in More Details
}

// Review Moderation System Interfaces (GitHub Issue #256)
export interface PendingReview extends BookRating {
  bookTitle: string
  bookThumbnail?: string
  bookAuthors: string[]
}

export interface ReviewModerationRequest {
  reviewId: number
  action: 'approve' | 'reject' | 'delete'
  rejectionReason?: string
}

export interface ReviewModerationResponse {
  success: boolean
  message: string
  review?: BookRating
}

// Dynamic Genre Management System Interfaces

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

export interface GenreSuggestion {
  id: number
  suggestedName: string
  description?: string
  suggestedBy: string
  bookId?: number
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  reviewComment?: string
  createdAt: string
}

// API Request/Response interfaces for genre management

export interface CreateGenreRequest {
  name: string
  description?: string
}

export interface AssignGenreRequest {
  genreId: number
  isAutoAssigned?: boolean
}

export interface SuggestGenreRequest {
  suggestedName: string
  description?: string
  bookId?: number
}

export interface ReviewGenreSuggestionRequest {
  status: 'approved' | 'rejected'
  reviewComment?: string
}

export interface GenreClassificationResult {
  suggestedGenres: CuratedGenre[]
  confidence: number
}

// Data source types
export type DataSource = 'google' | 'openlibrary' | 'loc'

// Source attribution interface
export interface SourceAttribution {
  title: DataSource
  description: DataSource
  publishedDate: DataSource
  publisher: DataSource
  authors: DataSource
  subjects: DataSource
}

// Cover selection interfaces
export interface CoverOption {
  source: string
  url: string
  width?: number
  height?: number
}

export interface EnhancedCoverOption {
  source: DataSource
  url: string
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'extraLarge'
  metadata?: {
    width?: number
    height?: number
    quality?: 'low' | 'medium' | 'high'
  }
}

export interface CoverMetadata {
  source: string
  url: string
  selectedAt: string
  selectedBy: string
  google_id?: string
  selection_reason?: string
}

// 2FA/TOTP Types
export interface TOTPSetupResponse {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export interface TwoFactorStatus {
  enabled: boolean
  enabledAt: string | null
  backupCodes: {
    total: number
    used: number
    remaining: number
  }
}

export interface TOTPVerifyRequest {
  totpCode: string
}

export interface BackupCodeVerifyRequest {
  backupCode: string
}

// Series system interfaces

export interface Series {
  id: string
  user_id: string
  location_id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  sort_order: number
  book_count?: number // populated when fetching series with counts
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

export interface BookSeries {
  book_id: string
  series_id: string
  added_at: string
}

// API Request/Response interfaces for series

export interface CreateSeriesRequest {
  name: string
  description?: string
  color?: string
  sort_order?: number
  location_id?: number // Optional - will use user's primary location if not provided
}

export interface UpdateSeriesRequest {
  name?: string
  description?: string
  color?: string
  sort_order?: number
}

export interface AddBooksToSeriesRequest {
  book_ids: string[]
}

export interface SeriesWithBooks extends Series {
  books: EnhancedBook[]
}

export interface SeriesResponse {
  series: Series[]
}

export interface SeriesBooksResponse {
  series: Series
  books: EnhancedBook[]
  total: number
  page: number
  limit: number
}

// Series approval system interfaces

export interface ApproveSeriesRequest {
  approval_status: 'approved' | 'rejected'
  rejection_reason?: string
}

export interface PendingSeriesWithCreator extends Series {
  creator_name?: string
  creator_email?: string
  location_name?: string
}

export interface PendingSeriesResponse {
  series: PendingSeriesWithCreator[]
}

// Library Activity Sidebar Types

export interface ActivityItem {
  id: string
  type: 'recent_review' | 'newly_added' | 'popular_book' | 'checkout_activity'
  timestamp: string
  data: ActivityItemData
}

export interface ActivityItemData {
  book: EnhancedBook
  user?: {
    id: string
    first_name?: string
    last_name?: string
  }
  rating?: number
  review?: string
  action?: 'added' | 'checked_out' | 'checked_in' | 'rated'
  popularity_score?: number
  days_ago?: number
  rating_count?: number
  average_rating?: number
  recent_activity_count?: number
}

export interface LibraryActivityResponse {
  recent_reviews: ActivityItem[]
  newly_added: ActivityItem[]
  popular_books: ActivityItem[]
  checkout_activity: ActivityItem[]
}

export interface RecentReview {
  id: number
  book: EnhancedBook
  user_name?: string
  rating: number
  review?: string
  created_at: string
}

export interface NewlyAddedBook {
  book: EnhancedBook
  added_by_name?: string
  days_ago: number
  created_at: string
}

export interface PopularBook {
  book: EnhancedBook
  popularity_score: number
  rating_count: number
  average_rating?: number
  recent_activity_count: number
}

export interface SidebarPreferences {
  collapsed: boolean
  activeSection?: 'reviews' | 'new' | 'popular' | 'activity'
}