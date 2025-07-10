/**
 * Preview Script: Enhanced Genres Cleanup
 * 
 * This script shows you which books have problematic enhanced_genres that should be cleared
 * and re-classified. It doesn't make any changes - just shows what would be affected.
 * 
 * Run this first to see the impact before running the actual migration.
 */

const API_BASE = 'https://librarycard-api-production.tim-arnold.workers.dev'

async function getBooks() {
  try {
    console.log('📚 Fetching books from API...')
    const response = await fetch(`${API_BASE}/api/books`, {
      headers: {
        'Authorization': 'Bearer librarian@tim52.io', // Admin email for migration
      }
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const books = await response.json()
    console.log(`✅ Fetched ${books.length} books`)
    return books
  } catch (error) {
    console.error('❌ Error fetching books:', error.message)
    console.log('\n💡 Make sure to:')
    console.log('   1. Update the API_BASE URL if needed')
    console.log('   2. Update the Authorization header with your admin email')
    console.log('   3. Ensure the API is accessible')
    return []
  }
}

function isProblematicGenre(enhancedGenres) {
  if (!enhancedGenres || enhancedGenres.length === 0) {
    return false
  }
  
  // Join all genres into a string to check patterns
  const genresString = Array.isArray(enhancedGenres) 
    ? enhancedGenres.join(' ') 
    : enhancedGenres.toString()
  
  // Check for problematic patterns
  const problems = []
  
  if (genresString.includes(',')) {
    problems.push('contains commas (raw categories)')
  }
  
  if (genresString.includes('Fiction / ')) {
    problems.push('contains "Fiction /" pattern')
  }
  
  if (genresString.includes('----')) {
    problems.push('contains dashes')
  }
  
  if (genresString.includes(' and ')) {
    problems.push('contains " and "')
  }
  
  if (genresString.toLowerCase().includes('criticism')) {
    problems.push('contains "criticism"')
  }
  
  if (genresString.toLowerCase().includes('history and criticism')) {
    problems.push('contains "history and criticism"')
  }
  
  if (genresString.length > 200) {
    problems.push(`very long (${genresString.length} chars)`)
  }
  
  if (genresString.includes('[') || genresString.includes(']')) {
    problems.push('contains brackets')
  }
  
  return problems.length > 0 ? problems : false
}

function analyzeBooks(books) {
  console.log('\n🔍 Analyzing books for problematic enhanced genres...')
  
  const problematic = []
  const clean = []
  const empty = []
  
  for (const book of books) {
    const problems = isProblematicGenre(book.enhancedGenres)
    
    if (!book.enhancedGenres || book.enhancedGenres.length === 0) {
      empty.push(book)
    } else if (problems) {
      problematic.push({
        ...book,
        problems
      })
    } else {
      clean.push(book)
    }
  }
  
  return { problematic, clean, empty }
}

function showResults(analysis) {
  const { problematic, clean, empty } = analysis
  
  console.log('\n📊 ANALYSIS RESULTS:')
  console.log('=' * 50)
  console.log(`📚 Total books analyzed: ${problematic.length + clean.length + empty.length}`)
  console.log(`❌ Problematic enhanced genres: ${problematic.length}`)
  console.log(`✅ Clean enhanced genres: ${clean.length}`)
  console.log(`⚪ Empty enhanced genres: ${empty.length}`)
  
  if (problematic.length > 0) {
    console.log('\n🚨 PROBLEMATIC BOOKS (first 10):')
    console.log('-' * 40)
    
    problematic.slice(0, 10).forEach((book, index) => {
      console.log(`\n${index + 1}. "${book.title}" (ID: ${book.id})`)
      console.log(`   Enhanced Genres: ${JSON.stringify(book.enhancedGenres)}`)
      console.log(`   Problems: ${book.problems.join(', ')}`)
      
      if (book.categories && book.categories.length > 0) {
        console.log(`   Raw Categories: ${JSON.stringify(book.categories.slice(0, 3))}${book.categories.length > 3 ? '...' : ''}`)
      }
    })
    
    if (problematic.length > 10) {
      console.log(`\n   ... and ${problematic.length - 10} more books with problems`)
    }
    
    console.log('\n💡 RECOMMENDED ACTION:')
    console.log(`   Run the migration SQL to clear enhanced_genres for ${problematic.length} books`)
    console.log('   This will allow them to be properly re-classified when viewed')
  } else {
    console.log('\n✅ No problematic enhanced genres found!')
    console.log('   Your genre data looks clean.')
  }
  
  if (clean.length > 0) {
    console.log(`\n✨ ${clean.length} books have clean enhanced genres that will be preserved`)
  }
}

async function main() {
  console.log('🔍 Enhanced Genres Cleanup Preview')
  console.log('=' * 50)
  console.log('This script analyzes your books to find problematic enhanced_genres')
  console.log('No changes will be made - this is preview only.\n')
  
  const books = await getBooks()
  
  if (books.length === 0) {
    console.log('❌ Could not fetch books. Please check the configuration.')
    return
  }
  
  const analysis = analyzeBooks(books)
  showResults(analysis)
  
  console.log('\n📋 NEXT STEPS:')
  console.log('1. Review the problematic books above')
  console.log('2. If you want to clean them, run: wrangler d1 execute --file=migrations/update_enhanced_genres.sql')
  console.log('3. After cleanup, the books will be re-classified when users view them')
}

main().catch(console.error)