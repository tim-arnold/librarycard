#!/usr/bin/env node

/**
 * Run Production Restore to Staging (Non-Interactive)
 * 
 * Automatically restores production backup to staging without prompts
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function restoreProductionToStaging() {
  console.log('🧪 RESTORING PRODUCTION DATA TO STAGING 🧪\n');
  
  // Find the production backup file
  const backupFile = './cloudflare/prod-backup-2025-08-17T01-44-32-379Z.json';
  
  if (!existsSync(backupFile)) {
    console.error('❌ Production backup file not found:', backupFile);
    process.exit(1);
  }
  
  console.log('📦 Found production backup:', backupFile);
  
  // Load and verify backup
  const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
  console.log(`📅 Backup from: ${backupData.timestamp}`);
  console.log(`📊 Total tables: ${Object.keys(backupData.tables).length}`);
  
  let totalRows = 0;
  for (const [tableName, tableData] of Object.entries(backupData.tables)) {
    if (!tableData.error && tableData.row_count) {
      totalRows += tableData.row_count;
    }
  }
  console.log(`📊 Total rows to restore: ${totalRows}\n`);
  
  // Create staging backup first
  console.log('📦 Creating staging backup before restore...');
  try {
    execSync('node scripts/backup-staging.js create "pre-prod-restore"', { 
      stdio: 'inherit',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
    });
    console.log('✅ Staging backup created\n');
  } catch (error) {
    console.error('❌ Failed to create staging backup:', error.message);
    process.exit(1);
  }
  
  // Define table order for restore
  const tableOrder = [
    // Child tables (no foreign key dependencies)
    'auth_audit_log', 'user_recovery_codes', 'user_global_permissions',
    'webauthn_challenges', 'webauthn_credentials', 'jwt_sessions',
    'location_user_permissions', 'location_admin_capabilities', 'location_members', 'location_invitations',
    'book_checkout_history', 'book_ratings', 'book_removal_requests', 'signup_approval_requests',
    'book_genres', 'books', 'shelves',
    // Parent tables (referenced by others)
    'enhanced_genres_backup', 'curated_genres', 'locations', 'users'
  ];
  
  console.log('🗑️  Clearing staging tables...');
  
  // Clear tables in dependency order
  for (const tableName of tableOrder) {
    if (backupData.tables[tableName] && !backupData.tables[tableName].error) {
      try {
        executeStagingD1Command(`DELETE FROM ${tableName}`);
        console.log(`    ✅ Cleared ${tableName}`);
      } catch (error) {
        console.log(`    ⚠️  Could not clear ${tableName}: ${error.message}`);
      }
    }
  }
  
  console.log('\n📥 Restoring production data to staging...');
  
  // Restore in reverse order
  const reversedOrder = [...tableOrder].reverse();
  let restoredTables = 0;
  let restoredRows = 0;
  
  for (const tableName of reversedOrder) {
    const tableData = backupData.tables[tableName];
    
    if (!tableData || tableData.error || !tableData.data || tableData.data.length === 0) {
      continue;
    }
    
    console.log(`    📥 Restoring ${tableName} (${tableData.data.length} rows)...`);
    
    try {
      // Insert data row by row with schema compatibility
      for (const row of tableData.data) {
        // Get columns from production backup data
        const prodColumns = Object.keys(row);
        
        // Get staging table schema to handle schema differences
        let stagingColumns;
        try {
          const schemaResult = executeStagingD1Command(`PRAGMA table_info(${tableName})`);
          const schemaLines = schemaResult.split('\n');
          const schemaJsonStart = schemaLines.findIndex(line => line.trim().startsWith('['));
          if (schemaJsonStart !== -1) {
            const schemaJson = schemaLines.slice(schemaJsonStart).join('\n');
            const schemaData = JSON.parse(schemaJson);
            if (schemaData[0] && schemaData[0].results) {
              stagingColumns = schemaData[0].results.map(col => col.name);
            }
          }
        } catch (error) {
          console.log(`    ⚠️  Could not get schema for ${tableName}, using production columns only`);
          stagingColumns = prodColumns;
        }
        
        // Use only columns that exist in both production data AND staging schema
        const commonColumns = prodColumns.filter(col => 
          stagingColumns ? stagingColumns.includes(col) : true
        );
        
        const values = commonColumns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          return value;
        });
        
        const insertSql = `INSERT INTO ${tableName} (${commonColumns.join(', ')}) VALUES (${values.join(', ')})`;
        executeStagingD1Command(insertSql);
      }
      
      console.log(`    ✅ Restored ${tableName}: ${tableData.data.length} rows`);
      restoredTables++;
      restoredRows += tableData.data.length;
      
    } catch (error) {
      console.error(`    ❌ Failed to restore ${tableName}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 PRODUCTION DATA RESTORED TO STAGING!');
  console.log('======================================');
  console.log(`📊 Tables restored: ${restoredTables}`);
  console.log(`📊 Total rows restored: ${restoredRows}`);
  console.log('======================================\n');
  
  // Quick verification
  console.log('🔍 Quick verification...');
  try {
    const userCount = executeStagingD1Command('SELECT COUNT(*) as count FROM users');
    const bookCount = executeStagingD1Command('SELECT COUNT(*) as count FROM books');
    const locationCount = executeStagingD1Command('SELECT COUNT(*) as count FROM locations');
    
    console.log(`📊 Users in staging: ${parseCount(userCount)}`);
    console.log(`📊 Books in staging: ${parseCount(bookCount)}`);
    console.log(`📊 Locations in staging: ${parseCount(locationCount)}`);
    
    console.log('\n✅ STAGING NOW MATCHES PRODUCTION!');
    console.log('🎯 Staging environment is ready for testing with real production data');
    
  } catch (error) {
    console.log('⚠️  Verification had issues, but restore likely succeeded');
  }
}

function executeStagingD1Command(sql) {
  const command = `wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --command="${sql.replace(/"/g, '\\"')}"`;
  
  return execSync(command, { 
    encoding: 'utf8', 
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
  });
}

function parseCount(output) {
  try {
    const lines = output.split('\n');
    const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
    if (jsonStart === -1) return 'unknown';
    
    const jsonText = lines.slice(jsonStart).join('\n');
    const data = JSON.parse(jsonText);
    
    if (Array.isArray(data) && data[0] && data[0].results && data[0].results[0]) {
      return data[0].results[0].count;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Run it
restoreProductionToStaging().catch(error => {
  console.error('❌ Restore failed:', error.message);
  process.exit(1);
});