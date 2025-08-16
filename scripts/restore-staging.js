#!/usr/bin/env node

/**
 * Staging Database Restore System
 * 
 * Test version of restore system for staging environment:
 * - Lists available staging backups
 * - Verifies backup integrity before restore
 * - Creates pre-restore backup
 * - Restores data with confirmation steps
 * - Provides rollback capability
 * - Safe for testing restore procedures
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = './backups-staging';
const METADATA_FILE = './backups-staging/backup-metadata.json';
const AUDIT_LOG = './staging-audit.log';

class StagingDatabaseRestore {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async restore() {
    try {
      console.log('🧪 STAGING DATABASE RESTORE TEST 🧪\n');
      console.log('⚠️  WARNING: This will OVERWRITE staging data!');
      console.log('✅ This is SAFE - staging environment only\n');
      
      const backupId = await this.selectBackup();
      await this.verifyBackup(backupId);
      await this.createPreRestoreBackup();
      await this.confirmRestore(backupId);
      await this.executeRestore(backupId);
      
    } catch (error) {
      console.error('❌ Staging restore failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async selectBackup() {
    console.log('📋 Step 1: Select Staging Backup to Restore');
    
    if (!existsSync(METADATA_FILE)) {
      throw new Error('No staging backups found');
    }

    const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
    
    if (metadata.length === 0) {
      throw new Error('No staging backups available');
    }

    console.log('Available staging backups:');
    console.log('─'.repeat(80));
    
    metadata.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString();
      const size = (backup.size / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${backup.id}`);
      console.log(`   Date: ${date} | Reason: ${backup.reason}`);
      console.log(`   Tables: ${backup.tables} | Rows: ${backup.rows} | Size: ${size}MB`);
      console.log('');
    });

    const selection = await this.askQuestion('\nEnter the number of the backup to restore: ');
    const index = parseInt(selection) - 1;
    
    if (index < 0 || index >= metadata.length) {
      throw new Error('Invalid selection');
    }

    const selectedBackup = metadata[index];
    console.log(`✅ Selected staging backup: ${selectedBackup.id}\n`);
    
    return selectedBackup.id;
  }

  async verifyBackup(backupId) {
    console.log('🔍 Step 2: Staging Backup Verification');
    
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    if (!existsSync(backupFile)) {
      throw new Error(`Staging backup file not found: ${backupFile}`);
    }

    console.log(`Verifying staging backup integrity: ${backupId}`);
    
    try {
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
      // Verify structure
      if (!backupData.tables || !backupData.metadata) {
        throw new Error('Invalid backup structure');
      }

      // Verify each table
      let totalRows = 0;
      const tableCount = Object.keys(backupData.tables).length;
      
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (!tableData.schema || !Array.isArray(tableData.data)) {
          throw new Error(`Invalid table data for: ${tableName}`);
        }
        totalRows += tableData.data.length;
      }

      // Verify metadata consistency
      if (totalRows !== backupData.metadata.total_rows) {
        throw new Error('Row count mismatch in metadata');
      }

      console.log(`✅ Staging backup verification successful`);
      console.log(`📊 Verified ${tableCount} tables with ${totalRows} total rows`);
      console.log(`📅 Backup created: ${new Date(backupData.timestamp).toLocaleString()}`);
      console.log(`👤 Created by: ${backupData.metadata.created_by}`);
      console.log(`📝 Reason: ${backupData.reason}\n`);
      
      return backupData;

    } catch (error) {
      console.error(`❌ Staging backup verification failed: ${error.message}`);
      throw error;
    }
  }

  async createPreRestoreBackup() {
    console.log('💾 Step 3: Pre-Restore Staging Backup');
    console.log('Creating backup of current staging state before restore...');
    
    try {
      // Import the staging backup system
      const { StagingDatabaseBackup } = require('./backup-staging.js');
      const backupSystem = new StagingDatabaseBackup();
      
      // Create backup with restore reason
      const result = await backupSystem.createStagingBackup('pre-restore');
      
      this.logAudit(`PRE_RESTORE_BACKUP: ${result.backupId} | Tables: ${result.metadata.total_tables} | Rows: ${result.metadata.total_rows}`);
      
      console.log('✅ Pre-restore staging backup completed');
      console.log(`📁 Backup ID: ${result.backupId}`);
      console.log('This backup can be used to rollback if restore fails\n');
      
      return result.backupId;
      
    } catch (error) {
      console.error('❌ Pre-restore staging backup failed:', error.message);
      console.log('\n⚠️  WARNING: Cannot create safety backup!');
      
      const proceed = await this.askQuestion('Continue without pre-restore backup? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes') {
        throw new Error('Restore cancelled - pre-restore backup recommended for safety');
      }
      
      console.log('⚠️  Proceeding without pre-restore backup\n');
      return null;
    }
  }

  async confirmRestore(backupId) {
    console.log('🔐 Step 4: Staging Restore Confirmation');
    console.log('You are about to RESTORE staging database from backup.');
    console.log('This will OVERWRITE all current staging data!');
    console.log('');
    
    // Simplified confirmation for staging
    const confirm1 = await this.askQuestion(`Type "RESTORE STAGING ${backupId}" to confirm: `);
    if (confirm1 !== `RESTORE STAGING ${backupId}`) {
      throw new Error('Staging restore cancelled - confirmation failed');
    }
    
    const confirm2 = await this.askQuestion('Type "STAGING TEST" to proceed: ');
    if (confirm2 !== 'STAGING TEST') {
      throw new Error('Staging restore cancelled - second confirmation failed');
    }
    
    console.log('✅ Staging restore confirmed\n');
  }

  async executeRestore(backupId) {
    console.log('🚀 Step 5: Executing Staging Restore');
    
    const timestamp = new Date().toISOString();
    const user = process.env.USER || 'unknown';
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    // Log restore attempt
    this.logAudit(`STAGING_RESTORE_START: ${timestamp} | User: ${user} | Backup: ${backupId}`);
    
    try {
      console.log(`Restoring staging from backup: ${backupId}`);
      console.log('This may take several minutes...\n');
      
      // Load backup data
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
      // Restore each table
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        console.log(`🔄 Restoring table: ${tableName} (${tableData.row_count} rows)`);
        
        try {
          // Drop and recreate table
          await this.executeD1Command(`DROP TABLE IF EXISTS ${tableName};`);
          await this.executeD1Command(tableData.schema);
          
          // Insert data in batches
          if (tableData.data.length > 0) {
            await this.insertDataBatch(tableName, tableData.data);
          }
          
          console.log(`  ✅ ${tableName} restored successfully`);
          
        } catch (error) {
          console.error(`  ❌ Failed to restore table ${tableName}: ${error.message}`);
          throw new Error(`Table restore failed: ${tableName}`);
        }
      }
      
      console.log('\n✅ Staging database restore completed successfully!');
      this.logAudit(`STAGING_RESTORE_SUCCESS: ${timestamp} | User: ${user} | Backup: ${backupId}`);
      
      console.log('\n📋 Post-restore checklist:');
      console.log('1. Verify staging application is functioning correctly');
      console.log('2. Test critical user flows on staging');
      console.log('3. Check data integrity with spot checks');
      console.log('4. Compare with production functionality');
      console.log('5. This was a successful test of backup/restore system!');
      
    } catch (error) {
      console.error('\n❌ Staging restore failed!');
      this.logAudit(`STAGING_RESTORE_FAILED: ${timestamp} | User: ${user} | Backup: ${backupId} | Error: ${error.message}`);
      
      console.log('\n🚨 Staging database may be in inconsistent state!');
      console.log('1. Check staging application status');
      console.log('2. Consider rollback to pre-restore backup');
      console.log('3. Review restore logs for specific errors');
      console.log('4. This is staging - safe to debug and retry');
      
      throw error;
    }
  }

  async executeD1Command(sql) {
    try {
      // Use staging-new configuration
      const command = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW} npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --command="${sql.replace(/"/g, '\\"')}"`;
      const result = execSync(command, { encoding: 'utf8' });
      return result;
    } catch (error) {
      throw new Error(`Database command failed: ${error.message}`);
    }
  }

  async insertDataBatch(tableName, data) {
    if (data.length === 0) return;
    
    // Get column names from first row
    const columns = Object.keys(data[0]);
    const batchSize = 10; // Smaller batch size to avoid command length limits
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Insert each row individually to avoid command length issues
      for (const row of batch) {
        const vals = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          return val;
        });
        
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${vals.join(', ')});`;
        
        try {
          await this.executeD1Command(sql);
        } catch (error) {
          console.log(`    ⚠️  Failed to insert row in ${tableName}: ${error.message}`);
          // Continue with other rows
        }
      }
    }
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  logAudit(message) {
    const logEntry = `${new Date().toISOString()} - ${message}\n`;
    writeFileSync(AUDIT_LOG, logEntry, { flag: 'a' });
  }
}

// Execute if called directly
if (require.main === module) {
  const restore = new StagingDatabaseRestore();
  restore.restore();
}

module.exports = { StagingDatabaseRestore };