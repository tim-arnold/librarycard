import type { Book, EnhancedBook, DataSource, SourceAttribution, EnhancedCoverOption, GoogleBookItem } from '@/lib/types'
import { classifyGenres } from '@/lib/genreClassifier'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

export async function fetchBookData(isbn: string): Promise<Book | null> {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`)
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return null
    }

    const bookInfo = data.items[0].volumeInfo

    const book: Book = {
      id: `${isbn}-${Date.now()}`,
      isbn,
      title: bookInfo.title || 'Unknown Title',
      authors: bookInfo.authors || ['Unknown Author'],
      description: bookInfo.description,
      thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail,
      publishedDate: bookInfo.publishedDate,
      categories: bookInfo.categories
    }

    return book
  } catch (error) {
    console.error('Error fetching book data:', error)
    
    try {
      const openLibraryResponse = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
      const openLibraryData = await openLibraryResponse.json()
      
      if (openLibraryData.title) {
        const book: Book = {
          id: `${isbn}-${Date.now()}`,
          isbn,
          title: openLibraryData.title,
          authors: openLibraryData.authors?.map((author: { name: string }) => author.name) || ['Unknown Author'],
          description: openLibraryData.description?.value || openLibraryData.description,
          publishedDate: openLibraryData.publish_date,
          categories: openLibraryData.subjects?.slice(0, 3)
        }
        
        if (openLibraryData.covers && openLibraryData.covers[0]) {
          book.thumbnail = `https://covers.openlibrary.org/b/id/${openLibraryData.covers[0]}-M.jpg`
        }
        
        return book
      }
    } catch (openLibraryError) {
      console.error('OpenLibrary fallback failed:', openLibraryError)
    }
    
    return null
  }
}

export async function fetchEnhancedBookData(isbn: string): Promise<EnhancedBook | null> {
  try {
    // First get basic data from Google Books
    const googleResponse = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`)
    const googleData = await googleResponse.json()

    if (!googleData.items || googleData.items.length === 0) {
      return null
    }

    const bookInfo = googleData.items[0].volumeInfo

    // Create base book object from Google Books
    const enhancedBook: EnhancedBook = {
      id: `${isbn}-${Date.now()}`,
      isbn,
      title: bookInfo.title || 'Unknown Title',
      authors: bookInfo.authors || ['Unknown Author'],
      description: bookInfo.description,
      thumbnail: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail,
      publishedDate: bookInfo.publishedDate,
      categories: bookInfo.categories,
      publisherInfo: bookInfo.publisher,
      pageCount: bookInfo.pageCount,
      averageRating: bookInfo.averageRating,
      ratingCount: bookInfo.ratingsCount
    }

    // Try to enhance with OpenLibrary data
    try {
      // Search OpenLibrary for the book
      const searchResponse = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&limit=1`)
      const searchData = await searchResponse.json()
      
      if (searchData.docs && searchData.docs.length > 0) {
        const olDoc = searchData.docs[0]
        const workKey = olDoc.key
        
        if (workKey) {
          enhancedBook.openLibraryKey = workKey
          
          // Get detailed work information
          const workResponse = await fetch(`https://openlibrary.org${workKey}.json`)
          const workData = await workResponse.json()
          
          if (workData.subjects) {
            // Store raw subjects for reference
            enhancedBook.subjects = workData.subjects
            
            // Use our curated genre classification system
            const classifiedGenres = classifyGenres(
              enhancedBook.categories, // Google Books categories
              workData.subjects,       // OpenLibrary subjects
              process.env.NODE_ENV === 'development' // Enable debug in development
            )
            
            if (classifiedGenres.length > 0) {
              enhancedBook.enhancedGenres = classifiedGenres
            }
            
            // Extract series information
            const seriesSubjects = workData.subjects.filter((subject: string) => 
              subject.toLowerCase().startsWith('series:')
            )
            
            if (seriesSubjects.length > 0) {
              const seriesInfo = seriesSubjects[0].replace(/^series:\s*/i, '')
              enhancedBook.series = seriesInfo
            }
          }
          
          // Use OpenLibrary description if it's more detailed
          if (workData.description) {
            const olDescription = typeof workData.description === 'string' 
              ? workData.description 
              : workData.description.value
            
            if (olDescription && olDescription.length > (enhancedBook.description?.length || 0)) {
              enhancedBook.extendedDescription = olDescription
            }
          }
        }
      }
    } catch (olError) {
      console.log('OpenLibrary enhancement failed, using Google Books data only:', olError)
    }

    // If we don't have enhanced genres yet, try to classify from Google Books categories alone
    if (!enhancedBook.enhancedGenres && enhancedBook.categories) {
      const classifiedGenres = classifyGenres(
        enhancedBook.categories,
        undefined,
        process.env.NODE_ENV === 'development' // Enable debug in development
      )
      if (classifiedGenres.length > 0) {
        enhancedBook.enhancedGenres = classifiedGenres
      }
    }

    return enhancedBook
  } catch (error) {
    console.error('Error fetching enhanced book data:', error)
    return null
  }
}

