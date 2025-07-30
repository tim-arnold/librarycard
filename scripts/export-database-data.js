#!/usr/bin/env node

/**
 * Database Export Script
 * 
 * This script exports database data for Cloudflare account migration:
 * - Exports all table data to JSON format
 * - Creates migration-ready data structure
 * - Includes metadata and integrity checks
 * - Supports staging and production environments
 * - Provides rollback capability
 */

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const EXPORT_DIR = './migration-exports';
const EXPORT_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
let EXPORT_PATH; // Will be set based on environment

// Database schema tables to export (production schema)
const PRODUCTION_TABLES = [
  'users',
  'signup_approval_requests', 
  'locations',
  'location_members',
  'location_member_invites',
  'genres',
  'books',
  'book_checkouts',
  'book_requests',
  'reading_sessions'
];

// Staging database has different schema - detect actual tables
const STAGING_TABLES = [
  'users',
  'signup_approval_requests',
  'locations', 
  'location_members',
  'location_invitations',
  'shelves',
  'books',
  'book_checkout_history',
  'book_ratings',
  'book_removal_requests',
  'location_admin_capabilities',
  'location_user_permissions',
  'curated_genres',
  'book_genres',
  'genre_suggestions',
  'user_global_permissions',
  'location_default_permissions'
];

class DatabaseExporter {
  constructor(environment = 'production') {
    this.environment = environment;
    this.databaseName = environment === 'staging' ? 'librarycard-db-staging' : 'librarycard-db';
    this.tables = environment === 'staging' ? STAGING_TABLES : PRODUCTION_TABLES;
    this.ensureExportDirectory();
    this.metadata = {
      exportTimestamp: new Date().toISOString(),
      sourceAccount: this.getCurrentAccountId(),
      sourceDatabase: this.databaseName,
      environment: this.environment,
      tables: [],
      totalRecords: 0,
      checksum: null
    };
  }

  ensureExportDirectory() {
    EXPORT_PATH = join(EXPORT_DIR, `${this.environment}-export-${EXPORT_TIMESTAMP}`);
    
    if (!existsSync(EXPORT_DIR)) {
      mkdirSync(EXPORT_DIR, { recursive: true });
    }
    if (!existsSync(EXPORT_PATH)) {
      mkdirSync(EXPORT_PATH, { recursive: true });
    }
    console.log(`📁 Export directory: ${EXPORT_PATH}`);
  }

  getCurrentAccountId() {
    try {
      const result = execSync('wrangler whoami', { encoding: 'utf8' });
      const match = result.match(/Account ID: ([a-f0-9]+)/);
      return match ? match[1] : 'unknown';
    } catch (error) {
      console.warn('⚠️ Could not determine current account ID');
      return 'unknown';
    }
  }

  async exportTable(tableName) {
    console.log(`📊 Exporting table: ${tableName}`);
    
    try {
      // Export table data as JSON
      const query = `SELECT * FROM ${tableName}`;
      const result = execSync(
        `wrangler d1 execute ${this.databaseName} --command="${query}" --json --env=${this.environment} --remote`,
        { encoding: 'utf8' }
      );

      const data = JSON.parse(result);
      const records = data.results || [];
      
      // Write table data to file
      const tableFile = join(EXPORT_PATH, `${tableName}.json`);
      writeFileSync(tableFile, JSON.stringify(records, null, 2));
      
      // Update metadata
      this.metadata.tables.push({
        name: tableName,
        recordCount: records.length,
        filename: `${tableName}.json`,
        exportedAt: new Date().toISOString()
      });
      
      this.metadata.totalRecords += records.length;
      console.log(`✅ Exported ${records.length} records from ${tableName}`);
      
      return records;
    } catch (error) {
      console.error(`❌ Failed to export table ${tableName}:`, error.message);
      throw error;
    }
  }

  async exportAllTables() {
    console.log(`🚀 Starting ${this.environment} data export...`);
    console.log(`📍 Source: ${this.databaseName} (${this.environment})`);
    console.log(`📁 Target: ${EXPORT_PATH}`);
    console.log('');

    const exportedData = {};

    for (const tableName of this.tables) {
      try {
        exportedData[tableName] = await this.exportTable(tableName);
      } catch (error) {
        console.error(`❌ Export failed for table: ${tableName}`);
        throw error;
      }
    }

    return exportedData;
  }

  calculateChecksum(data) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async createManifest(exportedData) {
    console.log('📄 Creating export manifest...');
    
    // Calculate data checksum
    this.metadata.checksum = this.calculateChecksum(exportedData);
    
    // Write metadata file
    const manifestFile = join(EXPORT_PATH, 'export-manifest.json');
    writeFileSync(manifestFile, JSON.stringify(this.metadata, null, 2));
    
    console.log(`✅ Export manifest created: ${manifestFile}`);
    return manifestFile;
  }

  async verifyExport() {
    console.log('🔍 Verifying export integrity...');
    
    let totalVerified = 0;
    const errors = [];

    for (const tableInfo of this.metadata.tables) {
      const tableFile = join(EXPORT_PATH, tableInfo.filename);
      
      if (!existsSync(tableFile)) {
        errors.push(`Missing export file: ${tableInfo.filename}`);
        continue;
      }

      try {
        const data = JSON.parse(readFileSync(tableFile, 'utf8'));
        if (data.length !== tableInfo.recordCount) {
          errors.push(`Record count mismatch in ${tableInfo.name}: expected ${tableInfo.recordCount}, got ${data.length}`);
        } else {
          totalVerified += data.length;
        }
      } catch (error) {
        errors.push(`Invalid JSON in ${tableInfo.filename}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('❌ Export verification failed:');
      errors.forEach(error => console.error(`   ${error}`));
      throw new Error('Export verification failed');
    }

    console.log(`✅ Export verified: ${totalVerified} records across ${this.metadata.tables.length} tables`);
    return true;
  }

  printSummary() {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`📊 ${this.environment.toUpperCase()} DATA EXPORT SUMMARY`);
    console.log('═══════════════════════════════════════');
    console.log(`Export Path: ${EXPORT_PATH}`);
    console.log(`Environment: ${this.environment}`);
    console.log(`Total Tables: ${this.metadata.tables.length}`);
    console.log(`Total Records: ${this.metadata.totalRecords}`);
    console.log(`Data Checksum: ${this.metadata.checksum.substring(0, 16)}...`);
    console.log('');
    console.log('📋 Table Details:');
    this.metadata.tables.forEach(table => {
      console.log(`   ${table.name}: ${table.recordCount} records`);
    });
    console.log('');
    console.log('✅ Export ready for import to new Cloudflare account');
    console.log('═══════════════════════════════════════');
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--env='));
  const environment = envArg ? envArg.split('=')[1] : 'production';
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use --env=staging or --env=production');
    process.exit(1);
  }
  
  const exporter = new DatabaseExporter(environment);
  
  try {
    // Export all table data
    const exportedData = await exporter.exportAllTables();
    
    // Create manifest with metadata
    await exporter.createManifest(exportedData);
    
    // Verify export integrity
    await exporter.verifyExport();
    
    // Print summary
    exporter.printSummary();
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Create new Cloudflare account resources');
    console.log('2. Set up new D1 database and KV namespace');
    console.log(`3. Run import-database-data.js with --source=${EXPORT_PATH}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

module.exports = { DatabaseExporter };