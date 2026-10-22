const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        // 僅在測試瀏覽器回應中擷取正式引擎，不在產品加入測試掛鉤。
        await page.route('**/src/logic/GameEngine.js*', async (route) => {
            const response = await route.fetch();
            const source = await response.text();
            await route.fulfill({ response, body: source.replace('constructor(canvas, callbacks) {',
                'constructor(canvas, callbacks) { window.testEngine = this;') });
        });
        await page.goto('http://127.0.0.1:43187');
        await page.getByRole('button', { name: '開始任務', exact: true }).waitFor();
        for (const [name, goal, speed] of [['簡單', 250, 0.35], ['中等', 350, 0.5], ['困難', 400, 0.65]]) {
            await page.getByRole('button', { name, exact: true }).click();
            assert.ok((await page.locator('.difficulty-summary').textContent()).includes(String(goal)));
            await page.getByRole('button', { name: '開始任務', exact: true }).click();
            await page.locator('.hud').waitFor();
            assert.equal(await page.evaluate(() => window.testEngine.difficulty.baseSpeed), speed);
            assert.ok((await page.locator('.mission-progress').textContent()).includes(String(goal / 10)));
            await page.locator('.pause-btn').click();
            await page.getByRole('button', { name: '離開遊戲', exact: true }).click();
        }
        await page.getByRole('button', { name: '乘法', exact: true }).click();
        await page.getByRole('button', { name: '困難', exact: true }).click();
        await page.getByRole('button', { name: '開始任務', exact: true }).click();
        await page.locator('.hud').waitFor();
        await page.evaluate(() => {
            const engine = window.testEngine;
            engine.entityManager.addMonster({ x: engine.entityManager.player.x,
                y: engine.entityManager.player.y - 150, speed: 0.5,
                equation: '2 + 3 = ?', answer: 5, options: [4, 5, 6] });
            engine.updateOptions();
        });
        await page.getByRole('button', { name: '5', exact: true }).waitFor();
        await page.getByRole('button', { name: '4', exact: true }).click();
        await page.getByRole('button', { name: '4', exact: true }).click();
        await page.locator('.learning-hint').waitFor();
        await page.keyboard.press('2');
        await page.waitForFunction(() => window.testEngine.score === 10);
        assert.equal(await page.locator('.learning-hint').count(), 0);
        await page.locator('.mute-btn').click();
        for (let i = 0; i < 3; i++) {
            await page.locator('.pause-btn').click();
            assert.equal(await page.evaluate(() => window.testEngine.paused), true);
            await page.getByRole('button', { name: '繼續遊戲', exact: true }).click();
        }
        await page.evaluate(() => { window.testEngine.score = window.testEngine.winningScore; });
        await page.locator('.gameover-screen').waitFor();
        await page.getByRole('button', { name: '重新任務', exact: true }).click();
        await page.locator('.hud').waitFor();
        assert.equal(await page.locator('.mute-btn').getAttribute('aria-label'), '開啟聲音');
        assert.deepEqual(await page.evaluate(() => window.testEngine.settings),
            { sessionType: 'arcade', mode: 'mul', difficulty: 'hard' });
        await page.locator('.pause-btn').click();
        await page.getByRole('button', { name: '離開遊戲', exact: true }).click();
        await page.locator('.start-screen').waitFor();
        assert.equal(await page.evaluate(() => window.testEngine.state), 'idle');
        assert.equal(await page.evaluate(() => window.testEngine.frameId), null);
        await page.setViewportSize({ width: 375, height: 667 });
        assert.ok(await page.locator('.start-btn').isVisible());
        await page.locator('.start-btn').click();
        await page.locator('.hud').waitFor();
        const progressBox = await page.locator('.mission-progress').boundingBox();
        assert.ok(progressBox.x >= 0 && progressBox.x + progressBox.width <= 375);
        await page.evaluate(() => {
            const engine = window.testEngine;
            engine.entityManager.monsters = [];
            engine.entityManager.addMonster({ x: 187, y: 200, speed: 0.1,
                equation: '8 + 5 = ?', answer: 13, options: [12, 13, 14] });
            engine.updateOptions();
        });
        await page.getByRole('button', { name: '12', exact: true }).click();
        await page.getByRole('button', { name: '12', exact: true }).click();
        await page.locator('.learning-hint').waitFor();
        assert.ok((await page.locator('.learning-hint').textContent()).includes('8 + 2 + 3'));
        const hintBox = await page.locator('.learning-hint').boundingBox();
        assert.ok(hintBox.x >= 0 && hintBox.x + hintBox.width <= 375);
        await page.screenshot({ path: 'scripts/mobile.tmp', type: 'png' });
        await page.locator('.pause-btn').click();
        await page.getByRole('button', { name: '離開遊戲', exact: true }).click();
        const highScoreBefore = await page.evaluate(() => localStorage.getItem('mathMonstersHighScore'));
        await page.getByRole('button', { name: '十題練習', exact: true }).click();
        await page.locator('.start-btn').click();
        for (let index = 0; index < 10; index++) {
            await page.waitForFunction(() => window.testEngine.entityManager.monsters.some(m => m.alive));
            const question = await page.evaluate(() => {
                const engine = window.testEngine;
                const monster = engine.entityManager.monsters.find(m => m.alive);
                monster.x = engine.entityManager.player.x;
                monster.y = engine.entityManager.player.y - 100;
                monster.scale = 1;
                engine.updateOptions();
                return { answer: monster.answer, wrong: monster.options.find(v => v !== monster.answer) };
            });
            if (index === 9) {
                await page.evaluate(() => { window.testEngine.entityManager.monsters[0].y = 2000; });
            } else {
                if (index < 2) {
                    await page.getByRole('button', { name: String(question.wrong), exact: true }).click();
                }
                await page.getByRole('button', { name: String(question.answer), exact: true }).click();
            }
            await page.waitForFunction(count => window.testEngine.practice.records.length === count, index + 1);
        }
        await page.locator('.practice-summary').waitFor();
        assert.ok((await page.locator('.practice-summary').textContent()).includes('70%'));
        assert.equal(await page.locator('.practice-summary li').count(), 3);
        assert.equal(await page.evaluate(() => localStorage.getItem('mathMonstersHighScore')), highScoreBefore);
        const retryBox = await page.getByRole('button', { name: '重新任務', exact: true }).boundingBox();
        assert.ok(retryBox.y >= 0 && retryBox.y + retryBox.height <= 667);
        await page.screenshot({ path: 'scripts/practice-mobile.tmp', type: 'png' });
        await page.getByRole('button', { name: '重新任務', exact: true }).click();
        assert.equal(await page.evaluate(() => window.testEngine.practice.records.length), 0);
        await page.locator('.pause-btn').click();
        await page.getByRole('button', { name: '離開遊戲', exact: true }).click();
        await page.getByRole('button', { name: 'EN', exact: true }).click();
        await page.getByRole('button', { name: '10-question practice', exact: true }).click();
        await page.locator('.start-btn').click();
        await page.evaluate(() => {
            const engine = window.testEngine;
            for (let i = 0; i < 10; i++) {
                engine.spawnMonster();
                engine.entityManager.monsters[0].y = 2000;
                engine.update(16);
            }
        });
        await page.getByRole('heading', { name: 'Practice complete!', exact: true }).waitFor();
        assert.equal(await page.locator('.practice-summary li').count(), 10);
        assert.deepEqual(errors, []);
        console.log('PASS: 三難度、鍵盤命中、暫停重試、靜音、手機提示、中英十題摘要與複習、最高分隔離；無頁面錯誤。');
    } finally {
        await browser.close();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
