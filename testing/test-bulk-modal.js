const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
require('dotenv').config({ path: '../.env.local' });

async function testBulkModal() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  let nextProcess = null;
  let workerProcess = null;
  
  const screenshotsDir = './screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

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

  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null, // Use full screen viewport
    args: ['--start-maximized'] // Start maximized
  });
  
  const page = await browser.newPage();
  
  // Set viewport to full screen
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Starting bulk modal test...');
    
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
    
    // Navigate to add books page
    console.log('Navigating to add books...');
    await page.goto('http://localhost:3000/add-books', { waitUntil: 'networkidle2' });
    
    // Wait for the page to fully load and permissions to be checked
    console.log('Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for permission warnings after waiting
    const permissionWarning = await page.$('[data-testid="permission-warning"], .MuiAlert-root');
    if (permissionWarning) {
      const warningText = await page.evaluate(el => el.textContent, permissionWarning);
      console.log('Permission warning found:', warningText);
      // If there's still a permission warning, let's try waiting a bit more
      console.log('Waiting longer for permissions to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Search for a book to add some results
    console.log('Searching for books...');
    await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
    await page.type('input[placeholder*="Search"]', 'Agatha Christie');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for search results
    
    // Dismiss cookie notification again if it appeared
    console.log('Checking for cookie notification after search...');
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
    
    // Select some books by clicking "Select" buttons (only on books not already in library)
    console.log('Selecting books that are not already in library...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for results to fully load
    
    // Find all "Select" buttons and click them
    const allButtons = await page.$$('button');
    let selectedCount = 0;
    
    for (let i = 0; i < allButtons.length && selectedCount < 3; i++) {
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
    
    if (selectedCount === 0) {
      console.log('No Select buttons found, looking for any clickable selection elements...');
      // Fallback: try clicking any checkboxes
      const allCheckboxes = await page.$$('input[type="checkbox"]');
      for (let i = 0; i < Math.min(3, allCheckboxes.length); i++) {
        await allCheckboxes[i].click();
        selectedCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(`Fallback: Selected ${selectedCount} books via checkboxes`);
    }
    
    // Look for cart or review functionality on the add-books page
    console.log('Looking for cart or review functionality on add-books page...');
    
    // Wait a moment for any UI updates after selecting books
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TanStack DevTools removed, so cart button should be accessible now
    console.log('TanStack DevTools removed - cart button should be accessible');
    
    // Take a screenshot to see current state
    const debugScreenPath = `${screenshotsDir}/debug-after-selection_${timestamp}.png`;
    await page.screenshot({ 
      path: debugScreenPath,
      fullPage: true 
    });
    console.log(`Debug screenshot saved as ${debugScreenPath}`);
    
    // Look specifically for the blue circular cart button in bottom-right
    console.log('Looking for the blue circular cart button...');
    let cartFound = false;
    
    // Use coordinate-based clicking for the cart button since it's visible in bottom-right
    console.log('Trying to click cart button by coordinates...');
    const viewport = await page.viewport();
    const cartX = viewport.width - 50; // 50px from right edge
    const cartY = viewport.height - 50; // 50px from bottom edge
    
    console.log(`Clicking coordinates: (${cartX}, ${cartY})`);
    await page.mouse.click(cartX, cartY);
    cartFound = true;
    
    console.log('Clicked cart button coordinates');
    
    if (!cartFound) {
      console.log('Looking for badge elements with count...');
      // Try to find badges or notifications
      const elementsWithBadge = await page.$$('[data-badge], .MuiBadge-root, .badge, [aria-label*="3"], [title*="3"]');
      for (const element of elementsWithBadge) {
        const text = await page.evaluate(el => el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '', element);
        console.log(`Found badge element: "${text}"`);
        
        // Click the element itself or its parent
        try {
          await element.click();
          cartFound = true;
          console.log('Clicked badge element');
          break;
        } catch (error) {
          console.log('Badge element not clickable, trying parent...');
          const parent = await element.evaluateHandle(el => el.parentElement);
          if (parent) {
            try {
              await parent.click();
              cartFound = true;
              console.log('Clicked badge parent element');
              break;
            } catch (e) {
              console.log('Parent also not clickable');
            }
          }
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click the "Review and Add" button in the cart dialog
    console.log('Looking for "Review and Add" button in cart dialog...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for cart dialog to open
    
    const reviewButtons = await page.$$('button');
    let reviewButtonFound = false;
    
    for (const button of reviewButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Review and Add') || (text.includes('Review') && text.includes('3'))) {
        console.log(`Found and clicking button: "${text}"`);
        await button.click();
        reviewButtonFound = true;
        break;
      }
    }
    
    if (!reviewButtonFound) {
      console.log('Review and Add button not found, looking for any button with "Review"...');
      for (const button of reviewButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Review') && !text.includes('Selected')) {
          console.log(`Found fallback review button: "${text}"`);
          await button.click();
          reviewButtonFound = true;
          break;
        }
      }
    }
    
    if (reviewButtonFound) {
      console.log('Successfully clicked Review and Add button');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for modal to open
    } else {
      console.log('No Review and Add button found');
    }
    
    // Take screenshot of the modal
    console.log('Taking screenshot of bulk modal...');
    const modalScreenPath = `${screenshotsDir}/bulk-modal_${timestamp}.png`;
    await page.screenshot({ 
      path: modalScreenPath,
      fullPage: true 
    });
    console.log(`Bulk modal screenshot saved as ${modalScreenPath}`);
    
    // Scroll down to see the summary section better
    await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take another screenshot focused on the summary
    const summaryScreenPath = `${screenshotsDir}/bulk-modal-summary_${timestamp}.png`;
    await page.screenshot({ 
      path: summaryScreenPath,
      fullPage: true 
    });
    console.log(`Summary screenshot saved as ${summaryScreenPath}`);
    
  } catch (error) {
    console.error('Error during bulk modal test:', error);
    
    // Take debug screenshot
    const debugScreenPath = `${screenshotsDir}/debug-bulk-modal-error_${timestamp}.png`;
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

testBulkModal();