export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  auth_provider: string
  email_verified: boolean
  user_role: 'super_admin' | 'admin' | 'user'
  is_active: boolean
  created_at: string
  books_added: number
  locations_joined: number
  last_book_added: string | null
  location_names: string | null
}

export interface LocationInvitation {
  id: number
  location_id: number
  location_name?: string
  invited_email: string
  invitation_token: string
  invited_by: string
  invited_by_name?: string
  expires_at: string
  used_at?: string
  created_at: string
}

export interface Location {
  id: number
  name: string
  description?: string
  owner_id: string
  created_at: string
  single_shelf_location?: boolean
  activity_visibility?: 'private' | 'public'
  allow_user_exports?: number
  book_count?: number
  shelf_count?: number
  owner_name?: string
}

export interface Shelf {
  id: number
  name: string
  location_id: number
  created_at: string
  book_count?: number
}
