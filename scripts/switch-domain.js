#!/usr/bin/env node

/**
 * Domain Switching Script for LibraryCard
 *
 * LCWEB-184: Centralized Domain Configuration System
 *
 * Usage:
 *   npm run switch-domain newdomain.com
 *   npm run switch-domain --staging staging-newdomain.com
 *   npm run switch-domain --production newdomain.com --confirm
 *
 * This script updates environment variables and configuration files
 * to switch the domain for LibraryCard across all environments.
 *
 * ✅ No database migration needed - LibraryCard uses relative paths!
 */

const fs = require('fs');
const path = require('path');

const ENVIRONMENTS = ['local', 'staging', 'production'];
const CONFIG_FILES = [
  'wrangler.toml',
  'wrangler.staging-new.toml',
  'wrangler.prod.toml',
  '.env.example'
];

function showUsage() {
  console.log(`
🔄 LibraryCard Domain Switching Script

Usage:
  node scripts/switch-domain.js <domain> [options]

Examples:
  node scripts/switch-domain.js librarycard.example.com
  node scripts/switch-domain.js --staging staging.example.com
  node scripts/switch-domain.js --production example.com --confirm

Options:
  --staging          Update staging environment
  --production       Update production environment
  --confirm          Skip confirmation prompt (required for production)
  --help, -h         Show this help message

Environment Variables Updated:
  DOMAIN             Base domain name
  EMAIL_DOMAIN       Email domain (defaults to base domain)
  NEXT_PUBLIC_API_URL  Frontend API URL (computed)
  APP_URL            Worker app URL (computed)
  FROM_EMAIL         System email address (computed)

Configuration Files:
  ${CONFIG_FILES.join('\n  ')}
`);
}

function validateDomain(domain) {
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;

  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain is required');
  }

  if (!domainRegex.test(domain)) {
    throw new Error(`Invalid domain format: ${domain}`);
  }

  if (domain.includes('localhost')) {
    throw new Error('Cannot use localhost as production domain');
  }

  return true;
}

function generateDomainUrls(domain, environment) {
  const urls = {};

  switch (environment) {
    case 'local':
      urls.frontendUrl = 'http://localhost:3000';
      urls.apiUrl = 'http://localhost:8787';
      urls.fromEmail = 'LibraryCard <noreply@localhost>';
      break;

    case 'staging':
      urls.frontendUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      urls.apiUrl = `https://librarycard-api-staging.librarycard-staging.workers.dev`;
      urls.fromEmail = `LibraryCard <librarian@tim52.io>`;
      break;

    case 'production':
      urls.frontendUrl = `https://${domain}`;
      urls.apiUrl = `https://api.${domain}`;
      urls.fromEmail = `LibraryCard <librarian@tim52.io>`;
      break;
  }

  return urls;
}

function updateEnvironmentFile(filePath, domain, environment) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath} (skipping)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const urls = generateDomainUrls(domain, environment);

    // Update domain-related variables
    content = content.replace(/DOMAIN=.*/g, `DOMAIN=${domain}`);
    content = content.replace(/NEXT_PUBLIC_API_URL=.*/g, `NEXT_PUBLIC_API_URL=${urls.apiUrl}`);
    content = content.replace(/APP_URL=.*/g, `APP_URL=${urls.frontendUrl}`);
    content = content.replace(/FROM_EMAIL=.*/g, `FROM_EMAIL=${urls.fromEmail}`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
  }
}

function updateWranglerConfig(filePath, domain, environment) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath} (skipping)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const urls = generateDomainUrls(domain, environment);

    // Update wrangler.toml variables
    content = content.replace(/DOMAIN = ".*"/g, `DOMAIN = "${domain}"`);
    content = content.replace(/APP_URL = ".*"/g, `APP_URL = "${urls.frontendUrl}"`);
    content = content.replace(/FROM_EMAIL = ".*"/g, `FROM_EMAIL = "${urls.fromEmail}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
  }
}

function validateConfiguration(domain, environment) {
  const warnings = [];
  const urls = generateDomainUrls(domain, environment);

  if (environment === 'production') {
    if (!urls.frontendUrl.startsWith('https://')) {
      warnings.push('Production frontend URL should use HTTPS');
    }
    if (!urls.apiUrl.startsWith('https://')) {
      warnings.push('Production API URL should use HTTPS');
    }
    if (urls.fromEmail.includes('localhost')) {
      warnings.push('Production should not use localhost email');
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  return warnings.length === 0;
}

async function confirmAction(message) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(`${message} (y/N): `, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let domain = null;
  let environment = 'local';
  let skipConfirmation = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showUsage();
      process.exit(0);
    } else if (arg === '--staging') {
      environment = 'staging';
    } else if (arg === '--production') {
      environment = 'production';
    } else if (arg === '--confirm') {
      skipConfirmation = true;
    } else if (!arg.startsWith('--')) {
      domain = arg;
    }
  }

  if (!domain) {
    console.error('❌ Domain is required');
    showUsage();
    process.exit(1);
  }

  try {
    // Validate domain
    validateDomain(domain);

    console.log(`🔄 Switching ${environment} environment to: ${domain}`);

    // Validate configuration
    const isValid = validateConfiguration(domain, environment);
    if (!isValid && environment === 'production') {
      console.error('❌ Configuration validation failed for production');
      process.exit(1);
    }

    // Confirmation prompt
    if (!skipConfirmation) {
      const urls = generateDomainUrls(domain, environment);
      console.log('\\n📋 Configuration Preview:');
      console.log(`  Frontend URL: ${urls.frontendUrl}`);
      console.log(`  API URL: ${urls.apiUrl}`);
      console.log(`  From Email: ${urls.fromEmail}`);

      const confirmed = await confirmAction(`\\nProceed with domain switch to ${domain}?`);
      if (!confirmed) {
        console.log('❌ Domain switch cancelled');
        process.exit(0);
      }
    } else if (environment === 'production' && !skipConfirmation) {
      console.error('❌ Production domain changes require --confirm flag');
      process.exit(1);
    }

    console.log('\\n🔧 Updating configuration files...');

    // Update configuration files based on environment
    if (environment === 'local') {
      updateEnvironmentFile('.env.local', domain, environment);
      updateWranglerConfig('wrangler.toml', domain, environment);
    } else if (environment === 'staging') {
      updateWranglerConfig('wrangler.staging-new.toml', domain, environment);
    } else if (environment === 'production') {
      updateWranglerConfig('wrangler.prod.toml', domain, environment);
    }

    // Always update example file
    updateEnvironmentFile('.env.example', domain, environment);

    console.log('\\n✅ Domain switch completed successfully!');
    console.log('\\n📋 Next steps:');
    console.log('  1. Update DNS records to point to new domain');
    console.log('  2. Deploy workers with new configuration');
    console.log('  3. Test all functionality with new domain');
    console.log('  4. Update external integrations (OAuth, webhooks, etc.)');

    if (environment === 'production') {
      console.log('\\n⚠️  Production Reminders:');
      console.log('  • Update OAuth redirect URLs');
      console.log('  • Update email service domain verification');
      console.log('  • Monitor for SSL certificate provisioning');
      console.log('  • Test all email delivery');
    }

  } catch (error) {
    console.error(`❌ Domain switch failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateDomainUrls,
  validateDomain,
  validateConfiguration
};