export async function fetchEnhancedBookFromSearch(googleBookItem: GoogleBookItem): Promise<EnhancedBook | null> {
  // Handle both new format and legacy format
  let isbn: string | undefined
  let title: string
  let authors: string[]
  let description: string | undefined
  let thumbnail: string | undefined
  let publishedDate: string | undefined
  let categories: string[] | undefined
  let publisher: string | undefined
  let pageCount: number | undefined
  let averageRating: number | undefined
  let ratingsCount: number | undefined

  if (googleBookItem.volumeInfo) {
    // Legacy Google Books format
    isbn = googleBookItem.volumeInfo.industryIdentifiers?.find(
      (id: { type: string; identifier: string }) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier
    title = googleBookItem.volumeInfo.title
    authors = googleBookItem.volumeInfo.authors || ['Unknown Author']
    description = googleBookItem.volumeInfo.description
    thumbnail = googleBookItem.volumeInfo.imageLinks?.thumbnail
    publishedDate = googleBookItem.volumeInfo.publishedDate
    categories = googleBookItem.volumeInfo.categories
    publisher = googleBookItem.volumeInfo.publisher
    pageCount = googleBookItem.volumeInfo.pageCount
    averageRating = googleBookItem.volumeInfo.averageRating
    ratingsCount = googleBookItem.volumeInfo.ratingsCount
  } else {
    // Enhanced format
    isbn = googleBookItem.isbn
    title = googleBookItem.title
    authors = googleBookItem.authors || ['Unknown Author']
    description = googleBookItem.description
    thumbnail = googleBookItem.covers?.thumbnail || googleBookItem.covers?.small || googleBookItem.covers?.medium
    publishedDate = googleBookItem.publishedDate
    categories = googleBookItem.categories
    publisher = googleBookItem.publisher
    pageCount = googleBookItem.pageCount
    averageRating = googleBookItem.averageRating
    ratingsCount = googleBookItem.ratingsCount
  }

  // Try enhanced lookup if we have a real ISBN (not generated IDs)
  if (isbn && !isbn.startsWith('OL') && !isbn.startsWith('ol-') && !isbn.startsWith('loc-')) {
    const enhancedBook = await fetchEnhancedBookData(isbn)
    if (enhancedBook) {
      return enhancedBook
    }
    // If enhanced lookup fails, continue to fallback below
  }

  // Fallback to basic data - always return something useful
  const enhancedBook: EnhancedBook = {
    id: googleBookItem.id,
    isbn: isbn || googleBookItem.id, // Use Google Books ID as fallback
    title,
    authors,
    description,
    thumbnail,
    publishedDate,
    categories,
    publisherInfo: publisher,
    pageCount,
    averageRating,
    ratingCount: ratingsCount
  }

  // Apply genre classification to the fallback data too
  if (enhancedBook.categories) {
    const classifiedGenres = classifyGenres(
      enhancedBook.categories,
      undefined,
      process.env.NODE_ENV === 'development' // Enable debug in development
    )
    if (classifiedGenres.length > 0) {
      enhancedBook.enhancedGenres = classifiedGenres
    }
  }

  return enhancedBook
}

// Library of Congress API integration
const LOC_SRU_BASE = 'http://lx2.loc.gov:210/LCDB'

interface LocBookData {
  isbn: string
  title: string
  authors: string[]
  description?: string
  subjects: string[]
  publisher?: string
  publishedDate?: string
  lccn?: string
  series?: string
  language?: string
  classification?: string
  physicalDescription?: string
  notes?: string[]
  coverUrls?: string[]
}

async function fetchLocBookData(isbn: string): Promise<LocBookData | null> {
  try {
    const query = `bath.isbn=${isbn}`
    const sruUrl = `${LOC_SRU_BASE}?query=${encodeURIComponent(query)}&operation=searchRetrieve&recordSchema=mods&maximumRecords=1`
    
    const response = await fetch(sruUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'LibraryCard/1.0 (library management system)'
      },
      signal: AbortSignal.timeout(8000)
    })
    
    if (!response.ok) {
      console.warn(`Library of Congress API error for ISBN ${isbn}: ${response.status}`)
      return null
    }
    
    const xmlText = await response.text()
    return parseLocResponse(xmlText, isbn)
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn(`Library of Congress API timeout for ISBN ${isbn}`)
    } else {
      console.error(`Error fetching Library of Congress data for ISBN ${isbn}:`, error)
    }
    return null
  }
}

