/**
 * Simple Migration Script: Re-classify Enhanced Genres
 * 
 * This script connects to your production API and re-classifies enhanced_genres
 * for all existing books using the proper classifyGenres() function.
 * 
 * SAFETY:
 * - Only updates the enhanced_genres field via API
 * - Preserves original categories and subjects data
 * - Can be run multiple times safely (idempotent)
 * - Shows preview of changes before making them
 * 
 * PREREQUISITES:
 * - Set NEXT_PUBLIC_API_URL environment variable
 * - Or update API_BASE constant below
 * 
 * USAGE:
 * NEXT_PUBLIC_API_URL=https://your-api.workers.dev node migrations/reclassify_enhanced_genres_simple.js
 */

// Import the classifier - this might need adjustment based on your setup
import { classifyGenres } from '../src/lib/genreClassifier.js'

const API_BASE = process.env.NEXT_PUBLIC_API_URL
if (!API_BASE) {
  console.error('ERROR: NEXT_PUBLIC_API_URL environment variable is required')
  console.error('Usage: NEXT_PUBLIC_API_URL=https://your-api.workers.dev node migrations/reclassify_enhanced_genres_simple.js')
  process.exit(1)
}

// Mock authentication - you might need to adjust this
const AUTH_EMAIL = 'your-admin-email@example.com'

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_EMAIL}`, // Adjust auth as needed
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  console.log(`🌐 API ${method} ${API_BASE}${endpoint}`)
  
  const response = await fetch(`${API_BASE}${endpoint}`, options)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`)
  }
  
  return response.json()
}

async function getAllBooks() {
  console.log('📚 Fetching all books from API...')
  const books = await apiRequest('/api/books')
  console.log(`Found ${books.length} books`)
  return books
}

function analyzeBook(book) {
  const { id, title, categories = [], subjects = [], enhancedGenres = [] } = book
  
  // Run classification on current data
  const newEnhancedGenres = classifyGenres(categories, subjects, false)
  
  // Compare with current enhanced genres
  const currentSet = new Set(enhancedGenres)
  const newSet = new Set(newEnhancedGenres)
  
  const needsUpdate = currentSet.size !== newSet.size || 
    [...currentSet].some(genre => !newSet.has(genre))
  
  return {
    id,
    title,
    current: enhancedGenres,
    new: newEnhancedGenres,
    needsUpdate,
    categories: categories.length,
    subjects: subjects.length
  }
}

async function previewMigration() {
  console.log('🔍 PREVIEW MODE: Analyzing all books...')
  console.log('=' * 60)
  
  const books = await getAllBooks()
  const analysis = books.map(analyzeBook)
  
  const needsUpdate = analysis.filter(a => a.needsUpdate)
  const noChange = analysis.filter(a => !a.needsUpdate)
  
  console.log('\n📊 ANALYSIS SUMMARY:')
  console.log(`   Total books: ${analysis.length}`)
  console.log(`   Need updates: ${needsUpdate.length}`)
  console.log(`   No changes needed: ${noChange.length}`)
  
  if (needsUpdate.length > 0) {
    console.log('\n📋 BOOKS THAT NEED UPDATES:')
    console.log('-' * 40)
    
    needsUpdate.slice(0, 10).forEach(book => {
      console.log(`\n📖 "${book.title}" (ID: ${book.id})`)
      console.log(`   Sources: ${book.categories} categories, ${book.subjects} subjects`)
      console.log(`   Current: [${book.current.join(', ')}]`)
      console.log(`   New:     [${book.new.join(', ')}]`)
    })
    
    if (needsUpdate.length > 10) {
      console.log(`\n   ... and ${needsUpdate.length - 10} more books`)
    }
  }
  
  console.log('\n' + '=' * 60)
  console.log('🤔 This was a PREVIEW. No changes were made.')
  console.log('   To apply changes, run: node migrations/reclassify_enhanced_genres_simple.js --apply')
  
  return { needsUpdate, noChange }
}

async function applyMigration() {
  console.log('⚡ APPLY MODE: Re-classifying enhanced genres...')
  console.log('=' * 60)
  
  const books = await getAllBooks()
  const analysis = books.map(analyzeBook)
  const needsUpdate = analysis.filter(a => a.needsUpdate)
  
  if (needsUpdate.length === 0) {
    console.log('✅ No books need updates!')
    return
  }
  
  console.log(`🔄 Updating ${needsUpdate.length} books...`)
  
  let updated = 0
  let errors = 0
  
  for (const book of needsUpdate) {
    try {
      console.log(`\n📝 Updating "${book.title}" (${updated + 1}/${needsUpdate.length})`)
      console.log(`   New genres: [${book.new.join(', ')}]`)
      
      // Update via API - this endpoint might need to be created
      await apiRequest(`/api/books/${book.id}/enhanced-genres`, 'PUT', {
        enhancedGenres: book.new
      })
      
      console.log(`   ✅ Updated successfully`)
      updated++
      
      // Be gentle on the API
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`   ❌ Error updating "${book.title}":`, error.message)
      errors++
    }
  }
  
  console.log('\n' + '=' * 60)
  console.log('📊 MIGRATION SUMMARY:')
  console.log(`   Books updated: ${updated}`)
  console.log(`   Errors: ${errors}`)
  
  if (errors === 0) {
    console.log('✅ Migration completed successfully!')
  } else {
    console.log('⚠️  Migration completed with some errors.')
  }
}

async function main() {
  const isApplyMode = process.argv.includes('--apply')
  
  try {
    if (isApplyMode) {
      await applyMigration()
    } else {
      await previewMigration()
    }
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
main()