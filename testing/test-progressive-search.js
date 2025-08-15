const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config({ path: '../.env.local' });

/**
 * Progressive Search Enhancement Test
 * 
 * Tests the new progressive search functionality:
 * 1. Default Google Books search (no toggle)
 * 2. OpenLibrary enhancement option appears after search
 * 3. Enhanced results merge correctly with source attribution
 * 4. No confusing mode selection upfront
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
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Starting progressive search test...');
    
    // ========================================
    // AUTHENTICATION
    // ========================================
    
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    
    const username = process.env.SCREENSHOT_USER;
    const password = process.env.SCREENSHOT_PASSWORD;
    
    if (!username || !password) {
      throw new Error('SCREENSHOT_USER and SCREENSHOT_PASSWORD must be set in .env.local');
    }
    
    console.log('Signing in...');
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
    
    console.log('Signed in successfully!');
    
    // ========================================
    // COOKIE DISMISSAL
    // ========================================
    
    await dismissCookieNotification(page);
    
    // ========================================
    // PROGRESSIVE SEARCH TEST
    // ========================================
    
    await testProgressiveSearch(page, screenshotsDir, timestamp);
    
  } catch (error) {
    console.error('Error during test:', error);
    
    const debugScreenPath = `${screenshotsDir}/debug-progressive-search-error_${timestamp}.png`;
    await page.screenshot({ 
      path: debugScreenPath,
      fullPage: true 
    });
    console.log(`Debug screenshot saved as ${debugScreenPath}`);
  } finally {
    await browser.close();
    
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

async function testProgressiveSearch(page, screenshotsDir, timestamp) {
  console.log('Testing progressive search enhancement...');
  
  // Navigate to add books page
  await page.goto('http://localhost:3000/add-books', { waitUntil: 'networkidle2' });
  await dismissCookieNotification(page);
  
  // Take screenshot of initial add books page
  const initialScreenPath = `${screenshotsDir}/progressive-search-initial_${timestamp}.png`;
  await page.screenshot({ path: initialScreenPath, fullPage: true });
  console.log(`Initial add books page screenshot: ${initialScreenPath}`);
  
  // Verify no enhanced search toggle exists
  console.log('Verifying enhanced search toggle is removed...');
  const toggleExists = await page.$('input[type="checkbox"]') !== null;
  if (toggleExists) {
    console.log('❌ WARNING: Enhanced search toggle still exists!');
  } else {
    console.log('✅ Enhanced search toggle successfully removed');
  }
  
  // Test Google Books search (default behavior)
  console.log('Testing default Google Books search...');
  await searchForBooks(page, 'Stephen King');
  
  // Take screenshot of Google Books search results
  const googleResultsPath = `${screenshotsDir}/progressive-search-google-results_${timestamp}.png`;
  await page.screenshot({ path: googleResultsPath, fullPage: true });
  console.log(`Google Books results screenshot: ${googleResultsPath}`);
  
  // Verify search results are displayed
  const searchResults = await page.$$('[data-testid="search-results-section"]');
  if (searchResults.length > 0) {
    console.log('✅ Google Books search results displayed');
  } else {
    console.log('❌ No search results found');
  }
  
  // Verify OpenLibrary enhancement option appears
  console.log('Checking for OpenLibrary enhancement option...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for enhancement option to appear
  
  const enhancementAlert = await page.$('.MuiAlert-root');
  if (enhancementAlert) {
    const alertText = await page.evaluate(el => el.textContent, enhancementAlert);
    if (alertText.includes("Didn't find what you were looking for")) {
      console.log('✅ OpenLibrary enhancement option displayed correctly');
      
      // Take screenshot of enhancement option
      const enhancementOptionPath = `${screenshotsDir}/progressive-search-enhancement-option_${timestamp}.png`;
      await page.screenshot({ path: enhancementOptionPath, fullPage: true });
      console.log(`Enhancement option screenshot: ${enhancementOptionPath}`);
      
      // Test clicking the enhancement option
      console.log('Testing OpenLibrary enhancement...');
      const enhanceButton = await page.$('.MuiAlert-root button');
      if (enhanceButton) {
        await enhanceButton.click();
        console.log('Clicked OpenLibrary enhancement button');
        
        // Wait for enhanced results
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Take screenshot of enhanced results
        const enhancedResultsPath = `${screenshotsDir}/progressive-search-enhanced-results_${timestamp}.png`;
        await page.screenshot({ path: enhancedResultsPath, fullPage: true });
        console.log(`Enhanced results screenshot: ${enhancedResultsPath}`);
        
        // Verify enhanced chip is displayed
        const enhancedChip = await page.$('.MuiChip-root');
        if (enhancedChip) {
          const chipText = await page.evaluate(el => el.textContent, enhancedChip);
          if (chipText.includes('Enhanced with OpenLibrary')) {
            console.log('✅ Enhanced with OpenLibrary chip displayed');
          }
        }
        
        // Check for source attribution chips on results
        const sourceChips = await page.$$('.MuiChip-root[title*="Books"], .MuiChip-root[title*="Library"]');
        if (sourceChips.length > 0) {
          console.log(`✅ Found ${sourceChips.length} source attribution chips`);
        } else {
          console.log('⚠️  No source attribution chips found');
        }
      }
    }
  } else {
    console.log('⚠️  OpenLibrary enhancement option not found');
  }
  
  // Test another search to verify consistent behavior
  console.log('Testing second search for consistency...');
  await searchForBooks(page, 'Tolkien');
  
  const secondSearchPath = `${screenshotsDir}/progressive-search-second-search_${timestamp}.png`;
  await page.screenshot({ path: secondSearchPath, fullPage: true });
  console.log(`Second search screenshot: ${secondSearchPath}`);
  
  console.log('Progressive search test completed!');
}

// Utility functions
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

async function searchForBooks(page, searchTerm) {
  console.log(`Searching for: ${searchTerm}`);
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
  
  // Clear existing search
  await page.click('input[placeholder*="Search"]', { clickCount: 3 });
  await page.type('input[placeholder*="Search"]', searchTerm);
  await page.keyboard.press('Enter');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await dismissCookieNotification(page);
}

runTest().catch(console.error);