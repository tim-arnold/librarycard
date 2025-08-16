#!/usr/bin/env node

/**
 * Staging Database Backup System
 * 
 * Test version of backup system for staging environment
 * - Same functionality as production backup
 * - Uses staging-new environment and database
 * - Safe for testing backup/restore procedures
 */

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const BACKUP_DIR = './backups-staging';
const METADATA_FILE = './backups-staging/backup-metadata.json';

class StagingDatabaseBackup {
  constructor() {
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`✅ Created staging backup directory: ${BACKUP_DIR}`);
    }
  }

  async createStagingBackup(reason = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `staging-backup-${timestamp}`;
    
    console.log(`📦 Creating staging database backup: ${backupId}`);
    console.log(`Reason: ${reason}`);
    
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      reason: reason,
      tables: {},
      metadata: {
        created_by: process.env.USER || 'system',
        environment: 'staging-new',
        backup_method: 'automated'
      }
    };

    try {
      // Get list of all tables
      console.log('📋 Discovering database tables...');
      const tablesResult = this.executeD1Command(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' 
        ORDER BY name;
      `);
      
      const tables = this.parseD1Output(tablesResult);
      console.log(`Found ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);

      // Backup each table
      for (const table of tables) {
        console.log(`💾 Backing up table: ${table.name}`);
        
        // Get table schema
        const schemaResult = this.executeD1Command(`
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name='${table.name}';
        `);
        
        // Get table data
        const dataResult = this.executeD1Command(`SELECT * FROM ${table.name};`);
        const tableData = this.parseD1Output(dataResult);
        
        backupData.tables[table.name] = {
          schema: this.parseD1Output(schemaResult)[0]?.sql || '',
          data: tableData,
          row_count: tableData.length
        };
        
        console.log(`  ✅ ${tableData.length} rows backed up from ${table.name}`);
      }

      // Calculate backup statistics
      const totalRows = Object.values(backupData.tables).reduce((sum, table) => sum + table.row_count, 0);
      backupData.metadata.total_tables = tables.length;
      backupData.metadata.total_rows = totalRows;
      backupData.metadata.size_estimate = JSON.stringify(backupData).length;

      // Write backup file
      const backupFile = join(BACKUP_DIR, `${backupId}.json`);
      writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      // Update metadata index
      this.updateBackupMetadata(backupData);
      
      console.log(`✅ Staging backup completed successfully!`);
      console.log(`📁 File: ${backupFile}`);
      console.log(`📊 Stats: ${tables.length} tables, ${totalRows} rows`);
      console.log(`💾 Size: ${(backupData.metadata.size_estimate / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        success: true,
        backupId: backupId,
        file: backupFile,
        metadata: backupData.metadata
      };

    } catch (error) {
      console.error('❌ Staging backup failed:', error.message);
      throw error;
    }
  }

  executeD1Command(sql) {
    try {
      // Use staging-new configuration
      const command = `CLOUDFLARE_API_TOKEN=${process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW} npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --command="${sql.replace(/"/g, '\\"')}"`;
      const result = execSync(command, { encoding: 'utf8' });
      return result;
    } catch (error) {
      throw new Error(`Database command failed: ${error.message}`);
    }
  }

  parseD1Output(output) {
    try {
      // D1 returns results in various formats, try to parse as JSON first
      const lines = output.trim().split('\n');
      const dataLines = lines.filter(line => 
        line.startsWith('{') || line.startsWith('[') || line.includes('|')
      );
      
      if (dataLines.length === 0) return [];
      
      // Try to parse as JSON array
      try {
        return JSON.parse(dataLines.join('\n'));
      } catch {
        // Fallback: parse pipe-separated format
        return this.parsePipeFormat(dataLines);
      }
      
    } catch (error) {
      console.warn('⚠️  Could not parse D1 output, returning raw data');
      return [{ raw_output: output }];
    }
  }

  parsePipeFormat(lines) {
    if (lines.length < 2) return [];
    
    const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
    const rows = [];
    
    for (let i = 2; i < lines.length; i++) { // Skip header separator
      const values = lines[i].split('|').map(v => v.trim()).filter(v => v);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }
    
    return rows;
  }

  updateBackupMetadata(backupData) {
    let metadata = [];
    
    if (existsSync(METADATA_FILE)) {
      try {
        metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Could not read existing metadata, creating new file');
      }
    }

    metadata.unshift({
      id: backupData.id,
      timestamp: backupData.timestamp,
      reason: backupData.reason,
      tables: backupData.metadata.total_tables,
      rows: backupData.metadata.total_rows,
      size: backupData.metadata.size_estimate,
      created_by: backupData.metadata.created_by
    });

    // Keep only last 50 backups in metadata
    metadata = metadata.slice(0, 50);

    writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  }

  async listBackups() {
    if (!existsSync(METADATA_FILE)) {
      console.log('📭 No staging backups found');
      return [];
    }

    const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf8'));
    
    console.log('📋 Available Staging Backups:');
    console.log('─'.repeat(80));
    
    metadata.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString();
      const size = (backup.size / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${backup.id}`);
      console.log(`   Date: ${date} | Reason: ${backup.reason}`);
      console.log(`   Tables: ${backup.tables} | Rows: ${backup.rows} | Size: ${size}MB`);
      console.log('');
    });

    return metadata;
  }

  async verifyBackup(backupId) {
    const backupFile = join(BACKUP_DIR, `${backupId}.json`);
    
    if (!existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`🔍 Verifying staging backup: ${backupId}`);
    
    try {
      const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
      
      // Verify structure
      if (!backupData.tables || !backupData.metadata) {
        throw new Error('Invalid backup structure');
      }

      // Verify each table
      let totalRows = 0;
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
      console.log(`📊 Verified ${Object.keys(backupData.tables).length} tables with ${totalRows} total rows`);
      
      return true;

    } catch (error) {
      console.error(`❌ Staging backup verification failed: ${error.message}`);
      throw error;
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const backup = new StagingDatabaseBackup();

  switch (command) {
    case 'create':
      const reason = args[1] || 'manual';
      backup.createStagingBackup(reason)
        .then(result => {
          console.log(`\n🎉 Staging backup created successfully: ${result.backupId}`);
          process.exit(0);
        })
        .catch(error => {
          console.error(`\n💥 Staging backup failed: ${error.message}`);
          process.exit(1);
        });
      break;

    case 'list':
      backup.listBackups()
        .then(() => process.exit(0))
        .catch(error => {
          console.error(`Error listing staging backups: ${error.message}`);
          process.exit(1);
        });
      break;

    case 'verify':
      const backupId = args[1];
      if (!backupId) {
        console.error('Usage: node backup-staging.js verify <backup-id>');
        process.exit(1);
      }
      backup.verifyBackup(backupId)
        .then(() => process.exit(0))
        .catch(error => {
          console.error(`Verification failed: ${error.message}`);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage:');
      console.log('  node backup-staging.js create [reason]  - Create a new staging backup');
      console.log('  node backup-staging.js list             - List all staging backups');
      console.log('  node backup-staging.js verify <id>      - Verify a staging backup');
      process.exit(1);
  }
}

module.exports = { StagingDatabaseBackup };