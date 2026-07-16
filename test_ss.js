const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Listen to console logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        // Intercept requests to mock auth
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('/api/auth/me')) {
                request.respond({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ email: 'javibillo29@gmail.com' })
                });
            } else {
                request.continue();
            }
        });
        
        console.log('Opening app.html...');
        await page.goto('file:///c:/Users/javib/structa/app.html', { waitUntil: 'networkidle0' });

        console.log('Injecting admin email...');
        await page.evaluate(() => {
            const input = document.getElementById('email');
            if (input) input.value = 'javibillo29@gmail.com';
        });

        console.log('Clicking Digital Takeoff button...');
        await page.evaluate(() => window.openTakeoff());
        
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Uploading dummy.png...');
        const fileInput = await page.$('#takeoffFileInput');
        if (fileInput) {
            await fileInput.uploadFile(path.resolve('dummy.png'));
            console.log('File uploaded via Puppeteer.');
        } else {
            console.log('File input not found.');
        }

        await new Promise(r => setTimeout(r, 2000));

        const statusText = await page.evaluate(() => {
            return document.getElementById('takeoffStatus').textContent;
        });
        console.log('Status text:', statusText);

        const canvasData = await page.evaluate(() => {
            const canvas = document.getElementById('takeoffCanvas');
            return canvas ? { width: canvas.width, height: canvas.height, cw: canvas.clientWidth, ch: canvas.clientHeight } : null;
        });
        console.log('Canvas metrics:', canvasData);

        const scale = await page.evaluate(() => window.TakeoffTool ? window.TakeoffTool.scale : null);
        console.log('TakeoffTool Scale:', scale);

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'takeoff_screenshot.png' });
        
        await browser.close();
        console.log('Done.');
    } catch(e) {
        console.error('Test script error:', e);
    }
})();
