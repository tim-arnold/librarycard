#!/usr/bin/env node

/**
 * Production Database Migration Safety Wrapper
 * 
 * This script provides safe database migration with:
 * - Automatic backup before migration
 * - SQL validation and preview
 * - Multi-step confirmation process
 * - Rollback capability preparation
 * - Complete audit logging
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync, readdirSync } = require('fs');
const { createInterface } = require('readline');
const { join, basename } = require('path');

const AUDIT_LOG = './production-audit.log';
const BACKUP_DIR = './backups';
const MIGRATIONS_DIR = './migrations';

class ProductionMigrator {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async migrate() {
    try {
      console.log('🚨 PRODUCTION DATABASE MIGRATION SAFETY CHECK 🚨\n');
      
      const migrationFile = await this.selectMigration();
      await this.validateMigration(migrationFile);
      await this.createBackup();
      await this.previewMigration(migrationFile);
      await this.confirmMigration();
      await this.executeMigration(migrationFile);
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async selectMigration() {
    console.log('📁 Step 1: Migration File Selection');
    
    if (!existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    }
    
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      throw new Error('No migration files found');
    }
    
    console.log('Available migration files:');
    migrationFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    const selection = await this.askQuestion('\nEnter the number of the migration file to apply: ');
    const index = parseInt(selection) - 1;
    
    if (index < 0 || index >= migrationFiles.length) {
      throw new Error('Invalid selection');
    }
    
    const selectedFile = migrationFiles[index];
    console.log(`✅ Selected: ${selectedFile}\n`);
    
    return selectedFile;
  }

  async validateMigration(migrationFile) {
    console.log('🔍 Step 2: Migration Validation');
    
    const migrationPath = join(MIGRATIONS_DIR, migrationFile);
    
    if (!existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationContent = readFileSync(migrationPath, 'utf8');
    
    // Basic SQL validation
    if (migrationContent.trim().length === 0) {
      throw new Error('Migration file is empty');
    }
    
    // Check for dangerous operations
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM/i,
      /TRUNCATE/i,
      /UPDATE.*SET.*WHERE\s*$/i // UPDATE without WHERE clause
    ];
    
    const foundDangerous = dangerousPatterns.some(pattern => pattern.test(migrationContent));
    if (foundDangerous) {
      console.log('⚠️  WARNING: Migration contains potentially destructive operations');
      const proceed = await this.askQuestion('Type "ACKNOWLEDGE RISK" to continue: ');
      if (proceed !== 'ACKNOWLEDGE RISK') {
        throw new Error('Migration cancelled due to dangerous operations');
      }
    }
    
    console.log('✅ Migration file validated\n');
    return migrationContent;
  }

  async createBackup() {
    console.log('💾 Step 3: Creating Production Backup');
    
    try {
      console.log('Creating automated database backup...');
      
      // Import the backup system
      const { DatabaseBackup } = require('./auto-backup.js');
      const backupSystem = new DatabaseBackup();
      
      // Create backup with migration reason
      const result = await backupSystem.createProductionBackup('pre-migration');
      
      this.logAudit(`BACKUP_CREATED: ${result.backupId} | Tables: ${result.metadata.total_tables} | Rows: ${result.metadata.total_rows}`);
      
      console.log('✅ Automated backup completed successfully');
      console.log(`📁 Backup ID: ${result.backupId}`);
      console.log(`📊 Backed up ${result.metadata.total_tables} tables with ${result.metadata.total_rows} rows\n`);
      
      // Verify the backup
      console.log('🔍 Verifying backup integrity...');
      await backupSystem.verifyBackup(result.backupId);
      console.log('✅ Backup verification successful\n');
      
      return result.backupId;
      
    } catch (error) {
      console.error('❌ Automated backup failed:', error.message);
      console.log('\n⚠️  Fallback: Manual backup confirmation required');
      
      const confirm = await this.askQuestion('Confirm that production backup exists through other means (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        throw new Error('Cannot proceed without confirmed backup');
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logAudit(`BACKUP_MANUAL_CONFIRMED: ${timestamp} | Note: Automated backup failed, manual confirmation provided`);
      console.log('✅ Manual backup confirmation accepted\n');
      
      return `manual-${timestamp}`;
    }
  }

  async previewMigration(migrationFile) {
    console.log('👀 Step 4: Migration Preview');
    
    const migrationPath = join(MIGRATIONS_DIR, migrationFile);
    const migrationContent = readFileSync(migrationPath, 'utf8');
    
    console.log(`Migration file: ${migrationFile}`);
    console.log('─'.repeat(60));
    console.log(migrationContent);
    console.log('─'.repeat(60));
    
    // Show what database will be affected
    console.log('Target database: librarycard-db (PRODUCTION)');
    console.log('Environment: production');
    console.log('');
  }

  async confirmMigration() {
    console.log('🔐 Step 5: Migration Confirmation');
    console.log('You are about to run a DATABASE MIGRATION on PRODUCTION.');
    console.log('This operation may be IRREVERSIBLE and could cause DATA LOSS.');
    console.log('');
    
    // First confirmation
    const confirm1 = await this.askQuestion('Type "MIGRATE PRODUCTION" to confirm: ');
    if (confirm1 !== 'MIGRATE PRODUCTION') {
      throw new Error('Migration cancelled - confirmation failed');
    }
    
    // Second confirmation with timestamp
    const now = new Date().toISOString();
    console.log(`\nCurrent time: ${now}`);
    const confirm2 = await this.askQuestion('Type "EXECUTE NOW" to proceed: ');
    if (confirm2 !== 'EXECUTE NOW') {
      throw new Error('Migration cancelled - second confirmation failed');
    }
    
    // Final warning
    console.log('\n⚠️  FINAL WARNING: This will modify production data!');
    const confirm3 = await this.askQuestion('Type "I UNDERSTAND THE RISK" for final confirmation: ');
    if (confirm3 !== 'I UNDERSTAND THE RISK') {
      throw new Error('Migration cancelled - final confirmation failed');
    }
    
    console.log('✅ Migration confirmed\n');
  }

  async executeMigration(migrationFile) {
    console.log('🚨 PHASE 3 SECURITY: Local Production Database Access Blocked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔒 Local production database migrations have been disabled for security.');
    console.log('');
    console.log('✅ SAFE PRODUCTION MIGRATION OPTIONS:');
    console.log('');
    console.log('1. 🎯 GitHub Actions (Recommended):');
    console.log('   • Go to: https://github.com/tim-arnold/libarycard/actions');
    console.log('   • Select: "Deploy to Production (Enhanced Safety)"');
    console.log('   • Choose deployment type: "database-migration" or "full-deployment"');
    console.log(`   • Specify migration file: ${migrationFile}`);
    console.log('   • Fill reason and type "CONFIRM-PRODUCTION"');
    console.log('');
    console.log('2. 🛡️ Enhanced Safety Features:');
    console.log('   • Automatic pre-migration backup');
    console.log('   • Multi-person approval required');
    console.log('   • Staging verification checks');
    console.log('   • Automated rollback on failure');
    console.log('   • Complete audit trail');
    console.log('');
    console.log('3. 🔄 Rollback Protection:');
    console.log('   • Backup created before any changes');
    console.log('   • Emergency restore procedures available');
    console.log('   • Health checks after migration');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 This protection prevents:');
    console.log('   • Accidental production database damage');
    console.log('   • Unreviewed schema changes');
    console.log('   • Missing backup procedures');
    console.log('   • Lost migration audit trails');
    console.log('');
    
    // Log the blocked attempt
    const timestamp = new Date().toISOString();
    const user = process.env.USER || 'unknown';
    this.logAudit(`MIGRATION_BLOCKED: ${timestamp} | User: ${user} | File: ${migrationFile} | Reason: Phase 3 local access restriction`);
    
    console.log('🚫 Local migration blocked. Use GitHub Actions for production database changes.');
    process.exit(1);
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
  const migrator = new ProductionMigrator();
  migrator.migrate();
}