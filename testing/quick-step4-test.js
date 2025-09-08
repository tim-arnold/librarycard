const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config({ path: '../.env.local' });

async function testStep4() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Starting test...');
    
    // Navigate to signin page (like the working screenshot.js)
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    
    const email = process.env.SCREENSHOT_USER;
    const password = process.env.SCREENSHOT_PASSWORD;
    
    if (!email || !password) {
      console.log('SCREENSHOT_USER and SCREENSHOT_PASSWORD must be set');
      return;
    }
    
    console.log('Signing in...');
    
    // Use the exact working login flow from screenshot.js
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Sign in with Email')) {
        await button.click();
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const emailInput = await page.$('input[type="email"], input[label="Email"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(email);
    }
    
    const passwordInput = await page.$('input[type="password"], input[label="Password"]');
    if (passwordInput) {
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(password);
    }
    
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    }
    
    console.log('Signed in, starting tour...');
    
    // Start tour from user menu
    await page.waitForSelector('[data-testid="AccountCircleIcon"]');
    await page.click('[data-testid="AccountCircleIcon"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Start Tour
    const menuItems = await page.$$('li, [role="menuitem"]');
    for (const item of menuItems) {
      const text = await item.evaluate(el => el.textContent);
      if (text && text.includes('Start Tour')) {
        await item.click();
        break;
      }
    }
    
    console.log('Tour started, navigating to step 4...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Next 3 times to reach step 4
    for (let i = 0; i < 3; i++) {
      const nextButtons = await page.$$('button');
      for (const button of nextButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Next')) {
          await button.click();
          console.log(`Clicked Next ${i + 1}`);
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log('Taking screenshot...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const timestamp = Date.now();
    const screenshotPath = path.join(__dirname, 'screenshots', `step4-current-${timestamp}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false 
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    console.log(`Compare with: ${path.join(__dirname, 'screenshots', 'step4-target.png')}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testStep4();