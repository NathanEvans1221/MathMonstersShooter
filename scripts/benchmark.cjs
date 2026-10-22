const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
        await page.route('**/src/logic/GameEngine.js*', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, body: (await response.text()).replace(
                'constructor(canvas, callbacks) {', 'constructor(canvas, callbacks) { window.testEngine = this;') });
        });
        await page.goto('http://127.0.0.1:43187');
        await page.locator('.start-btn').click();
        await page.locator('.hud').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(() => {
            const engine = window.testEngine;
            engine.stop();
            engine.entityManager.reset();
            for (let i = 0; i < 5; i++) engine.entityManager.addMonster({
                x: 300, y: 30 + i * 80, equation: `${i} + 3 = ?`, answer: i + 3,
                options: [i + 2, i + 3, i + 4], speed: 0.5 });
            engine.entityManager.monsters.forEach(m => { m.scale = 1; });
            let notifications = 0, measurements = 0;
            const notify = engine.callbacks.onOptions;
            engine.callbacks.onOptions = value => { notifications++; notify(value); };
            const measure = engine.ctx.measureText.bind(engine.ctx);
            engine.ctx.measureText = value => { measurements++; return measure(value); };
            const samples = [];
            for (let round = 0; round < 7; round++) {
                const start = performance.now();
                for (let frame = 0; frame < 1000; frame++) { engine.update(0); engine.draw(); }
                samples.push((performance.now() - start) / 1000);
            }
            samples.sort((a, b) => a - b);
            return { frames: 7000, monsters: 5, notifications, measurements,
                medianCpuMsPerFrame: samples[3], samples };
        });
        const reportPath = process.argv[2];
        if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify(result));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
