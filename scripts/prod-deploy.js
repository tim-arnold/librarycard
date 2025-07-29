#!/usr/bin/env node

/**
 * Production Deployment Safety Wrapper
 * 
 * This script provides a safe interface for production deployments with:
 * - Environment validation
 * - Multi-step confirmation
 * - Pre-deployment checks
 * - Audit logging
 * - Rollback preparation
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { createInterface } = require('readline');

const AUDIT_LOG = './production-audit.log';
const REQUIRED_BRANCH = 'main';

class ProductionDeployer {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async deploy() {
    try {
      console.log('🚨 PRODUCTION DEPLOYMENT SAFETY CHECK 🚨\n');
      
      await this.validateEnvironment();
      await this.performPreChecks();
      await this.confirmDeployment();
      await this.executeDeployment();
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async validateEnvironment() {
    console.log('📋 Step 1: Environment Validation');
    
    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== REQUIRED_BRANCH) {
      throw new Error(`Must be on ${REQUIRED_BRANCH} branch. Currently on: ${currentBranch}`);
    }
    console.log(`✅ On ${REQUIRED_BRANCH} branch`);
    
    // Check working directory is clean
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (gitStatus) {
      throw new Error('Working directory is not clean. Commit or stash changes first.');
    }
    console.log('✅ Working directory clean');
    
    // Check for production-specific configuration
    if (!existsSync('./wrangler.prod.toml')) {
      throw new Error('wrangler.prod.toml not found - production configuration missing');
    }
    console.log('✅ Production configuration file found');
    
    // Verify production environment exists in config
    const wranglerConfig = readFileSync('./wrangler.prod.toml', 'utf8');
    if (!wranglerConfig.includes('[env.production]')) {
      throw new Error('Production environment not configured in wrangler.prod.toml');
    }
    console.log('✅ Production environment configured');
    
    // Verify this is production-only config
    if (wranglerConfig.includes('[env.local]') || wranglerConfig.includes('[env.staging]')) {
      throw new Error('Production config contains non-production environments - unsafe configuration');
    }
    console.log('✅ Production-only configuration verified\n');
  }

  async performPreChecks() {
    console.log('🔍 Step 2: Pre-deployment Checks');
    
    // Check if staging is up to date
    try {
      console.log('Verifying staging environment status...');
      // We can't easily check staging health without additional tooling
      // For now, just log that this should be verified manually
      console.log('⚠️  Please verify staging environment is healthy before proceeding');
    } catch (error) {
      console.log('⚠️  Could not verify staging status');
    }
    
    // Check recent commits
    const recentCommits = execSync('git log --oneline -5', { encoding: 'utf8' });
    console.log('📝 Recent commits:');
    console.log(recentCommits);
    
    console.log('✅ Pre-checks completed\n');
  }

  async confirmDeployment() {
    console.log('🔐 Step 3: Deployment Confirmation');
    console.log('You are about to deploy to PRODUCTION. This action cannot be undone automatically.');
    console.log('');
    
    // First confirmation
    const confirm1 = await this.askQuestion('Type "PRODUCTION" to confirm you want to deploy to production: ');
    if (confirm1 !== 'PRODUCTION') {
      throw new Error('Deployment cancelled - confirmation failed');
    }
    
    // Second confirmation with current time
    const now = new Date().toISOString();
    console.log(`\nCurrent time: ${now}`);
    const confirm2 = await this.askQuestion('Type "DEPLOY NOW" to proceed with production deployment: ');
    if (confirm2 !== 'DEPLOY NOW') {
      throw new Error('Deployment cancelled - second confirmation failed');
    }
    
    console.log('✅ Deployment confirmed\n');
  }

  async executeDeployment() {
    console.log('🚀 Step 4: Executing Deployment');
    
    const timestamp = new Date().toISOString();
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const user = process.env.USER || 'unknown';
    
    // Log deployment attempt
    this.logAudit(`DEPLOYMENT_START: ${timestamp} | User: ${user} | Commit: ${commitHash}`);
    
    try {
      console.log('Deploying to production...');
      
      // Execute the actual deployment using production-specific configuration
      execSync('npx wrangler deploy --config=wrangler.prod.toml --env=production', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('\n✅ Production deployment completed successfully!');
      this.logAudit(`DEPLOYMENT_SUCCESS: ${timestamp} | User: ${user} | Commit: ${commitHash}`);
      
      console.log('\n📋 Post-deployment checklist:');
      console.log('1. Verify production site is loading correctly');
      console.log('2. Check production logs for errors');
      console.log('3. Test critical user flows');
      console.log('4. Monitor error rates for the next 30 minutes');
      
    } catch (error) {
      console.error('\n❌ Deployment failed!');
      this.logAudit(`DEPLOYMENT_FAILED: ${timestamp} | User: ${user} | Commit: ${commitHash} | Error: ${error.message}`);
      throw error;
    }
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
  const deployer = new ProductionDeployer();
  deployer.deploy();
}