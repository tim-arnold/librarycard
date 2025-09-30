#!/usr/bin/env node

/**
 * Import Production Data to Local Database
 *
 * This script imports production data from a backup JSON file into the local database
 * for development and testing purposes.
 *
 * Usage:
 *   node import-production-data.js [backup-file-path]
 *
 * If no backup file path is provided, defaults to '../../cloudflare/prod-backup-latest.json'
 */

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');

const path = require('path');

// Configuration
const BACKUP_FILE = process.argv[2] || path.join(__dirname, '../../cloudflare/prod-backup-latest.json');
const LOCAL_DB = 'librarycard-db-local';

// Tables to import (in dependency order - parents first)
const IMPORT_ORDER = [
  'users',
  'locations',
  'location_members',
  'location_user_permissions',
  'location_admin_capabilities',
  'location_default_permissions',
  'location_invitations',
  'user_global_permissions',
  'user_activity_privacy',
  'curated_genres',
  'genre_requests',
  'genre_suggestions',
  'shelves',
  'books',
  'book_genres',
  'book_ratings',
  'book_checkout_history',
  'book_removal_requests',
  'book_images',
  'series',
  'book_series',
  'signup_approval_requests',
  'auth_audit_log',
  'jwt_sessions',
  'user_recovery_codes',
  'webauthn_challenges',
  'webauthn_credentials',
  'notification_queue',
  'notification_log',
  'notification_preferences',
  'in_app_notifications',
  'notification_read_status',
  'book_cover_appeals', // Appeals system
  'appeal_resolution_actions', // Appeals resolution tracking
  'ai_classification_allowlist' // Keep our seeded allowlist
];

// Tables to skip (system/tracking tables)
const SKIP_TABLES = [
  'migrations_applied',
  'migration_batches',
  'sqlite_sequence'
  // Note: ai_classification_allowlist is imported if it exists in backup,
  // otherwise it will be seeded by migrations
];

class ProductionDataImporter {
  constructor() {
    console.log('🔄 Production Data Import to Local Database');
    console.log('=============================================');
  }

  executeLocalD1Command(sql) {
    try {
      const command = `npx wrangler d1 execute ${LOCAL_DB} --local --command="${sql.replace(/"/g, '\\"')}"`;
      return execSync(command, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error) {
      throw new Error(`D1 command failed: ${error.message}`);
    }
  }

  createTableFromData(tableName, sampleRow) {
    console.log(`  🔧 Creating table ${tableName}...`);

    const columns = Object.keys(sampleRow).map(column => {
      const value = sampleRow[column];
      let type = 'TEXT';

      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'INTEGER' : 'REAL';
      } else if (typeof value === 'boolean') {
        type = 'BOOLEAN';
      }

      // Special handling for ID columns to ensure proper primary key constraints
      if (column === 'id' && type === 'INTEGER') {
        return `${column} ${type} PRIMARY KEY AUTOINCREMENT`;
      }

      return `${column} ${type}`;
    });

    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
    this.executeLocalD1Command(createTableSQL);
  }

