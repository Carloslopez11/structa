const puppeteer = require('puppeteer');

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

        console.log('Looking for Digital Takeoff button...');
        const buttonText = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const takeoffBtn = btns.find(b => b.textContent.includes('Digital Takeoff'));
            if (!takeoffBtn) return 'Button not found';
            takeoffBtn.click();
            return 'Button clicked!';
        });
        
        console.log(buttonText);

        await new Promise(r => setTimeout(r, 2000));
        
        const modalDisplay = await page.evaluate(() => {
            const modal = document.getElementById('takeoffModal');
            return modal ? modal.style.display : 'Modal not found in DOM';
        });

        console.log('Takeoff Modal display style:', modalDisplay);

        await browser.close();
    } catch(e) {
        console.error('Test script error:', e);
    }
})();
