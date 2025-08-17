#!/usr/bin/env node

/**
 * Production Database Backup System
 * 
 * Production version of backup system for production environment
 * - Same functionality as staging backup but for production
 * - Uses production environment and database
 * - Creates comprehensive backups with metadata tracking
 */

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = './backups-production';
const METADATA_FILE = './backups-production/backup-metadata.json';

class ProductionDatabaseBackup {
  constructor() {
    this.validateGitHubActionsEnvironment();
    this.ensureBackupDirectory();
  }

  validateGitHubActionsEnvironment() {
    // CRITICAL SAFETY: Only allow execution in GitHub Actions
    if (!process.env.GITHUB_ACTIONS) {
      console.error('🚨 PRODUCTION SAFETY VIOLATION 🚨');
      console.error('❌ Production backup scripts can ONLY be executed via GitHub Actions');
      console.error('❌ Local execution is BLOCKED for production safety');
      console.error('');
      console.error('✅ Use GitHub Actions workflow: "💾 Production Cloudflare Workers & D1 Backup"');
      console.error('✅ Or for staging: npm run backup:staging:create');
      process.exit(1);
    }

    // Verify we're in the expected GitHub Actions environment
    if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_WORKFLOW) {
      console.error('🚨 INVALID EXECUTION ENVIRONMENT 🚨');
      console.error('❌ Missing required GitHub Actions environment variables');
      process.exit(1);
    }

