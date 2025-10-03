import { Env } from '../types';
import { getUserFromRequest } from '../auth';

interface ExportBook {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  isbn13: string | null;
  description: string | null;
  publisher: string | null;
  published_date: string | null;
  page_count: number | null;
  cover_image_url: string | null;
  location_name: string | null;
  shelf_name: string | null;
  status: string;
  checked_out_by: string | null;
  due_date: string | null;
  tags: string[];
  genres: string[];
  user_rating: number | null;
  user_review: string | null;
  series_name: string | null;
  series_position: number | null;
  added_date: string;
}

interface ExportData {
  export_date: string;
  export_format: string;
  library_name: string;
  user_email: string;
  books: ExportBook[];
  locations?: {
    id: string;
    name: string;
    shelves: { id: string; name: string }[];
  }[];
  stats: {
    total_books: number;
    checked_out: number;
    available: number;
    total_reviews: number;
  };
}

export async function handleExportRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  const locationId = url.searchParams.get('location_id');

  if (!['json', 'csv'].includes(format)) {
    return new Response(JSON.stringify({ error: 'Invalid format. Use json or csv.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = await getUserFromRequest(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userRecord = await env.DB.prepare('SELECT user_role FROM users WHERE id = ?')
    .bind(userId)
    .first() as any;

  const userIsAdmin = userRecord?.user_role === 'admin' || userRecord?.user_role === 'super_admin';

  if (!userIsAdmin && locationId) {
    const location = await env.DB.prepare(
      'SELECT allow_user_exports FROM locations WHERE id = ?'
    )
      .bind(locationId)
      .first() as any;

    if (!location || !location.allow_user_exports) {
      return new Response(
        JSON.stringify({ error: 'Export not allowed for this location' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  const exportData = await generateExportData(env, userId, locationId, userIsAdmin);

  if (format === 'csv') {
    const csv = convertToCSV(exportData.books);
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="library-export-${Date.now()}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="library-export-${Date.now()}.json"`,
    },
  });
}

async function generateExportData(
  env: Env,
  userEmail: string,
  locationId: string | null,
  includeFullData: boolean
): Promise<ExportData> {
  let locationFilter = '';
  let params: any[] = [];

  if (locationId) {
    locationFilter = 'AND shelves.location_id = ?';
    params.push(locationId);
  }

  const booksQuery = `
    SELECT
      books.id,
      books.title,
      books.authors as author,
      books.isbn,
      books.isbn as isbn13,
      books.description,
      books.publisher_info as publisher,
      books.published_date,
      books.page_count,
      books.thumbnail as cover_image_url,
      books.created_at as added_date,
      books.status,
      locations.name as location_name,
      shelves.name as shelf_name,
      books.checked_out_by,
      books.due_date,
      books.user_rating,
      books.user_review,
      books.series as series_name,
      books.series_number as series_position,
      books.tags,
      books.enhanced_genres as genres
    FROM books
    LEFT JOIN shelves ON books.shelf_id = shelves.id
    LEFT JOIN locations ON shelves.location_id = locations.id
    WHERE 1=1
    ${locationFilter}
    ORDER BY books.title
  `;

  const { results: books } = await env.DB.prepare(booksQuery).bind(...params).all();

  const exportBooks: ExportBook[] = (books as any[]).map((book) => {
    let tags: string[] = [];
    let genres: string[] = [];

    try {
      if (book.tags) {
        tags = JSON.parse(book.tags);
      }
    } catch (e) {
      tags = [];
    }

    try {
      if (book.genres) {
        genres = JSON.parse(book.genres);
      }
    } catch (e) {
      genres = [];
    }

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      isbn13: book.isbn13,
      description: book.description,
      publisher: book.publisher,
      published_date: book.published_date,
      page_count: book.page_count,
      cover_image_url: book.cover_image_url,
      location_name: book.location_name,
      shelf_name: book.shelf_name,
      status: book.status,
      checked_out_by: includeFullData ? book.checked_out_by : null,
      due_date: book.due_date,
      tags,
      genres,
      user_rating: book.user_rating,
      user_review: book.user_review,
      series_name: book.series_name,
      series_position: book.series_position,
      added_date: book.added_date,
    };
  });

  const exportData: ExportData = {
    export_date: new Date().toISOString(),
    export_format: 'json',
    library_name: 'LibraryCard Export',
    user_email: userEmail,
    books: exportBooks,
    stats: {
      total_books: exportBooks.length,
      checked_out: exportBooks.filter((b) => b.status === 'checked_out').length,
      available: exportBooks.filter((b) => b.status === 'available').length,
      total_reviews: exportBooks.filter((b) => b.user_review).length,
    },
  };

  if (includeFullData) {
    const locationsQuery = `
      SELECT
        locations.id,
        locations.name,
        GROUP_CONCAT(shelves.id || ':' || shelves.name) as shelves
      FROM locations
      LEFT JOIN shelves ON locations.id = shelves.location_id
      WHERE 1=1
      ${locationId ? 'AND locations.id = ?' : ''}
      GROUP BY locations.id
    `;

    const { results: locations } = await env.DB.prepare(locationsQuery)
      .bind(...(locationId ? [locationId] : []))
      .all();

    exportData.locations = (locations as any[]).map((loc) => ({
      id: loc.id,
      name: loc.name,
      shelves: loc.shelves
        ? loc.shelves.split(',').map((s: string) => {
            const [id, name] = s.split(':');
            return { id, name };
          })
        : [],
    }));
  }

  return exportData;
}

function convertToCSV(books: ExportBook[]): string {
  const headers = [
    'Title',
    'Author',
    'ISBN',
    'ISBN-13',
    'Publisher',
    'Published Date',
    'Pages',
    'Location',
    'Shelf',
    'Status',
    'Due Date',
    'Tags',
    'Genres',
    'My Rating',
    'Series',
    'Series Position',
    'Added Date',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = books.map((book) => [
    escapeCSV(book.title),
    escapeCSV(book.author),
    escapeCSV(book.isbn),
    escapeCSV(book.isbn13),
    escapeCSV(book.publisher),
    escapeCSV(book.published_date),
    escapeCSV(book.page_count),
    escapeCSV(book.location_name),
    escapeCSV(book.shelf_name),
    escapeCSV(book.status),
    escapeCSV(book.due_date),
    escapeCSV(book.tags.join('; ')),
    escapeCSV(book.genres.join('; ')),
    escapeCSV(book.user_rating),
    escapeCSV(book.series_name),
    escapeCSV(book.series_position),
    escapeCSV(book.added_date),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
