#!/usr/bin/env node

/**
 * LibraryCard Automated Migration Runner
 * 
 * Automates database migration process with:
 * - State tracking (which migrations have been applied)
 * - Rollback functionality for failed migrations
 * - Batch processing for deployment safety
 * - Checksum validation to prevent corrupted migrations
 * 
 * Usage:
 *   npm run migrate                    # Apply pending migrations
 *   npm run migrate:status             # Show migration status
 *   npm run migrate:rollback           # Rollback last batch
 *   npm run migrate:rollback [batch]   # Rollback specific batch
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class MigrationRunner {
  constructor(options = {}) {
    this.migrationsDir = options.migrationsDir || path.join(__dirname, '..', 'migrations');
    this.environment = options.environment || process.env.NODE_ENV || 'local';
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    
    // Environment-specific database configurations
    this.dbConfigs = {
      local: {
        database: 'librarycard-db-local',
        remote: false
      },
      'staging-new': {
        database: 'librarycard-db-staging-new',
        remote: true,
        config: 'wrangler.staging-new.toml',
        env: 'staging'
      },
      production: {
        database: 'librarycard-db-production',
        remote: true,
        env: 'production'
      }
    };
    
    this.dbConfig = this.dbConfigs[this.environment];
    if (!this.dbConfig) {
      throw new Error(`Unknown environment: ${this.environment}`);
    }
  }

  /**
   * Generate unique batch ID for this migration run
   */
  generateBatchId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `batch-${timestamp}-${random}`;
  }

  /**
   * Calculate MD5 checksum of file content
   */
  calculateChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Execute SQL command using wrangler d1
   */
  async executeSQL(sql, description = 'SQL execution') {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${description}`);
      
      if (this.dryRun) {
        this.log('DRY RUN - SQL would be executed:');
        this.log(sql);
        resolve({ success: true, output: 'DRY RUN' });
        return;
      }

      const args = ['d1', 'execute', this.dbConfig.database, '--command', sql];
      
      if (this.dbConfig.remote) {
        args.push('--remote');
      }
      
      if (this.dbConfig.config) {
        args.push('--config', this.dbConfig.config);
      }
      
      if (this.dbConfig.env) {
        args.push('--env', this.dbConfig.env);
      }

      const startTime = Date.now();
      const child = spawn('npx', ['wrangler', ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code === 0) {
          this.log(`✅ ${description} completed in ${executionTime}ms`);
          resolve({ 
            success: true, 
            output: stdout,
            executionTime
          });
        } else {
          const command = `wrangler ${args.join(' ')}`;
          this.log(`❌ ${description} failed with code ${code}`);
          this.log(`❌ Command: ${command}`);
          this.log(`❌ STDOUT: ${stdout}`);
          this.log(`❌ STDERR: ${stderr}`);
          reject(new Error(`${description} failed with code ${code}: ${stderr || stdout || 'No output'}`));
        }
      });
    });
  }

  /**
   * Execute SQL file using wrangler d1
   */
  async executeSQLFile(filepath, description = 'SQL file execution') {
    return new Promise((resolve, reject) => {
      this.log(`Executing file: ${description}`);
      
      if (this.dryRun) {
        this.log('DRY RUN - File would be executed:', filepath);
        resolve({ success: true, output: 'DRY RUN', executionTime: 0 });
        return;
      }

      const args = ['d1', 'execute', this.dbConfig.database, '--file', filepath];
      
      if (this.dbConfig.remote) {
        args.push('--remote');
      }
      
      if (this.dbConfig.config) {
        args.push('--config', this.dbConfig.config);
      }
      
      if (this.dbConfig.env) {
        args.push('--env', this.dbConfig.env);
      }

      const startTime = Date.now();
      const child = spawn('npx', ['wrangler', ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code === 0) {
          this.log(`✅ ${description} completed in ${executionTime}ms`);
          resolve({ 
            success: true, 
            output: stdout,
            executionTime
          });
        } else {
          const command = `wrangler ${args.join(' ')}`;
          this.log(`❌ ${description} failed with code ${code}`);
          this.log(`❌ Command: ${command}`);
          this.log(`❌ STDOUT: ${stdout}`);
          this.log(`❌ STDERR: ${stderr}`);
          reject(new Error(`${description} failed with code ${code}: ${stderr || stdout || 'No output'}`));
        }
      });
    });
  }

  /**
   * Get list of applied migrations from database
   */
  async getAppliedMigrations() {
    try {
      const result = await this.executeSQL(
        'SELECT filename, applied_at, checksum, batch_id FROM migrations_applied ORDER BY applied_at ASC',
        'Fetching applied migrations'
      );
      
      if (this.dryRun) {
        return []; // In dry run, assume no migrations applied
      }
      
      // Parse the output to extract migration data
      // This is a simplified parser - may need adjustment based on wrangler output format
      const lines = result.output.split('\n').filter(line => line.trim());
      const migrations = [];
      
      for (const line of lines) {
        if (line.includes('|') && !line.includes('filename')) {
          const parts = line.split('|').map(part => part.trim());
          if (parts.length >= 4) {
            migrations.push({
              filename: parts[1],
              applied_at: parts[2],
              checksum: parts[3],
              batch_id: parts[4]
            });
          }
        }
      }
      
      return migrations;
    } catch (error) {
      // Bootstrap detection: if migrations table doesn't exist yet, return empty array
      if (error.message.includes('no such table: migrations_applied') ||
          error.message.includes('no such table') ||
          error.message.includes('table or view does not exist') ||
          error.message.includes('migrations_applied')) {
        this.log(`🆕 First-time setup detected: migration tracking tables don't exist yet`);
        this.log(`📋 Bootstrap mode: Will apply all existing migrations to establish baseline`);
        return [];
      }
      
      this.log(`❌ Error fetching applied migrations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get list of all migration files from filesystem
   */
  getAllMigrationFiles() {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Alphabetical sort ensures chronological order for dated files

    return files.map(filename => {
      const filepath = path.join(this.migrationsDir, filename);
      const content = fs.readFileSync(filepath, 'utf8');
      const checksum = this.calculateChecksum(content);
      
      return {
        filename,
        filepath,
        content,
        checksum
      };
    });
  }

  /**
   * Get pending migrations that haven't been applied yet
   */
  async getPendingMigrations() {
    const allMigrations = this.getAllMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedFilenames = new Set(appliedMigrations.map(m => m.filename));

    const pending = allMigrations.filter(migration => {
      if (!appliedFilenames.has(migration.filename)) {
        return true;
      }
      
      // Check if checksum matches (detect modified migrations)
      const applied = appliedMigrations.find(m => m.filename === migration.filename);
      if (applied && applied.checksum !== migration.checksum) {
        this.log(`⚠️  WARNING: Migration ${migration.filename} has been modified since it was applied`);
        this.log(`   Applied checksum: ${applied.checksum}`);
        this.log(`   Current checksum: ${migration.checksum}`);
        return false; // Don't re-apply modified migrations
      }
      
      return false;
    });

    return pending;
  }

  /**
   * Record migration as applied in tracking table
   */
  async recordMigrationApplied(migration, batchId, executionTime) {
    const sql = `
      INSERT INTO migrations_applied (filename, checksum, execution_time_ms, batch_id)
      VALUES ('${migration.filename}', '${migration.checksum}', ${executionTime}, '${batchId}')
    `;
    
    await this.executeSQL(sql, `Recording migration ${migration.filename} as applied`);
  }

  /**
   * Start a new migration batch
   */
  async startMigrationBatch(batchId, totalMigrations) {
    const sql = `
      INSERT INTO migration_batches (id, total_migrations, environment)
      VALUES ('${batchId}', ${totalMigrations}, '${this.environment}')
    `;
    
    await this.executeSQL(sql, `Starting migration batch ${batchId}`);
  }

  /**
   * Update migration batch status
   */
  async updateMigrationBatch(batchId, status, successfulMigrations = 0, failedMigration = null, errorMessage = null) {
    let sql = `
      UPDATE migration_batches 
      SET status = '${status}', 
          successful_migrations = ${successfulMigrations}
    `;
    
    if (status === 'completed') {
      sql += `, completed_at = CURRENT_TIMESTAMP`;
    }
    
    if (failedMigration) {
      sql += `, failed_migration = '${failedMigration}'`;
    }
    
    if (errorMessage) {
      const escapedError = errorMessage.replace(/'/g, "''"); // Escape single quotes
      sql += `, error_message = '${escapedError}'`;
    }
    
    sql += ` WHERE id = '${batchId}'`;
    
    await this.executeSQL(sql, `Updating batch ${batchId} status to ${status}`);
  }

  /**
   * Apply all pending migrations
   */
  async migrate() {
    this.log(`🚀 Starting migration process for environment: ${this.environment}`);
    
    if (this.dryRun) {
      this.log('🔍 DRY RUN MODE - No changes will be made');
    }

    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      this.log('✅ No pending migrations found - database is up to date');
      return { success: true, migrationsApplied: 0 };
    }

    this.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => {
      this.log(`   - ${migration.filename}`);
    });

    // For first-time bootstrap, check if migrations have already been manually applied
    const appliedMigrations = await this.getAppliedMigrations();
    if (appliedMigrations.length === 0 && this.environment !== 'local') {
      this.log('\n🔍 First-time bootstrap detected on non-local environment');
      this.log('   Checking for manually applied migrations...');
      
      const safeToBootstrap = await this.checkBootstrapSafety(pendingMigrations);
      if (!safeToBootstrap) {
        this.log('⚠️  Some migrations appear to have been manually applied');
        this.log('   Use dry-run mode to review, or manually mark applied migrations in tracking tables');
        
        // In dry-run mode, return success so workflows can parse the output
        if (this.dryRun) {
          this.log('🔍 DRY RUN: Would skip applying migrations due to bootstrap safety check');
          return { success: true, migrationsApplied: 0, skipped: true, reason: 'Bootstrap safety check failed' };
        }
        
        return { success: false, error: 'Bootstrap safety check failed' };
      }
      
      // Bootstrap: Create tracking tables first
      this.log('🔨 Creating migration tracking tables for first-time setup...');
      await this.createTrackingTables();
    }

    const batchId = this.generateBatchId();
    let successfulMigrations = 0;

    try {
      await this.startMigrationBatch(batchId, pendingMigrations.length);

      for (const migration of pendingMigrations) {
        this.log(`\n🔧 Applying migration: ${migration.filename}`);
        
        try {
          const result = await this.executeSQLFile(migration.filepath, migration.filename);
          await this.recordMigrationApplied(migration, batchId, result.executionTime);
          successfulMigrations++;
          
          this.log(`✅ Successfully applied: ${migration.filename}`);
        } catch (error) {
          this.log(`❌ Failed to apply migration: ${migration.filename}`);
          this.log(`Error: ${error.message}`);
          
          await this.updateMigrationBatch(batchId, 'failed', successfulMigrations, migration.filename, error.message);
          
          throw new Error(`Migration failed: ${migration.filename} - ${error.message}`);
        }
      }

      await this.updateMigrationBatch(batchId, 'completed', successfulMigrations);
      
      this.log(`\n🎉 Migration batch completed successfully!`);
      this.log(`   Batch ID: ${batchId}`);
      this.log(`   Migrations applied: ${successfulMigrations}/${pendingMigrations.length}`);
      
      return { 
        success: true, 
        migrationsApplied: successfulMigrations,
        batchId
      };

    } catch (error) {
      this.log(`\n💥 Migration batch failed!`);
      this.log(`   Batch ID: ${batchId}`);
      this.log(`   Successful migrations: ${successfulMigrations}/${pendingMigrations.length}`);
      this.log(`   Error: ${error.message}`);
      
      return { 
        success: false, 
        error: error.message,
        migrationsApplied: successfulMigrations,
        batchId
      };
    }
  }

  /**
   * Show migration status
   */
  async status() {
    this.log(`📊 Migration Status for environment: ${this.environment}\n`);

    try {
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = this.getAllMigrationFiles();
      const pendingMigrations = await this.getPendingMigrations();

      this.log(`Total migration files: ${allMigrations.length}`);
      this.log(`Applied migrations: ${appliedMigrations.length}`);
      this.log(`Pending migrations: ${pendingMigrations.length}\n`);

      if (appliedMigrations.length > 0) {
        this.log('📋 Applied migrations:');
        appliedMigrations.forEach(migration => {
          this.log(`   ✅ ${migration.filename} (${migration.applied_at})`);
        });
      }

      if (pendingMigrations.length > 0) {
        this.log('\n📋 Pending migrations:');
        pendingMigrations.forEach(migration => {
          this.log(`   ⏳ ${migration.filename}`);
        });
      }

      return {
        total: allMigrations.length,
        applied: appliedMigrations.length,
        pending: pendingMigrations.length
      };

    } catch (error) {
      this.log(`❌ Error getting migration status: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Rollback migrations from a specific batch
   */
  async rollback(batchId = null) {
    try {
      await this.initializeMigrationSystem();

      // Get the batch to rollback
      const targetBatch = await this.getTargetBatch(batchId);
      if (!targetBatch) {
        this.log(`❌ No batch found to rollback`);
        return { success: false, error: 'No batch found' };
      }

      this.log(`🔄 Rolling back batch ${targetBatch.id} (${targetBatch.migrations_count} migrations)\n`);

      // Get migrations from this batch in reverse order
      const batchMigrations = await this.getBatchMigrations(targetBatch.id);
      
      if (batchMigrations.length === 0) {
        this.log(`❌ No migrations found in batch ${targetBatch.id}`);
        return { success: false, error: 'No migrations in batch' };
      }

      // Check if batch has rollback files
      const rollbackableCount = batchMigrations.filter(m => this.hasRollbackFile(m.filename)).length;
      
      if (rollbackableCount === 0) {
        this.log(`⚠️  WARNING: No rollback files found for batch ${targetBatch.id}`);
        this.log(`Cannot automatically rollback. Manual intervention required.`);
        return { success: false, error: 'No rollback files available' };
      }

      this.log(`Found rollback files for ${rollbackableCount}/${batchMigrations.length} migrations`);

      // Create rollback batch record
      const rollbackBatchId = `rollback_${targetBatch.id}_${Date.now()}`;
      await this.startRollbackBatch(rollbackBatchId, targetBatch.id, rollbackableCount);

      let rolledBackCount = 0;
      let errors = [];

      // Execute rollbacks in reverse order
      for (const migration of batchMigrations.reverse()) {
        if (!this.hasRollbackFile(migration.filename)) {
          this.log(`⚠️  Skipping ${migration.filename} (no rollback file)`);
          continue;
        }

        try {
          this.log(`🔄 Rolling back: ${migration.filename}`);
          
          const rollbackFile = this.getRollbackFilename(migration.filename);
          const rollbackSQL = fs.readFileSync(path.join(this.migrationsDir, rollbackFile), 'utf8');
          
          await this.executeSQL(rollbackSQL);
          await this.recordMigrationRolledBack(migration.filename, rollbackBatchId);
          
          rolledBackCount++;
          this.log(`   ✅ Rolled back successfully`);

        } catch (error) {
          this.log(`   ❌ Rollback failed: ${error.message}`);
          errors.push({ migration: migration.filename, error: error.message });
          break; // Stop on first error to prevent partial rollbacks
        }
      }

      // Update rollback batch status
      const success = errors.length === 0;
      await this.updateRollbackBatch(rollbackBatchId, success ? 'completed' : 'failed', rolledBackCount, errors[0]?.error);

      if (success) {
        this.log(`\n🎉 Rollback completed successfully!`);
        this.log(`Rolled back ${rolledBackCount} migrations from batch ${targetBatch.id}`);
        return { success: true, rolledBackCount, batchId: rollbackBatchId };
      } else {
        this.log(`\n💥 Rollback failed after ${rolledBackCount} migrations`);
        this.log(`Error: ${errors[0]?.error}`);
        return { success: false, error: errors[0]?.error, rolledBackCount, batchId: rollbackBatchId };
      }

    } catch (error) {
      this.log(`💥 Rollback error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get target batch for rollback
   */
  async getTargetBatch(batchId) {
    if (batchId) {
      // Rollback specific batch
      const result = await this.executeSQL(
        `SELECT * FROM migration_batches WHERE id = ? LIMIT 1`,
        [batchId]
      );
      return result.results[0] || null;
    } else {
      // Rollback last successful batch
      const result = await this.executeSQL(`
        SELECT * FROM migration_batches 
        WHERE status = 'completed' 
        ORDER BY started_at DESC 
        LIMIT 1
      `);
      return result.results[0] || null;
    }
  }

  /**
   * Get migrations from a specific batch
   */
  async getBatchMigrations(batchId) {
    const result = await this.executeSQL(`
      SELECT filename FROM migrations_applied 
      WHERE batch_id = ? 
      ORDER BY applied_at DESC
    `, [batchId]);
    return result.results;
  }

  /**
   * Check if rollback file exists for migration
   */
  hasRollbackFile(migrationFilename) {
    const rollbackFile = this.getRollbackFilename(migrationFilename);
    return fs.existsSync(path.join(this.migrationsDir, rollbackFile));
  }

  /**
   * Get rollback filename for migration
   */
  getRollbackFilename(migrationFilename) {
    const name = migrationFilename.replace('.sql', '');
    return `${name}.rollback.sql`;
  }

  /**
   * Start rollback batch tracking
   */
  async startRollbackBatch(rollbackBatchId, originalBatchId, migrationCount) {
    await this.executeSQL(`
      INSERT INTO migration_batches (id, started_at, status, migrations_count, rollback_target)
      VALUES (?, datetime('now'), 'running', ?, ?)
    `, [rollbackBatchId, migrationCount, originalBatchId]);
  }

  /**
   * Record migration rollback
   */
  async recordMigrationRolledBack(filename, rollbackBatchId) {
    // Remove from applied migrations
    await this.executeSQL(`
      DELETE FROM migrations_applied WHERE filename = ?
    `, [filename]);

    // Record in rollback log (optional tracking table)
    try {
      await this.executeSQL(`
        INSERT OR IGNORE INTO migration_rollbacks (filename, rolled_back_at, rollback_batch_id)
        VALUES (?, datetime('now'), ?)
      `, [filename, rollbackBatchId]);
    } catch (error) {
      // Table might not exist, that's ok
    }
  }

  /**
   * Update rollback batch status
   */
  async updateRollbackBatch(rollbackBatchId, status, successfulRollbacks, errorMessage = null) {
    await this.executeSQL(`
      UPDATE migration_batches 
      SET status = ?, completed_at = datetime('now'), successful_migrations = ?, error_message = ?
      WHERE id = ?
    `, [status, successfulRollbacks, errorMessage, rollbackBatchId]);
  }

  /**
   * Check if it's safe to bootstrap by detecting manually applied migrations
   */
  async checkBootstrapSafety(pendingMigrations) {
    this.log('   🔍 Checking database schema for existing tables...');
    
    try {
      // Check for tables that should be created by pending migrations
      // IMPORTANT: We need to actually query the database even in dry-run mode
      // to make the correct bootstrap decision
      const wasInDryRun = this.dryRun;
      this.dryRun = false; // Temporarily disable dry-run for this safety check
      
      const result = await this.executeSQL(`
        SELECT name FROM sqlite_master WHERE type='table'
      `, 'Checking existing tables');
      
      this.dryRun = wasInDryRun; // Restore original dry-run setting
      
      const existingTables = new Set();
      
      try {
        // Parse JSON output from wrangler D1
        const lines = result.output.split('\n');
        const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
        
        if (jsonStart !== -1) {
          const jsonOutput = lines.slice(jsonStart).join('\n');
          const parsed = JSON.parse(jsonOutput);
          
          if (parsed && parsed[0] && parsed[0].results) {
            parsed[0].results.forEach(row => {
              if (row.name) {
                existingTables.add(row.name);
              }
            });
          }
        } else {
          // Fallback to pipe-delimited parsing
          const lines = result.output.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.includes('|') && !line.includes('name')) {
              const tableName = line.split('|')[1]?.trim();
              if (tableName) {
                existingTables.add(tableName);
              }
            }
          }
        }
      } catch (error) {
        this.log(`   ⚠️  Error parsing table output: ${error.message}`);
        // Try fallback parsing
        const lines = result.output.split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line.includes('|') && !line.includes('name')) {
            const tableName = line.split('|')[1]?.trim();
            if (tableName) {
              existingTables.add(tableName);
            }
          }
        }
      }
      
      this.log(`   📊 Found ${existingTables.size} existing tables`);
      if (existingTables.size > 0) {
        this.log(`   📋 Tables: ${Array.from(existingTables).slice(0, 10).join(', ')}${existingTables.size > 10 ? '...' : ''}`);
      }
      
      // Check if critical tables that should be created by migrations already exist
      const criticalTables = ['books', 'users', 'locations', 'curated_genres'];
      const existingCriticalTables = criticalTables.filter(table => existingTables.has(table));
      
      if (existingCriticalTables.length > 0) {
        this.log(`   ⚠️  Critical tables already exist: ${existingCriticalTables.join(', ')}`);
        this.log(`   🎯 This suggests migrations have been manually applied`);
        
        // For now, return false to be safe
        // In the future, we could add smarter detection or user confirmation
        return false;
      }
      
      this.log('   ✅ Bootstrap appears safe - no conflicting tables found');
      return true;
      
    } catch (error) {
      this.log(`   ❌ Error checking bootstrap safety: ${error.message}`);
      // If we can't check, err on the side of caution
      return false;
    }
  }

  /**
   * Create migration tracking tables for first-time setup
   */
  async createTrackingTables() {
    this.log('🔨 Creating migration tracking tables...');
    
    // Create migrations_applied table
    const migrationsAppliedSQL = `
      CREATE TABLE IF NOT EXISTS migrations_applied (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL DEFAULT 0,
        batch_id TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_applied_batch_id ON migrations_applied(batch_id);
      CREATE INDEX IF NOT EXISTS idx_migrations_applied_applied_at ON migrations_applied(applied_at);
    `;
    
    await this.executeSQL(migrationsAppliedSQL, 'Creating migrations_applied table');
    
    // Create migration_batches table
    const migrationBatchesSQL = `
      CREATE TABLE IF NOT EXISTS migration_batches (
        id TEXT PRIMARY KEY,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT NOT NULL DEFAULT 'running',
        total_migrations INTEGER NOT NULL DEFAULT 0,
        successful_migrations INTEGER NOT NULL DEFAULT 0,
        failed_migration TEXT,
        error_message TEXT,
        environment TEXT NOT NULL,
        rollback_target TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_migration_batches_status ON migration_batches(status);
      CREATE INDEX IF NOT EXISTS idx_migration_batches_started_at ON migration_batches(started_at);
    `;
    
    await this.executeSQL(migrationBatchesSQL, 'Creating migration_batches table');
    
    // Create migration_rollbacks table (optional)
    const migrationRollbacksSQL = `
      CREATE TABLE IF NOT EXISTS migration_rollbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        rolled_back_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        rollback_batch_id TEXT NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_rollback_batch_id ON migration_rollbacks(rollback_batch_id);
    `;
    
    await this.executeSQL(migrationRollbacksSQL, 'Creating migration_rollbacks table');
    
    this.log('✅ Migration tracking tables created successfully');
  }

  /**
   * Logging helper
   */
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';
  
  const options = {
    environment: process.env.MIGRATION_ENV || process.env.NODE_ENV || 'local',
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  };

  // Block staging/production operations unless in CI environment
  if ((options.environment === 'staging-new' || options.environment === 'production') && !process.env.CI) {
    console.log(`🚫 BLOCKED: Direct ${options.environment} operations are not permitted locally`);
    console.log(`\n🔒 SECURITY POLICY: All staging and production operations must use GitHub Actions\n`);
    
    if (command === 'rollback') {
      console.log(`✅ Use GitHub Actions workflow: "Automated Database Rollbacks"`);
      console.log(`   1. Go to: https://github.com/tim-arnold/libarycard/actions/workflows/automated-rollbacks.yml`);
      console.log(`   2. Click "Run workflow"`);
      console.log(`   3. Select environment: ${options.environment === 'staging-new' ? 'staging' : 'production'}`);
      console.log(`   4. Type "CONFIRM" in confirmation field`);
      console.log(`   5. Enter reason for rollback (required)`);
      console.log(`   6. Optional: Specify batch ID`);
    } else {
      console.log(`✅ Use GitHub Actions workflow: "Automated Database Migrations"`);
      console.log(`   1. Go to: https://github.com/tim-arnold/libarycard/actions/workflows/automated-migrations.yml`);
      console.log(`   2. Click "Run workflow"`);
      console.log(`   3. Select environment: ${options.environment === 'staging-new' ? 'staging' : 'production'}`);
      console.log(`   4. Optional: Enable dry-run for preview`);
      console.log(`   5. Optional: Add reason for audit`);
    }
    
    console.log(`\n📋 This policy prevents accidental staging/production changes from local machines`);
    process.exit(1);
  }

  const runner = new MigrationRunner(options);

  try {
    switch (command) {
      case 'migrate':
        const result = await runner.migrate();
        process.exit(result.success ? 0 : 1);
        break;
        
      case 'status':
        await runner.status();
        process.exit(0);
        break;
        
      case 'rollback':
        const batchId = args[1] || null; // Optional batch ID parameter
        const rollbackResult = await runner.rollback(batchId);
        if (!rollbackResult.success) {
          process.exit(1);
        }
        break;
        
      default:
        console.log(`Usage: node migrate.js [command] [options]
        
Commands:
  migrate    Apply pending migrations (default)
  status     Show migration status
  rollback   Rollback migrations (last batch if no batch ID specified)
  
Options:
  --dry-run    Show what would be done without making changes
  --verbose    Show detailed output
  
Environment Variables:
  MIGRATION_ENV    Target environment (local, staging-new, production)
`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`💥 Migration runner error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };