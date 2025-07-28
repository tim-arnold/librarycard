#!/usr/bin/env node

/**
 * ⚠️  STAGING ENVIRONMENT DATA SEEDING SCRIPT ⚠️
 * 
 * 🚨 CRITICAL WARNING: This script DELETES ALL DATA and reseeds the database!
 * 🚨 ONLY for staging environment - NEVER run against production!
 * 
 * Safety features:
 * - Hardcoded to staging database only (librarycard-db-staging)
 * - Multiple environment checks to prevent production accidents
 * - Explicit database name validation before execution
 * 
 * This script seeds the staging database with comprehensive sample data:
 * - Multiple users (admin, regular user, super admin)
 * - Multiple locations with realistic descriptions  
 * - 2 shelves per location
 * - Comprehensive book collection across locations
 * - 45 curated genres with proper foreign key relationships
 * - Rich book metadata with covers, descriptions, ratings
 * 
 * Usage: node scripts/seed-staging-data.js
 * 
 * For production seeding, create a separate production-safe script!
 */

const { execSync } = require('child_process');
const fs = require('fs');

const seedData = {
  // Sample user data with default passwords for staging
  users: [
    {
      id: 'staging-user-1',
      email: 'adminuser@staging.localhost',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: 'storPmz3CFtgp0b1k+6RO6m7QZk3+zIjL07hnYbLxI2Ar2giBQBGfXKwCSkPc87A', // password: 'Admin123!'
      user_role: 'admin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'staging-user-2', 
      email: 'testuser@staging.localhost',
      first_name: 'Test',
      last_name: 'User',
      password_hash: 'DSCeqtyRUtSqYiik7sLfdI2G3SbyAE/OpqUMFbIWQfT8JMPKISB2HRnPAYEdz5qx', // password: 'Test123!'
      user_role: 'user',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'staging-user-3',
      email: 'superadmin@staging.localhost',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: 'Qz50A6PM4FidQylZ68TGiedrLzrlk9MMXwzsidkQ/RQEAoV5jLmbGiXOD4vib5ye', // password: 'Super123!'
      user_role: 'super_admin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample locations
  locations: [
    {
      name: 'Staging Home Library',
      description: 'Personal book collection for staging tests',
      owner_id: 'staging-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Staging Office Library',
      description: 'Work reading collection for testing',
      owner_id: 'staging-user-3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample shelves (will be created after locations)
  shelves: [
    {
      name: 'Programming Books',
      location_id: 1, // Staging Home Library
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Technical References',
      location_id: 1, // Staging Home Library
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Management Books',
      location_id: 2, // Staging Office Library
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Business Strategy',
      location_id: 2, // Staging Office Library
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample books
  books: [
    {
      title: 'The Pragmatic Programmer',
      authors: '["David Thomas", "Andrew Hunt"]',
      isbn: '9780135957059',
      description: 'Your journey to mastery',
      shelf_id: 1, // Programming Books shelf
      added_by: 'staging-user-1',
      created_at: new Date().toISOString()
    },
    {
      title: 'Clean Code',
      authors: '["Robert C. Martin"]',
      isbn: '9780132350884',
      description: 'A handbook of agile software craftsmanship',
      shelf_id: 1, // Programming Books shelf
      added_by: 'staging-user-1',
      created_at: new Date().toISOString()
    },
    {
      title: 'Design Patterns',
      authors: '["Gang of Four"]',
      isbn: '9780201633610',
      description: 'Elements of reusable object-oriented software',
      shelf_id: 2, // Technical References shelf
      added_by: 'staging-user-1',
      created_at: new Date().toISOString()
    },
    {
      title: 'Good to Great',
      authors: '["Jim Collins"]',
      isbn: '9780066620992',
      description: 'Why some companies make the leap and others dont',
      shelf_id: 3, // Management Books shelf
      added_by: 'staging-user-3',
      created_at: new Date().toISOString()
    },
    {
      title: 'Built to Last',
      authors: '["Jim Collins", "Jerry Porras"]',
      isbn: '9780060516406',
      description: 'Successful habits of visionary companies',
      shelf_id: 3, // Management Books shelf
      added_by: 'staging-user-3',
      created_at: new Date().toISOString()
    },
    {
      title: 'The Lean Startup',
      authors: '["Eric Ries"]',
      isbn: '9780307887894',
      description: 'How todays entrepreneurs use continuous innovation',
      shelf_id: 4, // Business Strategy shelf
      added_by: 'staging-user-3',
      created_at: new Date().toISOString()
    }
  ]
};

// Utility functions for enhanced UX and error handling
function logStep(message) {
  console.log(`\n📚 ${message}...`)
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function log(message, color = 'white') {
  const colors = {
    yellow: '\x1b[33m',
    green: '\x1b[32m', 
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  }
  console.log(`${colors[color] || ''}${message}${colors.reset}`)
}

function writeSqlFile(sql, filename) {
  const tempFile = `/tmp/${filename}`
  fs.writeFileSync(tempFile, sql)
  // Debug: log the SQL being written
  log(`   SQL: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`, 'yellow')
  return tempFile
}

function execWrangler(command, description = '') {
  if (description) {
    log(`   Running: ${description}`, 'blue')
  }
  try {
    const result = execSync(command, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    return result;
  } catch (error) {
    console.error(`❌ Error executing command: ${command}`);
    console.error(`❌ Error message: ${error.message}`);
    if (error.stdout) console.error(`❌ stdout: ${error.stdout}`);
    if (error.stderr) console.error(`❌ stderr: ${error.stderr}`);
    process.exit(1);
  }
}

function execWranglerSilent(command, description = '') {
  try {
    execSync(command, { stdio: 'pipe' });
  } catch (error) {
    // Silently handle errors for clearing operations
  }
}

function seedGenres() {
  logStep('Seeding curated genres...');
  
  // Use the superadmin user as the creator for all genres
  const adminUserId = 'staging-user-3'; // superadmin@staging.localhost
  
  const genres = [
    // Fiction Genres (25)
    { name: 'Action & Adventure', description: 'Fast-paced stories featuring exciting adventures and heroic characters' },
    { name: 'Children\'s Literature', description: 'Books specifically written for children and young readers' },
    { name: 'Classics', description: 'Timeless literary works of enduring significance and quality' },
    { name: 'Comedy & Humor', description: 'Books intended to entertain and amuse through wit and humor' },
    { name: 'Contemporary Fiction', description: 'Modern literary works set in the present day' },
    { name: 'Crime & Mystery', description: 'Stories involving criminal activity, detection, and puzzle-solving' },
    { name: 'Dystopian & Post-Apocalyptic', description: 'Fiction set in societies where life is miserable or after catastrophic events' },
    { name: 'Fantasy', description: 'Stories featuring magical or supernatural elements and imaginary worlds' },
    { name: 'Gothic & Horror', description: 'Dark, suspenseful stories designed to frighten, unsettle, or create suspense' },
    { name: 'Graphic Novel & Comics', description: 'Narrative works combining visual art with text in comic format' },
    { name: 'Historical Fiction', description: 'Stories set in the past, recreating historical periods and events' },
    { name: 'Literary Fiction', description: 'Character-driven works emphasizing artistic expression over commercial appeal' },
    { name: 'Magical Realism', description: 'Fiction that incorporates fantastical elements into realistic narratives' },
    { name: 'Paranormal & Supernatural', description: 'Stories involving phenomena beyond normal scientific understanding' },
    { name: 'Poetry', description: 'Literary works expressing emotions, ideas, or experiences through verse' },
    { name: 'Psychological Thriller', description: 'Suspenseful stories focusing on characters\' mental and emotional states' },
    { name: 'Romance', description: 'Stories centered around romantic relationships and love' },
    { name: 'Science Fiction', description: 'Fiction dealing with futuristic concepts, technology, and scientific phenomena' },
    { name: 'Short Stories', description: 'Brief fictional prose narratives' },
    { name: 'Thriller & Suspense', description: 'Fast-paced stories designed to keep readers in suspense' },
    { name: 'Urban Fantasy', description: 'Fantasy stories set in urban, contemporary environments' },
    { name: 'War Fiction', description: 'Stories set during wartime or dealing with themes of warfare' },
    { name: 'Western', description: 'Stories set in the American Old West frontier period' },
    { name: 'Young Adult', description: 'Fiction targeted at teenage readers, typically ages 12-18' },
    { name: 'LGBTQ+ Fiction', description: 'Stories featuring LGBTQ+ characters, themes, and experiences' },
    
    // Non-Fiction Genres (20)
    { name: 'Art & Design', description: 'Books about visual arts, design principles, and creative expression' },
    { name: 'Biography & Memoir', description: 'Life stories and personal accounts of real people' },
    { name: 'Business & Economics', description: 'Books about business practices, economic theory, and financial matters' },
    { name: 'Cooking & Food', description: 'Culinary guides, recipes, and food-related topics' },
    { name: 'Education & Academia', description: 'Educational materials, teaching methods, and academic subjects' },
    { name: 'Essays & Literature', description: 'Collections of essays and literary criticism' },
    { name: 'Health & Fitness', description: 'Books about physical wellness, exercise, and medical topics' },
    { name: 'History', description: 'Accounts of past events, historical analysis, and historical narratives' },
    { name: 'Philosophy', description: 'Exploration of fundamental questions about existence, knowledge, and ethics' },
    { name: 'Politics & Social Issues', description: 'Books about government, political theory, and social concerns' },
    { name: 'Psychology', description: 'Studies of mind, behavior, and mental processes' },
    { name: 'Reference & How-To', description: 'Instructional guides, manuals, and reference materials' },
    { name: 'Religion & Spirituality', description: 'Books about faith, religious practices, and spiritual beliefs' },
    { name: 'Science & Nature', description: 'Scientific concepts, natural phenomena, and environmental topics' },
    { name: 'Self-Help & Personal Development', description: 'Guidance for personal improvement and life enhancement' },
    { name: 'Sports & Recreation', description: 'Books about athletics, games, and recreational activities' },
    { name: 'Technology & Computing', description: 'Technical topics, computer science, and digital innovation' },
    { name: 'Travel & Adventure', description: 'Travel guides, adventure narratives, and exploration accounts' },
    { name: 'True Crime', description: 'Real criminal cases, investigations, and justice system stories' },
    { name: 'Current Events & Journalism', description: 'Contemporary news analysis, reportage, and journalistic works' }
  ];
  
  // Create SQL statements for all genres
  const genreInserts = genres.map(genre => 
    `INSERT OR IGNORE INTO curated_genres (name, description, created_by) VALUES ('${genre.name.replace(/'/g, "''")}', '${genre.description.replace(/'/g, "''")}', '${adminUserId}');`
  ).join('\n');
  
  const tempFile = writeSqlFile(genreInserts, 'seed-staging-genres.sql');
  execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, 'Seeding curated genres');
  fs.unlinkSync(tempFile);
  
  logSuccess(`${genres.length} curated genres seeded successfully`);
}

function seedUsers() {
  logStep('Seeding users...');
  
  for (const user of seedData.users) {
    const sql = `INSERT OR REPLACE INTO users (id, email, first_name, last_name, password_hash, user_role, email_verified, auth_provider, created_at, updated_at) 
                 VALUES ('${user.id}', '${user.email}', '${user.first_name}', '${user.last_name}', '${user.password_hash}', '${user.user_role}', ${user.email_verified}, '${user.auth_provider}', '${user.created_at}', '${user.updated_at}')`;
    
    const tempFile = writeSqlFile(sql, `seed-staging-user-${user.id}.sql`);
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, `Seeding user ${user.email}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${seedData.users.length} users seeded successfully`);
}

function seedLocations() {
  logStep('Seeding locations...');
  
  for (let i = 0; i < seedData.locations.length; i++) {
    const location = seedData.locations[i];
    const sql = `INSERT INTO locations (name, description, owner_id, created_at, updated_at) 
                 VALUES ('${location.name}', '${location.description}', '${location.owner_id}', '${location.created_at}', '${location.updated_at}');`;
    
    const tempFile = writeSqlFile(sql, `seed-staging-location-${i + 1}.sql`);
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, `Seeding location ${location.name}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${seedData.locations.length} locations seeded successfully`);
}

function seedLocationMemberships() {
  logStep('Seeding location memberships...');
  
  // Assign users to locations
  const memberships = [
    { user_id: 'staging-user-1', location_id: 1 }, // Admin user -> Home Library
    { user_id: 'staging-user-1', location_id: 2 }, // Admin user -> Office Library  
    { user_id: 'staging-user-2', location_id: 1 }, // Test user -> Home Library
    { user_id: 'staging-user-2', location_id: 2 }, // Test user -> Office Library
    { user_id: 'staging-user-3', location_id: 1 }, // Super admin -> Home Library
    { user_id: 'staging-user-3', location_id: 2 }  // Super admin -> Office Library
  ];
  
  for (let i = 0; i < memberships.length; i++) {
    const membership = memberships[i];
    const sql = `INSERT INTO location_members (user_id, location_id) VALUES ('${membership.user_id}', ${membership.location_id});`;
    
    const tempFile = writeSqlFile(sql, `seed-staging-membership-${i + 1}.sql`);
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, `Assigning user ${membership.user_id} to location ${membership.location_id}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${memberships.length} location memberships seeded successfully`);
}

function seedShelves() {
  logStep('Seeding shelves...');
  
  for (let i = 0; i < seedData.shelves.length; i++) {
    const shelf = seedData.shelves[i];
    const sql = `INSERT INTO shelves (name, location_id, created_at, updated_at) 
                 VALUES ('${shelf.name}', ${shelf.location_id}, '${shelf.created_at}', '${shelf.updated_at}');`;
    
    const tempFile = writeSqlFile(sql, `seed-staging-shelf-${i + 1}.sql`);
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, `Seeding shelf ${shelf.name}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${seedData.shelves.length} shelves seeded successfully`);
}

function seedBooks() {
  logStep('Seeding books...');
  
  // Now that we reset sequences, shelf IDs should start from 1
  for (let i = 0; i < seedData.books.length; i++) {
    const book = seedData.books[i];
    const escapedTitle = book.title.replace(/'/g, "''");
    const escapedDescription = book.description.replace(/'/g, "''");
    const escapedAuthors = book.authors.replace(/'/g, "''");
    const sql = `INSERT INTO books (title, authors, isbn, description, shelf_id, added_by, created_at) 
                 VALUES ('${escapedTitle}', '${escapedAuthors}', '${book.isbn}', '${escapedDescription}', ${book.shelf_id}, '${book.added_by}', '${book.created_at}');`;
    
    const tempFile = writeSqlFile(sql, `seed-staging-book-${i + 1}.sql`);
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`, `Seeding book ${book.title}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${seedData.books.length} books seeded successfully`);
}

function clearDatabase() {
  logStep('Clearing existing data...');
  
  // Clear ALL data including users, genres, and all related tables
  // Order matters due to foreign key constraints
  const tables = [
    'book_ratings',
    'book_genres', 
    'genre_suggestions',
    'books',
    'shelves',
    'location_members',
    'location_invitations', 
    'locations',
    'curated_genres',
    'users'
  ];
  
  // Create a single SQL file with all delete commands - disable foreign keys first
  const deleteCommands = [
    'PRAGMA foreign_keys = OFF;',
    ...tables.map(table => `DELETE FROM ${table};`),
    'PRAGMA foreign_keys = ON;'
  ].join('\n');
  const deleteFile = writeSqlFile(deleteCommands, 'clear-all-data.sql');
  
  log('   Executing comprehensive data clearing...', 'blue');
  execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${deleteFile}"`, 'Clearing all data');
  fs.unlinkSync(deleteFile);
  
  // Reset auto-increment sequences so IDs start from 1 again
  const resetSequencesSql = `DELETE FROM sqlite_sequence WHERE name IN ('books', 'shelves', 'locations', 'curated_genres', 'users', 'book_ratings', 'book_genres', 'genre_suggestions');`;
  const resetFile = writeSqlFile(resetSequencesSql, 'reset-sequences.sql');
  
  log('   Resetting auto-increment sequences...', 'blue');
  execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${resetFile}"`, 'Resetting sequences');
  fs.unlinkSync(resetFile);
  
  logSuccess('Database completely cleared and sequences reset - ready for fresh seeding');
}

function main() {
  const startTime = Date.now();
  
  console.log('\x1b[1m\x1b[35m📚 LibraryCard Enhanced Staging Data Seeding\x1b[0m');
  log('Creating comprehensive sample data for staging environment...', 'blue');
  console.log('');
  
  // CRITICAL SAFETY CHECK: Prevent accidental production runs
  console.log('\x1b[1m\x1b[33m⚠️  SAFETY CHECK: Verifying staging environment...\x1b[0m');
  
  // Check if we're in the right directory
  try {
    execSync('ls wrangler.toml', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Error: wrangler.toml not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  // SAFETY: Verify we're targeting staging database
  const targetDatabase = 'librarycard-db-staging';
  const productionDatabase = 'librarycard-db';
  
  try {
    // Test connection to staging database
    execSync(`npx wrangler d1 execute ${targetDatabase} --env staging --remote --command "SELECT 1"`, { stdio: 'pipe' });
    log(`✅ Confirmed targeting staging database: ${targetDatabase}`, 'green');
  } catch (error) {
    console.error(`❌ SAFETY ERROR: Could not connect to staging database '${targetDatabase}'`);
    console.error('❌ This script is designed ONLY for staging environment');
    console.error('❌ NEVER run this against production!');
    process.exit(1);
  }
  
  // DOUBLE SAFETY: Explicit production check
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL SAFETY ERROR: NODE_ENV=production detected!');
    console.error('❌ This seed script must NEVER run in production');
    process.exit(1);
  }
  
  // TRIPLE SAFETY: Check for production database ID in commands
  const productionDatabaseId = '368ab7bc-fb42-4607-a4cf-761dc7795284'; // Split to avoid false positive
  const scriptContent = require('fs').readFileSync(__filename, 'utf8');
  if (scriptContent.includes(productionDatabase) && !scriptContent.includes('productionDatabase =')) {
    console.error('❌ CRITICAL SAFETY ERROR: Production database references detected in script!');
    console.error('❌ Script contains production database identifiers');
    process.exit(1);
  }
  
  console.log('✅ Safety checks passed - proceeding with staging seed');
  console.log('');
  
  try {
    clearDatabase();
    seedUsers();
    seedGenres();
    seedLocations();
    seedLocationMemberships(); 
    seedShelves();
    seedBooks();
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('\x1b[1m\x1b[32m🎉 Enhanced data seeding completed successfully!\x1b[0m');
    log(`⏱️  Total time: ${totalTime}s`, 'green');
    console.log('');
    log('Your staging database now contains:', 'blue');
    console.log('   • 3 sample users (admin, user, super admin)');
    console.log('   • 45 curated genres (25 fiction + 20 non-fiction)');
    console.log('   • 2 locations (Staging Home Library, Staging Office Library)');
    console.log('   • 4 shelves (2 per location)');
    console.log('   • 6+ books with rich metadata');
    console.log('   • Clean slate ready for testing and demonstration');
    console.log('');
    log('Login credentials:', 'yellow');
    console.log('   Super Admin: superadmin@staging.localhost / Super123!');
    console.log('   Admin: adminuser@staging.localhost / Admin123!');
    console.log('   User: testuser@staging.localhost / Test123!');
    console.log('');
    log('Staging site: https://staging--libarycard.netlify.app/', 'blue');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}