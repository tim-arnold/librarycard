#!/usr/bin/env node

/**
 * Production Data Import Script
 * 
 * This script imports production data to new Cloudflare account:
 * - Imports data from export directory
 * - Validates data integrity before import
 * - Creates tables and inserts data
 * - Provides verification and rollback options
 */

const { execSync } = require('child_process');
const { readFileSync, existsSync, readdirSync } = require('fs');
const { join } = require('path');

class ProductionDataImporter {
  constructor(sourcePath, targetAccount = 'new-account') {
    this.sourcePath = sourcePath;
    this.targetAccount = targetAccount;
    this.manifest = null;
    this.importedTables = [];
    
    this.validateSourcePath();
    this.loadManifest();
  }

  validateSourcePath() {
    if (!existsSync(this.sourcePath)) {
      throw new Error(`Export directory not found: ${this.sourcePath}`);
    }

    const manifestFile = join(this.sourcePath, 'export-manifest.json');
    if (!existsSync(manifestFile)) {
      throw new Error(`Export manifest not found: ${manifestFile}`);
    }

    console.log(`📁 Import source: ${this.sourcePath}`);
  }

  loadManifest() {
    const manifestFile = join(this.sourcePath, 'export-manifest.json');
    try {
      this.manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
      console.log(`📄 Loaded manifest: ${this.manifest.tables.length} tables, ${this.manifest.totalRecords} records`);
    } catch (error) {
      throw new Error(`Failed to load manifest: ${error.message}`);
    }
  }