  applySchema() {
    const schemaPath = path.join(__dirname, '../../schema.sql');

    if (!existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log('📋 Applying database schema from schema.sql...');
    console.log(`   Source: ${schemaPath}`);

    const schemaSQL = readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements (separated by semicolons)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`   Executing ${statements.length} schema statements...`);

    let successCount = 0;
    for (const statement of statements) {
      try {
        this.executeLocalD1Command(statement + ';');
        successCount++;
      } catch (error) {
        // Some statements might fail if tables already exist, that's OK
        if (!error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement failed: ${error.message}`);
        }
      }
    }

    console.log(`   ✅ Applied ${successCount}/${statements.length} schema statements`);
    console.log('');
  }

  async importProductionData() {
    // Step 1: Apply schema first
    this.applySchema();

    // Step 2: Load backup data
    if (!existsSync(BACKUP_FILE)) {
      throw new Error(`Backup file not found: ${BACKUP_FILE}`);
    }

    console.log(`📦 Loading backup data from: ${BACKUP_FILE}`);
    const backupData = JSON.parse(readFileSync(BACKUP_FILE, 'utf8'));

    console.log(`📅 Backup from: ${backupData.timestamp}`);
    console.log(`📊 Total tables in backup: ${Object.keys(backupData.tables).length}`);

    // Calculate total rows to import
    let totalRowsToImport = 0;
    let tablesWithData = [];

    for (const tableName of IMPORT_ORDER) {
      if (SKIP_TABLES.includes(tableName)) continue;

      const tableData = backupData.tables[tableName];
      if (tableData && !tableData.error && tableData.data && tableData.data.length > 0) {
        totalRowsToImport += tableData.data.length;
        tablesWithData.push(`${tableName}(${tableData.data.length})`);
      }
    }

    console.log(`📊 Tables with data: ${tablesWithData.join(', ')}`);
    console.log(`📊 Total rows to import: ${totalRowsToImport}`);
    console.log('');

    // Import data table by table
    let importedTables = 0;
    let importedRows = 0;

    for (const tableName of IMPORT_ORDER) {
      if (SKIP_TABLES.includes(tableName)) {
        console.log(`⏭️  Skipping ${tableName} (system table)`);
        continue;
      }

      const tableData = backupData.tables[tableName];
      if (!tableData || tableData.error || !tableData.data) {
        console.log(`⏭️  Skipping ${tableName} (no table data structure)`);
        continue;
      }

      if (tableData.data.length === 0) {
        console.log(`📝 Creating empty table ${tableName} (table exists in backup but no data)`);
        // Create the table even if empty, so the structure exists
        try {
          // Try to clear the table (this will fail if table doesn't exist)
          this.executeLocalD1Command(`DELETE FROM ${tableName}`);
        } catch (error) {
          if (error.message.includes('no such table')) {
            // Table doesn't exist, create it from the backup schema if available
            if (tableData.schema) {
              console.log(`  🔧 Creating table from backup schema...`);
              this.executeLocalD1Command(tableData.schema);
            } else {
              console.log(`  ⚠️  No schema available for ${tableName}, skipping empty table`);
            }
          }
        }
        continue;
      }

      console.log(`📥 Importing ${tableName} (${tableData.data.length} rows)...`);

      try {
        // Clear existing data first (skip if table doesn't exist)
        try {
          console.log(`  🧹 Clearing existing ${tableName} data...`);
          this.executeLocalD1Command(`DELETE FROM ${tableName}`);
        } catch (error) {
          if (error.message.includes('no such table')) {
            console.log(`  ℹ️  Table ${tableName} doesn't exist yet, will be created`);
          } else {
            throw error;
          }
        }

        // Process in small batches for reliability
        const batchSize = 10;
        const totalBatches = Math.ceil(tableData.data.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startRow = batchIndex * batchSize;
          const endRow = Math.min(startRow + batchSize, tableData.data.length);
          const batch = tableData.data.slice(startRow, endRow);

          console.log(`  📦 Batch ${batchIndex + 1}/${totalBatches}: rows ${startRow + 1}-${endRow}`);

          // Create INSERT statement
          const columns = Object.keys(batch[0]);
          const values = batch.map(row => {
            const rowValues = columns.map(col => {
              const value = row[col];
              if (value === null || value === undefined) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;
              }
              if (typeof value === 'number') return value;
              if (typeof value === 'boolean') return value ? 1 : 0;
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            });
            return `(${rowValues.join(', ')})`;
          });

          const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES ${values.join(', ')}`;

          try {
            this.executeLocalD1Command(sql);
            console.log(`    ✅ Batch completed`);
          } catch (batchError) {
            if (batchError.message.includes('no such table')) {
              console.log(`    🔧 Table doesn't exist, creating from data structure...`);
              this.createTableFromData(tableName, batch[0]);
              // Retry the batch after creating the table
              this.executeLocalD1Command(sql);
              console.log(`    ✅ Batch completed after table creation`);
            } else {
              console.log(`    ❌ Batch failed: ${batchError.message}`);
              // Continue with next batch
            }
          }
        }

        console.log(`  ✅ Imported ${tableName}: ${tableData.data.length} rows`);
        importedTables++;
        importedRows += tableData.data.length;

      } catch (error) {
        console.log(`  ❌ Failed to import ${tableName}: ${error.message}`);
      }
    }

    console.log('');
    console.log('🎉 PRODUCTION DATA IMPORT COMPLETED!');
    console.log('====================================');
    console.log(`📊 Tables imported: ${importedTables}`);
    console.log(`📊 Total rows imported: ${importedRows}`);
    console.log('====================================');

    // Verify critical tables
    console.log('');
    console.log('🔍 Verifying imported data...');
    const criticalTables = ['users', 'books', 'locations'];

    for (const tableName of criticalTables) {
      try {
        const result = this.executeLocalD1Command(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = this.parseCountResult(result);
        console.log(`✅ ${tableName}: ${count} rows`);
      } catch (error) {
        console.log(`❌ ${tableName}: verification failed - ${error.message}`);
      }
    }

    // Create essential views that apps expect
    console.log('');
    console.log('🔧 Creating essential database views...');
    try {
      this.executeLocalD1Command(`
        DROP VIEW IF EXISTS library_ratings_agg;
        CREATE VIEW library_ratings_agg AS
        WITH location_users AS (
          SELECT DISTINCT
            l.id as location_id,
            u.id as user_id
          FROM locations l
          LEFT JOIN location_members lm ON l.id = lm.location_id
          LEFT JOIN users u ON lm.user_id = u.id OR l.owner_id = u.id
          WHERE u.id IS NOT NULL
        )
        SELECT
          b.id as book_id,
          l.id as location_id,
          AVG(CAST(br.rating AS REAL)) as library_average_rating,
          COUNT(br.rating) as library_rating_count
        FROM books b
        JOIN shelves s ON b.shelf_id = s.id
        JOIN locations l ON s.location_id = l.id
        LEFT JOIN book_ratings br ON b.id = br.book_id
        LEFT JOIN location_users lu ON l.id = lu.location_id AND br.user_id = lu.user_id
        GROUP BY b.id, l.id;
      `);
      console.log('✅ Created library_ratings_agg view');
    } catch (error) {
      console.log(`❌ Failed to create library_ratings_agg view: ${error.message}`);
    }

    console.log('');
    console.log('🎯 Local database now has production data!');
    console.log('📝 You can now test the appeals system with real books and users.');
  }

  parseCountResult(output) {
    try {
      // Parse wrangler D1 output to extract count
      const lines = output.split('\n');
      const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
      if (jsonStart !== -1) {
        const jsonText = lines.slice(jsonStart).join('\n');
        const data = JSON.parse(jsonText);
        if (Array.isArray(data) && data[0] && data[0].results && data[0].results[0]) {
          return data[0].results[0].count;
        }
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
}

// Run the import
const importer = new ProductionDataImporter();
importer.importProductionData().catch(error => {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
});