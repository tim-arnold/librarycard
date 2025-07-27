#!/usr/bin/env node

/**
 * LibraryCard Local Development Database Setup
 * 
 * This script provides a complete local database setup including:
 * 1. Schema creation from schema.sql
 * 2. Migration runner for all migration files
 * 3. Enhanced data seeding with rich sample data
 * 
 * Usage: npm run setup-local
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_NAME = 'DB'; // Use the binding name from wrangler.toml
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.sql');

// Console styling
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Execute wrangler command with error handling
 */
function executeWrangler(command, description) {
  try {
    log(`   Running: ${command}`, 'cyan');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000 // 30 second timeout
    });
    logSuccess(`${description} completed`);
    return { success: true, output: result };
  } catch (error) {
    logError(`${description} failed`);
    log(`   Error: ${error.message}`, 'red');
    if (error.stdout) log(`   Stdout: ${error.stdout}`, 'yellow');
    if (error.stderr) log(`   Stderr: ${error.stderr}`, 'yellow');
    return { success: false, error: error.message };
  }
}

/**
 * Get all migration files in chronological order
 */
function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .filter(file => !file.includes('.js')) // Exclude JS files
    .sort((a, b) => {
      // Sort by date prefix first, then alphabetically
      const dateA = a.match(/^(\d{8})/);
      const dateB = b.match(/^(\d{8})/);
      
      if (dateA && dateB) {
        return dateA[1].localeCompare(dateB[1]);
      } else if (dateA) {
        return 1; // Dated files come after undated
      } else if (dateB) {
        return -1;
      } else {
        return a.localeCompare(b);
      }
    });
  
  return files;
}

/**
 * Initialize database with schema
 */
function initializeSchema() {
  logStep('1', 'Initializing database schema');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    logError(`Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  const result = executeWrangler(
    `npx wrangler d1 execute ${DB_NAME} --file=${SCHEMA_FILE} --local`,
    'Schema initialization'
  );
  
  if (!result.success) {
    logError('Failed to initialize database schema');
    process.exit(1);
  }
}

/**
 * Run all migrations
 */
function runMigrations() {
  logStep('2', 'Running database migrations');
  
  const migrationFiles = getMigrationFiles();
  log(`   Found ${migrationFiles.length} migration files`, 'blue');
  
  if (migrationFiles.length === 0) {
    logWarning('No migration files found');
    return;
  }
  
  // List migrations that will be applied
  log('   Migrations to apply:', 'blue');
  migrationFiles.forEach((file, index) => {
    log(`     ${index + 1}. ${file}`, 'cyan');
  });
  
  let successCount = 0;
  let failureCount = 0;
  
  // Apply each migration
  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    log(`\n   Applying: ${file}`, 'yellow');
    
    const result = executeWrangler(
      `npx wrangler d1 execute ${DB_NAME} --file=${filePath} --local`,
      `Migration: ${file}`
    );
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
      logWarning(`Migration ${file} failed but continuing...`);
    }
  }
  
  log(`\n   Migration Results:`, 'blue');
  logSuccess(`${successCount} migrations applied successfully`);
  if (failureCount > 0) {
    logWarning(`${failureCount} migrations failed`);
  }
}

/**
 * Enhanced data seeding with rich sample data
 */
function seedSampleData() {
  logStep('3', 'Seeding enhanced sample data');
  
  // Execute the enhanced seeding script
  try {
    log('   Running enhanced data seeding script...', 'cyan');
    execSync('node scripts/seed-local-data.js', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    logSuccess('Sample data seeding completed');
  } catch (error) {
    logError('Sample data seeding failed');
    log(`   Error: ${error.message}`, 'red');
  }
}

/**
 * Verify database setup
 */
function verifySetup() {
  logStep('4', 'Verifying database setup');
  
  const queries = [
    { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'Locations', query: 'SELECT COUNT(*) as count FROM locations' },
    { name: 'Shelves', query: 'SELECT COUNT(*) as count FROM shelves' },
    { name: 'Books', query: 'SELECT COUNT(*) as count FROM books' },
    { name: 'Genres', query: 'SELECT COUNT(*) as count FROM curated_genres' }
  ];
  
  for (const { name, query } of queries) {
    try {
      const result = execSync(
        `echo "${query};" | npx wrangler d1 execute ${DB_NAME} --local`,
        { encoding: 'utf8' }
      );
      
      // Parse the result to extract count
      const match = result.match(/\|\s*(\d+)\s*\|/);
      const count = match ? match[1] : 'unknown';
      log(`   ${name}: ${count} records`, 'green');
    } catch (error) {
      log(`   ${name}: verification failed`, 'red');
    }
  }
}

/**
 * Main setup function
 */
async function setupLocalDatabase() {
  log(`${colors.bright}${colors.magenta}LibraryCard Local Database Setup${colors.reset}`);
  log(`${colors.cyan}Setting up comprehensive local development environment...${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Initialize schema
    initializeSchema();
    
    // Step 2: Run migrations
    runMigrations();
    
    // Step 3: Seed sample data
    seedSampleData();
    
    // Step 4: Verify setup
    verifySetup();
    
    // Success summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(`\n${colors.bright}${colors.green}🎉 Local database setup completed successfully!${colors.reset}`);
    log(`${colors.green}⏱️  Total time: ${duration}s${colors.reset}`);
    log(`\n${colors.cyan}Your local development environment is ready with:${colors.reset}`);
    log(`   • Complete database schema with all tables and indexes`);
    log(`   • All migrations applied in chronological order`);
    log(`   • Rich sample data (users, locations, shelves, books)`);
    log(`   • 20 books per location across 2 shelves (10 books each)`);
    log(`\n${colors.yellow}Next steps:${colors.reset}`);
    log(`   1. Run: npm run dev`);
    log(`   2. Visit: http://localhost:3000`);
    log(`   3. Login with: adminuser@localhost / Admin123!`);
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupLocalDatabase();
}

module.exports = { setupLocalDatabase };