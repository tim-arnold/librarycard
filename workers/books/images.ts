import { Env } from '../types';

/**
 * Image Storage and Management for Book Covers
 * Handles R2 storage operations for custom book cover images
 */

export interface ImageUploadRequest {
  bookId?: number;
  image: string; // Base64 data URL
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  metadata?: {
    key: string;
    size: number;
    format: string;
    width: number;
    height: number;
  };
  error?: string;
}

/**
 * Upload a book cover image to R2 storage
 */
export async function uploadBookCoverImage(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    if (!env.R2_BUCKET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image storage not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ImageUploadRequest = await request.json();

    if (!body.image) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image data is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse base64 data URL
    const dataUrlMatch = body.image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!dataUrlMatch) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid image format. Expected base64 data URL.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [, imageFormat, base64Data] = dataUrlMatch;

    // Validate format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedFormats.includes(imageFormat.toLowerCase())) {
      return new Response(JSON.stringify({
        success: false,
        error: `Unsupported image format: ${imageFormat}. Allowed formats: ${allowedFormats.join(', ')}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.length > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: `Image too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const key = `covers/${userId}/${timestamp}-${randomId}.${imageFormat}`;

    // Upload to R2
    const uploadResult = await env.R2_BUCKET.put(key, imageBuffer, {
      httpMetadata: {
        contentType: `image/${imageFormat}`,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        originalSize: imageBuffer.length.toString(),
        ...(body.metadata && {
          width: body.metadata.width.toString(),
          height: body.metadata.height.toString(),
        }),
      },
    });

    if (!uploadResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload image to storage'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate public URL based on environment
    let imageUrl: string;

    if (env.ENVIRONMENT === 'local') {
      // For local development, create a data URL that can be used directly
      // This avoids the need for R2 public access configuration in development
      const mimeType = `image/${imageFormat}`;
      const base64Image = btoa(String.fromCharCode(...imageBuffer));
      imageUrl = `data:${mimeType};base64,${base64Image}`;
    } else {
      // For staging/production, construct proper R2 public URL
      // Note: This requires R2 public access to be configured or a custom domain
      imageUrl = `https://librarycard-images.r2.dev/${key}`;
    }

    // If bookId is provided, save image reference to database
    if (body.bookId) {
      try {
        // Check if user has access to this book
        const bookAccessStmt = env.DB.prepare(`
          SELECT b.id FROM books b
          LEFT JOIN shelves s ON b.shelf_id = s.id
          LEFT JOIN locations l ON s.location_id = l.id
          LEFT JOIN location_members lm ON l.id = lm.location_id
          WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
        `);

        const bookAccess = await bookAccessStmt.bind(body.bookId, userId, userId, userId).first();
        if (!bookAccess) {
          // Clean up uploaded image if book access is denied
          await env.R2_BUCKET.delete(key);
          return new Response(JSON.stringify({
            success: false,
            error: 'Book not found or access denied'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Save image metadata to database
        const imageInsertStmt = env.DB.prepare(`
          INSERT INTO book_images (
            book_id, image_url, image_type, storage_provider, storage_key,
            file_size, image_format, width, height, is_primary, uploaded_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await imageInsertStmt.bind(
          body.bookId,
          imageUrl,
          'cover',
          'r2',
          key,
          imageBuffer.length,
          imageFormat,
          body.metadata?.width || null,
          body.metadata?.height || null,
          true, // Set as primary cover
          userId
        ).run();

        // Update book's custom cover URL
        const bookUpdateStmt = env.DB.prepare(`
          UPDATE books SET
            custom_cover_url = ?,
            custom_cover_metadata = ?
          WHERE id = ?
        `);

        const metadata = JSON.stringify({
          key,
          size: imageBuffer.length,
          format: imageFormat,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          ...(body.metadata && {
            width: body.metadata.width,
            height: body.metadata.height,
          }),
        });

        await bookUpdateStmt.bind(imageUrl, metadata, body.bookId).run();
      } catch (dbError) {
        console.error('Database error while saving image metadata:', dbError);
        // Don't delete the uploaded image as it might be useful for debugging
        // The image will remain in R2 but won't be linked to the book
      }
    }

    const response: ImageUploadResponse = {
      success: true,
      imageUrl,
      metadata: {
        key,
        size: imageBuffer.length,
        format: imageFormat,
        width: body.metadata?.width || 0,
        height: body.metadata?.height || 0,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error uploading book cover image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error during image upload'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Delete a book cover image from R2 storage
 */
export async function deleteBookCoverImage(
  request: Request,
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>,
  bookId: number
): Promise<Response> {
  try {
    if (!env.R2_BUCKET) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Image storage not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has access to this book
    const bookAccessStmt = env.DB.prepare(`
      SELECT b.id, b.custom_cover_metadata FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
    `);

    const bookData = await bookAccessStmt.bind(bookId, userId, userId, userId).first() as any;
    if (!bookData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Book not found or access denied'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get storage key from metadata
    let storageKey: string | null = null;
    if (bookData.custom_cover_metadata) {
      try {
        const metadata = JSON.parse(bookData.custom_cover_metadata);
        storageKey = metadata.key;
      } catch (e) {
        console.warn('Failed to parse custom cover metadata:', e);
      }
    }

    // Delete from R2 if we have the key
    if (storageKey) {
      try {
        await env.R2_BUCKET.delete(storageKey);
      } catch (r2Error) {
        console.error('Failed to delete from R2:', r2Error);
        // Continue with database cleanup even if R2 deletion fails
      }
    }

    // Remove custom cover references from database
    const bookUpdateStmt = env.DB.prepare(`
      UPDATE books SET
        custom_cover_url = NULL,
        custom_cover_metadata = NULL
      WHERE id = ?
    `);
    await bookUpdateStmt.bind(bookId).run();

    // Remove from book_images table
    const imageDeleteStmt = env.DB.prepare(`
      DELETE FROM book_images
      WHERE book_id = ? AND image_type = 'cover' AND uploaded_by = ?
    `);
    await imageDeleteStmt.bind(bookId, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Custom cover deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting book cover image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error during image deletion'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Get book cover images for a specific book
 */
export async function getBookCoverImages(
  userId: string,
  env: Env,
  corsHeaders: Record<string, string>,
  bookId: number
): Promise<Response> {
  try {
    // Check if user has access to this book
    const bookAccessStmt = env.DB.prepare(`
      SELECT b.id FROM books b
      LEFT JOIN shelves s ON b.shelf_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN location_members lm ON l.id = lm.location_id
      WHERE b.id = ? AND (b.added_by = ? OR l.owner_id = ? OR lm.user_id = ?)
    `);

    const bookAccess = await bookAccessStmt.bind(bookId, userId, userId, userId).first();
    if (!bookAccess) {
      return new Response(JSON.stringify({
        error: 'Book not found or access denied'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all images for this book
    const imagesStmt = env.DB.prepare(`
      SELECT
        id, image_url, image_type, file_size, image_format,
        width, height, is_primary, upload_date, metadata
      FROM book_images
      WHERE book_id = ?
      ORDER BY is_primary DESC, upload_date DESC
    `);

    const images = await imagesStmt.bind(bookId).all();

    return new Response(JSON.stringify({
      images: images.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting book cover images:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}