#!/usr/bin/env node

// Simple script to create a test user with proper password hashing
const { execSync } = require('child_process');

async function hashPassword(password) {
  // This mimics the PBKDF2 hashing from workers/auth-core/index.ts
  const crypto = globalThis.crypto;

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to Uint8Array
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Import the password as a key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive 256 bits (32 bytes) using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // Combine salt and hash for storage
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64 string for database storage
  return btoa(String.fromCharCode(...combined));
}

async function createTestUser() {
  const testEmail = 'test@localhost.dev';
  const testPassword = 'password';

  console.log('Creating test user...');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);

  const passwordHash = await hashPassword(testPassword);
  console.log(`Password hash: ${passwordHash}`);

  // Delete existing test user if it exists
  try {
    execSync(`npx wrangler d1 execute librarycard-db-local --local --command="DELETE FROM users WHERE email = '${testEmail}'"`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
  } catch (error) {
    // Ignore errors if user doesn't exist
  }

  // Create new test user
  const sql = `INSERT INTO users (id, email, first_name, last_name, auth_provider, email_verified, password_hash, user_role, created_at, updated_at) VALUES ('test-user-local', '${testEmail}', 'Test', 'User', 'email', 1, '${passwordHash}', 'admin', datetime('now'), datetime('now'))`;

  execSync(`npx wrangler d1 execute librarycard-db-local --local --command="${sql.replace(/"/g, '\\"')}"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });

  console.log('✅ Test user created successfully!');
  console.log('You can now log in with:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  Password: ${testPassword}`);
}

createTestUser().catch(error => {
  console.error('❌ Failed to create test user:', error.message);
  process.exit(1);
});