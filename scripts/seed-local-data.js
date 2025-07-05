#!/usr/bin/env node

/**
 * Local Development Data Seeding Script
 * 
 * This script seeds the local development database with sample data
 * for testing and development purposes.
 */

const { execSync } = require('child_process');

const seedData = {
  // Sample user data with default passwords for local development
  users: [
    {
      id: 'dev-user-1',
      email: 'adminuser@localhost',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: '$2b$10$CqyKQ4zGfzcPETorqg1JXe4qhyThrFUwxwH/CDePtcw57YmQ2L0jW', // password: 'Admin123!'
      user_role: 'admin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dev-user-2', 
      email: 'testuser@localhost',
      first_name: 'Test',
      last_name: 'User',
      password_hash: '$2b$10$9fOwbDBB/GMv.0GXz00Doer/82aMOmds/SbTh6gY/.G0MayylDIwq', // password: 'Test123!'
      user_role: 'user',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dev-user-3',
      email: 'superadmin@localhost',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: '$2b$10$7mK9x8L5vZ2aB3cY1dE6fG8hI9jK0lM1nO2pQ3rS4tU5vW6xY7zA8', // password: 'Super123!'
      user_role: 'superadmin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample locations
  locations: [
    {
      name: 'Home Library',
      description: 'Personal book collection at home',
      owner_id: 'dev-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Office Library',
      description: 'Work reading collection',
      owner_id: 'dev-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample shelves (will be created after locations)
  shelves: [
    {
      name: 'Programming Books',
      location_id: 1, // Home Library (will be ID 1)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Technical References',
      location_id: 1, // Home Library
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Management Books',
      location_id: 2, // Office Library (will be ID 2)
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
      added_by: 'dev-user-1',
      created_at: new Date().toISOString()
    },
    {
      title: 'Clean Code',
      authors: '["Robert C. Martin"]',
      isbn: '9780132350884',
      description: 'A handbook of agile software craftsmanship',
      shelf_id: 1, // Programming Books shelf
      added_by: 'dev-user-1',
      created_at: new Date().toISOString()
    },
    {
      title: 'Design Patterns',
      authors: '["Gang of Four"]',
      isbn: '9780201633610',
      description: 'Elements of reusable object-oriented software',
      shelf_id: 2, // Technical References shelf
      added_by: 'dev-user-1',
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
    const tempFile = `/tmp/seed-user-${user.id}.sql`;
    fs.writeFileSync(tempFile, sql);
    
    execWrangler(`npx wrangler d1 execute DB --env local --local --file="${tempFile}"`);
    
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
    
    execWrangler(`npx wrangler d1 execute DB --env local --local --command "${sql}"`);
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
    
    execWrangler(`npx wrangler d1 execute DB --env local --local --command "${sql}"`);
  }
  
  console.log('✅ Shelves seeded successfully');
}

function seedBooks() {
  console.log('🌱 Seeding books...');
  
  for (const book of seedData.books) {
    const escapedAuthors = book.authors.replace(/"/g, '\\"');
    const sql = `INSERT INTO books (title, authors, isbn, description, shelf_id, added_by, created_at) 
                 VALUES ('${book.title}', '${escapedAuthors}', '${book.isbn}', '${book.description}', ${book.shelf_id}, '${book.added_by}', '${book.created_at}')`;
    
    execWrangler(`npx wrangler d1 execute DB --env local --local --command "${sql}"`);
  }
  
  console.log('✅ Books seeded successfully');
}

function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Clear in reverse order to avoid foreign key constraints
  const tables = ['books', 'shelves', 'locations'];
  
  for (const table of tables) {
    const sql = `DELETE FROM ${table}`;
    execWrangler(`npx wrangler d1 execute DB --env local --local --command "${sql}"`);
  }
  
  console.log('✅ Database cleared');
}

function main() {
  console.log('🚀 Starting local development data seeding...');
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
    console.log('🎉 Local development data seeding completed successfully!');
    console.log('');
    console.log('You can now start your local development server with:');
    console.log('  npx wrangler dev --env local --port 8787');
    console.log('');
    console.log('And your Next.js frontend with:');
    console.log('  npm run dev');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}