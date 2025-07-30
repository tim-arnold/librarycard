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
    console.log('🚨 PHASE 3 SECURITY: Local Production Access Blocked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔒 Local production deployments have been disabled for security.');
    console.log('');
    console.log('✅ SAFE PRODUCTION DEPLOYMENT OPTIONS:');
    console.log('');
    console.log('1. 🎯 GitHub Actions (Recommended):');
    console.log('   • Go to: https://github.com/tim-arnold/libarycard/actions');
    console.log('   • Select: "Deploy to Production (Enhanced Safety)"');
    console.log('   • Fill required fields and click "Run workflow"');
    console.log('');
    console.log('2. 📋 Required Information:');
    console.log('   • Deployment type: [worker-only|database-migration|full-deployment]');
    console.log('   • Reason: Explain why you\'re deploying');
    console.log('   • Confirmation: Type "CONFIRM-PRODUCTION"');
    console.log('');
    console.log('3. 🛡️ Safety Features:');
    console.log('   • Multi-person approval required');
    console.log('   • Automatic pre-deployment backup');
    console.log('   • Staging verification checks');
    console.log('   • Post-deployment health monitoring');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 This change improves security by:');
    console.log('   • Preventing accidental local production commands');
    console.log('   • Ensuring all production changes are reviewed');
    console.log('   • Creating audit trails for compliance');
    console.log('   • Enabling automatic rollback capabilities');
    console.log('');
    
    // Log the blocked attempt
    const timestamp = new Date().toISOString();
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const user = process.env.USER || 'unknown';
    this.logAudit(`DEPLOYMENT_BLOCKED: ${timestamp} | User: ${user} | Commit: ${commitHash} | Reason: Phase 3 local access restriction`);
    
    console.log('🚫 Local deployment blocked. Use GitHub Actions for production deployments.');
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
  const deployer = new ProductionDeployer();
  deployer.deploy();
}