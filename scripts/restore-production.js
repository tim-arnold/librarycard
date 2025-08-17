#!/usr/bin/env node

/**
 * Production Database Restore System
 * 
 * Production version of restore system for production environment:
 * - Lists available production backups
 * - Verifies backup integrity before restore
 * - Creates pre-restore backup
 * - Restores data with confirmation steps
 * - Provides rollback capability
 * - EXTREME CAUTION: This affects production data!
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = './backups-production';
const METADATA_FILE = './backups-production/backup-metadata.json';
const AUDIT_LOG = './production-restore-audit.log';

class ProductionDatabaseRestore {
  constructor() {
    this.validateGitHubActionsEnvironment();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  validateGitHubActionsEnvironment() {
    // CRITICAL SAFETY: Production restore should NEVER be automated
    // This is an extra safety check - restore should always be manual
    console.error('🚨 PRODUCTION RESTORE SAFETY BLOCK 🚨');
    console.error('❌ Production database restore is BLOCKED from automation');
    console.error('❌ This operation requires manual local execution with extreme caution');
    console.error('');
    console.error('🔧 For production restore:');
    console.error('   1. Download backup from GitHub release');
    console.error('   2. Extract to local backups-production/ directory');
    console.error('   3. Set PRODUCTION_RESTORE_OVERRIDE=true environment variable');
    console.error('   4. Run locally: PRODUCTION_RESTORE_OVERRIDE=true node scripts/restore-production.js');
    console.error('');
    console.error('⚠️  EXTREME CAUTION: This affects live production data!');
    
    // Allow override for emergency situations only
    if (!process.env.PRODUCTION_RESTORE_OVERRIDE) {
      process.exit(1);
    }

    console.log('⚠️  PRODUCTION RESTORE OVERRIDE DETECTED');
    console.log('🚨 PROCEEDING WITH EXTREME CAUTION');
  }

  async restore() {
    try {
      console.log('🚨 PRODUCTION DATABASE RESTORE 🚨\n');
      console.log('⚠️  EXTREME WARNING: This will OVERWRITE PRODUCTION DATA!');
      console.log('❌ This affects LIVE USER DATA - proceed with extreme caution!\n');
      
      const backupId = await this.selectBackup();
      await this.verifyBackup(backupId);
      await this.createPreRestoreBackup();
      await this.confirmRestore(backupId);
      await this.executeRestore(backupId);
      
    } catch (error) {
      console.error('❌ Production restore failed:', error.message);
      this.logAudit('RESTORE_FAILED', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async selectBackup() {
    if (!existsSync(METADATA_FILE)) {
      throw new Error('No production backups found. Create a backup first.');
    }

    const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
    
    if (metadata.length === 0) {
      throw new Error('No production backups available');
    }

    console.log('📦 Available Production Backups:\n');
    metadata.reverse().slice(0, 10).forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.id}`);
      console.log(`   📅 ${backup.timestamp}`);
      console.log(`   📝 ${backup.reason}`);
      console.log(`   📊 ${backup.tables} tables, ${backup.total_rows} rows`);
      console.log('');
    });

    const answer = await this.question('Enter backup number to restore (1-10): ');
    const selectedIndex = parseInt(answer) - 1;
    
    if (selectedIndex < 0 || selectedIndex >= Math.min(metadata.length, 10)) {
      throw new Error('Invalid backup selection');
    }

    const selectedBackup = metadata[selectedIndex];
    console.log(`\n✅ Selected backup: ${selectedBackup.id}\n`);
    
    this.logAudit('BACKUP_SELECTED', selectedBackup.id);
    return selectedBackup.id;
  }

  async verifyBackup(backupId) {
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`🔍 Verifying backup integrity: ${backupId}`);
    
    try {
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
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
      
      console.log(`\n📊 Backup verification:`);
      console.log(`   ✅ Successful tables: ${successfulTables}`);
      console.log(`   ❌ Failed tables: ${failedTables}`);
      console.log(`   📊 Total rows: ${totalRows}\n`);
      
      if (failedTables > 0) {
        const proceed = await this.question('⚠️  Backup has failed tables. Continue anyway? (yes/no): ');
        if (proceed.toLowerCase() !== 'yes') {
          throw new Error('Restore cancelled due to backup integrity issues');
        }
      }
      
      this.logAudit('BACKUP_VERIFIED', `${backupId}: ${successfulTables} successful, ${failedTables} failed tables`);
      
    } catch (error) {
      if (error.message.includes('Restore cancelled')) {
        throw error;
      }
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  async createPreRestoreBackup() {
    console.log('📦 Creating pre-restore backup of current production data...');
    
    try {
      const ProductionBackup = require('./backup-production.js');
      const backup = new ProductionBackup();
      const backupId = await backup.createProductionBackup('pre-restore-safety-backup');
      
      console.log(`✅ Pre-restore backup created: ${backupId}\n`);
      this.logAudit('PRE_RESTORE_BACKUP_CREATED', backupId);
      
    } catch (error) {
      console.error('❌ Failed to create pre-restore backup:', error.message);
      throw new Error('Cannot proceed without pre-restore backup');
    }
  }

  async confirmRestore(backupId) {
    console.log('🚨 FINAL PRODUCTION RESTORE CONFIRMATION 🚨\n');
    console.log('You are about to:');
    console.log(`  📦 Restore backup: ${backupId}`);
    console.log('  🗄️  OVERWRITE ALL PRODUCTION DATABASE DATA');
    console.log('  👥 AFFECT ALL LIVE USERS');
    console.log('  ⚠️  IRREVERSIBLY CHANGE PRODUCTION STATE\n');
    
    const confirm1 = await this.question('Type "RESTORE PRODUCTION" to confirm: ');
    if (confirm1 !== 'RESTORE PRODUCTION') {
      throw new Error('Restore cancelled - confirmation failed');
    }
    
    const confirm2 = await this.question('Type "I UNDERSTAND THE RISKS" to proceed: ');
    if (confirm2 !== 'I UNDERSTAND THE RISKS') {
      throw new Error('Restore cancelled - risk acknowledgment failed');
    }
    
    console.log('\n✅ Production restore confirmed\n');
    this.logAudit('RESTORE_CONFIRMED', backupId);
  }

  async executeRestore(backupId) {
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
    
    console.log(`🔄 Starting production database restore: ${backupId}`);
    console.log(`📅 Backup from: ${backupData.timestamp}\n`);
    
    // Define table restoration order (child tables first, then parent tables)
    const tableOrder = [
      // Child tables (no foreign key dependencies)
      'notification_queue', 'notification_log', 'notification_read_status', 'notification_preferences',
      'in_app_notifications', 'webauthn_challenges', 'webauthn_credentials', 'jwt_sessions', 
      'auth_audit_log', 'user_recovery_codes', 'user_global_permissions',
      // Tables with dependencies  
      'location_user_permissions', 'location_admin_capabilities', 'location_members', 'location_invitations',
      'book_checkout_history', 'book_ratings', 'book_removal_requests', 'signup_approval_requests',
      'book_genres', 'books', 'shelves',
      // Parent tables (referenced by others)
      'curated_genres', 'locations', 'users'
    ];
    
    try {
      // Phase 1: Clear existing data in dependency order
      console.log('🗑️  Phase 1: Clearing existing production data...');
      for (const tableName of tableOrder) {
        if (backupData.tables[tableName] && !backupData.tables[tableName].error) {
          try {
            this.executeD1Command(`DELETE FROM ${tableName}`);
            console.log(`    ✅ Cleared ${tableName}`);
          } catch (error) {
            console.log(`    ⚠️  Could not clear ${tableName}: ${error.message}`);
          }
        }
      }
      
      // Phase 2: Restore data in reverse dependency order  
      console.log('\n📥 Phase 2: Restoring production data...');
      const reversedOrder = [...tableOrder].reverse();
      
      let restoredTables = 0;
      let restoredRows = 0;
      
      for (const tableName of reversedOrder) {
        const tableData = backupData.tables[tableName];
        
        if (!tableData || tableData.error) {
          console.log(`    ⏭️  Skipping ${tableName} (no valid backup data)`);
          continue;
        }
        
        if (!tableData.data || tableData.data.length === 0) {
          console.log(`    ⏭️  Skipping ${tableName} (empty table)`);
          continue;
        }
        
        console.log(`    📥 Restoring ${tableName} (${tableData.data.length} rows)...`);
        
        try {
          // Insert data row by row (safer for large datasets)
          for (const row of tableData.data) {
            // Get columns from backup data
            const backupColumns = Object.keys(row);
            
            // Get target table schema to handle any schema differences
            let targetColumns;
            try {
              const schemaResult = this.executeD1Command(`PRAGMA table_info(${tableName})`);
              const schemaLines = schemaResult.split('\n');
              const schemaJsonStart = schemaLines.findIndex(line => line.trim().startsWith('['));
              if (schemaJsonStart !== -1) {
                const schemaJson = schemaLines.slice(schemaJsonStart).join('\n');
                const schemaData = JSON.parse(schemaJson);
                if (schemaData[0] && schemaData[0].results) {
                  targetColumns = schemaData[0].results.map(col => col.name);
                }
              }
            } catch (error) {
              console.log(`    ⚠️  Could not get schema for ${tableName}, using backup columns only`);
              targetColumns = backupColumns;
            }
            
            // Use only columns that exist in both backup data AND target schema
            const commonColumns = backupColumns.filter(col => 
              targetColumns ? targetColumns.includes(col) : true
            );
            
            const values = commonColumns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                // Use JSON.stringify to properly escape all special characters including quotes, backslashes, etc.
                return JSON.stringify(value);
              }
              return value;
            });
            
            const insertSql = `INSERT INTO ${tableName} (${commonColumns.join(', ')}) VALUES (${values.join(', ')})`;
            this.executeD1Command(insertSql);
          }
          
          console.log(`    ✅ Restored ${tableName}: ${tableData.data.length} rows`);
          restoredTables++;
          restoredRows += tableData.data.length;
          
        } catch (error) {
          console.error(`    ❌ Failed to restore ${tableName}: ${error.message}`);
          this.logAudit('TABLE_RESTORE_FAILED', `${tableName}: ${error.message}`);
        }
      }
      
      // Phase 3: Verification
      console.log('\n🔍 Phase 3: Verifying production restore...');
      const verificationResults = await this.verifyRestore(backupData);
      
      console.log('\n🎉 PRODUCTION RESTORE COMPLETED 🎉');
      console.log('================================');
      console.log(`📦 Restored backup: ${backupId}`);
      console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
      console.log(`📊 Tables restored: ${restoredTables}`);
      console.log(`📊 Total rows restored: ${restoredRows}`);
      console.log(`🔍 Verification: ${verificationResults.status}`);
      console.log('================================\n');
      
      this.logAudit('RESTORE_COMPLETED', `${backupId}: ${restoredTables} tables, ${restoredRows} rows restored`);
      
    } catch (error) {
      console.error('\n❌ Production restore failed during execution:', error.message);
      console.error('🚨 Production database may be in inconsistent state!');
      console.error('🔧 Consider running emergency rollback procedures');
      
      this.logAudit('RESTORE_EXECUTION_FAILED', error.message);
      throw error;
    }
  }

  async verifyRestore(originalBackupData) {
    console.log('  🔍 Verifying restored data...');
    
    let verified = 0;
    let failed = 0;
    
    for (const [tableName, tableData] of Object.entries(originalBackupData.tables)) {
      if (tableData.error || !tableData.data) continue;
      
      try {
        const currentOutput = this.executeD1Command(`SELECT COUNT(*) as count FROM ${tableName}`);
        const currentData = this.parseD1Output(currentOutput);
        const currentCount = currentData[0]?.count || 0;
        const expectedCount = tableData.row_count;
        
        if (currentCount === expectedCount) {
          console.log(`    ✅ ${tableName}: ${currentCount}/${expectedCount} rows`);
          verified++;
        } else {
          console.log(`    ⚠️  ${tableName}: ${currentCount}/${expectedCount} rows (mismatch)`);
          failed++;
        }
      } catch (error) {
        console.log(`    ❌ ${tableName}: verification failed`);
        failed++;
      }
    }
    
    const status = failed === 0 ? 'SUCCESSFUL' : 'PARTIAL';
    console.log(`  📊 Verification: ${verified} verified, ${failed} failed`);
    
    return { status, verified, failed };
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
      const lines = output.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('['));
      
      if (jsonStartIndex === -1) {
        console.warn('⚠️  No JSON found in D1 output');
        return [];
      }
      
      const jsonLines = lines.slice(jsonStartIndex);
      const jsonText = jsonLines.join('\n');
      const jsonData = JSON.parse(jsonText);
      
      if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].results) {
        return jsonData[0].results;
      }
      
      return [];
    } catch (error) {
      console.warn('⚠️  Could not parse D1 JSON output:', error.message);
      return [];
    }
  }

  logAudit(action, details) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${action}: ${details}\n`;
    
    try {
      writeFileSync(AUDIT_LOG, entry, { flag: 'a' });
    } catch (error) {
      console.warn('⚠️  Could not write to audit log:', error.message);
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// CLI interface
if (require.main === module) {
  const restore = new ProductionDatabaseRestore();

  async function main() {
    try {
      await restore.restore();
    } catch (error) {
      console.error('\n❌ Production restore operation failed:', error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = ProductionDatabaseRestore;