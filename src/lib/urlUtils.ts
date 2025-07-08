/**
 * Convert a display name to a URL-friendly slug
 * Example: "Home Library" -> "home-library"
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Convert a URL slug back to a display name
 * Example: "home-library" -> "Home Library"
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Create a mapping of display names to slugs for reverse lookup
 */
export function createSlugMap(names: string[]): { [slug: string]: string } {
  const map: { [slug: string]: string } = {}
  names.forEach(name => {
    map[nameToSlug(name)] = name
  })
  return map
}