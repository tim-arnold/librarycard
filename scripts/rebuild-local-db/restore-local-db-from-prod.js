#!/usr/bin/env node

/**
 * Restore Local Database from Production Backup
 *
 * This script completely wipes the local database and reimports everything from a production backup.
 * It prompts for a backup release to download, extracts it, and imports the data.
 * Use this for a fresh, reliable local development setup with real production data.
 */

const { execSync } = require('child_process');
const { existsSync, readdirSync, rmSync } = require('fs');
const { createInterface } = require('readline');
const path = require('path');

console.log('🔄 Restore Local Database from Production Backup');
console.log('================================================');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForBackupSource() {
  return new Promise((resolve) => {
    console.log('');
    console.log('📁 How would you like to restore the database?');
    console.log('');
    console.log('1. Use existing backup in /cloudflare directory');
    console.log('2. Download fresh backup from GitHub releases');
    console.log('');

    rl.question('Choose option (1 or 2): ', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function listLocalBackups() {
  const cloudflareDir = path.join(__dirname, '../../cloudflare');

  if (!existsSync(cloudflareDir)) {
    return [];
  }

  const files = readdirSync(cloudflareDir);
  return files.filter(file =>
    (file.startsWith('prod-backup-') ||
     file.startsWith('staging-backup-') ||
     file === 'staging-database-backup.json') &&
    file.endsWith('.json')
  );
}

async function promptForLocalBackup(backups) {
  return new Promise((resolve) => {
    console.log('');
    console.log('📂 Available local backups:');
    console.log('');

    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup}`);
    });

    console.log('');
    rl.question('Choose backup number: ', (answer) => {
      const choice = parseInt(answer.trim()) - 1;
      if (choice >= 0 && choice < backups.length) {
        resolve(backups[choice]);
      } else {
        console.log('❌ Invalid choice');
        process.exit(1);
      }
    });
  });
}

async function promptForRemoteBackup() {
  return new Promise((resolve) => {
    console.log('');
    console.log('💡 Available backup releases can be found at:');
    console.log('   https://github.com/tim-arnold/libarycard/releases');
    console.log('');
    console.log('📝 Enter the backup release name:');
    console.log('   Production: "cf-backup-101-20250923"');
    console.log('   Staging:    "staging-backup-6-20250924-1710"');

    rl.question('Backup release: ', (answer) => {
      resolve(answer.trim());
    });
  });
}

function cleanupCloudflareDirectory() {
  const cloudflareDir = path.join(__dirname, '../../cloudflare');

  console.log('🧹 Cleaning up /cloudflare directory...');

  if (existsSync(cloudflareDir)) {
    // Remove all files in the directory
    const files = readdirSync(cloudflareDir);
    files.forEach(file => {
      const filePath = path.join(cloudflareDir, file);
      rmSync(filePath, { recursive: true, force: true });
    });
    console.log(`✅ Removed ${files.length} files from /cloudflare directory`);
  } else {
    console.log('ℹ️  /cloudflare directory does not exist');
  }
}

async function downloadAndExtractBackup(backupName) {
  const cloudflareDir = path.join(__dirname, '../../cloudflare');
  // Extract date from backup name
  // Production format: "cf-backup-101-20250923" -> "20250923"
  // Staging format: "staging-backup-6-20250924-1710" -> "20250924"
  let dateStr, filename;

  if (backupName.startsWith('cf-backup-')) {
    // Production backup format: cf-backup-XXX-YYYYMMDD
    const dateMatch = backupName.match(/(\d{8})$/);
    if (!dateMatch) {
      throw new Error(`Invalid production backup name format. Expected: cf-backup-XXX-YYYYMMDD`);
    }
    dateStr = dateMatch[1];
    filename = `cloudflare-backup-${dateStr}.tar.gz`;
  } else if (backupName.startsWith('staging-backup-')) {
    // Staging backup format: staging-backup-X-YYYYMMDD-HHMM
    const dateMatch = backupName.match(/staging-backup-\d+-(\d{8})-(\d{4})$/);
    if (!dateMatch) {
      throw new Error(`Invalid staging backup name format. Expected: staging-backup-X-YYYYMMDD-HHMM`);
    }
    dateStr = dateMatch[1];
    const timeStr = dateMatch[2];
    filename = `staging-cloudflare-backup-${dateStr}-${timeStr}.tar.gz`;
  } else {
    throw new Error(`Unknown backup format. Expected: cf-backup-XXX-YYYYMMDD or staging-backup-X-YYYYMMDD-HHMM`);
  }
  const tarFile = `${cloudflareDir}/${filename}`;
  const downloadUrl = `https://github.com/tim-arnold/libarycard/releases/download/${backupName}/${filename}`;

  console.log('');
  console.log('📦 Downloading production backup...');
  console.log(`   Source: ${downloadUrl}`);
  console.log(`   Target: ${tarFile}`);

  try {
    // Check if GitHub CLI is installed and authenticated
    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch (authError) {
      throw new Error('GitHub CLI not authenticated. Please run: gh auth login');
    }

    // Create cloudflare directory if it doesn't exist
    execSync(`mkdir -p ${cloudflareDir}`, { stdio: 'inherit' });

    // Download the backup tar.gz file using GitHub CLI (handles private repos)
    console.log('🔑 Using GitHub CLI for authenticated download...');
    execSync(`gh release download ${backupName} --pattern "${filename}" --repo tim-arnold/libarycard --dir "${cloudflareDir}"`, { stdio: 'inherit' });

    // Debug: Check what files are in the cloudflare directory
    console.log('🔍 Checking download location...');
    const downloadedFiles = readdirSync(cloudflareDir);
    console.log(`Files in ${cloudflareDir}:`, downloadedFiles);

    if (!existsSync(tarFile)) {
      throw new Error(`Download failed - file not found: ${tarFile}\nActual files: ${downloadedFiles.join(', ')}`);
    }

    console.log('✅ Download completed');

    // Extract the tar.gz file
    console.log('📂 Extracting backup archive...');
    execSync(`cd ${cloudflareDir} && tar -xzf ${path.basename(tarFile)}`, { stdio: 'inherit' });

    // Debug: Check what files are in the directory after extraction
    console.log('🔍 Checking extracted files...');
    const extractedFiles = readdirSync(cloudflareDir);
    console.log(`Files after extraction:`, extractedFiles);

    // Look for JSON backup file in the main directory first
    let backupJsonFile = extractedFiles.find(file =>
      (file.startsWith('prod-backup-') || file.startsWith('staging-backup-') || file === 'staging-database-backup.json') && file.endsWith('.json')
    );
    let backupJsonPath;

    if (!backupJsonFile) {
      // Check subdirectories for the JSON file
      const possibleSubdirs = ['cloudflare', 'staging-cloudflare'];

      for (const subdirName of possibleSubdirs) {
        const subdir = path.join(cloudflareDir, subdirName);
        if (existsSync(subdir)) {
          console.log(`🔍 Checking ${subdirName} subdirectory...`);
          const subdirFiles = readdirSync(subdir);
          console.log(`Files in ${subdirName} subdirectory:`, subdirFiles);

          backupJsonFile = subdirFiles.find(file =>
            (file.startsWith('prod-backup-') || file.startsWith('staging-backup-') || file === 'staging-database-backup.json') && file.endsWith('.json')
          );

          if (backupJsonFile) {
            // Move the JSON file to the main cloudflare directory
            const srcPath = path.join(subdir, backupJsonFile);
            const destPath = path.join(cloudflareDir, backupJsonFile);
            console.log(`📁 Moving ${backupJsonFile} from ${subdirName} subdirectory to main directory...`);
            execSync(`mv "${srcPath}" "${destPath}"`);

            // Remove the empty subdirectory
            rmSync(subdir, { recursive: true, force: true });
            console.log(`🧹 Cleaned up ${subdirName} subdirectory`);

            backupJsonPath = destPath;
            break;
          }
        }
      }
    } else {
      backupJsonPath = path.join(cloudflareDir, backupJsonFile);
    }

    if (!backupJsonFile) {
      // Debug: Look for any .json files
      const anyJsonFiles = extractedFiles.filter(file => file.endsWith('.json'));
      throw new Error(`No production backup JSON file found in extracted archive.\nAll files: ${extractedFiles.join(', ')}\nJSON files: ${anyJsonFiles.join(', ')}`);
    }

    console.log(`✅ Extracted backup: ${backupJsonFile}`);

    // Clean up tar.gz file
    rmSync(tarFile);
    console.log('🧹 Cleaned up tar.gz file');

    return backupJsonPath;

  } catch (error) {
    console.error(`❌ Failed to download/extract backup: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  let backupFilePath;

  // Step 1: Wipe existing database
  console.log('🗑️  Removing existing local database...');
  try {
    execSync(`rm -rf "${path.join(__dirname, '../../.wrangler/state')}"`, { stdio: 'inherit' });
    console.log('✅ Local database removed');
  } catch (error) {
    console.log('ℹ️  No existing database to remove');
  }

  // Step 2: Determine backup source
  const sourceChoice = await promptForBackupSource();

  if (sourceChoice === '1') {
    // Use existing local backup
    const localBackups = await listLocalBackups();

    if (localBackups.length === 0) {
      console.log('❌ No local backups found in /cloudflare directory');
      console.log('💡 Choose option 2 to download a fresh backup');
      process.exit(1);
    }

    const selectedBackup = await promptForLocalBackup(localBackups);
    backupFilePath = path.join(__dirname, '../../cloudflare', selectedBackup);
    console.log(`✅ Using local backup: ${selectedBackup}`);

  } else if (sourceChoice === '2') {
    // Download fresh backup from GitHub

    // Clean up cloudflare directory first
    cleanupCloudflareDirectory();

    const backupName = await promptForRemoteBackup();

    if (!backupName) {
      console.error('❌ No backup name provided');
      process.exit(1);
    }

    // Download and extract backup
    backupFilePath = await downloadAndExtractBackup(backupName);

  } else {
    console.error('❌ Invalid choice. Please choose 1 or 2.');
    process.exit(1);
  }

  // Close readline interface
  rl.close();

  // Step 3: Run the import script with backup file path
  console.log('');
  console.log('📦 Importing production data...');
  console.log(`🔧 Using backup: ${path.basename(backupFilePath)}`);
  console.log('');

  try {
    execSync(`node "${path.join(__dirname, 'import-production-data.js')}" "${backupFilePath}"`, { stdio: 'inherit' });

    // Step 5: Optional cleanup after successful import
    console.log('');
    console.log('🧹 Post-import cleanup...');
    console.log('💡 Consider cleaning /cloudflare directory to save space');
    console.log('   (Backup files can be re-downloaded anytime)');

    console.log('');
    console.log('🎉 LOCAL DATABASE RESTORE COMPLETE!');
    console.log('===================================');
    console.log('✅ Fresh local database created from production data');
    console.log('✅ All users, books, locations, and permissions imported');
    console.log('✅ Ready for local development and testing');
    console.log('');
    console.log('💡 You can now:');
    console.log('   • RESTART local dev-worker if it was running');
    console.log('   • Log in with production user credentials');
    console.log('');
    console.log('🔑 Use test@localhost.dev / password for a local test user');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Check the output above for specific errors.');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});