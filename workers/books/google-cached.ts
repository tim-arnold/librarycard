import { Env, GoogleBooksResponse } from '../types';
import { CacheManager, CacheKeys, CacheTTL } from '../cache/kv';

function googleBooksUrl(path: string, params: Record<string, string>, env: Env): string {
  const url = new URL(`https://www.googleapis.com/books/v1/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (env.GOOGLE_BOOKS_API_KEY) url.searchParams.set('key', env.GOOGLE_BOOKS_API_KEY);
  return url.toString();
}

// Utility function to ensure Google Books thumbnail URLs use HTTPS
function ensureHttps(url: string | undefined): string | undefined {
  if (!url) return url
  if (url.startsWith('http://books.google.com/')) {
    return url.replace('http://books.google.com/', 'https://books.google.com/')
  }
  return url
}

/**
 * Cached Google Books API functions with automatic fallback
 */

/**
 * Cached Google Books ISBN lookup
 */
export async function getCachedGoogleBooksISBN(isbn: string, env: Env): Promise<any | null> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.googleBooksISBN(isbn);
  
  // Try to get from cache first
  const cachedResult = await cache.get<any>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Fallback to Google Books API
  try {
    const response = await fetch(googleBooksUrl('volumes', { q: `isbn:${isbn}` }, env));

    if (!response.ok) {
      console.warn(`Google Books API error for ISBN ${isbn}: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      // Cache null result to avoid repeated API calls for invalid ISBNs
      await cache.set(cacheKey, null, CacheTTL.GOOGLE_BOOKS);
      return null;
    }
    
    const bookInfo = data.items[0].volumeInfo;
    
    const result = {
      id: data.items[0].id,
      isbn,
      title: bookInfo.title || 'Unknown Title',
      authors: bookInfo.authors || ['Unknown Author'],
      description: bookInfo.description,
      thumbnail: ensureHttps(bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail),
      publishedDate: bookInfo.publishedDate,
      categories: bookInfo.categories || [],
      publisher: bookInfo.publisher,
      pageCount: bookInfo.pageCount,
      averageRating: bookInfo.averageRating,
      ratingsCount: bookInfo.ratingsCount,
      language: bookInfo.language,
      previewLink: bookInfo.previewLink,
      infoLink: bookInfo.infoLink,
      imageLinks: bookInfo.imageLinks || {},
      industryIdentifiers: bookInfo.industryIdentifiers || [],
      maturityRating: bookInfo.maturityRating,
      allowAnonLogging: bookInfo.allowAnonLogging,
      contentVersion: bookInfo.contentVersion
    };
    
    // Cache the result
    await cache.set(cacheKey, result, CacheTTL.GOOGLE_BOOKS);
    
    return result;
    
  } catch (error) {
    console.error(`Error fetching Google Books data for ISBN ${isbn}:`, error);
    return null;
  }
}

/**
 * Cached Google Books search
 */
export async function getCachedGoogleBooksSearch(query: string, env: Env, maxResults: number = 10): Promise<any[] | null> {
  const cache = new CacheManager(env);
  const cacheKey = CacheKeys.googleBooksSearch(query);
  
  // Try to get from cache first
  const cachedResult = await cache.get<any[]>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Fallback to Google Books API
  try {
    const response = await fetch(
      googleBooksUrl('volumes', { q: query, maxResults: String(maxResults) }, env)
    );
    
    if (!response.ok) {
      console.warn(`Google Books API search error for query "${query}": ${response.status}`);
      return null;
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      // Cache empty result to avoid repeated API calls for queries with no results
      await cache.set(cacheKey, [], CacheTTL.GOOGLE_BOOKS);
      return [];
    }
    
    const results = data.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;
      const isbn = volumeInfo.industryIdentifiers?.find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;
      
      return {
        id: item.id,
        isbn: isbn || item.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || ['Unknown Author'],
        description: volumeInfo.description,
        thumbnail: ensureHttps(volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail),
        publishedDate: volumeInfo.publishedDate,
        categories: volumeInfo.categories || [],
        publisher: volumeInfo.publisher,
        pageCount: volumeInfo.pageCount,
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        language: volumeInfo.language,
        previewLink: volumeInfo.previewLink,
        infoLink: volumeInfo.infoLink,
        imageLinks: volumeInfo.imageLinks || {},
        industryIdentifiers: volumeInfo.industryIdentifiers || [],
        maturityRating: volumeInfo.maturityRating,
        allowAnonLogging: volumeInfo.allowAnonLogging,
        contentVersion: volumeInfo.contentVersion
      };
    });
    
    // Cache the result
    await cache.set(cacheKey, results, CacheTTL.GOOGLE_BOOKS);
    
    return results;
    
  } catch (error) {
    console.error(`Error searching Google Books for query "${query}":`, error);
    return null;
  }
}

/**
 * Cached Google Books volume lookup by ID
 */
