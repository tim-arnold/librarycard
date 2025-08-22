import { Env } from '../types';
import { CacheManager, CacheKeys, CacheTTL } from '../cache/kv';
import { trackApiCall, trackOptimizedSkip } from '../analytics/openLibraryAnalytics';

/**
 * Library of Congress SRU API integration with caching
 * 
 * Uses the Library of Congress Search/Retrieval via URL (SRU) API
 * to fetch authoritative book metadata in MODS XML format.
 */

// Library of Congress SRU API base URL
const LOC_SRU_BASE = 'http://lx2.loc.gov:210/LCDB';

// MODS XML namespace for parsing
const MODS_NS = 'http://www.loc.gov/mods/v3';

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

interface ModsTitleInfo {
  title: string;
  subTitle?: string;
}

interface ModsName {
  namePart: string;
  type?: string;
  role?: {
    roleTerm: string;
  };
}

interface ModsSubject {
  topic?: string;
  geographic?: string;
  temporal?: string;
  genre?: string;
}

interface ModsIdentifier {
  value: string;
  type: string;
}

interface ModsOriginInfo {
  dateIssued?: string;
  publisher?: string;
  place?: {
    placeTerm: string;
  };
}

interface ModsClassification {
  value: string;
  authority?: string;
}

interface ModsLanguage {
  languageTerm: string;
}

interface ModsRelatedItem {
  type?: string;
  titleInfo?: ModsTitleInfo;
}

interface ModsLocation {
  url?: string;
}

/**
 * Cached Library of Congress ISBN lookup
 */
export async function getCachedLocISBN(isbn: string, env: Env): Promise<LocBookData | null> {
  const cache = new CacheManager(env);
  const cacheKey = `loc:books:isbn:${isbn}`;
  
  // Try to get from cache first
  const cachedResult = await cache.get<LocBookData>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Fallback to Library of Congress SRU API
  try {
    const query = `bath.isbn=${isbn}`;
    const sruUrl = `${LOC_SRU_BASE}?query=${encodeURIComponent(query)}&operation=searchRetrieve&recordSchema=mods&maximumRecords=1`;
    
    const response = await fetch(sruUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'LibraryCard/1.0 (library management system)'
      },
      // 8 second timeout for LoC API
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      console.warn(`Library of Congress SRU API error for ISBN ${isbn}: ${response.status}`);
      return null;
    }
    
    const xmlText = await response.text();
    
    if (!xmlText || xmlText.trim().length === 0) {
      console.warn(`Empty response from LoC SRU API for ISBN ${isbn}`);
      return null;
    }
    
    const bookData = await parseLocResponse(xmlText, isbn);
    
    if (!bookData) {
      // Cache null result to avoid repeated API calls for invalid ISBNs
      await cache.set(cacheKey, null, CacheTTL.GOOGLE_BOOKS);
      return null;
    }
    
    // Cache the result for 24 hours (LoC data is authoritative and stable)
    await cache.set(cacheKey, bookData, 24 * 60 * 60 * 1000);
    
    return bookData;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn(`Library of Congress API timeout for ISBN ${isbn}`);
    } else {
      console.error(`Error fetching Library of Congress data for ISBN ${isbn}:`, error);
    }
    return null;
  }
}

/**
 * Cached Library of Congress search by title and author
 */