function parseLocResponse(xmlText: string, isbn: string): LocBookData | null {
  try {
    // Check if we have any records
    const numberOfRecordsMatch = xmlText.match(/<numberOfRecords>(\d+)<\/numberOfRecords>/)
    const numberOfRecords = numberOfRecordsMatch ? parseInt(numberOfRecordsMatch[1]) : 0
    
    if (numberOfRecords === 0) {
      return null
    }
    
    // Extract the MODS record content
    const modsMatch = xmlText.match(/<mods:mods[^>]*>([\s\S]*?)<\/mods:mods>/)
    if (!modsMatch) {
      console.warn(`No MODS record found in LoC response for ISBN ${isbn}`)
      return null
    }
    
    const modsContent = modsMatch[1]
    
    // Extract individual fields using regex
    const title = extractModsField(modsContent, 'title') || 'Unknown Title'
    const authors = extractModsAuthors(modsContent)
    const subjects = extractModsSubjects(modsContent)
    const description = extractModsField(modsContent, 'abstract')
    const publisher = extractModsField(modsContent, 'publisher')
    const publishedDate = extractModsField(modsContent, 'dateIssued')
    const lccn = extractModsIdentifier(modsContent, 'lccn')
    const language = extractModsField(modsContent, 'languageTerm')
    const classification = extractModsField(modsContent, 'classification')
    const notes = extractModsNotes(modsContent)
    const series = extractModsSeries(modsContent)
    const coverUrls = extractModsCoverUrls(modsContent)
    
    return {
      isbn,
      title,
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      description,
      subjects,
      publisher,
      publishedDate,
      lccn,
      language,
      classification,
      notes: notes.length > 0 ? notes : undefined,
      series,
      coverUrls: coverUrls.length > 0 ? coverUrls : undefined
    }
    
  } catch (error) {
    console.error(`Error parsing LoC XML response for ISBN ${isbn}:`, error)
    return null
  }
}

// Helper functions for parsing MODS XML
function extractModsField(modsContent: string, fieldName: string): string | undefined {
  const regex = new RegExp(`<mods:${fieldName}[^>]*>([\\s\\S]*?)<\\/mods:${fieldName}>`)
  const match = modsContent.match(regex)
  return match ? cleanXmlText(match[1]) : undefined
}

function extractModsAuthors(modsContent: string): string[] {
  const authors: string[] = []
  const nameMatches = Array.from(modsContent.matchAll(/<mods:name[^>]*>[\s\S]*?<mods:namePart[^>]*>(.*?)<\/mods:namePart>/g))
  
  for (const match of nameMatches) {
    const author = cleanXmlText(match[1])
    if (author && !authors.includes(author)) {
      authors.push(author)
    }
  }
  
  return authors
}

function extractModsSubjects(modsContent: string): string[] {
  const subjects: string[] = []
  
  const topicMatches = Array.from(modsContent.matchAll(/<mods:subject[^>]*>[\s\S]*?<mods:topic[^>]*>(.*?)<\/mods:topic>/g))
  for (const match of topicMatches) {
    const subject = cleanXmlText(match[1])
    if (subject && !subjects.includes(subject)) {
      subjects.push(subject)
    }
  }
  
  return subjects
}

