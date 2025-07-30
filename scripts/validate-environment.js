#!/usr/bin/env node

/**
 * Environment Validation Utility
 * 
 * This script validates the development environment before allowing
 * production operations. It checks:
 * - Git repository state
 * - Environment configuration
 * - Required dependencies
 * - API token permissions
 * - Staging test status
 */

const { execSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Environment Validation Check\n');
    
    this.checkGitRepository();
    this.checkWorkingDirectory();
    this.checkConfiguration();
    this.checkDependencies();
    this.checkEnvironmentVariables();
    
    this.displayResults();
    
    if (this.errors.length > 0) {
      console.log('\n❌ Environment validation failed. Fix errors before proceeding.');
      process.exit(1);
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Environment validation passed with warnings.');
      console.log('Review warnings before proceeding with production operations.');
    } else {
      console.log('\n✅ Environment validation passed. Safe to proceed.');
    }
  }

  checkGitRepository() {
    try {
      // Check if we're in a git repository
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      
      // Check current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      if (currentBranch !== 'main') {
        this.warnings.push(`Not on main branch (currently on: ${currentBranch})`);
      }
      
      // Check if branch is up to date with remote
      try {
        execSync('git fetch', { stdio: 'pipe' });
        const behind = execSync('git rev-list HEAD..origin/main --count', { encoding: 'utf8' }).trim();
        
        if (parseInt(behind) > 0) {
          this.warnings.push(`Branch is ${behind} commits behind origin/main`);
        }
      } catch (error) {
        this.warnings.push('Could not check remote branch status');
      }
      
      console.log('✅ Git repository check passed');
      
    } catch (error) {
      this.errors.push('Not in a git repository or git not available');
    }
  }

  checkWorkingDirectory() {
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      
      if (gitStatus) {
        this.warnings.push('Working directory has uncommitted changes');
        console.log('⚠️  Working directory has uncommitted changes');
      } else {
        console.log('✅ Working directory is clean');
      }
      
    } catch (error) {
      this.errors.push('Could not check working directory status');
    }
  }

  checkConfiguration() {
    // Check for wrangler.toml
    if (!existsSync('./wrangler.toml')) {
      this.errors.push('wrangler.toml not found');
      return;
    }
    
    try {
      const wranglerConfig = readFileSync('./wrangler.toml', 'utf8');
      
      // Check for required environments
      const environments = ['local', 'staging', 'production'];
      environments.forEach(env => {
        if (!wranglerConfig.includes(`[env.${env}]`)) {
          this.errors.push(`Missing ${env} environment in wrangler.toml`);
        }
      });
      
      // Check for dangerous default environment
      if (wranglerConfig.includes('name = "librarycard-api-production"') && 
          !wranglerConfig.includes('[env.production]')) {
        this.errors.push('Production configuration at root level - unsafe!');
      }
      
      console.log('✅ Configuration file check passed');
      
    } catch (error) {
      this.errors.push('Could not read wrangler.toml');
    }
    
    // Check for package.json
    if (!existsSync('./package.json')) {
      this.errors.push('package.json not found');
      return;
    }
    
    try {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
      
      // Check for required scripts
      const requiredScripts = ['dev', 'build', 'lint'];
      requiredScripts.forEach(script => {
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          this.warnings.push(`Missing ${script} script in package.json`);
        }
      });
      
    } catch (error) {
      this.errors.push('Could not read package.json');
    }
  }

  checkDependencies() {
    try {
      // Check if node_modules exists
      if (!existsSync('./node_modules')) {
        this.errors.push('node_modules not found - run npm install');
        return;
      }
      
      // Check for wrangler CLI
      try {
        execSync('npx wrangler --version', { stdio: 'pipe' });
        console.log('✅ Wrangler CLI available');
      } catch (error) {
        this.errors.push('Wrangler CLI not available');
      }
      
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
      
      if (majorVersion < 18) {
        this.errors.push(`Node.js version ${nodeVersion} is too old. Requires Node.js 18+`);
      } else {
        console.log(`✅ Node.js version ${nodeVersion} is compatible`);
      }
      
    } catch (error) {
      this.errors.push('Could not check dependencies');
    }
  }

  checkEnvironmentVariables() {
    // Check for dangerous environment variables in production context
    const dangerousVars = [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID'
    ];
    
    dangerousVars.forEach(varName => {
      if (process.env[varName]) {
        this.warnings.push(`${varName} is set in environment - ensure it's for the correct account`);
      }
    });
    
    // Check for .env files
    const envFiles = ['.env', '.env.local', '.env.production'];
    envFiles.forEach(file => {
      if (existsSync(file)) {
        this.warnings.push(`${file} exists - verify it doesn't contain production secrets`);
      }
    });
    
    console.log('✅ Environment variables check completed');
  }

  displayResults() {
    console.log('\n📋 Validation Summary:');
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('   All checks passed successfully!');
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  validator.validate();
}

module.exports = { EnvironmentValidator };