export async function getCachedLocSearch(title: string, author?: string, env?: Env, maxResults: number = 10): Promise<LocBookData[] | null> {
  if (!env) return null;
  
  const cache = new CacheManager(env);
  const queryString = author ? `${title} ${author}` : title;
  const cacheKey = `loc:books:search:${queryString}`;
  
  // Try to get from cache first
  const cachedResult = await cache.get<LocBookData[]>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Build SRU query
  let query: string;
  if (author) {
    query = `bath.title="${title}" AND bath.author="${author}"`;
  } else {
    query = `bath.title="${title}"`;
  }
  
  try {
    const sruUrl = `${LOC_SRU_BASE}?query=${encodeURIComponent(query)}&operation=searchRetrieve&recordSchema=mods&maximumRecords=${maxResults}`;
    
    const response = await fetch(sruUrl, {
      headers: {
        'Accept': 'application/xml',
        'User-Agent': 'LibraryCard/1.0 (library management system)'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      console.warn(`Library of Congress search error for "${queryString}": ${response.status}`);
      return null;
    }
    
    const xmlText = await response.text();
    const results = await parseLocSearchResponse(xmlText);
    
    // Cache the result
    await cache.set(cacheKey, results, 24 * 60 * 60 * 1000);
    
    return results;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn(`Library of Congress search timeout for "${queryString}"`);
    } else {
      console.error(`Error searching Library of Congress for "${queryString}":`, error);
    }
    return null;
  }
}

/**
 * Parse Library of Congress SRU XML response to extract book data
 */
async function parseLocResponse(xmlText: string, isbn: string): Promise<LocBookData | null> {
  try {
    // Simple XML parsing approach since we're in a Worker environment
    // This avoids the need for heavy XML parsing libraries
    
    // Check if we have any records
    const numberOfRecordsMatch = xmlText.match(/<numberOfRecords>(\d+)<\/numberOfRecords>/);
    const numberOfRecords = numberOfRecordsMatch ? parseInt(numberOfRecordsMatch[1]) : 0;
    
    if (numberOfRecords === 0) {
      return null;
    }
    
    // Extract the MODS record content
    const modsMatch = xmlText.match(/<mods:mods[^>]*>([\s\S]*?)<\/mods:mods>/);
    if (!modsMatch) {
      console.warn(`No MODS record found in LoC response for ISBN ${isbn}`);
      return null;
    }
    
    const modsContent = modsMatch[1];
    
    // Extract individual fields using regex (simple approach for Worker environment)
    const title = extractModsTitle(modsContent);
    const authors = extractModsAuthors(modsContent);
    const subjects = extractModsSubjects(modsContent);
    const description = extractModsAbstract(modsContent);
    const publisher = extractModsPublisher(modsContent);
    const publishedDate = extractModsDate(modsContent);
    const lccn = extractModsLccn(modsContent);
    const language = extractModsLanguage(modsContent);
    const classification = extractModsClassification(modsContent);
    const notes = extractModsNotes(modsContent);
    const series = extractModsSeries(modsContent);
    const coverUrls = extractModsCoverUrls(modsContent);
    
    const bookData: LocBookData = {
      isbn,
      title: title || 'Unknown Title',
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
    };
    
    return bookData;
    
  } catch (error) {
    console.error(`Error parsing LoC XML response for ISBN ${isbn}:`, error);
    return null;
  }
}

/**
 * Parse Library of Congress search results
 */
async function parseLocSearchResponse(xmlText: string): Promise<LocBookData[]> {
  try {
    const results: LocBookData[] = [];
    
    // Extract all MODS records from the response
    // Handle both namespaced (mods:mods) and default namespace (mods) elements
    const modsMatches = xmlText.matchAll(/<mods(?:\s[^>]*)?>([\s\S]*?)<\/mods>/g);
    const matchesArray = Array.from(modsMatches);
    
    console.log(`Found ${matchesArray.length} MODS records in LoC XML`);
    
    for (const match of matchesArray) {
      const modsContent = match[1];
      console.log(`Processing MODS record (first 200 chars):`, modsContent.substring(0, 200));
      
      // Extract ISBN for this record (not required)
      const isbn = extractModsIsbn(modsContent);
      console.log(`Extracted ISBN:`, isbn);
      
      const title = extractModsTitle(modsContent);
      const authors = extractModsAuthors(modsContent);
      const subjects = extractModsSubjects(modsContent);
      const description = extractModsAbstract(modsContent);
      const publisher = extractModsPublisher(modsContent);
      const publishedDate = extractModsDate(modsContent);
      const lccn = extractModsLccn(modsContent);
      const language = extractModsLanguage(modsContent);
      const classification = extractModsClassification(modsContent);
      const notes = extractModsNotes(modsContent);
      const series = extractModsSeries(modsContent);
      const coverUrls = extractModsCoverUrls(modsContent);
      
      console.log(`Extracted data:`, { title, authors, lccn, publisher });
      
      const bookData: LocBookData = {
        isbn: isbn || lccn || `loc-${Date.now()}-${Math.random()}`, // Use LCCN or generate ID if no ISBN
        title: title || 'Unknown Title',
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
      };
      
      results.push(bookData);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error parsing LoC search response:', error);
    return [];
  }
}

// Helper functions for extracting specific MODS fields

function extractModsTitle(modsContent: string): string | undefined {
  // Handle both namespaced and default namespace
  const titleMatch = modsContent.match(/<(?:mods:)?titleInfo[^>]*>[\s\S]*?<(?:mods:)?title[^>]*>(.*?)<\/(?:mods:)?title>/);
  return titleMatch ? cleanXmlText(titleMatch[1]) : undefined;
}

function extractModsAuthors(modsContent: string): string[] {
  const authors: string[] = [];
  // Handle both namespaced and default namespace
  const nameMatches = modsContent.matchAll(/<(?:mods:)?name[^>]*>.*?<(?:mods:)?namePart[^>]*>(.*?)<\/(?:mods:)?namePart>/g);
  
  for (const match of Array.from(nameMatches)) {
    const author = cleanXmlText(match[1]);
    if (author && !authors.includes(author)) {
      authors.push(author);
    }
  }
  
  return authors;
}

function extractModsSubjects(modsContent: string): string[] {
  const subjects: string[] = [];
  
  // Extract topic subjects - handle both namespaced and default namespace
  const topicMatches = modsContent.matchAll(/<(?:mods:)?subject[^>]*>.*?<(?:mods:)?topic[^>]*>(.*?)<\/(?:mods:)?topic>/g);
  for (const match of Array.from(topicMatches)) {
    const subject = cleanXmlText(match[1]);
    if (subject && !subjects.includes(subject)) {
      subjects.push(subject);
    }
  }
  
  // Extract geographic subjects - handle both namespaced and default namespace
  const geoMatches = modsContent.matchAll(/<(?:mods:)?subject[^>]*>.*?<(?:mods:)?geographic[^>]*>(.*?)<\/(?:mods:)?geographic>/g);
  for (const match of Array.from(geoMatches)) {
    const subject = cleanXmlText(match[1]);
    if (subject && !subjects.includes(subject)) {
      subjects.push(subject);
    }
  }
  
  return subjects;
}

function extractModsAbstract(modsContent: string): string | undefined {
  const abstractMatch = modsContent.match(/<(?:mods:)?abstract[^>]*>([\s\S]*?)<\/(?:mods:)?abstract>/);
  return abstractMatch ? cleanXmlText(abstractMatch[1]) : undefined;
}

function extractModsPublisher(modsContent: string): string | undefined {
  const publisherMatch = modsContent.match(/<(?:mods:)?originInfo[^>]*>[\s\S]*?<(?:mods:)?publisher[^>]*>(.*?)<\/(?:mods:)?publisher>/);
  return publisherMatch ? cleanXmlText(publisherMatch[1]) : undefined;
}

function extractModsDate(modsContent: string): string | undefined {
  const dateMatch = modsContent.match(/<(?:mods:)?originInfo[^>]*>.*?<(?:mods:)?dateIssued[^>]*>(.*?)<\/(?:mods:)?dateIssued>/);
  return dateMatch ? cleanXmlText(dateMatch[1]) : undefined;
}

function extractModsIsbn(modsContent: string): string | undefined {
  const isbnMatches = Array.from(modsContent.matchAll(/<(?:mods:)?identifier[^>]*type=['"]isbn['"][^>]*>(.*?)<\/(?:mods:)?identifier>/g));
  
  for (const match of isbnMatches) {
    const isbn = cleanXmlText(match[1]);
    if (isbn) {
      // Clean and validate ISBN format
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      if (cleanIsbn.match(/^\d{9}[\dX]$/) || cleanIsbn.match(/^\d{13}$/)) {
        return cleanIsbn;
      }
    }
  }
  
  return undefined;
}

function extractModsLccn(modsContent: string): string | undefined {
  const lccnMatch = modsContent.match(/<(?:mods:)?identifier[^>]*type=['"]lccn['"][^>]*>(.*?)<\/(?:mods:)?identifier>/);
  return lccnMatch ? cleanXmlText(lccnMatch[1]) : undefined;
}

function extractModsLanguage(modsContent: string): string | undefined {
  const langMatch = modsContent.match(/<mods:language[^>]*>.*?<mods:languageTerm[^>]*>(.*?)<\/mods:languageTerm>/);
  return langMatch ? cleanXmlText(langMatch[1]) : undefined;
}

function extractModsClassification(modsContent: string): string | undefined {
  const classMatch = modsContent.match(/<mods:classification[^>]*>(.*?)<\/mods:classification>/);
  return classMatch ? cleanXmlText(classMatch[1]) : undefined;
}

function extractModsNotes(modsContent: string): string[] {
  const notes: string[] = [];
  const noteMatches = Array.from(modsContent.matchAll(/<mods:note[^>]*>(.*?)<\/mods:note>/g));
  
  for (const match of noteMatches) {
    const note = cleanXmlText(match[1]);
    if (note) {
      notes.push(note);
    }
  }
  
  return notes;
}

function extractModsSeries(modsContent: string): string | undefined {
  // Look for series information in related items
  const seriesMatch = modsContent.match(/<mods:relatedItem[^>]*type=['"]series['"][^>]*>.*?<mods:titleInfo[^>]*>.*?<mods:title[^>]*>(.*?)<\/mods:title>/);
  return seriesMatch ? cleanXmlText(seriesMatch[1]) : undefined;
}

function extractModsCoverUrls(modsContent: string): string[] {
  const urls: string[] = [];
  const urlMatches = Array.from(modsContent.matchAll(/<mods:location[^>]*>[\s\S]*?<mods:url[^>]*>(.*?)<\/mods:url>/g));
  
  for (const match of urlMatches) {
    const url = cleanXmlText(match[1]);
    if (url && (url.includes('cover') || url.includes('image') || url.includes('thumbnail'))) {
      urls.push(url);
    }
  }
  
  return urls;
}

/**
 * Create a deduplication key for smart duplicate detection
 */
function createDeduplicationKey(edition: any): string {
  // Normalize title and author for comparison
  const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const title = normalizeString(edition.title || '');
  const author = normalizeString((edition.authors?.[0] || '').split(',')[0]); // First author, first part
  
  // Try ISBN first (most reliable)
  if (edition.isbn && edition.isbn.length >= 10) {
    return `isbn:${edition.isbn.replace(/[^0-9X]/g, '')}`;
  }
  
  // Fallback to title+author combination
  return `${title}:${author}`;
}

/**
 * Sort editions by relevance to the search query
 */
function sortByRelevance(editions: any[], searchTitle: string, searchAuthor: string): any[] {
  return editions
    .map(edition => ({
      ...edition,
      relevanceScore: calculateRelevanceScore(edition, searchTitle, searchAuthor)
    }))
    .filter(edition => edition.relevanceScore > 0) // Remove irrelevant books (score 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Higher scores first
}

/**
 * Calculate relevance score for an edition based on search terms
 */
function calculateRelevanceScore(edition: any, searchTitle: string, searchAuthor: string): number {
  let score = 0;
  
  const editionTitle = (edition.title || '').toLowerCase();
  const editionAuthors = (edition.authors || []).map((author: any) => author.toLowerCase());
  const queryTitle = searchTitle.toLowerCase();
  const queryAuthor = searchAuthor.toLowerCase();
  
  // Title matching (highest weight) - STRICT matching only
  let titleScore = 0;
  if (editionTitle === queryTitle) {
    titleScore = 100; // Exact title match
  } else if (editionTitle.includes(queryTitle)) {
    titleScore = 80; // Title contains search term
  } else if (queryTitle.includes(editionTitle)) {
    titleScore = 60; // Search term contains title
  } else {
    // STRICT fuzzy title match - require significant overlap
    const titleWords = queryTitle.split(' ').filter(w => w.length > 2);
    const matchingWords = titleWords.filter(word => editionTitle.includes(word));
    const matchRatio = matchingWords.length / titleWords.length;
    
    // Only accept if at least 70% of significant words match
    if (matchRatio >= 0.7 && matchingWords.length >= 1) {
      titleScore = matchRatio * 40;
    }
    // Otherwise titleScore remains 0 (no match)
  }
  
  // Author matching (high weight)
  let authorScore = 0;
  const authorMatch = editionAuthors.some((editionAuthor: string) => {
    if (editionAuthor === queryAuthor) return true;
    if (editionAuthor.includes(queryAuthor) || queryAuthor.includes(editionAuthor)) return true;
    return false;
  });
  
  if (authorMatch) {
    authorScore = 80;
  }
  
  // CRITICAL FIX: Require BOTH title and author matches
  // If either title or author score is 0, the book is irrelevant
  if (titleScore === 0 || authorScore === 0) {
    // Debug logging for filtered results
    console.log(`❌ FILTERED OUT: "${editionTitle}" by [${editionAuthors.join(', ')}] - titleScore:${titleScore} authorScore:${authorScore} (searching for "${queryTitle}" by "${queryAuthor}")`);
    return 0; // Exclude books that don't match both title AND author
  }
  
  score = titleScore + authorScore;
  
  // Debug logging for accepted results
  console.log(`✅ ACCEPTED: "${editionTitle}" by [${editionAuthors.join(', ')}] - titleScore:${titleScore} authorScore:${authorScore} total:${score} (searching for "${queryTitle}" by "${queryAuthor}")`);
  
  // Publication date (prefer more recent, but not too heavily weighted)
  if (edition.publishedDate) {
    const year = parseInt(edition.publishedDate.split('-')[0]);
    if (year > 2020) score += 10;
    else if (year > 2010) score += 8;
    else if (year > 2000) score += 5;
    else if (year > 1990) score += 3;
  }
  
  // Metadata completeness (books with more info are likely better matches)
  if (edition.description) score += 5;
  if (edition.pageCount) score += 3;
  if (edition.publisher) score += 2;
  if (edition.averageRating && edition.ratingsCount) score += 8;
  
  // Source preference (slight preference for Google Books due to metadata quality)
  if (edition.source === 'google') score += 2;
  
  // ISBN presence (books with ISBNs tend to be more reliable)
  if (edition.isbn && edition.isbn.length >= 10) score += 5;
  
  return score;
}

/**
 * Clean XML text content by removing extra whitespace and decoding entities
 */
function cleanXmlText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Invalidate Library of Congress cache for specific ISBN
 */
export async function invalidateLocCache(isbn: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  await cache.del(`loc:books:isbn:${isbn}`);
}

/**
 * Invalidate Library of Congress search cache
 */
export async function invalidateLocSearchCache(query: string, env: Env): Promise<void> {
  const cache = new CacheManager(env);
  await cache.del(`loc:books:search:${query}`);
}

/**
 * Enhanced book editions lookup combining all three sources for cover selection
 */
export async function getEnhancedBookEditions(title: string, author: string, env: Env): Promise<any[]> {
  const cache = new CacheManager(env);
  const cacheKey = `enhanced:editions:${title}:${author}:v2`; // v2 to bypass old cache
  
  console.log(`🔍 Enhanced editions cache key: ${cacheKey}`);
  
  // Check cache first
  const cachedResult = await cache.get<any[]>(cacheKey);
  if (cachedResult) {
    console.log('📦 Returning cached enhanced search results:', cachedResult.length);
    return cachedResult;
  }
  
  try {
    // First, fetch Google Books results
    console.log(`📚 Fetching Google Books editions for "${title}" by "${author}"`);
    const googleResults = await fetchGoogleBooksEditions(title, author);
    
    // Check if we need OpenLibrary results (only if Google Books has < 3 covers)
    const googleCount = googleResults?.length || 0;
    let openLibraryResults: any[] = [];
    
    if (googleCount < 3) {
      console.log(`📖 Google Books returned ${googleCount} covers, fetching OpenLibrary to supplement`);
      try {
        const startTime = performance.now();
        openLibraryResults = await fetchOpenLibraryEditions(title, author);
        const responseTime = performance.now() - startTime;
        
        // Track the OpenLibrary API call
        trackApiCall(
          'covers.openlibrary.org',
          'cover-selection',
          responseTime,
          true
        );
      } catch (error) {
        console.warn('OpenLibrary fetch failed:', error);
        
        // Track the failed API call
        trackApiCall(
          'covers.openlibrary.org',
          'cover-selection',
          0,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
        
        openLibraryResults = [];
      }
    } else {
      console.log(`✅ Google Books returned ${googleCount} covers, skipping OpenLibrary (sufficient covers available)`);
      
      // Track the optimized skip
      trackOptimizedSkip(
        'cover-selection',
        `Google Books sufficient: ${googleCount} covers found (>= 3 threshold)`
      );
    }
    
    // Combine and deduplicate results with smart relevance sorting
    const allEditions: any[] = [];
    
    // Debug logging
    console.log(`Enhanced search results for "${title}" by "${author}":`);
    console.log('Google Books results:', googleCount);
    console.log('OpenLibrary results:', openLibraryResults?.length || 0);
    
    // Collect all results with source attribution
    const googleEditions: any[] = [];
    const openLibraryEditions: any[] = [];
    
    // Process Google Books results
    if (googleResults && googleResults.length > 0) {
      console.log('Processing Google Books results:', googleResults.length);
      googleResults.forEach((edition: any) => {
        googleEditions.push({
          ...edition,
          source: 'google',
          sourceDisplayName: 'Google Books'
        });
      });
    } else {
      console.log('No Google Books results returned');
    }
    
    // Process OpenLibrary results
    if (openLibraryResults && openLibraryResults.length > 0) {
      console.log('Processing OpenLibrary results:', openLibraryResults.length);
      openLibraryResults.forEach((edition: any) => {
        openLibraryEditions.push({
          ...edition,
          source: 'openlibrary',
          sourceDisplayName: 'Open Library'
        });
      });
    } else if (googleCount < 3) {
      console.log('No OpenLibrary results returned (but was attempted)');
    }
    
    // Combine and sort by relevance
    const combinedEditions = [...googleEditions, ...openLibraryEditions];
    const sortedEditions = sortByRelevance(combinedEditions, title, author);
    
    // Smart deduplication based on multiple criteria while preserving relevance order
    const seenKeys = new Set<string>();
    
    sortedEditions.forEach((edition: any) => {
      const dedupeKey = createDeduplicationKey(edition);
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        allEditions.push(edition);
      } else {
        console.log(`Skipping duplicate: ${edition.title} by ${edition.authors?.[0]} (${edition.source})`);
      }
    });
    
    console.log('Total combined and sorted results:', allEditions.length);
    
    // Cache the combined results
    await cache.set(cacheKey, allEditions, 24 * 60 * 60 * 1000); // 24 hours
    
    return allEditions;
    
  } catch (error) {
    console.error(`Error fetching enhanced book editions for "${title}" by ${author}:`, error);
    return [];
  }
}

async function fetchGoogleBooksEditions(title: string, author: string): Promise<any[]> {
  try {
    // If title and author are the same, treat it as a general search
    const query = title === author 
      ? title  // General search
      : `intitle:"${title}" inauthor:"${author}"`; // Specific title+author search
    
    console.log(`Google Books query: ${query}`);
    
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`,
      { signal: AbortSignal.timeout(8000) }
    );
    
    if (!response.ok) {
      console.warn(`Google Books editions API error: ${response.status}`);
      return [];
    }
    
    const data: any = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items
      .map((item: any) => {
        const volumeInfo = item.volumeInfo;
        const isbn = volumeInfo.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier;
        
        const covers: any = {};
        if (volumeInfo.imageLinks) {
          Object.keys(volumeInfo.imageLinks).forEach(size => {
            covers[size] = volumeInfo.imageLinks[size];
          });
        }
        
        return {
          id: `google-${item.id}`,
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
        // Always filter out results without covers for enhanced search
        return edition.covers && Object.keys(edition.covers).length > 0;
      });
      
  } catch (error) {
    console.error('Error fetching Google Books editions:', error);
    return [];
  }
}

async function fetchOpenLibraryEditions(title: string, author: string): Promise<any[]> {
  try {
    // If title and author are the same, treat it as a general search
    const query = title === author 
      ? title  // General search - let OpenLibrary search across all fields
      : `title:"${title}" author:"${author}"`; // Specific title+author search
    
    console.log(`OpenLibrary query: ${query}`);
    
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`,
      { signal: AbortSignal.timeout(8000) }
    );
    
    if (!response.ok) {
      console.warn(`OpenLibrary editions API error: ${response.status}`);
      return [];
    }
    
    const data: any = await response.json();
    console.log(`OpenLibrary returned ${data.docs?.length || 0} results`);
    
    if (!data.docs || data.docs.length === 0) {
      return [];
    }
    
    return data.docs
      .map((doc: any) => {
        const isbn = doc.isbn?.[0];
        // For OpenLibrary, we don't require ISBN - use work key as fallback
        const bookId = isbn || doc.key?.replace('/works/', '') || `ol-${Date.now()}`;
        
        const covers: any = {};
        if (doc.cover_i) {
          // OpenLibrary cover URLs
          covers.thumbnail = `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`;
          covers.small = `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`;
          covers.medium = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
          covers.large = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        }
        
        // Log only problematic cases for debugging
        if (!doc.title || !doc.cover_i) {
          console.log(`OL incomplete doc ${doc.key}: title="${doc.title}" cover_i=${doc.cover_i}`);
        }
        
        return {
          id: `openlibrary-${doc.key?.replace('/works/', '')}`,
          isbn: bookId, // Use work key if no ISBN
          title: doc.title || 'Unknown Title',
          authors: doc.author_name && doc.author_name.length > 0 ? doc.author_name : ['Unknown Author'],
          publisher: doc.publisher?.[0],
          publishedDate: doc.first_publish_year?.toString(),
          covers,
          pageCount: doc.number_of_pages_median,
          description: doc.first_sentence?.[0],
        };
      })
      .filter((edition: any) => {
        // Debug logging for OpenLibrary filtering
        const hasTitle = edition.title && edition.title !== 'Unknown Title';
        const hasCovers = edition.covers && Object.keys(edition.covers).length > 0;
        
        if (!hasTitle || !hasCovers) {
          console.log(`Filtering out OL result: title="${edition.title}" authors=${JSON.stringify(edition.authors)} covers=${Object.keys(edition.covers || {}).length}`);
          return false;
        }
        
        // Allow books with missing authors since OpenLibrary sometimes has incomplete author data
        // but the author info might be available when we fetch the full record
        return true;
      });
      
  } catch (error) {
    console.error('Error fetching OpenLibrary editions:', error);
    return [];
  }
}