function extractModsIdentifier(modsContent: string, type: string): string | undefined {
  const regex = new RegExp(`<mods:identifier[^>]*type=['"]${type}['"][^>]*>([\\s\\S]*?)<\\/mods:identifier>`)
  const match = modsContent.match(regex)
  return match ? cleanXmlText(match[1]) : undefined
}

function extractModsNotes(modsContent: string): string[] {
  const notes: string[] = []
  const noteMatches = Array.from(modsContent.matchAll(/<mods:note[^>]*>(.*?)<\/mods:note>/g))
  
  for (const match of noteMatches) {
    const note = cleanXmlText(match[1])
    if (note) {
      notes.push(note)
    }
  }
  
  return notes
}

function extractModsSeries(modsContent: string): string | undefined {
  const seriesMatch = modsContent.match(/<mods:relatedItem[^>]*type=['"]series['"][^>]*>[\s\S]*?<mods:titleInfo[^>]*>[\s\S]*?<mods:title[^>]*>(.*?)<\/mods:title>/)
  return seriesMatch ? cleanXmlText(seriesMatch[1]) : undefined
}

function extractModsCoverUrls(modsContent: string): string[] {
  const urls: string[] = []
  const urlMatches = Array.from(modsContent.matchAll(/<mods:location[^>]*>[\s\S]*?<mods:url[^>]*>(.*?)<\/mods:url>/g))
  
  for (const match of urlMatches) {
    const url = cleanXmlText(match[1])
    if (url && (url.includes('cover') || url.includes('image') || url.includes('thumbnail'))) {
      urls.push(url)
    }
  }
  
  return urls
}

function cleanXmlText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
}

// Enhanced multi-source book data fetching
export async function fetchMultiSourceBookData(isbn: string): Promise<EnhancedBook | null> {
  try {
    // Fetch from all three sources concurrently
    const [googleData, openLibraryData, locData] = await Promise.allSettled([
      fetchGoogleBooksData(isbn),
      fetchOpenLibraryData(isbn),
      fetchLocBookData(isbn)
    ])
    
    // Extract successful results
    const google = googleData.status === 'fulfilled' ? googleData.value : null
    const openLibrary = openLibraryData.status === 'fulfilled' ? openLibraryData.value : null
    const loc = locData.status === 'fulfilled' ? locData.value : null
    
    // If no sources returned data, return null
    if (!google && !openLibrary && !loc) {
      return null
    }
    
    // Merge data intelligently
    return mergeBookData(google, openLibrary, loc, isbn)
    
  } catch (error) {
    console.error('Error fetching multi-source book data:', error)
    return null
  }
}

async function fetchGoogleBooksData(isbn: string): Promise<any> {
  const response = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`)
  const data = await response.json()
  
  if (!data.items || data.items.length === 0) {
    return null
  }
  
  return data.items[0].volumeInfo
}

async function fetchOpenLibraryData(isbn: string): Promise<any> {
  try {
    // First try direct ISBN lookup
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    const data = await response.json()
    
    if (data.title) {
      return data
    }
  } catch (error) {
    console.log('OpenLibrary direct lookup failed, trying search:', error)
  }
  
  try {
    // Fallback to search
    const searchResponse = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&limit=1`)
    const searchData = await searchResponse.json()
    
    if (searchData.docs && searchData.docs.length > 0) {
      const workKey = searchData.docs[0].key
      if (workKey) {
        const workResponse = await fetch(`https://openlibrary.org${workKey}.json`)
        return await workResponse.json()
      }
    }
  } catch (error) {
    console.log('OpenLibrary search failed:', error)
  }
  
  return null
}

