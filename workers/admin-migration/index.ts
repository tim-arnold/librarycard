/**
 * Admin Migration Worker Endpoints
 * 
 * Provides endpoints specifically for migration scripts to access and update data.
 * These are separate from regular admin endpoints to avoid confusion and ensure
 * they're only used for maintenance operations.
 */

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS headers for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }
    
    try {
      // Route requests
      if (url.pathname === '/api/admin/books-for-migration' && request.method === 'GET') {
        return await getBooksForMigration(env.DB, corsHeaders)
      }
      
      if (url.pathname === '/api/admin/update-book-genres' && request.method === 'POST') {
        return await updateBookGenres(request, env.DB, corsHeaders)
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders })
      
    } catch (error) {
      console.error('Migration worker error:', error)
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}

async function getBooksForMigration(db: any, corsHeaders: any): Promise<Response> {
  console.log('📚 Fetching books for migration...')
  
  // Get all books with their genre data
  const stmt = db.prepare(`
    SELECT 
      id, 
      title, 
      categories, 
      subjects, 
      enhanced_genres
    FROM books 
    WHERE categories IS NOT NULL OR subjects IS NOT NULL OR enhanced_genres IS NOT NULL
    ORDER BY id
  `)
  
  const result = await stmt.all()
  const books = result.results || []
  
  console.log(`Found ${books.length} books for migration`)
  
  return new Response(JSON.stringify(books), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

async function updateBookGenres(request: Request, db: any, corsHeaders: any): Promise<Response> {
  const { bookId, enhancedGenres } = await request.json() as { bookId: number, enhancedGenres: string[] }
  
  if (!bookId || !Array.isArray(enhancedGenres)) {
    return new Response(JSON.stringify({ 
      error: 'Invalid request data. bookId and enhancedGenres array required.' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  console.log(`📝 Updating book ${bookId} with genres: [${enhancedGenres.join(', ')}]`)
  
  try {
    const stmt = db.prepare(`
      UPDATE books 
      SET enhanced_genres = ?
      WHERE id = ?
    `)
    
    const enhancedGenresJson = JSON.stringify(enhancedGenres)
    await stmt.bind(enhancedGenresJson, bookId).run()
    
    return new Response(JSON.stringify({ 
      success: true,
      bookId,
      enhancedGenres
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error(`Error updating book ${bookId}:`, error)
    return new Response(JSON.stringify({ 
      error: 'Database update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}