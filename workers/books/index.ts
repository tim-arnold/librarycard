import { Env, Book, GoogleBooksResponse } from '../types';
import { isUserAdmin, isUserSuperAdmin } from '../auth';
import { hasUserPermission, hasGlobalPermission, getLocationIdFromShelfId, getLocationIdFromBookId } from '../permissions';
import { invalidateAllAdminAnalytics } from '../admin/cached';
import { sendBookReviewUpdate } from '../notifications/index';
import { getWorkerFromEmail } from '../utils/domainConfig';

// Core Book Management Functions
export async function getUserBooks(userId: string, env: Env, corsHeaders: Record<string, string>) {
  // Check if user is super admin first
  const isSuperAdmin = await isUserSuperAdmin(userId, env);
  
  let stmt;
  let result;
  
  if (isSuperAdmin) {
    // Super admins can see all books - OPTIMIZED QUERY
    stmt = env.DB.prepare(`
      SELECT DISTINCT 
        b.id, b.isbn, b.title, b.authors, b.description, b.thumbnail, b.published_date,
        b.categories, b.shelf_id, b.tags, b.added_by, b.created_at, b.status,
        b.checked_out_by, b.checked_out_date, b.due_date,
        b.extended_description, b.subjects, b.page_count, b.google_average_rating, 
        b.google_ratings_count, b.rating_updated_at, b.publisher_info, b.open_library_key, 
        b.enhanced_genres, b.series, b.series_number,
        s.name as shelf_name, 
        l.name as location_name,
        br.rating as user_rating, 
        br.review_text as user_review,
        br.review_status as user_review_status,
        br.review_rejection_reason as user_review_rejection_reason,
        COALESCE((
          SELECT json_group_array(json_object('id', cg.id, 'name', cg.name, 'description', cg.description))
          FROM book_genres bg 
          JOIN curated_genres cg ON bg.genre_id = cg.id 
          WHERE bg.book_id = b.id AND cg.is_active = 1
        ), '[]') as assigned_genres,
        COALESCE((
          SELECT json_group_array(json_object('id', s.id, 'name', s.name, 'description', s.description, 'color', s.color))
          FROM book_series bs
          JOIN series s ON bs.series_id = s.id
          WHERE bs.book_id = b.id AND s.approval_status = 'approved'
        ), '[]') as current_series,
        COALESCE(lra.library_average_rating, 0) as library_average_rating,
        COALESCE(lra.library_rating_count, 0) as library_rating_count,
        u_checkout.first_name as checked_out_by_name
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN book_ratings br ON b.id = br.book_id AND br.user_id = ?
      -- LEFT JOIN book_genres_agg bga ON b.id = bga.book_id  -- Genre view not available yet
      LEFT JOIN library_ratings_agg lra ON b.id = lra.book_id AND l.id = lra.location_id
      LEFT JOIN users u_checkout ON b.checked_out_by = u_checkout.id
      ORDER BY b.created_at DESC
    `);
    result = await stmt.bind(userId).all();
  } else {
    // Regular admins and users see books based on ownership/membership - OPTIMIZED QUERY
    stmt = env.DB.prepare(`
      SELECT DISTINCT 
        b.id, b.isbn, b.title, b.authors, b.description, b.thumbnail, b.published_date,
        b.categories, b.shelf_id, b.tags, b.added_by, b.created_at, b.status,
        b.checked_out_by, b.checked_out_date, b.due_date,
        b.extended_description, b.subjects, b.page_count, b.google_average_rating, 
        b.google_ratings_count, b.rating_updated_at, b.publisher_info, b.open_library_key, 
        b.enhanced_genres, b.series, b.series_number,
        s.name as shelf_name, 
        l.name as location_name,
        br.rating as user_rating, 
        br.review_text as user_review,
        br.review_status as user_review_status,
        br.review_rejection_reason as user_review_rejection_reason,
        COALESCE((
          SELECT json_group_array(json_object('id', cg.id, 'name', cg.name, 'description', cg.description))
          FROM book_genres bg 
          JOIN curated_genres cg ON bg.genre_id = cg.id 
          WHERE bg.book_id = b.id AND cg.is_active = 1
        ), '[]') as assigned_genres,
        COALESCE((
          SELECT json_group_array(json_object('id', s.id, 'name', s.name, 'description', s.description, 'color', s.color))
          FROM book_series bs
          JOIN series s ON bs.series_id = s.id
          WHERE bs.book_id = b.id AND s.approval_status = 'approved'
        ), '[]') as current_series,
        COALESCE(lra.library_average_rating, 0) as library_average_rating,
        COALESCE(lra.library_rating_count, 0) as library_rating_count,
        u_checkout.first_name as checked_out_by_name
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      LEFT JOIN book_ratings br ON b.id = br.book_id AND br.user_id = ?
      -- LEFT JOIN book_genres_agg bga ON b.id = bga.book_id  -- Genre view not available yet
      LEFT JOIN library_ratings_agg lra ON b.id = lra.book_id AND l.id = lra.location_id
      LEFT JOIN users u_checkout ON b.checked_out_by = u_checkout.id
      WHERE l.owner_id = ? OR lm.user_id = ?
      ORDER BY b.created_at DESC
    `);
    result = await stmt.bind(userId, userId, userId).all();
  }
  
  const books = result.results.map((book: any) => ({
    ...book,
    authors: book.authors ? JSON.parse(book.authors) : [],
    categories: book.categories ? JSON.parse(book.categories) : [],
    tags: book.tags ? JSON.parse(book.tags) : [],
    subjects: book.subjects ? JSON.parse(book.subjects) : [],
    enhancedGenres: book.enhanced_genres ? JSON.parse(book.enhanced_genres) : [],
    assignedGenres: book.assigned_genres ? JSON.parse(book.assigned_genres).filter((g: any) => g.id !== null) : [],
    current_series: book.current_series ? JSON.parse(book.current_series).filter((s: any) => s.id !== null) : [],
    // Map database field names to frontend field names
    publishedDate: book.published_date,
    extendedDescription: book.extended_description,
    pageCount: book.page_count,
    // Use library-specific ratings for library views
    averageRating: book.library_average_rating,
    ratingCount: book.library_rating_count,
    // Keep Google Books ratings available for "More Details" modal
    googleAverageRating: book.google_average_rating,
    googleRatingCount: book.google_ratings_count,
    ratingUpdatedAt: book.rating_updated_at,
    userRating: book.user_rating,
    userReview: book.user_review,
    userReviewStatus: book.user_review_status,
    userReviewRejectionReason: book.user_review_rejection_reason,
    publisherInfo: book.publisher_info,
    openLibraryKey: book.open_library_key,
    seriesNumber: book.series_number,
    status: book.status || 'available', // Default to available if not set
  }));

  return new Response(JSON.stringify(books), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function createBook(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const book: Book = await request.json();
  
  // Check if user has permission to add books to this location
  if (book.shelf_id) {
    const locationId = await getLocationIdFromShelfId(book.shelf_id, env);
    if (!locationId) {
      return new Response(JSON.stringify({ error: 'Invalid shelf specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hasPermission = await hasUserPermission(userId, locationId, 'can_add_books', env);
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'You do not have permission to add books to this location' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  const stmt = env.DB.prepare(`
    INSERT INTO books (
      isbn, title, authors, description, thumbnail, published_date, categories, 
      shelf_id, tags, added_by, created_at,
      extended_description, subjects, page_count, average_rating, ratings_count,
      publisher_info, open_library_key, enhanced_genres, series, series_number,
      alternative_covers, selected_cover_source, cover_selection_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    book.isbn,
    book.title,
    typeof book.authors === 'string' ? book.authors : JSON.stringify(book.authors || []),
    book.description || null,
    book.thumbnail || null,
    book.published_date || book.publishedDate || null,  // Accept both snake_case and camelCase
    typeof book.categories === 'string' ? book.categories : JSON.stringify(book.categories || []),
    book.shelf_id || null,
    typeof book.tags === 'string' ? book.tags : JSON.stringify(book.tags || []),
    userId,
    book.extended_description || book.extendedDescription || null,  // Accept both formats
    typeof book.subjects === 'string' ? book.subjects : (book.subjects ? JSON.stringify(book.subjects) : null),
    book.page_count || book.pageCount || null,  // Accept both formats
    book.average_rating || book.averageRating || null,  // Accept both formats
    book.ratings_count || book.ratingsCount || null,  // Accept both formats
    book.publisher_info || book.publisherInfo || null,  // Accept both formats
    book.open_library_key || book.openLibraryKey || null,  // Accept both formats
    typeof book.enhanced_genres === 'string' ? book.enhanced_genres : (book.enhanced_genres ? JSON.stringify(book.enhanced_genres) : book.enhancedGenres ? JSON.stringify(book.enhancedGenres) : null),  // Accept both formats
    book.series || null,
    book.series_number || book.seriesNumber || null,  // Accept both formats
    book.alternative_covers ? JSON.stringify(book.alternative_covers) : null,
    book.selected_cover_source ? JSON.stringify(book.selected_cover_source) : null,
    book.selected_cover_source ? new Date().toISOString() : null
  ).run();

  // Invalidate admin analytics cache on book creation
  await invalidateAllAdminAnalytics(env);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function updateBook(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  const book: Partial<Book> = await request.json();
  
  // Get current book's location
  const currentLocationId = await getLocationIdFromBookId(id, env);
  if (!currentLocationId) {
    return new Response(JSON.stringify({ error: 'Book not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If changing shelf_id, check move permissions
  if (book.shelf_id !== undefined) {
    const newLocationId = await getLocationIdFromShelfId(book.shelf_id, env);
    if (!newLocationId) {
      return new Response(JSON.stringify({ error: 'Invalid shelf specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission to move books in current location
    const canMoveFromCurrent = await hasUserPermission(userId, currentLocationId, 'can_move_books', env);
    if (!canMoveFromCurrent) {
      return new Response(JSON.stringify({ error: 'You do not have permission to move books from this location' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If moving to different location, check cross-location and add permissions
    if (currentLocationId !== newLocationId) {
      // Check if user has global cross-location permission
      const canMoveBetweenLocations = await hasGlobalPermission(userId, 'can_move_books_between_locations', env);
      if (!canMoveBetweenLocations) {
        return new Response(JSON.stringify({ error: 'You do not have permission to move books between locations. Contact your administrator to enable cross-location book movement.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Also check add permission in target location
      const canAddToNew = await hasUserPermission(userId, newLocationId, 'can_add_books', env);
      if (!canAddToNew) {
        return new Response(JSON.stringify({ error: 'You do not have permission to add books to the target location' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // Build dynamic UPDATE query to only update provided fields
  const updateFields = [];
  const updateValues = [];
  
  if (book.shelf_id !== undefined) {
    updateFields.push('shelf_id = ?');
    updateValues.push(book.shelf_id || null);
  }
  
  if (book.tags !== undefined) {
    updateFields.push('tags = ?');
    updateValues.push(JSON.stringify(book.tags || []));
  }
  
  if (book.thumbnail !== undefined) {
    updateFields.push('thumbnail = ?');
    updateValues.push(book.thumbnail || null);
  }
  
  if (book.alternative_covers !== undefined) {
    updateFields.push('alternative_covers = ?');
    updateValues.push(book.alternative_covers ? JSON.stringify(book.alternative_covers) : null);
  }
  
  if (book.selected_cover_source !== undefined) {
    updateFields.push('selected_cover_source = ?');
    updateValues.push(book.selected_cover_source ? JSON.stringify(book.selected_cover_source) : null);
  }
  
  if (book.selected_cover_source !== undefined) {
    updateFields.push('cover_selection_date = ?');
    updateValues.push(new Date().toISOString());
  }
  
  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ success: true, message: 'No fields to update' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const stmt = env.DB.prepare(`
    UPDATE books 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);
  
  updateValues.push(id);
  await stmt.bind(...updateValues).run();

  // Invalidate admin analytics cache on book update
  await invalidateAllAdminAnalytics(env);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function deleteBook(userId: string, env: Env, corsHeaders: Record<string, string>, id: number) {
  // Get the location ID for this book
  const locationId = await getLocationIdFromBookId(id, env);
  if (!locationId) {
    return new Response(JSON.stringify({ error: 'Book not found or invalid location' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user has permission to delete books in this location
  const hasPermission = await hasUserPermission(userId, locationId, 'can_delete_books', env);
  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'You do not have permission to delete books in this location' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stmt = env.DB.prepare('DELETE FROM books WHERE id = ?');
  await stmt.bind(id).run();

  // Invalidate admin analytics cache on book deletion
  await invalidateAllAdminAnalytics(env);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Book Checkout System Functions
export async function checkoutBook(request: Request, bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  let due_date: string | undefined;
  let notes: string | undefined;
  
  // Safely parse JSON body, handling empty/missing body
  try {
    const body = await request.text();
    if (body.trim()) {
      const parsed = JSON.parse(body);
      due_date = parsed.due_date;
      notes = parsed.notes;
    }
  } catch (error) {
    // If JSON parsing fails, continue with undefined values
    console.warn('Failed to parse checkout request body:', error);
  }

  try {
    // Check user role first
    const userRoleStmt = env.DB.prepare(`SELECT user_role FROM users WHERE id = ?`);
    const userRole = await userRoleStmt.bind(userId).first() as any;
    const isAdmin = userRole?.user_role === 'admin' || userRole?.user_role === 'super_admin';
    
    // For admin/superadmin, just check if book exists and is available
    let book;
    if (isAdmin) {
      const bookStmt = env.DB.prepare(`
        SELECT b.*, s.location_id, l.name as location_name
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE b.id = ?
      `);
      book = await bookStmt.bind(bookId).first();
    } else {
      // For regular users, check if user has access to this book and that it's available
      const bookStmt = env.DB.prepare(`
        SELECT b.*, s.location_id, l.name as location_name
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
      `);
      book = await bookStmt.bind(bookId, userId, userId, userId).first();
    }
    
    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if book is already checked out
    if ((book as any).status === 'checked_out') {
      return new Response(JSON.stringify({ error: 'Book is already checked out' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate due date (default to 2 weeks from now if not provided)
    const dueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Update book status and add history atomically
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE books
        SET status = 'checked_out',
            checked_out_by = ?,
            checked_out_date = datetime('now'),
            due_date = ?
        WHERE id = ?
      `).bind(userId, dueDate, bookId),
      env.DB.prepare(`
        INSERT INTO book_checkout_history (book_id, user_id, action, action_date, due_date, notes, created_at)
        VALUES (?, ?, 'checkout', datetime('now'), ?, ?, datetime('now'))
      `).bind(bookId, userId, dueDate, notes || null),
    ]);

    // Get user name for response
    const userStmt = env.DB.prepare(`SELECT first_name, last_name FROM users WHERE id = ?`);
    const user = await userStmt.bind(userId).first();
    const userName = user ? `${(user as any).first_name || ''}`.trim() || 'Unknown' : 'Unknown';

    return new Response(JSON.stringify({ 
      message: 'Book checked out successfully',
      book_title: (book as any).title,
      due_date: dueDate,
      book_id: bookId,
      checked_out_by: userId,
      checked_out_by_name: userName,
      checked_out_date: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking out book:', error);
    return new Response(JSON.stringify({ error: 'Failed to checkout book' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function checkinBook(bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {

  try {
    // Check user role first
    const userStmt = env.DB.prepare(`SELECT user_role FROM users WHERE id = ?`);
    const user = await userStmt.bind(userId).first() as any;
    const isAdmin = user?.user_role === 'admin' || user?.user_role === 'super_admin';
    
    // For admin/superadmin, just check if book exists and is checked out
    if (isAdmin) {
      const bookStmt = env.DB.prepare(`
        SELECT b.*, s.location_id, l.name as location_name
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE b.id = ?
      `);
      
      const book = await bookStmt.bind(bookId).first();
      
      if (!book) {
        return new Response(JSON.stringify({ error: 'Book not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if book is checked out
      if ((book as any).status !== 'checked_out') {
        return new Response(JSON.stringify({ error: 'Book is not currently checked out' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Admin can check in any book - proceed to checkin logic
      await env.DB.batch([
        env.DB.prepare(`
          UPDATE books
          SET status = 'available',
              checked_out_by = NULL,
              checked_out_date = NULL,
              due_date = NULL
          WHERE id = ?
        `).bind(bookId),
        env.DB.prepare(`
          INSERT INTO book_checkout_history (book_id, user_id, action, action_date, created_at)
          VALUES (?, ?, 'return', datetime('now'), datetime('now'))
        `).bind(bookId, userId),
      ]);

      return new Response(JSON.stringify({ 
        message: 'Book checked in successfully',
        book_title: (book as any).title,
        book_id: bookId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // For regular users, check if they have access to this book's location
    const bookStmt = env.DB.prepare(`
      SELECT b.*, s.location_id, l.name as location_name
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
    `);

    const book = await bookStmt.bind(bookId, userId, userId, userId).first();
    
    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if book is checked out
    if ((book as any).status !== 'checked_out') {
      return new Response(JSON.stringify({ error: 'Book is not currently checked out' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user can check in this book
    // User can check in if: they checked it out OR they have checkout override permission
    const isCheckedOutByUser = (book as any).checked_out_by === userId;
    
    if (!isCheckedOutByUser) {
      // User didn't check it out - check if they have override permission
      const locationId = (book as any).location_id;
      const canOverrideCheckout = await hasUserPermission(userId, locationId, 'allow_checkout_override', env);
      
      if (!canOverrideCheckout) {
        return new Response(JSON.stringify({ error: 'You can only return books you checked out yourself, or if you have checkout override permission' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update book status and add history atomically
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE books
        SET status = 'available',
            checked_out_by = NULL,
            checked_out_date = NULL,
            due_date = NULL
        WHERE id = ?
      `).bind(bookId),
      env.DB.prepare(`
        INSERT INTO book_checkout_history (book_id, user_id, action, action_date, created_at)
        VALUES (?, ?, 'return', datetime('now'), datetime('now'))
      `).bind(bookId, userId),
    ]);

    return new Response(JSON.stringify({ 
      message: 'Book checked in successfully',
      book_title: (book as any).title,
      book_id: bookId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking in book:', error);
    return new Response(JSON.stringify({ error: 'Failed to checkin book' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getCheckoutHistory(userId: string, env: Env, corsHeaders: Record<string, string>) {

  try {
    // Check if user is admin to determine what data they can see
    const isAdmin = await isUserAdmin(userId, env);
    
    let historyStmt;
    let bindings: any[];

    if (isAdmin) {
      // Admins can see all checkout history
      historyStmt = env.DB.prepare(`
        SELECT ch.*, 
               b.title as book_title, 
               b.authors as book_authors,
               b.isbn as book_isbn,
               l.name as location_name,
               u.first_name as user_name,
               u.email as user_email
        FROM book_checkout_history ch
        LEFT JOIN books b ON ch.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN users u ON ch.user_id = u.id
        ORDER BY ch.action_date DESC
      `);
      bindings = [];
    } else {
      // Regular users can only see their own checkout history
      historyStmt = env.DB.prepare(`
        SELECT ch.*, 
               b.title as book_title, 
               b.authors as book_authors,
               b.isbn as book_isbn,
               l.name as location_name
        FROM book_checkout_history ch
        LEFT JOIN books b ON ch.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE ch.user_id = ?
        ORDER BY ch.action_date DESC
      `);
      bindings = [userId];
    }

    const result = await historyStmt.bind(...bindings).all();
    
    const history = result.results.map((entry: any) => ({
      ...entry,
      book_authors: entry.book_authors ? JSON.parse(entry.book_authors) : []
    }));

    return new Response(JSON.stringify(history), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching checkout history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch checkout history' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Book Removal Request Functions
export async function createBookRemovalRequest(request: Request, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const { book_id, reason, reason_details }: {
    book_id: number;
    reason: string;
    reason_details?: string;
  } = await request.json();

  if (!book_id || !reason) {
    return new Response(JSON.stringify({ error: 'book_id and reason are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate reason
  const validReasons = ['lost', 'damaged', 'missing', 'overdue', 'returned', 'other'];
  if (!validReasons.includes(reason)) {
    return new Response(JSON.stringify({ error: 'Invalid reason. Must be one of: lost, damaged, missing, overdue, returned, other' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if user has access to this book
    const bookAccessStmt = env.DB.prepare(`
      SELECT b.id, b.title, b.authors, s.location_id, l.name as location_name
      FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
    `);

    const bookAccess = await bookAccessStmt.bind(book_id, userId, userId, userId).first();
    
    if (!bookAccess) {
      return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if there's already a pending request for this book
    const existingRequestStmt = env.DB.prepare(`
      SELECT id FROM book_removal_requests 
      WHERE book_id = ? AND status = 'pending'
    `);
    const existingRequest = await existingRequestStmt.bind(book_id).first();
    
    if (existingRequest) {
      return new Response(JSON.stringify({ error: 'A removal request for this book is already pending' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the removal request
    const createRequestStmt = env.DB.prepare(`
      INSERT INTO book_removal_requests (book_id, requester_id, reason, reason_details, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `);

    const result = await createRequestStmt.bind(
      book_id,
      userId,
      reason,
      reason_details || null
    ).run();

    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id,
      message: 'Book removal request submitted successfully',
      book_title: bookAccess.title,
      status: 'pending'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating book removal request:', error);
    return new Response(JSON.stringify({ error: 'Failed to create removal request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getBookRemovalRequests(userId: string, env: Env, corsHeaders: Record<string, string>) {

  try {
    // Check user permissions
    const isAdmin = await isUserAdmin(userId, env);
    const isSuperAdmin = await isUserSuperAdmin(userId, env);
    
    let requestsStmt;
    let bindings: any[];

    if (isSuperAdmin) {
      // Super admins can see all requests
      requestsStmt = env.DB.prepare(`
        SELECT rr.*, 
               b.title as book_title, 
               b.authors as book_authors,
               b.isbn as book_isbn,
               l.name as location_name,
               u_requester.first_name as requester_name,
               u_requester.email as requester_email,
               u_reviewer.first_name as reviewer_name
        FROM book_removal_requests rr
        LEFT JOIN books b ON rr.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN users u_requester ON rr.requester_id = u_requester.id
        LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
        ORDER BY rr.created_at DESC
      `);
      bindings = [];
    } else if (isAdmin) {
      // Regular admins can only see requests from their assigned locations
      requestsStmt = env.DB.prepare(`
        SELECT rr.*, 
               b.title as book_title, 
               b.authors as book_authors,
               b.isbn as book_isbn,
               l.name as location_name,
               u_requester.first_name as requester_name,
               u_requester.email as requester_email,
               u_reviewer.first_name as reviewer_name
        FROM book_removal_requests rr
        LEFT JOIN books b ON rr.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN users u_requester ON rr.requester_id = u_requester.id
        LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
        WHERE l.id IN (
          SELECT location_id FROM (
            SELECT id as location_id FROM locations WHERE owner_id = ?
            UNION
            SELECT location_id FROM location_members WHERE user_id = ?
          )
        )
        ORDER BY rr.created_at DESC
      `);
      bindings = [userId, userId];
    } else {
      // Regular users can only see their own requests
      requestsStmt = env.DB.prepare(`
        SELECT rr.*, 
               b.title as book_title, 
               b.authors as book_authors,
               b.isbn as book_isbn,
               l.name as location_name,
               u_reviewer.first_name as reviewer_name
        FROM book_removal_requests rr
        LEFT JOIN books b ON rr.book_id = b.id
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN users u_reviewer ON rr.reviewed_by = u_reviewer.id
        WHERE rr.requester_id = ?
        ORDER BY rr.created_at DESC
      `);
      bindings = [userId];
    }

    const result = await requestsStmt.bind(...bindings).all();
    
    const requests = result.results.map((request: any) => ({
      ...request,
      book_authors: request.book_authors ? JSON.parse(request.book_authors) : []
    }));

    return new Response(JSON.stringify(requests), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching book removal requests:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch removal requests' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function approveBookRemovalRequest(requestId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {

  // Check if user is admin (only admins can approve requests)
  if (!(await isUserAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required to approve removal requests' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the removal request details
    const requestStmt = env.DB.prepare(`
      SELECT rr.*, b.title as book_title, b.authors as book_authors
      FROM book_removal_requests rr
      LEFT JOIN books b ON rr.book_id = b.id
      WHERE rr.id = ? AND rr.status = 'pending'
    `);
    
    const removalRequest = await requestStmt.bind(requestId).first();
    
    if (!removalRequest) {
      return new Response(JSON.stringify({ error: 'Removal request not found or already processed' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM books WHERE id = ?').bind((removalRequest as any).book_id),
      env.DB.prepare(`
        UPDATE book_removal_requests
        SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now')
        WHERE id = ?
      `).bind(userId, requestId),
    ]);

    return new Response(JSON.stringify({ 
      message: 'Book removal request approved and book deleted successfully',
      book_title: (removalRequest as any).book_title,
      request_id: requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error approving book removal request:', error);
    return new Response(JSON.stringify({ error: 'Failed to approve removal request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function denyBookRemovalRequest(request: Request, requestId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {

  // Check if user is admin (only admins can deny requests)
  if (!(await isUserAdmin(userId, env))) {
    return new Response(JSON.stringify({ error: 'Admin privileges required to deny removal requests' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { review_comment }: { review_comment?: string } = await request.json();

  try {
    // Get the removal request details
    const requestStmt = env.DB.prepare(`
      SELECT rr.*, b.title as book_title
      FROM book_removal_requests rr
      LEFT JOIN books b ON rr.book_id = b.id
      WHERE rr.id = ? AND rr.status = 'pending'
    `);
    
    const removalRequest = await requestStmt.bind(requestId).first();
    
    if (!removalRequest) {
      return new Response(JSON.stringify({ error: 'Removal request not found or already processed' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the removal request status
    const updateRequestStmt = env.DB.prepare(`
      UPDATE book_removal_requests 
      SET status = 'denied', reviewed_by = ?, review_comment = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `);
    
    await updateRequestStmt.bind(userId, review_comment || null, requestId).run();

    return new Response(JSON.stringify({ 
      message: 'Book removal request denied',
      book_title: (removalRequest as any).book_title,
      request_id: requestId,
      review_comment: review_comment || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error denying book removal request:', error);
    return new Response(JSON.stringify({ error: 'Failed to deny removal request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function deleteBookRemovalRequest(requestId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Get the removal request details and verify user owns it
    const requestStmt = env.DB.prepare(`
      SELECT rr.*, b.title as book_title
      FROM book_removal_requests rr
      LEFT JOIN books b ON rr.book_id = b.id
      WHERE rr.id = ? AND rr.requester_id = ? AND rr.status = 'pending'
    `);
    
    const removalRequest = await requestStmt.bind(requestId, userId).first();
    
    if (!removalRequest) {
      return new Response(JSON.stringify({ error: 'Removal request not found, already processed, or you do not have permission to cancel it' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete the removal request
    const deleteStmt = env.DB.prepare('DELETE FROM book_removal_requests WHERE id = ?');
    await deleteStmt.bind(requestId).run();

    return new Response(JSON.stringify({ 
      message: 'Book removal request cancelled successfully',
      book_title: (removalRequest as any).book_title,
      request_id: requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error cancelling book removal request:', error);
    return new Response(JSON.stringify({ error: 'Failed to cancel removal request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Book Rating System Functions
export async function rateBook(request: Request, bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  const { rating, reviewText }: { rating: number, reviewText?: string } = await request.json();

  // Validate rating (allow 0 for deletion, 1-5 for rating)
  if (rating < 0 || rating > 5 || !Number.isInteger(rating)) {
    return new Response(JSON.stringify({ error: 'Rating must be an integer between 0 (to delete) and 5' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if user is admin first
    const isAdmin = await isUserAdmin(userId, env);
    
    let bookAccess;
    if (isAdmin) {
      // Admins can rate all books
      const bookStmt = env.DB.prepare(`
        SELECT b.id, b.title, s.location_id, l.name as location_name
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE b.id = ?
      `);
      bookAccess = await bookStmt.bind(bookId).first();
    } else {
      // Regular users need access check
      const bookAccessStmt = env.DB.prepare(`
        SELECT b.id, b.title, s.location_id, l.name as location_name
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
      `);
      bookAccess = await bookAccessStmt.bind(bookId, userId, userId, userId).first();
    }
    
    if (!bookAccess) {
      return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle rating deletion (rating = 0) or insertion/update
    if (rating === 0) {
      // Check if we're deleting a pending review (affects pending count)
      const existingReviewStmt = env.DB.prepare(`
        SELECT review_status FROM book_ratings WHERE book_id = ? AND user_id = ?
      `);
      const existingReview = await existingReviewStmt.bind(bookId, userId).first();
      const wasPending = (existingReview as any)?.review_status === 'pending';

      // Delete the rating
      const deleteRatingStmt = env.DB.prepare(`
        DELETE FROM book_ratings WHERE book_id = ? AND user_id = ?
      `);
      await deleteRatingStmt.bind(bookId, userId).run();

      // Invalidate admin analytics cache if a pending review was deleted
      if (wasPending) {
        try {
          const { invalidateAllAdminAnalytics } = await import('../admin/cached');
          await invalidateAllAdminAnalytics(env);
        } catch (cacheError) {
          console.error('Failed to invalidate admin analytics cache:', cacheError);
          // Don't fail the review deletion if cache invalidation fails
        }
      }
    } else {
      // Check existing review to properly handle status preservation
      const existingReviewStmt = env.DB.prepare(`
        SELECT review_text, review_status FROM book_ratings WHERE book_id = ? AND user_id = ?
      `);
      const existingReview = await existingReviewStmt.bind(bookId, userId).first();
      const wasPreviouslyRejected = (existingReview as any)?.review_status === 'rejected';
      
      // Determine review status based on user permissions and content changes
      const isAdmin = await isUserAdmin(userId, env);
      const hasReviewText = reviewText && reviewText.trim().length > 0;
      
      // Check if review text has actually changed
      const existingReviewText = (existingReview as any)?.review_text || '';
      const newReviewText = reviewText?.trim() || '';
      const reviewTextChanged = existingReviewText !== newReviewText;
      
      // Only require re-approval if review text has changed (star ratings never need approval)
      let reviewStatus: string;
      if (hasReviewText && !isAdmin && reviewTextChanged) {
        // New or changed review text needs moderation
        reviewStatus = 'pending';
      } else if (existingReview && !reviewTextChanged) {
        // Preserve existing status if only rating changed
        reviewStatus = (existingReview as any).review_status || 'approved';
      } else {
        // No review text or admin user - auto approve
        reviewStatus = 'approved';
      }
      
      // Insert or update rating in book_ratings table
      const upsertRatingStmt = env.DB.prepare(`
        INSERT OR REPLACE INTO book_ratings (
          book_id, user_id, rating, review_text, review_status, 
          reviewed_by, reviewed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 
          COALESCE((SELECT created_at FROM book_ratings WHERE book_id = ? AND user_id = ?), datetime('now')),
          datetime('now')
        )
      `);
      
      const reviewedBy = reviewStatus === 'approved' && isAdmin ? userId : null;
      const reviewedAt = reviewStatus === 'approved' ? new Date().toISOString() : null;
      
      await upsertRatingStmt.bind(
        bookId, userId, rating, reviewText || null, reviewStatus,
        reviewedBy, reviewedAt, bookId, userId
      ).run();

      // Send notification if review was submitted for moderation
      if (reviewStatus === 'pending' && reviewText && reviewText.trim().length > 0) {
        try {
          await sendBookReviewUpdate(
            env,
            (bookAccess as any).title,
            'authors' in bookAccess ? (bookAccess as any).authors : 'Unknown Author',
            reviewText,
            userId,
            (bookAccess as any).location_id,
            'submitted'
          );
        } catch (notificationError) {
          console.error('Failed to send book review notification:', notificationError);
          // Don't fail the review submission if notification fails
        }

        // Invalidate admin analytics cache since pending review count increased
        try {
          const { invalidateAllAdminAnalytics } = await import('../admin/cached');
          await invalidateAllAdminAnalytics(env);
        } catch (cacheError) {
          console.error('Failed to invalidate admin analytics cache:', cacheError);
          // Don't fail the review submission if cache invalidation fails
        }
      }

      // If this was a resubmission of a previously rejected review, mark the rejection notification as read
      if (wasPreviouslyRejected && hasReviewText) {
        try {
          // Find and mark the rejection notification as read
          const notificationStmt = env.DB.prepare(`
            SELECT id FROM in_app_notifications 
            WHERE recipient_user_id = ? 
              AND notification_type = 'book_review_rejected'
              AND is_read = FALSE
              AND JSON_EXTRACT(metadata, '$.bookTitle') = ?
            ORDER BY created_at DESC 
            LIMIT 1
          `);
          
          const notification = await notificationStmt.bind(userId, (bookAccess as any).title).first();
          
          if (notification) {
            const { markNotificationAsRead } = await import('../notifications/index');
            await markNotificationAsRead(env, (notification as any).id, userId);
          }
        } catch (notificationError) {
          console.error('Failed to mark rejection notification as read:', notificationError);
          // Don't fail the review submission if notification update fails
        }
      }
    }

    // Calculate new average rating for this book within the location
    const avgRatingStmt = env.DB.prepare(`
      SELECT 
        AVG(br.rating) as average_rating,
        COUNT(br.rating) as rating_count
      FROM book_ratings br
      INNER JOIN books b ON br.book_id = b.id
      INNER JOIN shelves s ON b.shelf_id = s.id
      INNER JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE br.book_id = ? 
        AND (b.added_by = br.user_id OR l.owner_id = br.user_id OR lm.user_id = br.user_id)
    `);

    const ratingStats = await avgRatingStmt.bind(bookId).first();
    const averageRating = (ratingStats as any)?.average_rating || null;
    const ratingCount = (ratingStats as any)?.rating_count || 0;

    // Update the books table with new average rating (library-wide average, not user-specific)
    const updateBookStmt = env.DB.prepare(`
      UPDATE books 
      SET rating_count = ?, rating_updated_at = datetime('now')
      WHERE id = ?
    `);

    await updateBookStmt.bind(ratingCount, bookId).run();

    // Get the user's review status for the response (only if not deleting)
    let userReviewStatus = null;
    if (rating !== 0) {
      const userReviewStmt = env.DB.prepare(`
        SELECT review_status
        FROM book_ratings
        WHERE book_id = ? AND user_id = ?
      `);
      const userReview = await userReviewStmt.bind(bookId, userId).first();
      userReviewStatus = (userReview as any)?.review_status || null;
    }

    return new Response(JSON.stringify({ 
      message: rating === 0 ? 'Rating deleted successfully' : 'Book rated successfully',
      book_id: bookId,
      book_title: (bookAccess as any).title,
      user_rating: rating === 0 ? null : rating,
      userReviewStatus: userReviewStatus,
      average_rating: averageRating,
      rating_count: ratingCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error rating book:', error);
    return new Response(JSON.stringify({ error: 'Failed to rate book' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function getBookRating(bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user is admin first
    const isAdmin = await isUserAdmin(userId, env);
    
    let ratingStmt;
    let bindings: any[];
    
    if (isAdmin) {
      // Admins can access all books
      ratingStmt = env.DB.prepare(`
        SELECT 
          b.id, b.title, b.user_rating, b.average_rating, b.rating_count, s.location_id,
          br.rating as current_user_rating, br.review_text as current_user_review,
          br.review_status as current_user_review_status
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN book_ratings br ON b.id = br.book_id AND br.user_id = ?
        WHERE b.id = ?
      `);
      bindings = [userId, bookId];
    } else {
      // Regular users need location access
      ratingStmt = env.DB.prepare(`
        SELECT 
          b.id, b.title, b.user_rating, b.average_rating, b.rating_count, s.location_id,
          br.rating as current_user_rating, br.review_text as current_user_review,
          br.review_status as current_user_review_status
        FROM books b
        LEFT JOIN shelves s ON b.shelf_id = s.id
        LEFT JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        LEFT JOIN book_ratings br ON b.id = br.book_id AND br.user_id = ?
        WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
      `);
      bindings = [userId, bookId, userId, userId, userId];
    }

    const result = await ratingStmt.bind(...bindings).first();
    
    if (!result) {
      return new Response(JSON.stringify({ error: 'Book not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bookRating = result as any;

    // Get all reviews for this book
    let allReviewsStmt;

    if (isAdmin) {
      // Admins can see all approved reviews for any book
      allReviewsStmt = env.DB.prepare(`
        SELECT DISTINCT
          br.id,
          br.rating,
          br.review_text,
          br.created_at,
          br.updated_at,
          br.user_id,
          br.reviewer_anonymous,
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.display_name_preference,
          u.custom_username,
          l.id as location_id,
          l.activity_visibility
        FROM book_ratings br
        INNER JOIN users u ON br.user_id = u.id
        INNER JOIN books b ON br.book_id = b.id
        INNER JOIN shelves s ON b.shelf_id = s.id
        INNER JOIN locations l ON s.location_id = l.id
        WHERE br.book_id = ?
          AND br.review_text IS NOT NULL AND br.review_text != ''
          AND br.review_status = 'approved'
        GROUP BY br.user_id
        ORDER BY MAX(br.updated_at) DESC
      `);
    } else {
      // Regular users see approved reviews from users with location access
      allReviewsStmt = env.DB.prepare(`
        SELECT DISTINCT
          br.id,
          br.rating,
          br.review_text,
          br.created_at,
          br.updated_at,
          br.user_id,
          br.reviewer_anonymous,
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.display_name_preference,
          u.custom_username,
          l.id as location_id,
          l.activity_visibility
        FROM book_ratings br
        INNER JOIN books b ON br.book_id = b.id
        INNER JOIN shelves s ON b.shelf_id = s.id
        INNER JOIN locations l ON s.location_id = l.id
        LEFT JOIN location_members lm ON l.id = lm.location_id
        INNER JOIN users u ON br.user_id = u.id
        WHERE br.book_id = ?
          AND (b.added_by = br.user_id OR l.owner_id = br.user_id OR lm.user_id = br.user_id)
          AND br.review_text IS NOT NULL AND br.review_text != ''
          AND br.review_status = 'approved'
        GROUP BY br.user_id
        ORDER BY MAX(br.updated_at) DESC
      `);
    }

    const reviewsResult = await allReviewsStmt.bind(bookId).all();

    // Apply privacy settings to each review
    const { getUserDisplayInfo } = await import('../privacy');
    const privacyAwareReviews = [];

    for (const review of reviewsResult.results || []) {
      const user = {
        id: review.user_id,
        email: review.email,
        first_name: review.first_name,
        last_name: review.last_name,
        display_name_preference: review.display_name_preference,
        custom_username: review.custom_username
      };

      // Get privacy-aware user display info
      const userDisplayInfo = await getUserDisplayInfo(
        user,
        userId,
        review.location_id,
        'review',
        review.id.toString(),
        env
      );

      privacyAwareReviews.push({
        ...review,
        user_name: userDisplayInfo.displayName
      });
    }

    return new Response(JSON.stringify({
      book_id: bookId,
      user_rating: bookRating.current_user_rating || null,
      user_review: bookRating.current_user_review || null,
      user_review_status: bookRating.current_user_review_status || null,
      average_rating: bookRating.average_rating || null,
      rating_count: bookRating.rating_count || 0,
      location_id: bookRating.location_id,
      all_ratings: privacyAwareReviews
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting book rating:', error);
    return new Response(JSON.stringify({ error: 'Failed to get book rating' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get checkout history for a specific book - admin only
export async function getBookCheckoutHistory(bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user is admin - only admins can see book checkout history
    const isAdmin = await isUserAdmin(userId, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get checkout history for the specific book
    const historyStmt = env.DB.prepare(`
      SELECT ch.*, 
             u.first_name as user_name,
             u.email as user_email
      FROM book_checkout_history ch
      LEFT JOIN users u ON ch.user_id = u.id
      WHERE ch.book_id = ?
      ORDER BY ch.action_date DESC
    `);

    const result = await historyStmt.bind(bookId).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting book checkout history:', error);
    return new Response(JSON.stringify({ error: 'Failed to get book checkout history' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Email overdue user for a specific book - admin only
// Book Cover Selection Functions
export async function getBookEditions(title: string, author: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    const query = `intitle:"${title}"+inauthor:${author}`;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
    );
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json() as GoogleBooksResponse;
    
    if (!data.items || data.items.length === 0) {
      return new Response(JSON.stringify({ editions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
            covers[size] = volumeInfo.imageLinks[size];
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
    
    return new Response(JSON.stringify({ editions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error fetching book editions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch book editions' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function emailOverdueUser(bookId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user is admin - only admins can send overdue emails
    const isAdmin = await isUserAdmin(userId, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get book details and current checkout info
    const bookStmt = env.DB.prepare(`
      SELECT b.*, 
             u.email as checked_out_user_email,
             u.first_name as checked_out_user_name,
             l.name as location_name
      FROM books b
      LEFT JOIN users u ON b.checked_out_by = u.id
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE b.id = ? AND b.checked_out_by IS NOT NULL
    `);

    const book = await bookStmt.bind(bookId).first();
    
    if (!book) {
      return new Response(JSON.stringify({ error: 'Book not found or not currently checked out' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bookData = book as any;
    
    // Send overdue email using Resend
    if (env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: getWorkerFromEmail(env),
          to: [bookData.checked_out_user_email],
          subject: `LibraryCard: Overdue Book Reminder - "${bookData.title}"`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Overdue Book Reminder</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 300;">📚 LibraryCard</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Overdue Book Reminder</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <h2 style="color: #ff6b35; margin-top: 0; font-size: 24px;">Book Return Reminder</h2>
                  
                  <p style="font-size: 16px; margin-bottom: 20px;">Hello ${bookData.checked_out_user_name},</p>
                  
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    This is a friendly reminder that you have a book checked out from ${bookData.location_name} that may be overdue:
                  </p>
                  
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">📖 "${bookData.title}"</p>
                    ${bookData.authors ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">by ${JSON.parse(bookData.authors).join(', ')}</p>` : ''}
                    ${bookData.checked_out_date ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"><strong>Checked out:</strong> ${new Date(bookData.checked_out_date).toLocaleDateString()}</p>` : ''}
                    ${bookData.due_date ? `<p style="margin: 0; font-size: 14px; color: #666;"><strong>Due date:</strong> ${new Date(bookData.due_date).toLocaleDateString()}</p>` : ''}
                  </div>
                  
                  <p style="font-size: 16px; margin-bottom: 25px;">
                    Please return this book to the library when you have a chance. Other community members may be waiting to read it!
                  </p>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 25px;">
                    If you've already returned this book, please disregard this message - there may be a delay in our system updates.
                  </p>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    Thank you for being part of our library community!
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
                  <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                    This is an automated reminder from LibraryCard. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
LibraryCard - Overdue Book Reminder

Hello ${bookData.checked_out_user_name},

This is a friendly reminder that you have a book checked out from ${bookData.location_name} that may be overdue:

"${bookData.title}"
${bookData.authors ? `by ${JSON.parse(bookData.authors).join(', ')}` : ''}
${bookData.checked_out_date ? `Checked out: ${new Date(bookData.checked_out_date).toLocaleDateString()}` : ''}
${bookData.due_date ? `Due date: ${new Date(bookData.due_date).toLocaleDateString()}` : ''}

Please return this book to the library when you have a chance. Other community members may be waiting to read it!

If you've already returned this book, please disregard this message - there may be a delay in our system updates.

Thank you for being part of our library community!

This is an automated reminder from LibraryCard.
          `
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Email service error: ${response.status} ${errorText}`);
      }

      const result = await response.json() as { id: string };
      console.log('Overdue email sent successfully:', result.id);
    } else {
      // Fallback for development without email service
      console.log(`
        Overdue email would be sent to: ${bookData.checked_out_user_email}
        User: ${bookData.checked_out_user_name}
        Book: "${bookData.title}"
        Location: ${bookData.location_name}
      `);
    }
    
    return new Response(JSON.stringify({ 
      message: 'Overdue notice sent successfully',
      book_title: bookData.title,
      user_email: bookData.checked_out_user_email,
      user_name: bookData.checked_out_user_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending overdue email:', error);
    return new Response(JSON.stringify({ error: 'Failed to send overdue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Review Moderation System (GitHub Issue #256)

export async function getPendingReviews(userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(userId, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all pending reviews with book details
    const pendingReviewsStmt = env.DB.prepare(`
      SELECT 
        br.id, br.book_id, br.user_id, br.rating, br.review_text,
        br.created_at, br.updated_at, br.review_status,
        b.title as book_title, b.thumbnail as book_thumbnail, b.authors as book_authors,
        u.first_name as user_name, u.email as user_email
      FROM book_ratings br
      INNER JOIN books b ON br.book_id = b.id
      INNER JOIN users u ON br.user_id = u.id
      WHERE br.review_status = 'pending'
        AND br.review_text IS NOT NULL 
        AND br.review_text != ''
      ORDER BY br.created_at ASC
    `);

    const result = await pendingReviewsStmt.all();
    
    const pendingReviews = result.results.map((review: any) => ({
      id: review.id,
      bookId: review.book_id,
      userId: review.user_id,
      rating: review.rating,
      reviewText: review.review_text,
      userName: review.user_name,
      userEmail: review.user_email,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      reviewStatus: review.review_status,
      bookTitle: review.book_title,
      bookThumbnail: review.book_thumbnail,
      bookAuthors: JSON.parse(review.book_authors || '[]')
    }));

    return new Response(JSON.stringify({
      pendingReviews,
      count: pendingReviews.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pending reviews' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export async function moderateReview(request: Request, reviewId: number, userId: string, env: Env, corsHeaders: Record<string, string>) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(userId, env);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, rejectionReason }: { action: 'approve' | 'reject' | 'delete', rejectionReason?: string } = await request.json();

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action. Must be approve, reject, or delete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the review first to verify it exists and is pending
    const reviewStmt = env.DB.prepare(`
      SELECT br.*, b.title as book_title 
      FROM book_ratings br
      INNER JOIN books b ON br.book_id = b.id
      WHERE br.id = ?
    `);
    
    const review = await reviewStmt.bind(reviewId).first() as any;
    
    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;
    let message;

    if (action === 'delete') {
      // Delete the review entirely
      const deleteStmt = env.DB.prepare(`DELETE FROM book_ratings WHERE id = ?`);
      result = await deleteStmt.bind(reviewId).run();
      message = 'Review deleted successfully';
    } else {
      // Approve or reject the review
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const updateStmt = env.DB.prepare(`
        UPDATE book_ratings 
        SET review_status = ?, reviewed_by = ?, reviewed_at = datetime('now'),
            review_rejection_reason = ?
        WHERE id = ?
      `);
      
      result = await updateStmt.bind(
        newStatus, 
        userId, 
        action === 'reject' ? (rejectionReason || 'No reason provided') : null,
        reviewId
      ).run();
      
      message = action === 'approve' ? 'Review approved successfully' : 'Review rejected successfully';
    }

    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'No changes made to review' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notification for review moderation (approve/reject only, not delete)
    if (action !== 'delete') {
      try {
        // Get book details for notification
        const bookStmt = env.DB.prepare(`
          SELECT title, authors, location_id FROM books WHERE id = ?
        `);
        const book = await bookStmt.bind(review.book_id).first() as any;

        if (book) {
          await sendBookReviewUpdate(
            env,
            book.title,
            book.authors || '',
            review.review_text || '',
            review.user_id,
            book.location_id,
            action === 'approve' ? 'approved' : 'rejected',
            userId,
            action === 'reject' ? rejectionReason : undefined
          );
        }
      } catch (error) {
        console.error('Error sending review moderation notification:', error);
        // Don't fail the entire operation if notification fails
      }
    }

    // Invalidate book cache to ensure UI gets updated data
    const { invalidateBookCache } = await import('./cached');
    await invalidateBookCache(review.book_id.toString(), review.user_id, env);

    // Invalidate admin analytics cache since pending review count changed
    const { invalidateAllAdminAnalytics } = await import('../admin/cached');
    await invalidateAllAdminAnalytics(env);

    return new Response(JSON.stringify({
      success: true,
      message,
      reviewId,
      action,
      bookTitle: review.book_title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error moderating review:', error);
    return new Response(JSON.stringify({ error: 'Failed to moderate review' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}