    console.log('✅ GitHub Actions environment validated for production backup');
    console.log(`📋 Repository: ${process.env.GITHUB_REPOSITORY}`);
    console.log(`📋 Workflow: ${process.env.GITHUB_WORKFLOW}`);
  }

  ensureBackupDirectory() {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✅ Created production backup directory: ${BACKUP_DIR}`);
    }
  }

  async createProductionBackup(reason = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `prod-backup-${timestamp}`;
    
    console.log(`📦 Creating production database backup: ${backupId}`);
    console.log(`Reason: ${reason}`);
    
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      reason: reason,
      tables: {},
      metadata: {
        created_by: process.env.USER || 'system',
        environment: 'production',
        backup_method: 'automated'
      }
    };

    try {
      // Get list of all tables (excluding system tables)
      console.log('📋 Discovering database tables...');
      const tablesOutput = this.executeD1Command(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_cf_%'
        ORDER BY name
      `);
      const tables = this.parseD1Output(tablesOutput);
      
      if (tables.length === 0) {
        throw new Error('No tables found in database');
      }
      
      console.log(`Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);
      
      // Backup each table
      let totalRows = 0;
      for (const table of tables) {
        const tableName = table.name;
        console.log(`  📊 Backing up table: ${tableName}`);
        
        try {
          // Get table data
          const tableData = this.executeD1Command(`SELECT * FROM ${tableName}`);
          const rows = this.parseD1Output(tableData);
          
          backupData.tables[tableName] = {
            row_count: rows.length,
            data: rows,
            backed_up_at: new Date().toISOString()
          };
          
          totalRows += rows.length;
          console.log(`    ✅ ${rows.length} rows backed up`);
        } catch (error) {
          console.error(`    ❌ Failed to backup table ${tableName}:`, error.message);
          backupData.tables[tableName] = {
            error: error.message,
            backed_up_at: new Date().toISOString()
          };
        }
      }
      
      // Save backup to file
      const backupFile = join(BACKUP_DIR, `${backupId}.json`);
      writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      // Update metadata
      this.updateBackupMetadata(backupData);
      
      console.log(`✅ Production backup completed: ${backupId}`);
      console.log(`📊 Total tables: ${Object.keys(backupData.tables).length}`);
      console.log(`📊 Total rows: ${totalRows}`);
      console.log(`💾 Backup file: ${backupFile}`);
      
      return backupId;
      
    } catch (error) {
      console.error('❌ Production backup failed:', error.message);
      throw error;
    }
  }

  executeD1Command(sql) {
    const command = `wrangler d1 execute librarycard-db --config=wrangler.prod.toml --env=production --remote --command="${sql.replace(/"/g, '\\"')}"`;
    
    try {
      return execSync(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch (error) {
      console.error(`D1 command failed: ${command}`);
      console.error('Error output:', error.stderr?.toString() || error.message);
      throw new Error(`D1 execution failed: ${error.message}`);
    }
  }

  parseD1Output(output) {
    try {
      // Split output into lines and find JSON start
      const lines = output.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('['));
      
      if (jsonStartIndex === -1) {
        console.warn('⚠️  No JSON found in D1 output');
        return [];
      }
      
      // Extract JSON portion
      const jsonLines = lines.slice(jsonStartIndex);
      const jsonText = jsonLines.join('\n');
      
      // Parse JSON
      const jsonData = JSON.parse(jsonText);
      
      // Handle wrangler D1 output format
      if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].results) {
        return jsonData[0].results;
      }
      
      // If it's already an array of results
      if (Array.isArray(jsonData)) {
        return jsonData;
      }
      
      return [];
    } catch (error) {
      console.warn('⚠️  Could not parse D1 JSON output:', error.message);
      console.warn('Raw output:', output);
      return [];
    }
  }

  updateBackupMetadata(backupData) {
    let metadata = [];
    
    // Load existing metadata if it exists
    if (existsSync(METADATA_FILE)) {
      try {
        const existing = readFileSync(METADATA_FILE, 'utf8');
        metadata = JSON.parse(existing);
      } catch (error) {
        console.warn('⚠️  Could not load existing metadata, starting fresh');
      }
    }
    
    // Add new backup to metadata
    metadata.push({
      id: backupData.id,
      timestamp: backupData.timestamp,
      reason: backupData.reason,
      tables: Object.keys(backupData.tables).length,
      total_rows: Object.values(backupData.tables).reduce((sum, table) => sum + (table.row_count || 0), 0),
      environment: backupData.metadata.environment,
      created_by: backupData.metadata.created_by
    });
    
    // Keep only last 50 backups in metadata
    if (metadata.length > 50) {
      metadata = metadata.slice(-50);
    }
    
    // Save updated metadata
    writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  }

  listBackups() {
    if (!existsSync(METADATA_FILE)) {
      console.log('📝 No backups found');
      return [];
    }
    
    try {
      const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
      
      console.log('\n📦 Available Production Backups:');
      console.log('================================');
      
      metadata.reverse().slice(0, 10).forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.id}`);
        console.log(`   📅 ${backup.timestamp}`);
        console.log(`   📝 ${backup.reason}`);
        console.log(`   📊 ${backup.tables} tables, ${backup.total_rows} rows`);
        console.log(`   👤 ${backup.created_by}`);
        console.log('');
      });
      
      if (metadata.length > 10) {
        console.log(`... and ${metadata.length - 10} more backups`);
      }
      
      return metadata;
    } catch (error) {
      console.error('❌ Failed to load backup metadata:', error.message);
      return [];
    }
  }

  verifyBackup(backupId) {
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    try {
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
      console.log(`🔍 Verifying backup: ${backupId}`);
      console.log(`📅 Created: ${backupData.timestamp}`);
      console.log(`📝 Reason: ${backupData.reason}`);
      
      let totalRows = 0;
      let successfulTables = 0;
      let failedTables = 0;
      
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (tableData.error) {
          console.log(`  ❌ ${tableName}: ${tableData.error}`);
          failedTables++;
        } else {
          console.log(`  ✅ ${tableName}: ${tableData.row_count} rows`);
          totalRows += tableData.row_count;
          successfulTables++;
        }
      }
      
      console.log(`\n📊 Verification Summary:`);
      console.log(`   ✅ Successful tables: ${successfulTables}`);
      console.log(`   ❌ Failed tables: ${failedTables}`);
      console.log(`   📊 Total rows: ${totalRows}`);
      
      if (failedTables > 0) {
        console.log('⚠️  Backup has some failed tables but may still be usable');
      } else {
        console.log('✅ Backup verification successful');
      }
      
      return { successfulTables, failedTables, totalRows };
      
    } catch (error) {
      console.error('❌ Backup verification failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const backup = new ProductionDatabaseBackup();
  const command = process.argv[2];
  const arg = process.argv[3];

  async function main() {
    try {
      switch (command) {
        case 'create':
          const reason = arg || 'manual';
          const backupId = await backup.createProductionBackup(reason);
          console.log(`\n🎉 Backup completed: ${backupId}`);
          break;
          
        case 'list':
          backup.listBackups();
          break;
          
        case 'verify':
          if (!arg) {
            console.error('❌ Please provide backup ID to verify');
            process.exit(1);
          }
          backup.verifyBackup(arg);
          break;
          
        default:
          console.log('Production Database Backup System');
          console.log('');
          console.log('Usage:');
          console.log('  node scripts/backup-production.js create [reason]  - Create new backup');
          console.log('  node scripts/backup-production.js list            - List available backups');
          console.log('  node scripts/backup-production.js verify <id>     - Verify backup integrity');
          console.log('');
          console.log('Examples:');
          console.log('  node scripts/backup-production.js create "pre-migration"');
          console.log('  node scripts/backup-production.js verify prod-backup-2025-08-16T22-30-15-123Z');
      }
    } catch (error) {
      console.error('\n❌ Operation failed:', error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = ProductionDatabaseBackup;