#!/usr/bin/env node

/**
 * Staging Environment Data Seeding Script
 * 
 * This script seeds the staging database with sample data
 * for testing and staging purposes.
 */

const { execSync } = require('child_process');

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

function execWrangler(command) {
  console.log(`Executing: ${command}`);
  try {
    const result = execSync(command, { stdio: 'inherit' });
    return result;
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    process.exit(1);
  }
}

function seedUsers() {
  console.log('🌱 Seeding users...');
  
  for (const user of seedData.users) {
    // Use single quotes and escape internal single quotes to avoid shell interpretation of $
    const sql = `INSERT OR REPLACE INTO users (id, email, first_name, last_name, password_hash, user_role, email_verified, auth_provider, created_at, updated_at) 
                 VALUES ('${user.id}', '${user.email}', '${user.first_name}', '${user.last_name}', '${user.password_hash}', '${user.user_role}', ${user.email_verified}, '${user.auth_provider}', '${user.created_at}', '${user.updated_at}')`;
    
    // Write SQL to temp file to avoid shell escaping issues
    const fs = require('fs');
    const tempFile = `/tmp/seed-staging-user-${user.id}.sql`;
    fs.writeFileSync(tempFile, sql);
    
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --file="${tempFile}"`);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
  }
  
  console.log('✅ Users seeded successfully');
}

function seedLocations() {
  console.log('🌱 Seeding locations...');
  
  for (let i = 0; i < seedData.locations.length; i++) {
    const location = seedData.locations[i];
    // Use explicit IDs to ensure consistent references
    const locationId = i + 1;
    const sql = `INSERT INTO locations (id, name, description, owner_id, created_at, updated_at) 
                 VALUES (${locationId}, '${location.name}', '${location.description}', '${location.owner_id}', '${location.created_at}', '${location.updated_at}')`;
    
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --command "${sql}"`);
  }
  
  console.log('✅ Locations seeded successfully');
}

function seedShelves() {
  console.log('🌱 Seeding shelves...');
  
  for (let i = 0; i < seedData.shelves.length; i++) {
    const shelf = seedData.shelves[i];
    // Use explicit IDs to ensure consistent references
    const shelfId = i + 1;
    const sql = `INSERT INTO shelves (id, name, location_id, created_at, updated_at) 
                 VALUES (${shelfId}, '${shelf.name}', ${shelf.location_id}, '${shelf.created_at}', '${shelf.updated_at}')`;
    
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --command "${sql}"`);
  }
  
  console.log('✅ Shelves seeded successfully');
}

function seedBooks() {
  console.log('🌱 Seeding books...');
  
  for (const book of seedData.books) {
    const escapedAuthors = book.authors.replace(/"/g, '\\"');
    const sql = `INSERT INTO books (title, authors, isbn, description, shelf_id, added_by, created_at) 
                 VALUES ('${book.title}', '${escapedAuthors}', '${book.isbn}', '${book.description}', ${book.shelf_id}, '${book.added_by}', '${book.created_at}')`;
    
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --command "${sql}"`);
  }
  
  console.log('✅ Books seeded successfully');
}

function clearDatabase() {
  console.log('🧹 Clearing existing staging data...');
  
  // Clear in reverse order to avoid foreign key constraints
  const tables = ['books', 'shelves', 'locations', 'users'];
  
  for (const table of tables) {
    const sql = `DELETE FROM ${table}`;
    execWrangler(`npx wrangler d1 execute librarycard-db-staging --env staging --remote --command "${sql}"`);
  }
  
  console.log('✅ Staging database cleared');
}

function main() {
  console.log('🚀 Starting staging environment data seeding...');
  console.log('');
  
  // Check if we're in the right directory
  try {
    execSync('ls wrangler.toml', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Error: wrangler.toml not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  try {
    clearDatabase();
    seedUsers();
    seedLocations(); 
    seedShelves();
    seedBooks();
    
    console.log('');
    console.log('🎉 Staging environment data seeding completed successfully!');
    console.log('');
    console.log('Test accounts:');
    console.log('  Super Admin: superadmin@staging.localhost / Super123!');
    console.log('  Regular Admin: adminuser@staging.localhost / Admin123!');
    console.log('  Regular User: testuser@staging.localhost / Test123!');
    console.log('');
    console.log('Staging site: https://staging--libarycard.netlify.app/');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}