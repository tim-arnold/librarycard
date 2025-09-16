// Cloudflare Workers types
type D1Database = any;
type KVNamespace = any;
type R2Bucket = any;

export interface Env {
  DB: D1Database;
  DATABASE: D1Database; // Alias for DB
  NEXTAUTH_SECRET: string;
  JWT_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  FROM_EMAIL: string;
  APP_URL: string;
  ENVIRONMENT?: string;
  RESEND_API_KEY?: string;
  POSTMARK_API_TOKEN?: string;
  FRONTEND_URL?: string;
  GOOGLE_CLOUD_PROJECT_ID?: string;
  GOOGLE_APPLICATION_CREDENTIALS_JSON?: string;
  GOOGLE_API_KEY?: string;
  // Cloudflare KV for caching
  CACHE?: KVNamespace;
  // Cloudflare R2 for image storage
  R2_BUCKET?: R2Bucket;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password_hash?: string;
  auth_provider?: string;
  email_verified?: boolean;
  email_verification_token?: string;
  email_verification_expires?: string;
  user_role?: string;
  // Privacy & Display Settings (LCWEB-174)
  display_name_preference?: 'first_name' | 'full_name' | 'email' | 'custom_username' | 'anonymous';
  custom_username?: string;
  // 2FA fields
  totp_secret?: string;
  totp_enabled?: boolean;
  totp_enabled_at?: string;
  backup_codes?: string; // JSON array
}

export interface Location {
  id?: number;
  name: string;
  description?: string;
  owner_id: string;
  single_shelf_location?: boolean;
  // Privacy Settings (LCWEB-174)
  activity_visibility?: 'private' | 'public';
}

export interface Shelf {
  id?: number;
  name: string;
  location_id: number;
}

export interface Book {
  id?: number;
  isbn: string;
  title: string;
  authors: string | string[]; // Can be string or array
  description?: string;
  thumbnail?: string;
  published_date?: string;
  categories?: string | string[]; // Can be string or array
  shelf_id?: number;
  tags?: string | string[]; // Can be string or array
  added_by: string;
  status?: string; // 'available', 'checked_out'
  checked_out_by?: string;
  checked_out_date?: string;
  due_date?: string;
  // Enhanced book fields
  extended_description?: string;
  subjects?: string | string[]; // Can be string or array
  page_count?: number;
  average_rating?: number;
  ratings_count?: number;
  publisher_info?: string;
  open_library_key?: string;
  enhanced_genres?: string | string[]; // Can be string or array
  series?: string;
  series_number?: string;
  // Cover selection fields
  alternative_covers?: string | any[]; // JSON string or array
  selected_cover_source?: string | any; // JSON string or object
  cover_selection_date?: string;
  // Privacy fields (LCWEB-174)
  added_by_anonymous?: boolean;
  // Frontend camelCase aliases
  publishedDate?: string;
  extendedDescription?: string;
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  publisherInfo?: string;
  openLibraryKey?: string;
  enhancedGenres?: string | string[];
  seriesNumber?: string;
}

export interface LocationInvitation {
  id?: number;
  location_id: number;
  invited_email: string;
  invitation_token: string;
  invited_by: string;
  expires_at: string;
  used_at?: string;
  created_at?: string;
}

export interface BookRemovalRequest {
  id?: number;
  book_id: number;
  requester_id: string;
  reason: string;
  reason_details?: string;
  status: string;
  reviewed_by?: string;
  review_comment?: string;
  created_at?: string;
  reviewed_at?: string;
}

export interface SignupApprovalRequest {
  id?: number;
  email: string;
  first_name: string;
  last_name?: string;
  password_hash: string;
  auth_provider: string;
  status: string; // 'pending', 'approved', 'denied'
  requested_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_comment?: string;
  created_user_id?: string;
}

export const DEFAULT_SHELVES = [
  'my first shelf'
];

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

// Google Books API response types
export interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  description?: string;
  imageLinks?: Record<string, string>;
  averageRating?: number;
  ratingsCount?: number;
  categories?: string[];
  language?: string;
  previewLink?: string;
  infoLink?: string;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
}

export interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

export interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
  totalItems?: number;
}

// Library of Congress API response types
export interface LocBookData {
  isbn: string;
  title: string;
  authors: string[];
  description?: string;
  subjects: string[];
  publisher?: string;
  publishedDate?: string;
  lccn?: string; // Library of Congress Control Number
  series?: string;
  language?: string;
  physicalDescription?: string;
  notes?: string[];
  classification?: string;
  coverUrls?: string[];
}

export interface LocSearchResponse {
  numberOfRecords: number;
  records: LocRecord[];
}

export interface LocRecord {
  recordData: {
    mods: ModsData;
  };
}

export interface ModsData {
  titleInfo?: ModsTitleInfo[];
  name?: ModsName[];
  subject?: ModsSubject[];
  identifier?: ModsIdentifier[];
  originInfo?: ModsOriginInfo;
  abstract?: string;
  physicalDescription?: string;
  note?: string[];
  classification?: ModsClassification[];
  language?: ModsLanguage;
  relatedItem?: ModsRelatedItem[];
  location?: ModsLocation;
}

export interface ModsTitleInfo {
  title: string;
  subTitle?: string;
}

export interface ModsName {
  namePart: string;
  type?: string;
  role?: {
    roleTerm: string;
  };
}

export interface ModsSubject {
  topic?: string;
  geographic?: string;
  temporal?: string;
  genre?: string;
}

export interface ModsIdentifier {
  value: string;
  type: string;
}

export interface ModsOriginInfo {
  dateIssued?: string;
  publisher?: string;
  place?: {
    placeTerm: string;
  };
}

export interface ModsClassification {
  value: string;
  authority?: string;
}

export interface ModsLanguage {
  languageTerm: string;
}

export interface ModsRelatedItem {
  type?: string;
  titleInfo?: ModsTitleInfo;
}

export interface ModsLocation {
  url?: string;
}

// Data source attribution types
export type DataSource = 'google' | 'openlibrary' | 'loc';

export interface SourceAttribution {
  title: DataSource;
  description: DataSource;
  publishedDate: DataSource;
  publisher: DataSource;
  authors: DataSource;
  subjects: DataSource;
}

// Enhanced cover selection types
export interface CoverOption {
  source: DataSource;
  url: string;
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'extraLarge';
  metadata?: {
    width?: number;
    height?: number;
    quality?: 'low' | 'medium' | 'high';
  };
}

// Multi-source book data aggregation
export interface MultiSourceBookData {
  google?: GoogleBooksItem;
  openLibrary?: any; // TODO: Define OpenLibrary types
  loc?: LocBookData;
  mergedData: Book;
  sourceAttribution: SourceAttribution;
  allCovers: CoverOption[];
}

// 2FA/TOTP Types
export interface TOTPSetupRequest {
  totpCode: string; // For verification during setup
}

export interface TOTPSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TOTPVerifyRequest {
  totpCode: string;
}

export interface TOTPDisableRequest {
  password: string; // Require password confirmation
}

export interface BackupCodeVerifyRequest {
  backupCode: string;
}

export interface BackupCodesStatus {
  total: number;
  used: number;
  remaining: number;
}

export interface TwoFactorStatus {
  enabled: boolean;
  enabledAt: string | null;
  backupCodes: BackupCodesStatus;
}

// Privacy & Display Settings Types (LCWEB-174)
export type DisplayNamePreference = 'first_name' | 'full_name' | 'email' | 'custom_username' | 'anonymous';
export type ActivityVisibility = 'private' | 'public';
export type ActivityType = 'book_addition' | 'review' | 'checkout';

export interface UserActivityPrivacy {
  id: number;
  user_id: string;
  activity_type: ActivityType;
  activity_id: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisplayNameOptions {
  first_name?: string;
  full_name?: string;
  email?: string;
  custom_username?: string;
}

export interface PrivacySettings {
  locationPrivacy: ActivityVisibility;
  userDisplayPreference: DisplayNamePreference;
  customUsername?: string;
}

export interface UserDisplayInfo {
  displayName: string;
  isAnonymous: boolean;
  canViewRealName: boolean;
}