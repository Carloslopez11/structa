const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Listen to console logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        
        // Listen to alerts
        page.on('dialog', async dialog => {
            console.log('ALERT RECEIVED:', dialog.message());
            await dialog.accept();
        });

        // Listen to page errors
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Opening app.html...');
        await page.goto('file:///c:/Users/javib/structa/app.html', { waitUntil: 'networkidle0' });

        console.log('Injecting admin email...');
        await page.evaluate(() => {
            const input = document.getElementById('email');
            if (input) input.value = 'javibillo29@gmail.com';
        });

        console.log('Clicking Digital Takeoff button...');
        await page.evaluate(() => {
            window.openTakeoff();
        });

        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Uploading dummy.png...');
        // Find the file input inside takeoffModal
        const fileInput = await page.$('#takeoffModal input[type="file"]');
        if (fileInput) {
            await fileInput.uploadFile(path.resolve('dummy.png'));
            console.log('File uploaded via Puppeteer.');
        } else {
            console.log('File input not found.');
        }

        await new Promise(r => setTimeout(r, 2000));

        // Check if img object is loaded in TakeoffTool
        const imageStatus = await page.evaluate(() => {
            if (!window.TakeoffTool) return 'TakeoffTool undefined';
            if (!window.TakeoffTool.img) return 'img object not set';
            return 'img loaded, width: ' + window.TakeoffTool.img.width;
        });

        console.log('TakeoffTool Image Status:', imageStatus);

        await browser.close();
    } catch(e) {
        console.error('Test script error:', e);
    }
})();
