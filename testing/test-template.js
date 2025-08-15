const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config({ path: '../.env.local' });

/**
 * LibraryCard Testing Template
 * 
 * This template provides a foundation for creating automated tests for LibraryCard.
 * It handles common setup tasks like server management, authentication, and screenshot capture.
 * 
 * Usage:
 * 1. Copy this file to a new test file (e.g., test-feature-name.js)
 * 2. Modify the testSpecificSteps() function to implement your test logic
 * 3. Update the test name and description
 * 4. Run with: node test-feature-name.js
 */

async function runTest() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  let nextProcess = null;
  let workerProcess = null;
  
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // ========================================
  // SERVER MANAGEMENT
  // ========================================
  
  // Kill any existing dev servers and workers
  console.log('Killing any existing dev servers and workers...');
  try {
    await execAsync('pkill -f "next dev"');
    await execAsync('pkill -f "wrangler dev"');
    await execAsync('pkill -f "npm run dev"');
    await execAsync('pkill -f "npm run dev-worker"');
    console.log('Existing servers and workers killed');
  } catch (error) {
    console.log('No existing servers/workers found or failed to kill them');
  }
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start the Next.js dev server
  console.log('Starting Next.js dev server...');
  nextProcess = spawn('npm', ['run', 'dev'], { 
    cwd: '..',
    stdio: 'pipe'
  });
  
  // Wait for the server to start
  await new Promise((resolve) => {
    nextProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Ready in')) {
        console.log('Next.js dev server ready');
        resolve();
      }
    });
  });
  
  // Start the worker dev server
  console.log('Starting worker dev server...');
  workerProcess = spawn('npm', ['run', 'dev-worker'], { 
    cwd: '..',
    stdio: 'pipe'
  });
  
  // Wait for the worker to start
  await new Promise((resolve) => {
    workerProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Ready on')) {
        console.log('Worker dev server ready');
        resolve();
      }
    });
    // Fallback timeout in case we don't see the expected output
    setTimeout(() => {
      console.log('Worker server timeout - proceeding anyway');
      resolve();
    }, 10000);
  });
  
  // Wait a bit more to ensure everything is ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ========================================
  // BROWSER SETUP
  // ========================================

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null, // Use full screen viewport
    args: ['--start-maximized'] // Start maximized
  });
  
  const page = await browser.newPage();
  
  // Set viewport to full screen
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Starting test...');
    
    // ========================================
    // AUTHENTICATION
    // ========================================
    
    // Navigate to signin
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    
    // Sign in
    const username = process.env.SCREENSHOT_USER;
    const password = process.env.SCREENSHOT_PASSWORD;
    
    if (!username || !password) {
      throw new Error('SCREENSHOT_USER and SCREENSHOT_PASSWORD must be set in .env.local');
    }
    
    console.log('Signing in...');
    // Wait for and click the email signin button
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Sign in with Email')) {
        await button.click();
        break;
      }
    }
    
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', username);
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('Signed in successfully! Current URL:', page.url());
    
    // ========================================
    // COOKIE DISMISSAL
    // ========================================
    
    // Dismiss cookie notification if present
    console.log('Checking for cookie notification...');
    try {
      const cookieButtons = await page.$$('button');
      for (const button of cookieButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Accept All') || text.includes('Accept') || text.includes('Decline')) {
          console.log(`Clicking cookie button: ${text}`);
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        }
      }
    } catch (error) {
      console.log('No cookie notification found or error dismissing it');
    }
    
    // ========================================
    // TEST-SPECIFIC STEPS
    // ========================================
    
    await testSpecificSteps(page, screenshotsDir, timestamp);
    
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take debug screenshot on error
    const debugScreenPath = `${screenshotsDir}/debug-error_${timestamp}.png`;
    await page.screenshot({ 
      path: debugScreenPath,
      fullPage: true 
    });
    console.log(`Debug screenshot saved as ${debugScreenPath}`);
  } finally {
    await browser.close();
    
    // ========================================
    // CLEANUP
    // ========================================
    
    // Clean up: kill both dev servers
    console.log('Cleaning up dev servers...');
    if (nextProcess) {
      nextProcess.kill();
    }
    if (workerProcess) {
      workerProcess.kill();
    }
  }
}

/**
 * Implement your test-specific logic here
 * @param {Object} page - Puppeteer page object
 * @param {string} screenshotsDir - Directory for screenshots
 * @param {string} timestamp - Timestamp for file naming
 */
async function testSpecificSteps(page, screenshotsDir, timestamp) {
  // ========================================
  // REPLACE THIS SECTION WITH YOUR TEST LOGIC
  // ========================================
  
  console.log('Running test-specific steps...');
  
  // Example: Navigate to a page
  await page.goto('http://localhost:3000/library', { waitUntil: 'networkidle2' });
  
  // Example: Take a screenshot
  const screenshotPath = `${screenshotsDir}/test-screenshot_${timestamp}.png`;
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  console.log(`Screenshot saved as ${screenshotPath}`);
  
  // Example: Wait for elements and interact
  // await page.waitForSelector('button[data-testid="some-button"]');
  // await page.click('button[data-testid="some-button"]');
  
  // Example: Dismiss cookie notifications after navigation
  // await dismissCookieNotification(page);
  
  // Add your test steps here...
  
  console.log('Test-specific steps completed');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Dismiss cookie notification if present
 * @param {Object} page - Puppeteer page object
 */
async function dismissCookieNotification(page) {
  console.log('Checking for cookie notification...');
  try {
    const cookieButtons = await page.$$('button');
    for (const button of cookieButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Accept All') || text.includes('Accept') || text.includes('Decline')) {
        console.log(`Clicking cookie button: ${text}`);
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      }
    }
  } catch (error) {
    console.log('No cookie notification found');
  }
}

/**
 * Click the floating cart button using coordinates
 * @param {Object} page - Puppeteer page object
 */
async function clickCartButton(page) {
  console.log('Clicking cart button...');
  const viewport = await page.viewport();
  const cartX = viewport.width - 50; // 50px from right edge
  const cartY = viewport.height - 50; // 50px from bottom edge
  
  console.log(`Clicking cart coordinates: (${cartX}, ${cartY})`);
  await page.mouse.click(cartX, cartY);
  await new Promise(resolve => setTimeout(resolve, 2000));
}

/**
 * Select books from search results by clicking "Select" buttons
 * @param {Object} page - Puppeteer page object
 * @param {number} count - Number of books to select (default: 3)
 */
async function selectBooksFromResults(page, count = 3) {
  console.log(`Selecting up to ${count} books from search results...`);
  
  const allButtons = await page.$$('button');
  let selectedCount = 0;
  
  for (let i = 0; i < allButtons.length && selectedCount < count; i++) {
    const button = allButtons[i];
    const text = await page.evaluate(el => el.textContent, button);
    
    if (text.includes('Select') && !text.includes('Already')) {
      console.log(`Clicking Select button: ${text}`);
      await button.click();
      selectedCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Selected ${selectedCount} books`);
  return selectedCount;
}

/**
 * Search for books
 * @param {Object} page - Puppeteer page object
 * @param {string} searchTerm - Search term to use
 */
async function searchForBooks(page, searchTerm) {
  console.log(`Searching for: ${searchTerm}`);
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  
  // Clear existing search
  await page.click('input[placeholder*="Search"]', { clickCount: 3 });
  await page.type('input[placeholder*="Search"]', searchTerm);
  await page.keyboard.press('Enter');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for search results
  
  // Dismiss cookie notification that might appear after search
  await dismissCookieNotification(page);
}

// ========================================
// RUN THE TEST
// ========================================

runTest().catch(console.error);