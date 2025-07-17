import { nameToSlug } from '@/lib/urlUtils'

// Generate URL path based on current filters
export function generateLibraryFilterUrl(
  locationFilter: string,
  shelfFilter: string,
  searchTerm: string,
  checkoutFilter: string
): string {
  const segments = []
  
  // Add location if set (convert to slug)
  if (locationFilter) segments.push(nameToSlug(locationFilter))
  
  // Add shelf if set (only if location is also set, convert to slug)
  if (shelfFilter && locationFilter) segments.push(nameToSlug(shelfFilter))
  
  // Create base path
  const basePath = segments.length > 0 ? `/library/${segments.join('/')}` : '/library'
  
  // Add search params for other filters
  const searchParams = new URLSearchParams()
  if (searchTerm) searchParams.set('search', searchTerm)
  // Note: categoryFilter is not included in URL to avoid race conditions
  if (checkoutFilter) searchParams.set('status', checkoutFilter)
  
  return basePath + (searchParams.toString() ? `?${searchParams.toString()}` : '')
}