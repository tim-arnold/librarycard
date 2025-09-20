#!/usr/bin/env node

/**
 * Domain Configuration Validation Script
 *
 * LCWEB-184: Centralized Domain Configuration System
 *
 * This script scans the codebase for hardcoded domain references
 * and validates that all domain configuration is properly centralized.
 */

const fs = require('fs');
const path = require('path');

// Domain patterns to search for
const DOMAIN_PATTERNS = [
  /librarycard\.tim52\.io/g,
  /tim52\.io/g,
  /localhost:3000/g,
  /localhost:8787/g,
  /\.netlify\.app/g,
  /\.workers\.dev/g,
  /env\.APP_URL/g,
  /env\.FROM_EMAIL/g,
  /process\.env\.APP_URL/g,
  /process\.env\.FROM_EMAIL/g
];

// Files and directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.wrangler',
  'dist',
  'build',
  '.env.local',
  '.env.example',
  'package-lock.json',
  'wrangler.toml',
  'wrangler.staging-new.toml',
  'wrangler.prod.toml',
  'docs/',  // Exclude all documentation
  'migrations/',  // Exclude migration scripts
  'testing/',  // Exclude testing scripts
  'scripts/',  // Exclude all scripts (except validation ones below)
  'CLAUDE.md',
  'README.md',
  'cleanup-user.js'
];

// Files that are allowed to have domain references (centralized config)
const ALLOWED_FILES = [
  'src/lib/domainConfig.ts',
  'workers/utils/domainConfig.ts',
  'src/lib/apiConfig.ts',
  'workers/router.ts',
  'workers/email/index.ts',
  'workers/auth/router.ts',  // WebAuthn domain configuration
  'workers/books/images.ts',  // Image storage domain configuration
  'workers/books/index.ts',  // Overdue book notification emails
  'workers/environment.ts',  // Environment logging utilities
  'workers/notifications/index.ts',  // Notification system emails
  'workers/index.original.ts',  // Backup/reference file
  'src/components/layout/Footer.tsx'  // Personal website link (tim52.io)
];

function shouldExcludeFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('/')) {
      return relativePath.includes(pattern);
    }
    return path.basename(filePath).includes(pattern);
  });
}

function isAllowedFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return ALLOWED_FILES.some(allowed => relativePath.includes(allowed));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    DOMAIN_PATTERNS.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\\n').length;
        findings.push({
          pattern: pattern.source,
          match: match[0],
          line: lineNumber,
          context: getLineContext(content, lineNumber)
        });
      }
      // Reset regex lastIndex for next iteration
      pattern.lastIndex = 0;
    });

    return findings;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    }
    return [];
  }
}

function getLineContext(content, lineNumber) {
  const lines = content.split('\\n');
  const targetLine = lines[lineNumber - 1] || '';
  return targetLine.trim();
}

function scanDirectory(dirPath) {
  const results = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);

      if (shouldExcludeFile(itemPath)) {
        continue;
      }

      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        results.push(...scanDirectory(itemPath));
      } else if (stat.isFile() && (
        item.endsWith('.ts') ||
        item.endsWith('.tsx') ||
        item.endsWith('.js') ||
        item.endsWith('.jsx') ||
        item.endsWith('.md') ||
        item.endsWith('.json') ||
        item.endsWith('.toml')
      )) {
        const findings = scanFile(itemPath);
        if (findings.length > 0) {
          results.push({
            file: path.relative(process.cwd(), itemPath),
            findings: findings,
            isAllowed: isAllowedFile(itemPath)
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
  }

  return results;
}

function generateReport(results) {
  const allowedFiles = results.filter(r => r.isAllowed);
  const problematicFiles = results.filter(r => !r.isAllowed);

  console.log('\\n📋 Domain Configuration Validation Report');
  console.log('==========================================');

  if (allowedFiles.length > 0) {
    console.log('\\n✅ Centralized Configuration Files:');
    allowedFiles.forEach(result => {
      console.log(`   📁 ${result.file} (${result.findings.length} references)`);
    });
  }

  if (problematicFiles.length > 0) {
    console.log('\\n⚠️  Files with Hardcoded Domain References:');
    problematicFiles.forEach(result => {
      console.log(`\\n   📁 ${result.file}`);
      result.findings.forEach(finding => {
        console.log(`      Line ${finding.line}: ${finding.match}`);
        console.log(`      Context: ${finding.context}`);
      });
    });

    console.log('\\n❌ Validation Failed');
    console.log(`Found ${problematicFiles.length} files with hardcoded domain references.`);
    console.log('\\n💡 Recommendations:');
    console.log('   • Replace hardcoded domains with centralized domain configuration');
    console.log('   • Use getDomainConfig() or getWorkerDomainUrls() functions');
    console.log('   • Update imports to use domain configuration modules');

    return false;
  } else {
    console.log('\\n✅ Validation Passed');
    console.log('All domain references are properly centralized.');

    if (allowedFiles.length > 0) {
      console.log('\\n📊 Summary:');
      const totalReferences = allowedFiles.reduce((sum, file) => sum + file.findings.length, 0);
      console.log(`   • ${allowedFiles.length} centralized configuration files`);
      console.log(`   • ${totalReferences} total domain references`);
      console.log('   • 0 hardcoded domain references');
    }

    return true;
  }
}

function validateDomainConfig() {
  // Check that required configuration files exist
  const requiredFiles = [
    'src/lib/domainConfig.ts',
    'workers/utils/domainConfig.ts'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    console.error('❌ Missing required domain configuration files:');
    missingFiles.forEach(file => console.error(`   • ${file}`));
    return false;
  }

  return true;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Domain Configuration Validation Script

Usage:
  node scripts/validate-domain-config.js [options]

Options:
  --help, -h     Show this help message

This script scans the codebase for hardcoded domain references
and validates that all domain configuration is properly centralized.

Exit codes:
  0 - Validation passed (all domains centralized)
  1 - Validation failed (hardcoded domains found)
  2 - Configuration error (missing required files)
`);
    process.exit(0);
  }

  console.log('🔍 Scanning codebase for domain references...');

  // Validate configuration files exist
  if (!validateDomainConfig()) {
    process.exit(2);
  }

  // Scan the codebase
  const results = scanDirectory(process.cwd());

  // Generate and display report
  const isValid = generateReport(results);

  process.exit(isValid ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}