const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('http://127.0.0.1:43187');
        await page.getByRole('button', { name: '開始任務', exact: true }).waitFor();
        await page.evaluate(async () => {
            const { GameEngine } = await import('/src/logic/GameEngine.js');
            const start = GameEngine.prototype.start;
            GameEngine.prototype.start = function (...args) {
                window.testEngine = this;
                return start.apply(this, args);
            };
        });
        await page.getByRole('button', { name: '乘法', exact: true }).click();
        await page.getByRole('button', { name: '困難', exact: true }).click();
        await page.getByRole('button', { name: '開始任務', exact: true }).click();
        await page.locator('.hud').waitFor();
        for (let i = 0; i < 3; i++) {
            await page.locator('.pause-btn').click();
            assert.equal(await page.evaluate(() => window.testEngine.paused), true);
            await page.getByRole('button', { name: '繼續遊戲', exact: true }).click();
        }
        await page.evaluate(() => { window.testEngine.score = window.testEngine.winningScore; });
        await page.locator('.gameover-screen').waitFor();
        await page.getByRole('button', { name: '重新任務', exact: true }).click();
        await page.locator('.hud').waitFor();
        assert.deepEqual(await page.evaluate(() => window.testEngine.settings),
            { mode: 'mul', difficulty: 'hard' });
        await page.locator('.pause-btn').click();
        await page.getByRole('button', { name: '離開遊戲', exact: true }).click();
        await page.locator('.start-screen').waitFor();
        assert.equal(await page.evaluate(() => window.testEngine.state), 'idle');
        assert.equal(await page.evaluate(() => window.testEngine.frameId), null);
        await page.setViewportSize({ width: 375, height: 667 });
        assert.ok(await page.locator('.start-btn').isVisible());
        assert.deepEqual(errors, []);
        console.log('PASS: 桌面開始、三次暫停恢復、勝利、保留設定重試、離開與手機尺寸首頁；無頁面錯誤。');
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