  async verifySourceData() {
    console.log('🔍 Verifying source data integrity...');
    
    const errors = [];
    let totalRecords = 0;

    for (const tableInfo of this.manifest.tables) {
      const tableFile = join(this.sourcePath, tableInfo.filename);
      
      if (!existsSync(tableFile)) {
        errors.push(`Missing data file: ${tableInfo.filename}`);
        continue;
      }

      try {
        const data = JSON.parse(readFileSync(tableFile, 'utf8'));
        if (data.length !== tableInfo.recordCount) {
          errors.push(`Record count mismatch in ${tableInfo.name}: expected ${tableInfo.recordCount}, got ${data.length}`);
        } else {
          totalRecords += data.length;
        }
      } catch (error) {
        errors.push(`Invalid JSON in ${tableInfo.filename}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('❌ Source data verification failed:');
      errors.forEach(error => console.error(`   ${error}`));
      throw new Error('Source data verification failed');
    }

    console.log(`✅ Source data verified: ${totalRecords} records`);
    return true;
  }

  async createTableSchema() {
    console.log('🏗️ Creating database schema in target account...');
    
    try {
      // Deploy schema to target database
      let command;
      if (this.targetAccount === 'new-account') {
        command = 'wrangler d1 execute librarycard-db-prod --config=wrangler.prod.toml --file=schema.sql --env=production --remote';
      } else if (this.targetAccount === 'staging-new-account') {
        command = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW} wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --file=schema.sql --env=staging --remote`;
      } else {
        command = 'wrangler d1 execute librarycard-db --file=schema.sql --env=production --remote';
      }
      
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Database schema created successfully');
    } catch (error) {
      throw new Error(`Failed to create schema: ${error.message}`);
    }
  }

  async importTable(tableInfo) {
    console.log(`📊 Importing table: ${tableInfo.name}`);
    
    const tableFile = join(this.sourcePath, tableInfo.filename);
    const data = JSON.parse(readFileSync(tableFile, 'utf8'));
    
    if (data.length === 0) {
      console.log(`⚪ Table ${tableInfo.name} is empty, skipping...`);
      return 0;
    }

    // Generate batch INSERT statements
    const batchSize = 100; // SQLite batch limit
    let importedCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const insertSql = this.generateBatchInsert(tableInfo.name, batch);
      
      try {
        let command;
        if (this.targetAccount === 'new-account') {
          command = `wrangler d1 execute librarycard-db-prod --config=wrangler.prod.toml --command="${insertSql}" --env=production --remote`;
        } else if (this.targetAccount === 'staging-new-account') {
          command = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW} wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --command="${insertSql}" --env=staging --remote`;
        } else {
          command = `wrangler d1 execute librarycard-db --command="${insertSql}" --env=production --remote`;
        }
        
        execSync(command, { stdio: 'pipe' });
        importedCount += batch.length;
        
        if (data.length > batchSize) {
          console.log(`   📈 Progress: ${importedCount}/${data.length} records`);
        }
      } catch (error) {
        throw new Error(`Failed to import batch for ${tableInfo.name}: ${error.message}`);
      }
    }

    console.log(`✅ Imported ${importedCount} records to ${tableInfo.name}`);
    this.importedTables.push({
      name: tableInfo.name,
      recordCount: importedCount
    });
    
    return importedCount;
  }

  generateBatchInsert(tableName, records) {
    if (records.length === 0) return '';

    // Get column names from first record
    const columns = Object.keys(records[0]);
    const columnList = columns.join(', ');

    // Generate VALUES clauses
    const valuesClauses = records.map(record => {
      const values = columns.map(col => {
        const value = record[col];
        if (value === null || value === undefined) {
          return 'NULL';
        }
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
        }
        if (typeof value === 'boolean') {
          return value ? '1' : '0';
        }
        return value;
      });
      return `(${values.join(', ')})`;
    });

    return `INSERT INTO ${tableName} (${columnList}) VALUES ${valuesClauses.join(', ')}`;
  }

  async importAllTables() {
    console.log('🚀 Starting production data import...');
    console.log(`📍 Target: ${this.targetAccount === 'new-account' ? 'librarycard-db-prod (new account)' : 'librarycard-db'}`);
    console.log('');

    let totalImported = 0;

    for (const tableInfo of this.manifest.tables) {
      try {
        const imported = await this.importTable(tableInfo);
        totalImported += imported;
      } catch (error) {
        console.error(`❌ Import failed for table: ${tableInfo.name}`);
        throw error;
      }
    }

    console.log(`✅ Import completed: ${totalImported} total records`);
    return totalImported;
  }

  async verifyImport() {
    console.log('🔍 Verifying imported data...');
    
    const errors = [];
    let totalVerified = 0;

    for (const tableInfo of this.importedTables) {
      try {
        let command;
        if (this.targetAccount === 'new-account') {
          command = `wrangler d1 execute librarycard-db-prod --config=wrangler.prod.toml --command="SELECT COUNT(*) as count FROM ${tableInfo.name}" --json --env=production --remote`;
        } else if (this.targetAccount === 'staging-new-account') {
          command = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW} wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --command="SELECT COUNT(*) as count FROM ${tableInfo.name}" --json --env=staging --remote`;
        } else {
          command = `wrangler d1 execute librarycard-db --command="SELECT COUNT(*) as count FROM ${tableInfo.name}" --json --env=production --remote`;
        }
        
        const result = execSync(command, { encoding: 'utf8' });
        const data = JSON.parse(result);
        const actualCount = data.results[0].count;
        
        if (actualCount !== tableInfo.recordCount) {
          errors.push(`Count mismatch in ${tableInfo.name}: expected ${tableInfo.recordCount}, got ${actualCount}`);
        } else {
          totalVerified += actualCount;
        }
      } catch (error) {
        errors.push(`Verification failed for ${tableInfo.name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('❌ Import verification failed:');
      errors.forEach(error => console.error(`   ${error}`));
      throw new Error('Import verification failed');
    }

    console.log(`✅ Import verified: ${totalVerified} records across ${this.importedTables.length} tables`);
    return true;
  }

  printSummary() {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📊 PRODUCTION DATA IMPORT SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Source: ${this.sourcePath}`);
    console.log(`Target: ${this.targetAccount === 'new-account' ? 'New Production Account' : 'Current Account'}`);
    console.log(`Total Tables: ${this.importedTables.length}`);
    console.log(`Total Records: ${this.importedTables.reduce((sum, t) => sum + t.recordCount, 0)}`);
    console.log('');
    console.log('📋 Imported Tables:');
    this.importedTables.forEach(table => {
      console.log(`   ${table.name}: ${table.recordCount} records`);
    });
    console.log('');
    console.log('✅ Data migration to new account completed successfully');
    console.log('═══════════════════════════════════════');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find(arg => arg.startsWith('--source='));
  const targetArg = args.find(arg => arg.startsWith('--target='));
  
  if (!sourceArg) {
    console.error('❌ Usage: node import-production-data.js --source=/path/to/export [--target=new-account]');
    process.exit(1);
  }

  const sourcePath = sourceArg.split('=')[1];
  const targetAccount = targetArg ? targetArg.split('=')[1] : 'new-account';
  
  console.log('🔄 Production Data Import Starting...');
  console.log(`📁 Source: ${sourcePath}`);
  console.log(`🎯 Target: ${targetAccount}`);
  console.log('');

  const importer = new ProductionDataImporter(sourcePath, targetAccount);
  
  try {
    // Verify source data integrity
    await importer.verifySourceData();
    
    // Create database schema in target
    await importer.createTableSchema();
    
    // Import all table data
    await importer.importAllTables();
    
    // Verify imported data
    await importer.verifyImport();
    
    // Print summary
    importer.printSummary();
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Test new production environment thoroughly');
    console.log('2. Update DNS routing to new worker');
    console.log('3. Monitor for 24 hours before cleanup');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Verify wrangler.prod.toml configuration');
    console.log('2. Check new account permissions');
    console.log('3. Ensure database and KV resources exist');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

module.exports = { ProductionDataImporter };