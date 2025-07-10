/**
 * Migration Script: Re-classify Enhanced Genres
 * 
 * This script processes all existing books in the database and re-classifies their
 * enhanced_genres using the proper classifyGenres() function. This fixes the issue
 * where raw categories/subjects were stored instead of properly curated genres.
 * 
 * SAFETY:
 * - Only updates the enhanced_genres field
 * - Preserves original categories and subjects data
 * - Can be run multiple times safely (idempotent)
 * - Processes books in batches to avoid memory issues
 * 
 * USAGE:
 * node migrations/reclassify_enhanced_genres.js
 */

import { classifyGenres } from '../src/lib/genreClassifier.js'

// Database connection setup - adjust based on your environment
const DB_URL = process.env.DATABASE_URL || 'http://localhost:8787'

async function fetchFromWorker(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Add any auth headers needed for your worker
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(`${DB_URL}${endpoint}`, options)
  if (!response.ok) {
    throw new Error(`Worker request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

async function getBooksForMigration() {
  console.log('📚 Fetching books that need genre reclassification...')
  
  // Get all books with their current genre data
  const books = await fetchFromWorker('/api/admin/books-for-migration')
  
  console.log(`Found ${books.length} books to process`)
  return books
}

async function updateBookGenres(bookId, newEnhancedGenres) {
  await fetchFromWorker('/api/admin/update-book-genres', 'POST', {
    bookId,
    enhancedGenres: newEnhancedGenres
  })
}

async function reclassifyBook(book) {
  const { id, title, categories, subjects, enhanced_genres: currentEnhanced } = book
  
  // Parse JSON fields
  const categoriesArray = categories ? JSON.parse(categories) : []
  const subjectsArray = subjects ? JSON.parse(subjects) : []
  const currentEnhancedArray = currentEnhanced ? JSON.parse(currentEnhanced) : []
  
  console.log(`\n📖 Processing: "${title}" (ID: ${id})`)
  console.log(`   Categories: ${categoriesArray.length} items`)
  console.log(`   Subjects: ${subjectsArray.length} items`)
  console.log(`   Current Enhanced: ${currentEnhancedArray.length} items`)
  
  // Run classification
  const newEnhancedGenres = classifyGenres(
    categoriesArray,
    subjectsArray,
    false // Don't enable debug for migration
  )
  
  console.log(`   ✨ New Enhanced: ${newEnhancedGenres.length} items - [${newEnhancedGenres.join(', ')}]`)
  
  // Update if different
  const currentSet = new Set(currentEnhancedArray)
  const newSet = new Set(newEnhancedGenres)
  
  const isDifferent = currentSet.size !== newSet.size || 
    [...currentSet].some(genre => !newSet.has(genre))
  
  if (isDifferent) {
    console.log(`   🔄 Updating database...`)
    await updateBookGenres(id, newEnhancedGenres)
    console.log(`   ✅ Updated successfully`)
    return true
  } else {
    console.log(`   ➡️  No changes needed`)
    return false
  }
}

async function runMigration() {
  console.log('🚀 Starting Enhanced Genres Reclassification Migration')
  console.log('=' * 60)
  
  try {
    // Get all books
    const books = await getBooksForMigration()
    
    if (books.length === 0) {
      console.log('✅ No books found to migrate')
      return
    }
    
    let processed = 0
    let updated = 0
    let errors = 0
    
    // Process books in batches to avoid overwhelming the system
    const BATCH_SIZE = 10
    
    for (let i = 0; i < books.length; i += BATCH_SIZE) {
      const batch = books.slice(i, i + BATCH_SIZE)
      
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(books.length / BATCH_SIZE)}`)
      
      for (const book of batch) {
        try {
          const wasUpdated = await reclassifyBook(book)
          processed++
          if (wasUpdated) updated++
          
          // Small delay to be gentle on the system
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`❌ Error processing book "${book.title}" (ID: ${book.id}):`, error.message)
          errors++
        }
      }
      
      // Longer delay between batches
      if (i + BATCH_SIZE < books.length) {
        console.log('⏸️  Pausing between batches...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Summary
    console.log('\n' + '=' * 60)
    console.log('📊 Migration Summary:')
    console.log(`   Total books processed: ${processed}`)
    console.log(`   Books updated: ${updated}`)
    console.log(`   Books unchanged: ${processed - updated}`)
    console.log(`   Errors: ${errors}`)
    
    if (errors === 0) {
      console.log('✅ Migration completed successfully!')
    } else {
      console.log('⚠️  Migration completed with some errors. Check logs above.')
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export { runMigration }