function mergeBookData(google: any, openLibrary: any, loc: LocBookData | null, isbn: string): EnhancedBook {
  // Determine best source for each field
  const sourceAttribution: SourceAttribution = {
    title: selectBestTitleSource(google, openLibrary, loc),
    description: selectBestDescriptionSource(google, openLibrary, loc),
    publishedDate: selectBestDateSource(google, openLibrary, loc),
    publisher: selectBestPublisherSource(google, openLibrary, loc),
    authors: selectBestAuthorsSource(google, openLibrary, loc),
    subjects: 'google' // We'll merge all subjects
  }
  
  // Build the enhanced book object
  const enhancedBook: EnhancedBook = {
    id: `${isbn}-${Date.now()}`,
    isbn,
    title: getBestTitle(google, openLibrary, loc, sourceAttribution.title),
    authors: getBestAuthors(google, openLibrary, loc, sourceAttribution.authors),
    description: getBestDescription(google, openLibrary, loc, sourceAttribution.description),
    publishedDate: getBestPublishedDate(google, openLibrary, loc, sourceAttribution.publishedDate),
    publisherInfo: getBestPublisher(google, openLibrary, loc, sourceAttribution.publisher),
    
    // Merge categories and subjects from all sources
    categories: mergeCategories(google, openLibrary, loc),
    subjects: mergeSubjects(google, openLibrary, loc),
    
    // Google Books specific fields (best source for these)
    thumbnail: google?.imageLinks?.thumbnail || google?.imageLinks?.smallThumbnail,
    pageCount: google?.pageCount,
    averageRating: google?.averageRating,
    ratingCount: google?.ratingsCount,
    
    // OpenLibrary specific fields
    openLibraryKey: openLibrary?.key,
    series: openLibrary?.series?.[0] || loc?.series,
    
    // Library of Congress specific fields
    lccn: loc?.lccn,
    locSubjects: loc?.subjects,
    classification: loc?.classification,
    language: loc?.language,
    physicalDescription: loc?.physicalDescription,
    notes: loc?.notes,
    
    // Enhanced features
    sourceAttribution,
    allCovers: aggregateAllCovers(google, openLibrary, loc),
    coverSources: getCoverSources(google, openLibrary, loc)
  }
  
  // Apply genre classification using all available subjects
  const allSubjects = [...(enhancedBook.categories || []), ...(enhancedBook.subjects || [])]
  if (allSubjects.length > 0) {
    const classifiedGenres = classifyGenres(
      enhancedBook.categories,
      enhancedBook.subjects,
      process.env.NODE_ENV === 'development'
    )
    if (classifiedGenres.length > 0) {
      enhancedBook.enhancedGenres = classifiedGenres
    }
  }
  
  return enhancedBook
}

// Source selection functions
function selectBestTitleSource(google: any, openLibrary: any, loc: LocBookData | null): DataSource {
  // Prefer LoC for authoritative titles, then Google Books, then OpenLibrary
  if (loc?.title && loc.title !== 'Unknown Title') return 'loc'
  if (google?.title) return 'google'
  if (openLibrary?.title) return 'openlibrary'
  return 'google'
}

function selectBestDescriptionSource(google: any, openLibrary: any, loc: LocBookData | null): DataSource {
  // Select the longest description
  const googleLength = google?.description?.length || 0
  const openLibraryLength = typeof openLibrary?.description === 'string' 
    ? openLibrary.description.length 
    : openLibrary?.description?.value?.length || 0
  const locLength = loc?.description?.length || 0
  
  if (locLength >= googleLength && locLength >= openLibraryLength) return 'loc'
  if (googleLength >= openLibraryLength) return 'google'
  return 'openlibrary'
}

function selectBestDateSource(google: any, openLibrary: any, loc: LocBookData | null): DataSource {
  // Prefer LoC for authoritative publication dates
  if (loc?.publishedDate) return 'loc'
  if (google?.publishedDate) return 'google'
  if (openLibrary?.publish_date) return 'openlibrary'
  return 'google'
}

function selectBestPublisherSource(google: any, openLibrary: any, loc: LocBookData | null): DataSource {
  // Prefer LoC for authoritative publisher info
  if (loc?.publisher) return 'loc'
  if (google?.publisher) return 'google'
  if (openLibrary?.publishers?.[0]) return 'openlibrary'
  return 'google'
}

function selectBestAuthorsSource(google: any, openLibrary: any, loc: LocBookData | null): DataSource {
  // Cross-validate authors - prefer LoC for consistency
  if (loc?.authors && loc.authors.length > 0 && loc.authors[0] !== 'Unknown Author') return 'loc'
  if (google?.authors && google.authors.length > 0) return 'google'
  if (openLibrary?.authors) return 'openlibrary'
  return 'google'
}

// Data extraction functions
function getBestTitle(google: any, openLibrary: any, loc: LocBookData | null, source: DataSource): string {
  switch (source) {
    case 'loc': return loc?.title || 'Unknown Title'
    case 'google': return google?.title || 'Unknown Title'
    case 'openlibrary': return openLibrary?.title || 'Unknown Title'
    default: return 'Unknown Title'
  }
}

function getBestAuthors(google: any, openLibrary: any, loc: LocBookData | null, source: DataSource): string[] {
  switch (source) {
    case 'loc': return loc?.authors || ['Unknown Author']
    case 'google': return google?.authors || ['Unknown Author']
    case 'openlibrary': 
      return openLibrary?.authors?.map((author: any) => author.name || author) || ['Unknown Author']
    default: return ['Unknown Author']
  }
}

function getBestDescription(google: any, openLibrary: any, loc: LocBookData | null, source: DataSource): string | undefined {
  switch (source) {
    case 'loc': return loc?.description
    case 'google': return google?.description
    case 'openlibrary': 
      return typeof openLibrary?.description === 'string' 
        ? openLibrary.description 
        : openLibrary?.description?.value
    default: return undefined
  }
}

function getBestPublishedDate(google: any, openLibrary: any, loc: LocBookData | null, source: DataSource): string | undefined {
  switch (source) {
    case 'loc': return loc?.publishedDate
    case 'google': return google?.publishedDate
    case 'openlibrary': return openLibrary?.publish_date
    default: return undefined
  }
}

function getBestPublisher(google: any, openLibrary: any, loc: LocBookData | null, source: DataSource): string | undefined {
  switch (source) {
    case 'loc': return loc?.publisher
    case 'google': return google?.publisher
    case 'openlibrary': return openLibrary?.publishers?.[0]
    default: return undefined
  }
}

function mergeCategories(google: any, openLibrary: any, loc: LocBookData | null): string[] {
  const categories: string[] = []
  
  if (google?.categories) {
    categories.push(...google.categories)
  }
  
  if (openLibrary?.subjects) {
    categories.push(...openLibrary.subjects.slice(0, 5)) // Limit OpenLibrary subjects
  }
  
  if (loc?.subjects) {
    categories.push(...loc.subjects.slice(0, 5)) // Limit LoC subjects
  }
  
  // Deduplicate and return
  return Array.from(new Set(categories))
}

function mergeSubjects(google: any, openLibrary: any, loc: LocBookData | null): string[] {
  const subjects: string[] = []
  
  if (google?.categories) {
    subjects.push(...google.categories)
  }
  
  if (openLibrary?.subjects) {
    subjects.push(...openLibrary.subjects)
  }
  
  if (loc?.subjects) {
    subjects.push(...loc.subjects)
  }
  
  // Deduplicate and return
  return Array.from(new Set(subjects))
}

function aggregateAllCovers(google: any, openLibrary: any, loc: LocBookData | null): EnhancedCoverOption[] {
  const covers: EnhancedCoverOption[] = []
  
  // Google Books covers
  if (google?.imageLinks) {
    Object.entries(google.imageLinks).forEach(([size, url]) => {
      covers.push({
        source: 'google',
        url: url as string,
        size: size as any,
        metadata: {
          quality: size === 'extraLarge' ? 'high' : size === 'large' ? 'medium' : 'low'
        }
      })
    })
  }
  
  // OpenLibrary covers
  if (openLibrary?.covers) {
    openLibrary.covers.forEach((coverId: number) => {
      ['S', 'M', 'L'].forEach(size => {
        covers.push({
          source: 'openlibrary',
          url: `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`,
          size: size === 'L' ? 'large' : size === 'M' ? 'medium' : 'small',
          metadata: {
            quality: size === 'L' ? 'high' : size === 'M' ? 'medium' : 'low'
          }
        })
      })
    })
  }
  
  // Library of Congress covers
  if (loc?.coverUrls) {
    loc.coverUrls.forEach(url => {
      covers.push({
        source: 'loc',
        url,
        size: 'medium', // Default size for LoC
        metadata: {
          quality: 'medium'
        }
      })
    })
  }
  
  return covers
}

function getCoverSources(google: any, openLibrary: any, loc: LocBookData | null): DataSource[] {
  const sources: DataSource[] = []
  
  if (google?.imageLinks && Object.keys(google.imageLinks).length > 0) {
    sources.push('google')
  }
  
  if (openLibrary?.covers && openLibrary.covers.length > 0) {
    sources.push('openlibrary')
  }
  
  if (loc?.coverUrls && loc.coverUrls.length > 0) {
    sources.push('loc')
  }
  
  return sources
}