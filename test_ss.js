const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('Opening app.html...');
        await page.goto('file:///c:/Users/javib/structa/app.html', { waitUntil: 'networkidle0' });

        await page.evaluate(() => {
            const input = document.getElementById('email');
            if (input) input.value = 'javibillo29@gmail.com';
        });

        console.log('Clicking Digital Takeoff button...');
        await page.evaluate(() => window.openTakeoff());
        
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Uploading dummy.png...');
        const fileInput = await page.$('#takeoffModal input[type="file"]');
        if (fileInput) {
            await fileInput.uploadFile(path.resolve('dummy.png'));
            console.log('File uploaded via Puppeteer.');
        }

        await new Promise(r => setTimeout(r, 2000));

        const statusText = await page.evaluate(() => {
            return document.getElementById('takeoffStatus').textContent;
        });
        console.log('Status text:', statusText);

        const canvasData = await page.evaluate(() => {
            const canvas = document.getElementById('takeoffCanvas');
            return { width: canvas.width, height: canvas.height, cw: canvas.clientWidth, ch: canvas.clientHeight };
        });
        console.log('Canvas metrics:', canvasData);

        const scale = await page.evaluate(() => window.TakeoffTool.scale);
        console.log('TakeoffTool Scale:', scale);

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'takeoff_screenshot.png' });
        
        await browser.close();
        console.log('Done.');
    } catch(e) {
        console.error('Test script error:', e);
    }
})();
