#!/usr/bin/env node

/**
 * Database Restore System
 * 
 * This script provides safe database restore functionality:
 * - Lists available backups
 * - Verifies backup integrity before restore
 * - Creates pre-restore backup
 * - Restores data with confirmation steps
 * - Provides rollback capability
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { join } = require('path');

const BACKUP_DIR = './backups';
const METADATA_FILE = './backups/backup-metadata.json';
const AUDIT_LOG = './production-audit.log';

class DatabaseRestore {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async restore() {
    try {
      console.log('🚨 PRODUCTION DATABASE RESTORE 🚨\n');
      console.log('⚠️  WARNING: This will OVERWRITE production data!');
      console.log('⚠️  Only proceed if you are absolutely certain!\n');
      
      const backupId = await this.selectBackup();
      await this.verifyBackup(backupId);
      await this.createPreRestoreBackup();
      await this.confirmRestore(backupId);
      await this.executeRestore(backupId);
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async selectBackup() {
    console.log('📋 Step 1: Select Backup to Restore');
    
    if (!existsSync(METADATA_FILE)) {
      throw new Error('No backups found');
    }

    const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
    
    if (metadata.length === 0) {
      throw new Error('No backups available');
    }

    console.log('Available backups:');
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
    console.log(`✅ Selected backup: ${selectedBackup.id}\n`);
    
    return selectedBackup.id;
  }

  async verifyBackup(backupId) {
    console.log('🔍 Step 2: Backup Verification');
    
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`Verifying backup integrity: ${backupId}`);
    
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

      console.log(`✅ Backup verification successful`);
      console.log(`📊 Verified ${tableCount} tables with ${totalRows} total rows`);
      console.log(`📅 Backup created: ${new Date(backupData.timestamp).toLocaleString()}`);
      console.log(`👤 Created by: ${backupData.metadata.created_by}`);
      console.log(`📝 Reason: ${backupData.reason}\n`);
      
      return backupData;

    } catch (error) {
      console.error(`❌ Backup verification failed: ${error.message}`);
      throw error;
    }
  }

  async createPreRestoreBackup() {
    console.log('💾 Step 3: Pre-Restore Backup');
    console.log('Creating backup of current production state before restore...');
    
    try {
      // Import the backup system
      const { DatabaseBackup } = require('./auto-backup.js');
      const backupSystem = new DatabaseBackup();
      
      // Create backup with restore reason
      const result = await backupSystem.createProductionBackup('pre-restore');
      
      this.logAudit(`PRE_RESTORE_BACKUP: ${result.backupId} | Tables: ${result.metadata.total_tables} | Rows: ${result.metadata.total_rows}`);
      
      console.log('✅ Pre-restore backup completed');
      console.log(`📁 Backup ID: ${result.backupId}`);
      console.log('This backup can be used to rollback if restore fails\n');
      
      return result.backupId;
      
    } catch (error) {
      console.error('❌ Pre-restore backup failed:', error.message);
      console.log('\n⚠️  WARNING: Cannot create safety backup!');
      
      const proceed = await this.askQuestion('Continue without pre-restore backup? This is DANGEROUS! (yes/no): ');
      if (proceed.toLowerCase() !== 'yes') {
        throw new Error('Restore cancelled - pre-restore backup required for safety');
      }
      
      console.log('⚠️  Proceeding without pre-restore backup - EXTREME RISK!\n');
      return null;
    }
  }

  async confirmRestore(backupId) {
    console.log('🔐 Step 4: Restore Confirmation');
    console.log('You are about to RESTORE production database from backup.');
    console.log('This will PERMANENTLY OVERWRITE all current production data!');
    console.log('');
    
    // First confirmation
    const confirm1 = await this.askQuestion(`Type "RESTORE ${backupId}" to confirm: `);
    if (confirm1 !== `RESTORE ${backupId}`) {
      throw new Error('Restore cancelled - confirmation failed');
    }
    
    // Second confirmation with timestamp
    const now = new Date().toISOString();
    console.log(`\nCurrent time: ${now}`);
    const confirm2 = await this.askQuestion('Type "OVERWRITE PRODUCTION DATA" to proceed: ');
    if (confirm2 !== 'OVERWRITE PRODUCTION DATA') {
      throw new Error('Restore cancelled - second confirmation failed');
    }
    
    // Final warning
    console.log('\n🚨 FINAL WARNING: This action is IRREVERSIBLE!');
    const confirm3 = await this.askQuestion('Type "I ACCEPT FULL RESPONSIBILITY" for final confirmation: ');
    if (confirm3 !== 'I ACCEPT FULL RESPONSIBILITY') {
      throw new Error('Restore cancelled - final confirmation failed');
    }
    
    console.log('✅ Restore confirmed\n');
  }

  async executeRestore(backupId) {
    console.log('🚀 Step 5: Executing Restore');
    
    const timestamp = new Date().toISOString();
    const user = process.env.USER || 'unknown';
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    // Log restore attempt
    this.logAudit(`RESTORE_START: ${timestamp} | User: ${user} | Backup: ${backupId}`);
    
    try {
      console.log(`Restoring from backup: ${backupId}`);
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
      
      console.log('\n✅ Database restore completed successfully!');
      this.logAudit(`RESTORE_SUCCESS: ${timestamp} | User: ${user} | Backup: ${backupId}`);
      
      console.log('\n📋 Post-restore checklist:');
      console.log('1. Verify application is functioning correctly');
      console.log('2. Test critical user flows');
      console.log('3. Check data integrity with spot checks');
      console.log('4. Monitor error rates for issues');
      console.log('5. Notify team of restore completion');
      
    } catch (error) {
      console.error('\n❌ Restore failed!');
      this.logAudit(`RESTORE_FAILED: ${timestamp} | User: ${user} | Backup: ${backupId} | Error: ${error.message}`);
      
      console.log('\n🚨 CRITICAL: Database may be in inconsistent state!');
      console.log('1. Check production application status immediately');
      console.log('2. Consider emergency rollback to pre-restore backup');
      console.log('3. Alert team of production database issue');
      console.log('4. Review restore logs for specific errors');
      
      throw error;
    }
  }

  async executeD1Command(sql) {
    try {
      // Use production-specific configuration
      const command = `npx wrangler d1 execute librarycard-db --config=wrangler.prod.toml --env=production --remote --command="${sql.replace(/"/g, '\\"')}"`;
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
    const batchSize = 50; // Insert in batches to avoid command length limits
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const values = batch.map(row => {
        const vals = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            // Use JSON.stringify to properly escape all special characters including quotes, backslashes, etc.
            return JSON.stringify(val);
          }
          return val;
        });
        return `(${vals.join(', ')})`;
      });
      
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values.join(', ')};`;
      await this.executeD1Command(sql);
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
  const restore = new DatabaseRestore();
  restore.restore();
}

module.exports = { DatabaseRestore };