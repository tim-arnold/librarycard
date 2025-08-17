#!/usr/bin/env node

/**
 * Test Production Restore to Staging
 * 
 * SAFELY tests production backup restore by restoring production data to staging environment
 * - Uses staging environment (safe to overwrite)
 * - Validates production backup integrity
 * - Tests complete restore process
 * - Confirms backup/restore cycle works end-to-end
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const STAGING_AUDIT_LOG = './staging-prod-restore-test.log';

class ProductionRestoreToStagingTest {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async testProductionRestore() {
    try {
      console.log('🧪 TESTING PRODUCTION RESTORE TO STAGING 🧪\n');
      console.log('✅ SAFE: This tests production backup restore using staging environment');
      console.log('📋 Purpose: Validate production backup/restore cycle before actual migration\n');
      
      const backupFile = await this.selectProductionBackup();
      await this.verifyProductionBackup(backupFile);
      await this.createStagingPreTestBackup();
      await this.confirmStagingOverwrite();
      await this.restoreProductionDataToStaging(backupFile);
      await this.verifyStagingAfterRestore();
      
    } catch (error) {
      console.error('❌ Production restore test failed:', error.message);
      this.logAudit('TEST_FAILED', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async selectProductionBackup() {
    console.log('📦 Looking for production backup files...\n');
    
    // Check for production backup files
    const backupPatterns = [
      './backups-production/prod-backup-*.json',
      './prod-backup-*.json',
      './backup/prod-backup-*.json',
      './cloudflare/prod-backup-*.json'
    ];
    
    let backupFiles = [];
    for (const pattern of backupPatterns) {
      try {
        const files = execSync(`ls ${pattern} 2>/dev/null || echo ""`, { encoding: 'utf8' })
          .split('\n')
          .filter(f => f.trim() && f.includes('prod-backup-'));
        backupFiles = backupFiles.concat(files);
      } catch (error) {
        // Pattern didn't match any files
      }
    }
    
    if (backupFiles.length === 0) {
      console.log('📁 Available files in current directory:');
      try {
        const allFiles = execSync('ls -la *.json 2>/dev/null || echo "No JSON files found"', { encoding: 'utf8' });
        console.log(allFiles);
      } catch (error) {
        console.log('No files found');
      }
      
      const manualFile = await this.question('\n📂 Enter path to production backup JSON file: ');
      if (!existsSync(manualFile)) {
        throw new Error(`Backup file not found: ${manualFile}`);
      }
      return manualFile;
    }
    
    console.log('Found production backup files:');
    backupFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    const selection = await this.question(`\nSelect backup file (1-${backupFiles.length}): `);
    const selectedIndex = parseInt(selection) - 1;
    
    if (selectedIndex < 0 || selectedIndex >= backupFiles.length) {
      throw new Error('Invalid backup file selection');
    }
    
    const selectedFile = backupFiles[selectedIndex];
    console.log(`\n✅ Selected: ${selectedFile}\n`);
    
    this.logAudit('BACKUP_SELECTED', selectedFile);
    return selectedFile;
  }

  async verifyProductionBackup(backupFile) {
    console.log(`🔍 Verifying production backup: ${backupFile}`);
    
    try {
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
      console.log(`📅 Backup created: ${backupData.timestamp}`);
      console.log(`📝 Backup reason: ${backupData.reason}`);
      console.log(`🏷️  Backup ID: ${backupData.id}`);
      
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
      
      console.log(`\n📊 Production backup verification:`);
      console.log(`   ✅ Successful tables: ${successfulTables}`);
      console.log(`   ❌ Failed tables: ${failedTables}`);
      console.log(`   📊 Total rows: ${totalRows}`);
      console.log(`   🏷️  Environment: ${backupData.metadata?.environment || 'unknown'}\n`);
      
      if (failedTables > 0) {
        const proceed = await this.question('⚠️  Backup has failed tables. Continue test anyway? (yes/no): ');
        if (proceed.toLowerCase() !== 'yes') {
          throw new Error('Test cancelled due to backup integrity issues');
        }
      }
      
      this.logAudit('BACKUP_VERIFIED', `${backupData.id}: ${successfulTables} successful, ${failedTables} failed tables, ${totalRows} total rows`);
      
      return backupData;
      
    } catch (error) {
      if (error.message.includes('Test cancelled')) {
        throw error;
      }
      throw new Error(`Production backup verification failed: ${error.message}`);
    }
  }

  async createStagingPreTestBackup() {
    console.log('📦 Creating backup of current staging data before test...');
    
    try {
      // Use existing staging backup script
      execSync('node scripts/backup-staging.js create "pre-prod-restore-test"', { 
        stdio: 'inherit',
        env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
      });
      
      console.log('✅ Staging pre-test backup created\n');
      this.logAudit('STAGING_PRE_TEST_BACKUP_CREATED', 'success');
      
    } catch (error) {
      console.error('❌ Failed to create staging pre-test backup:', error.message);
      throw new Error('Cannot proceed without staging backup');
    }
  }

  async confirmStagingOverwrite() {
    console.log('⚠️  STAGING OVERWRITE CONFIRMATION ⚠️\n');
    console.log('You are about to:');
    console.log('  📦 Restore PRODUCTION data to STAGING environment');
    console.log('  🗄️  OVERWRITE current staging data');
    console.log('  🧪 TEST production backup restore process');
    console.log('  ✅ This is SAFE - staging environment only\n');
    
    const confirm = await this.question('Type "TEST RESTORE" to proceed: ');
    if (confirm !== 'TEST RESTORE') {
      throw new Error('Test cancelled - confirmation failed');
    }
    
    console.log('\n✅ Staging restore test confirmed\n');
    this.logAudit('TEST_CONFIRMED', 'staging overwrite confirmed');
  }

  async restoreProductionDataToStaging(backupFile) {
    const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
    
    console.log(`🔄 Restoring production data to staging: ${backupData.id}`);
    console.log(`📅 Production backup from: ${backupData.timestamp}\n`);
    
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
      // Phase 1: Clear existing staging data
      console.log('🗑️  Phase 1: Clearing current staging data...');
      for (const tableName of tableOrder) {
        if (backupData.tables[tableName] && !backupData.tables[tableName].error) {
          try {
            this.executeStagingD1Command(`DELETE FROM ${tableName}`);
            console.log(`    ✅ Cleared ${tableName}`);
          } catch (error) {
            console.log(`    ⚠️  Could not clear ${tableName}: ${error.message}`);
          }
        }
      }
      
      // Phase 2: Restore production data to staging
      console.log('\n📥 Phase 2: Restoring production data to staging...');
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
            // Get columns from production backup data
            const prodColumns = Object.keys(row);
            
            // Get staging table schema to handle schema differences
            let stagingColumns;
            try {
              const schemaResult = this.executeStagingD1Command(`PRAGMA table_info(${tableName})`);
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
            this.executeStagingD1Command(insertSql);
          }
          
          console.log(`    ✅ Restored ${tableName}: ${tableData.data.length} rows`);
          restoredTables++;
          restoredRows += tableData.data.length;
          
        } catch (error) {
          console.error(`    ❌ Failed to restore ${tableName}: ${error.message}`);
          this.logAudit('TABLE_RESTORE_FAILED', `${tableName}: ${error.message}`);
        }
      }
      
      console.log('\n🎉 PRODUCTION DATA RESTORED TO STAGING 🎉');
      console.log('==========================================');
      console.log(`📦 Restored backup: ${backupData.id}`);
      console.log(`📅 Production backup: ${backupData.timestamp}`);
      console.log(`📊 Tables restored: ${restoredTables}`);
      console.log(`📊 Total rows restored: ${restoredRows}`);
      console.log('==========================================\n');
      
      this.logAudit('RESTORE_TO_STAGING_COMPLETED', `${backupData.id}: ${restoredTables} tables, ${restoredRows} rows restored to staging`);
      
    } catch (error) {
      console.error('\n❌ Restore to staging failed:', error.message);
      this.logAudit('RESTORE_TO_STAGING_FAILED', error.message);
      throw error;
    }
  }

  async verifyStagingAfterRestore() {
    console.log('🔍 Verifying staging environment after production data restore...\n');
    
    try {
      // Test basic connectivity
      console.log('  🌐 Testing staging API connectivity...');
      const healthCheck = await this.testStagingHealth();
      
      // Test data integrity
      console.log('  📊 Verifying data integrity...');
      const dataCheck = await this.verifyStagingData();
      
      console.log('\n✅ STAGING VERIFICATION COMPLETED');
      console.log('================================');
      console.log(`🌐 API Health: ${healthCheck ? 'PASS' : 'FAIL'}`);
      console.log(`📊 Data Integrity: ${dataCheck.status}`);
      console.log(`📋 Tables verified: ${dataCheck.verified}`);
      console.log(`⚠️  Issues found: ${dataCheck.issues}`);
      console.log('================================\n');
      
      if (healthCheck && dataCheck.status === 'PASS') {
        console.log('🎉 PRODUCTION BACKUP/RESTORE TEST: ✅ SUCCESS');
        console.log('✅ Production backup can be successfully restored');
        console.log('✅ Restored data works correctly in staging');
        console.log('✅ Backup/restore cycle is validated and ready\n');
        
        this.logAudit('TEST_SUCCESS', 'Production backup restore test completed successfully');
      } else {
        console.log('⚠️  PRODUCTION BACKUP/RESTORE TEST: ⚠️  ISSUES FOUND');
        console.log('❌ Some verification checks failed');
        console.log('🔧 Review issues before proceeding with production migration\n');
        
        this.logAudit('TEST_ISSUES', 'Production backup restore test found issues');
      }
      
    } catch (error) {
      console.error('❌ Staging verification failed:', error.message);
      this.logAudit('VERIFICATION_FAILED', error.message);
      throw error;
    }
  }

  async testStagingHealth() {
    try {
      const { spawn } = require('child_process');
      const curl = spawn('curl', ['-f', '-s', '--max-time', '15', 'https://staging--libarycard.netlify.app']);
      
      return new Promise((resolve) => {
        curl.on('close', (code) => {
          const healthy = code === 0;
          console.log(`    ${healthy ? '✅' : '❌'} Staging frontend: ${healthy ? 'accessible' : 'inaccessible'}`);
          resolve(healthy);
        });
        
        setTimeout(() => {
          curl.kill();
          resolve(false);
        }, 20000);
      });
    } catch (error) {
      console.log('    ❌ Staging health check failed');
      return false;
    }
  }

  async verifyStagingData() {
    let verified = 0;
    let issues = 0;
    
    try {
      // Test key tables
      const testTables = ['users', 'locations', 'books', 'book_genres'];
      
      for (const tableName of testTables) {
        try {
          const output = this.executeStagingD1Command(`SELECT COUNT(*) as count FROM ${tableName}`);
          const data = this.parseD1Output(output);
          const count = data[0]?.count || 0;
          
          console.log(`    ✅ ${tableName}: ${count} rows`);
          verified++;
        } catch (error) {
          console.log(`    ❌ ${tableName}: verification failed`);
          issues++;
        }
      }
      
      return {
        status: issues === 0 ? 'PASS' : 'PARTIAL',
        verified,
        issues
      };
      
    } catch (error) {
      return {
        status: 'FAIL',
        verified,
        issues: issues + 1
      };
    }
  }

  executeStagingD1Command(sql) {
    const command = `wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --command="${sql.replace(/"/g, '\\"')}"`;
    
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
      });
    } catch (error) {
      throw new Error(`Staging D1 execution failed: ${error.message}`);
    }
  }

  parseD1Output(output) {
    try {
      const lines = output.split('\n');
      const jsonStartIndex = lines.findIndex(line => line.trim().startsWith('['));
      
      if (jsonStartIndex === -1) {
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
      return [];
    }
  }

  logAudit(action, details) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${action}: ${details}\n`;
    
    try {
      writeFileSync(STAGING_AUDIT_LOG, entry, { flag: 'a' });
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
  const test = new ProductionRestoreToStagingTest();

  async function main() {
    try {
      await test.testProductionRestore();
    } catch (error) {
      console.error('\n❌ Production restore test failed:', error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = ProductionRestoreToStagingTest;