#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, statSync, copyFileSync } = require('fs');
const { join } = require('path');

require('dotenv').config({ path: '.env.local' });

async function syncProductionToStaging() {
  console.log('🔄 COMPLETE PRODUCTION TO STAGING SYNC 🔄\n');

  const fs = require('fs');
  const path = require('path');

  let backupFile = null;

  const possiblePaths = [
    './cloudflare/',
    './',
    './sync-workspace/cloudflare/',
    './sync-workspace/'
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const prodBackup = files.find(file => file.includes('prod-backup-') && file.endsWith('.json'));
      if (prodBackup) {
        backupFile = path.join(dir, prodBackup);
        break;
      }
    }
  }

  if (!backupFile) {
    console.log('🔍 Available files for debugging:');
    possiblePaths.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`${dir}:`, fs.readdirSync(dir));
      }
    });
    throw new Error('No production backup file found in any expected location');
  }

  if (!existsSync(backupFile)) {
    console.error('❌ Production backup file not found:', backupFile);
    process.exit(1);
  }

  console.log('📦 Found production backup:', backupFile);

  const backupData = JSON.parse(readFileSync(backupFile, 'utf8'));
  console.log(`📅 Backup from: ${backupData.timestamp}`);
  console.log(`📊 Total tables: ${Object.keys(backupData.tables).length}`);

  let totalRows = 0;
  for (const [tableName, tableData] of Object.entries(backupData.tables)) {
    if (!tableData.error && tableData.row_count) {
      totalRows += tableData.row_count;
    }
  }
  console.log(`📊 Total rows to sync: ${totalRows}\n`);

  try {
    execSync('node scripts/backup-staging.js create "pre-complete-prod-sync"', {
      stdio: 'inherit',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
    });
    console.log('✅ Staging backup created\n');
  } catch (error) {
    console.error('❌ Failed to create staging backup:', error.message);
    process.exit(1);
  }

  const tableOrder = [
    'users', 'locations', 'curated_genres',
    'shelves', 'books',
    'book_genres', 'book_ratings', 'book_removal_requests', 'book_checkout_history',
    'location_user_permissions', 'location_admin_capabilities', 'location_members', 'location_invitations',
    'signup_approval_requests', 'webauthn_credentials', 'webauthn_challenges',
    'notification_queue', 'notification_log', 'notification_read_status', 'notification_preferences',
    'in_app_notifications',
    'jwt_sessions', 'auth_audit_log', 'user_recovery_codes', 'user_global_permissions',
    'genre_suggestions', 'genre_requests',
    'migration_batches', 'migrations_applied', 'migration_rollbacks'
  ];

  const skipTables = ['sqlite_sequence', 'sqlite_master'];

  console.log('🗑️💥 DROPPING AND RECREATING STAGING DATABASE...');

  console.log('    📋 Getting staging database structure...');
  try {
    executeStagingD1Command("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name;");
    console.log('    ✅ Database schema captured');
  } catch (error) {
    console.log('    ⚠️  Could not capture schema, will rely on built-in schema');
  }

  console.log('    💥 Dropping all existing tables...');
  const tablesNotDropped = [];
  try {
    const tablesResult = executeStagingD1Command("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");

    const lines = tablesResult.split('\n');
    const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
    if (jsonStart !== -1) {
      const jsonText = lines.slice(jsonStart).join('\n');
      const data = JSON.parse(jsonText);

      if (Array.isArray(data) && data[0] && data[0].results) {
        const tableNames = data[0].results.map(row => row.name);
        console.log(`    🎯 Found ${tableNames.length} tables to drop`);

        for (const tableName of tableNames) {
          try {
            executeStagingD1Command(`DROP TABLE IF EXISTS ${tableName};`);
            console.log(`    💥 Dropped ${tableName}`);
          } catch (error) {
            console.log(`    ⚠️  Could not drop ${tableName}: ${error.message}`);
            tablesNotDropped.push(tableName);
          }
        }
      }
    }

    if (tablesNotDropped.length > 0) {
      console.log(`    ⚠️  ${tablesNotDropped.length} tables could not be dropped`);
      console.log(`    🧹 Will clear data from these tables instead: ${tablesNotDropped.join(', ')}`);
    } else {
      console.log('    ✅ All tables dropped successfully');
    }
  } catch (error) {
    console.log(`    ⚠️  Table drop had issues: ${error.message}`);
  }

  if (tablesNotDropped.length > 0) {
    console.log('    🧹 Clearing data from tables that could not be dropped...');
    for (const tableName of tablesNotDropped) {
      try {
        executeStagingD1Command(`DELETE FROM ${tableName};`);
        console.log(`    🧹 Cleared data from ${tableName}`);
      } catch (error) {
        console.log(`    ⚠️  Could not clear ${tableName}: ${error.message}`);
      }
    }
  }

  console.log('    🏗️  Creating tables individually from schema.sql...');
  try {
    const schemaPath = join('.', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const createStatements = schemaContent.match(/CREATE TABLE[^;]+;/gi) || [];
      console.log(`    🎯 Found ${createStatements.length} CREATE TABLE statements`);

      let createdTables = 0;
      let failedTables = 0;

      for (const createStatement of createStatements) {
        const tableName = createStatement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
        if (tableName) {
          try {
            const tempFile = `./create_${tableName}_${Date.now()}.sql`;
            fs.writeFileSync(tempFile, createStatement);

            execSync(`npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --file="${tempFile}"`, {
              encoding: 'utf8',
              env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
            });

            fs.unlinkSync(tempFile);
            console.log(`    ✅ Created table: ${tableName}`);
            createdTables++;
          } catch (error) {
            console.log(`    ❌ FAILED to create table: ${tableName} - ${error.message}`);
            failedTables++;
          }
        }
      }

      console.log(`    📊 Table creation summary: ${createdTables} created, ${failedTables} failed`);
    } else {
      console.log('    ⚠️  schema.sql not found, tables will be created as data is synced');
    }
  } catch (error) {
    console.log(`    ❌ Schema recreation had critical issues: ${error.message}`);
  }

  console.log('\n🧹 Clearing users table...');
  const usersClearMethods = [
    'DELETE FROM users;',
    'DELETE FROM users WHERE 1=1;',
    'PRAGMA foreign_keys = OFF; DELETE FROM users; PRAGMA foreign_keys = ON;'
  ];

  let usersCleared = false;
  for (const method of usersClearMethods) {
    try {
      executeStagingD1Command(method);
      console.log(`  ✅ Cleared users table`);
      usersCleared = true;
      break;
    } catch (error) {
      console.log(`  ⚠️  Method failed: ${method} - ${error.message}`);
    }
  }

  if (!usersCleared) {
    console.log('  🚨 Could not clear users table - production users may not sync properly');
  }

  console.log('  🗑️  Removing system user...');
  try {
    executeStagingD1Command("DELETE FROM users WHERE id = 'system' OR email = 'system@library.local';");
    console.log('  ✅ System user removed');
  } catch (error) {
    console.log(`  ⚠️  Could not remove system user: ${error.message}`);
  }

  console.log('\n📥 Syncing ALL production data to staging...');

  console.log('🔧 Disabling foreign key constraints for bulk sync...');
  try {
    executeStagingD1Command('PRAGMA foreign_keys = OFF;');
    console.log('✅ Foreign key constraints disabled');
  } catch (error) {
    console.log('⚠️  Could not disable foreign key constraints:', error.message);
  }

  const syncOrder = [...tableOrder];

  console.log('📋 Sync order (parents first):');
  syncOrder.forEach((table, idx) => {
    console.log(`  ${idx + 1}. ${table}`);
  });

  const criticalTables = ['users', 'locations', 'books', 'curated_genres'];

  console.log('\n🔍 Backup data analysis:');
  const allBackupTables = Object.keys(backupData.tables || {});
  allBackupTables.forEach((tableName) => {
    const tableData = backupData.tables[tableName];
    const hasData = tableData && !tableData.error && tableData.data && tableData.data.length > 0;
    const rowCount = hasData ? tableData.data.length : 0;
    const status = tableData?.error ? `ERROR: ${tableData.error}` : (hasData ? 'OK' : 'EMPTY');
    console.log(`  ${tableName}: ${rowCount} rows (${status})`);
  });

  const criticalMissingTables = [];
  console.log('\n🚨 Critical tables check:');
  criticalTables.forEach(tableName => {
    const tableData = backupData.tables[tableName];
    if (tableData && !tableData.error && tableData.data && tableData.data.length > 0) {
      console.log(`✅ ${tableName}: ${tableData.data.length} rows`);
    } else {
      console.log(`❌ ${tableName}: missing or empty`);
      criticalMissingTables.push(tableName);
    }
  });

  if (criticalMissingTables.length > 0) {
    console.log(`\n🚨 ${criticalMissingTables.length} critical tables missing: ${criticalMissingTables.join(', ')}`);
  }

  let syncedTables = 0;
  let syncedRows = 0;

  for (const tableName of syncOrder) {
    const tableData = backupData.tables[tableName];

    if (tableName === 'curated_genres' && tableData && tableData.data) {
      let fixedCount = 0;
      tableData.data.forEach(row => {
        if (row.created_by === 'system') {
          row.created_by = 'tim.arnold@gmail.com';
          fixedCount++;
        }
      });
      if (fixedCount > 0) {
        console.log(`🔧 Fixed ${fixedCount} curated_genres system user references`);
      }
    }

    if (skipTables.includes(tableName)) {
      continue;
    }

    if (!tableData || tableData.error || !tableData.data || tableData.data.length === 0) {
      continue;
    }

    console.log(`    📥 Syncing ${tableName} (${tableData.data.length} rows)...`);

    try {
      let tableReady = false;
      try {
        executeStagingD1Command(`SELECT 1 FROM ${tableName} LIMIT 1;`);
        tableReady = true;
      } catch (tableCheckError) {
        console.log(`    🏗️  Table ${tableName} missing, attempting to create from schema...`);
        tableReady = tryCreateTable(tableName);
        if (!tableReady) continue;
      }

      if (!tableReady) continue;

      const batchSize = 5;
      const totalBatches = Math.ceil(tableData.data.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startRow = batchIndex * batchSize;
        const endRow = Math.min(startRow + batchSize, tableData.data.length);
        const batch = tableData.data.slice(startRow, endRow);

        const columns = Object.keys(batch[0]);
        const batchValues = batch.map((row) => {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (typeof value === 'number') return value;
            if (typeof value === 'boolean') return value ? 1 : 0;

            try {
              return JSON.stringify(JSON.stringify(value));
            } catch (error) {
              return 'NULL';
            }
          });
          return `(${values.join(', ')})`;
        });

        const batchSql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES ${batchValues.join(', ')};`;

        const tempFile = `./batch_sql_${Date.now()}_${Math.random().toString(36).slice(2)}.sql`;
        fs.writeFileSync(tempFile, batchSql);

        try {
          execSync(`npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --file="${tempFile}"`, {
            encoding: 'utf8',
            timeout: 120000,
            env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
          });

          fs.unlinkSync(tempFile);
          console.log(`    ✅ Batch ${batchIndex + 1}/${totalBatches} completed (rows ${startRow + 1}-${endRow})`);
        } catch (batchError) {
          const preservedFile = `./FAILED_BATCH_${batchIndex + 1}_${tableName}_${Date.now()}.sql`;
          try {
            copyFileSync(tempFile, preservedFile);
            console.log(`    💾 PRESERVED failing SQL file: ${preservedFile}`);
          } catch (preserveError) {}

          try { unlinkSync(tempFile); } catch {}
          throw new Error(`BATCH SYNC FAILED: Batch ${batchIndex + 1} failed: ${batchError.message}`);
        }
      }

      console.log(`    ✅ Synced ${tableName}: ${tableData.data.length} rows`);
      syncedTables++;
      syncedRows += tableData.data.length;
    } catch (error) {
      console.error(`    🚨 Failed to sync ${tableName}: ${error.message}`);
      console.error(`    📊 Tables completed before failure: ${syncedTables} (${syncedRows} rows)`);
      throw new Error(`SYNC FAILURE: Table ${tableName} failed: ${error.message}`);
    }
  }

  console.log('\n🔧 Re-enabling foreign key constraints...');
  try {
    executeStagingD1Command('PRAGMA foreign_keys = ON;');
    console.log('✅ Foreign key constraints re-enabled');
  } catch (error) {
    console.log('⚠️  Could not re-enable foreign key constraints:', error.message);
  }

  console.log('\n🎉 PRODUCTION DATA SYNCED TO STAGING');
  console.log('=====================================================');
  console.log(`📊 Tables synced: ${syncedTables}`);
  console.log(`📊 Total rows synced: ${syncedRows}`);
  console.log('=====================================================\n');

  console.log('🔍 Final verification...');
  const verificationResults = {};
  let criticalVerificationFailed = false;

  for (const tableName of criticalTables) {
    try {
      const countResult = executeStagingD1Command(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = parseCount(countResult);
      verificationResults[tableName] = { status: 'OK', count };
      console.log(`✅ ${tableName}: ${count} rows`);

      if (count === 0 && ['users', 'books', 'locations'].includes(tableName)) {
        console.log(`🚨 CRITICAL: ${tableName} is empty!`);
        criticalVerificationFailed = true;
      }
    } catch (error) {
      console.log(`❌ ${tableName}: VERIFICATION FAILED - ${error.message}`);
      verificationResults[tableName] = { status: 'ERROR', error: error.message };
      criticalVerificationFailed = true;
    }
  }

  if (criticalVerificationFailed) {
    console.log('\n🚨 CRITICAL VERIFICATION FAILURE - manual investigation required');
  } else {
    console.log('\n✅ STAGING NOW MATCHES PRODUCTION');
  }
}

function tryCreateTable(tableName) {
  const fs = require('fs');
  try {
    const schemaContent = fs.readFileSync('schema.sql', 'utf8');
    const tableRegex = new RegExp(`CREATE TABLE ${tableName}\\s*\\([^;]+\\);`, 'is');
    const tableMatch = schemaContent.match(tableRegex);

    if (!tableMatch) {
      console.log(`    ⚠️  No CREATE statement found for ${tableName}`);
      return false;
    }

    let createTableSql = tableMatch[0];

    const fkTables = ['book_ratings', 'book_checkout_history', 'book_removal_requests', 'book_genres'];
    if (fkTables.includes(tableName)) {
      createTableSql = createTableSql.replace(/\s+REFERENCES\s+\w+\s*\([^)]+\)(\s+[A-Z\s]+)?/gi, '');
      createTableSql = createTableSql.replace(/,\s*CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+\w+\s*\([^)]+\)(\s+[A-Z\s]+)?/gi, '');
      createTableSql = createTableSql.replace(/,\s*FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+\w+\s*\([^)]+\)(\s+[A-Z\s]+)?/gi, '');
      createTableSql = createTableSql.replace(/,\s*,/g, ',');
      createTableSql = createTableSql.replace(/,\s*\)/g, ')');
    }

    const tempFile = `./create_${tableName}_${Date.now()}.sql`;
    fs.writeFileSync(tempFile, createTableSql);

    execSync(`npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --file="${tempFile}"`, {
      encoding: 'utf8',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
    });
    fs.unlinkSync(tempFile);

    console.log(`    ✅ Created missing table: ${tableName}`);
    return true;
  } catch (error) {
    console.log(`    ❌ Failed to create table ${tableName}: ${error.message}`);
    return false;
  }
}

function executeStagingD1Command(sql) {
  const command = `npx wrangler d1 execute librarycard-db-staging-new --config=wrangler.staging-new.toml --env=staging --remote --command="${sql.replace(/"/g, '\\"')}"`;

  return execSync(command, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN_STAGING_NEW }
  });
}

function parseCount(output) {
  try {
    const lines = output.split('\n');
    const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
    if (jsonStart === -1) return 'unknown';

    const jsonText = lines.slice(jsonStart).join('\n');
    const data = JSON.parse(jsonText);

    if (Array.isArray(data) && data[0] && data[0].results && data[0].results[0]) {
      return data[0].results[0].count;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

syncProductionToStaging().catch(error => {
  console.error('❌ Complete sync failed:', error.message);
  process.exit(1);
});