export async function getCachedGoogleBooksVolume(volumeId: string, env: Env): Promise<any | null> {
  const cache = new CacheManager(env);
  const cacheKey = `google:books:volume:${volumeId}`;
  
  // Try to get from cache first
  const cachedResult = await cache.get<any>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Fallback to Google Books API
  try {
    const response = await fetch(googleBooksUrl(`volumes/${volumeId}`, {}, env));
    
    if (!response.ok) {
      console.warn(`Google Books API volume error for ID ${volumeId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const volumeInfo = data.volumeInfo;
    
    const result = {
      id: data.id,
      isbn: volumeInfo.industryIdentifiers?.find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || data.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || ['Unknown Author'],
      description: volumeInfo.description,
      thumbnail: ensureHttps(volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail),
      publishedDate: volumeInfo.publishedDate,
      categories: volumeInfo.categories || [],
      publisher: volumeInfo.publisher,
      pageCount: volumeInfo.pageCount,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      language: volumeInfo.language,
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      imageLinks: volumeInfo.imageLinks || {},
      industryIdentifiers: volumeInfo.industryIdentifiers || [],
      maturityRating: volumeInfo.maturityRating,
      allowAnonLogging: volumeInfo.allowAnonLogging,
      contentVersion: volumeInfo.contentVersion
    };
    
    // Cache the result
    await cache.set(cacheKey, result, CacheTTL.GOOGLE_BOOKS);
    
    return result;
    
  } catch (error) {
    console.error(`Error fetching Google Books volume ${volumeId}:`, error);
    return null;
  }
}

/**
 * Cached book editions lookup (used by book cover selection)
 */
export async function getCachedBookEditions(title: string, author: string, env: Env): Promise<any[]> {
  const cache = new CacheManager(env);
  const query = `intitle:"${title}"+inauthor:${author}`;
  const cacheKey = CacheKeys.googleBooksSearch(query);
  
  // Try to get from cache first
  const cachedResult = await cache.get<any[]>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Fallback to Google Books API
  try {
    const response = await fetch(
      googleBooksUrl('volumes', { q: query, maxResults: '20' }, env)
    );
    
    if (!response.ok) {
      console.warn(`Google Books API editions error for "${title}" by ${author}: ${response.status}`);
      return [];
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      // Cache empty result
      await cache.set(cacheKey, [], CacheTTL.GOOGLE_BOOKS);
      return [];
    }
    
    const editions = data.items
      .map((item: any) => {
        const volumeInfo = item.volumeInfo;
        const isbn = volumeInfo.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier;
        
        const covers: any = {};
        if (volumeInfo.imageLinks) {
          Object.keys(volumeInfo.imageLinks).forEach(size => {
            covers[size] = ensureHttps(volumeInfo.imageLinks[size]);
          });
        }
        
        return {
          id: item.id,
          isbn: isbn || item.id,
          title: volumeInfo.title || 'Unknown Title',
          authors: volumeInfo.authors || ['Unknown Author'],
          publisher: volumeInfo.publisher,
          publishedDate: volumeInfo.publishedDate,
          covers,
          pageCount: volumeInfo.pageCount,
          description: volumeInfo.description,
          averageRating: volumeInfo.averageRating,
          ratingsCount: volumeInfo.ratingsCount
        };
      })
      .filter((edition: any) => {
        // Only include editions that have at least one valid cover image
        return edition.covers && Object.keys(edition.covers).length > 0;
      });
    
    // Cache the result
    await cache.set(cacheKey, editions, CacheTTL.GOOGLE_BOOKS);
    
    return editions;
    
  } catch (error) {
    console.error(`Error fetching book editions for "${title}" by ${author}:`, error);
    return [];
  }
}

/**
 * Enhanced book data with OpenLibrary integration (cached)
 */
export async function getCachedEnhancedBookData(isbn: string, env: Env): Promise<any | null> {
  const cache = new CacheManager(env);
  const cacheKey = `enhanced:book:${isbn}`;
  
  // Try to get from cache first
  const cachedResult = await cache.get<any>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Get Google Books data first
  const googleBooksData = await getCachedGoogleBooksISBN(isbn, env);
  if (!googleBooksData) {
    return null;
  }
  
  // Start with Google Books data
  const enhancedBook = {
    ...googleBooksData,
    extendedDescription: googleBooksData.description,
    subjects: [],
    enhancedGenres: [],
    series: null,
    openLibraryKey: null
  };
  
  // Try to enhance with OpenLibrary data
  try {
    const searchResponse = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&limit=1`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      
      if (searchData.docs && searchData.docs.length > 0) {
        const olDoc = searchData.docs[0];
        const workKey = olDoc.key;
        
        if (workKey) {
          enhancedBook.openLibraryKey = workKey;
          
          // Get detailed work information
          const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
          
          if (workResponse.ok) {
            const workData = await workResponse.json();
            
            if (workData.subjects) {
              enhancedBook.subjects = workData.subjects;
              
              // Extract series information
              const seriesSubjects = workData.subjects.filter((subject: string) => 
                subject.toLowerCase().startsWith('series:')
              );
              
              if (seriesSubjects.length > 0) {
                enhancedBook.series = seriesSubjects[0].replace(/^series:\s*/i, '');
              }
            }
            
            // Use OpenLibrary description if it's more detailed
            if (workData.description) {
              const olDescription = typeof workData.description === 'string' 
                ? workData.description 
                : workData.description.value;
              
              if (olDescription && olDescription.length > (enhancedBook.description?.length || 0)) {
                enhancedBook.extendedDescription = olDescription;
              }
            }
          }
        }
      }
    }
  } catch (olError) {
    console.log('OpenLibrary enhancement failed, using Google Books data only:', olError);
  }
  
  // Cache the result
  await cache.set(cacheKey, enhancedBook, CacheTTL.GOOGLE_BOOKS);
  
  return enhancedBook;
}

/**
 * Invalidate Google Books cache for specific ISBN
 */
export async function invalidateGoogleBooksCache(isbn: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear ISBN-specific cache
  await cache.del(CacheKeys.googleBooksISBN(isbn));
  await cache.del(`enhanced:book:${isbn}`);
}

/**
 * Invalidate Google Books search cache
 */
export async function invalidateGoogleBooksSearchCache(query: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  
  // Clear search-specific cache
  await cache.del(CacheKeys.googleBooksSearch(query));
}