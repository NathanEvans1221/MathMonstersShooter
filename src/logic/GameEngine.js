import { MathSystem } from './MathSystem.js';
import { EntityManager } from './EntityManager.js';
import { Collision } from './Collision.js';
import { SoundManager } from './SoundManager.js';

/**
 * 遊戲核心引擎
 * 負責處理遊戲狀態、更新邏輯、畫面渲染以及模組間的協調
 */
export class GameEngine {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.mathSystem = new MathSystem();
        this.entityManager = new EntityManager();

        this.width = canvas.width;
        this.height = canvas.height;

        this.state = 'idle'; // 遊戲狀態: idle, playing, gameover, gamewin
        this.targetMonster = null; // 當前鎖定的怪物目標
        this.lastTime = 0; // 上一次更新的時間戳
        this.spawnTimer = 0; // 怪物生成計時器
        this.spawnInterval = 2500; // 怪物生成間隔 (毫秒)
        this.slowDownTimer = 0; // 減速效果剩餘時間
        this.levelUpRestTimer = 0; // 升級後的休息緩衝時間
        this.consecutiveWrong = 0; // 連續答錯次數
        this.victoryTimer = null; // 勝利後的延遲計時器
        this.bulletRadius = 5; // 初始子彈半徑

        this.score = 0; // 當前分數
        this.lives = 3; // 剩餘生命
        this.level = 1; // 當前等級
        this.scaleFactor = 1; // 畫面縮放比例 (基準寬度 600px)

        this.clouds = []; // 背景雲朵
        this.initClouds();

        this.paused = false; // 是否暫停中

        this.loop = this.loop.bind(this);
    }

    /**
     * 初始化引擎
     */
    init() {
        this.entityManager.reset();
    }

    /**
     * 設定暫停或恢復遊戲
     * @param {boolean} val - 是否暫停
     */
    setPaused(val) {
        this.paused = val;
        if (val) {
            SoundManager.pauseBGM();
        } else {
            SoundManager.resumeBGM();
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    /**
     * 處理畫布尺寸變更
     * @param {number} w - 新寬度
     * @param {number} h - 新高度
     */
    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;

        // 計算縮放比例 (以 600px 為基準)
        this.scaleFactor = Math.min(1, w / 600);

        if (this.entityManager.player) {
            this.entityManager.player.x = w / 2;
            this.entityManager.player.y = h - (350 * Math.max(0.6, this.scaleFactor));
        }
        this.draw(); // 暫停時若縮放也需要重繪
    }

    /**
     * 開始新遊戲
     * @param {Object} settings - 包含 mode 與 difficulty
     */
    start(settings = {}) {
        const { mode = 'add', difficulty = 'medium' } = settings;

        switch (difficulty) {
            case 'easy': this.winningScore = 300; break;
            case 'medium': this.winningScore = 350; break;
            case 'hard': this.winningScore = 400; break;
            default: this.winningScore = 350;
        }

        this.mathSystem.setMode(mode);
        if (this.victoryTimer) clearTimeout(this.victoryTimer);
        this.score = 0;
        this.bulletRadius = 5;
        this.lives = 3;
        this.level = 1;
        this.spawnInterval = 2500;
        this.slowDownTimer = 0;
        this.levelUpRestTimer = 0;
        this.consecutiveWrong = 0;
        this.entityManager.reset();
        this.paused = false;
        this.state = 'playing';

        // 設定玩家初始位置
        this.entityManager.player.x = this.width / 2;
        this.entityManager.player.y = this.height - (350 * Math.max(0.6, this.scaleFactor));


        this.callbacks.onScore(this.score);
        this.callbacks.onLives(this.lives);
        this.callbacks.onOptions([]);

        SoundManager.playBGM(); // 開始播放背景音樂

        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    /**
     * 恢復遊戲
     */
    resume() {
        if (this.state !== 'playing' || this.paused) {
            this.state = 'playing';
            this.paused = false;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    /**
     * 停止遊戲
     */
    stop() {
        if (this.victoryTimer) clearTimeout(this.victoryTimer);
        this.state = 'idle';
        SoundManager.stopBGM();
    }

    /**
     * 處理玩家輸入的答案
     * @param {number} value - 選取的答案數值
     */
    handleAnswer(value) {
        if (this.state !== 'playing' || this.paused) return;

        const closestMonster = this.getClosestMonster();
        if (!closestMonster) return;

        if (closestMonster.answer === value) {
            // 答對了
            this.consecutiveWrong = 0; // 重設連續錯誤計數
            SoundManager.shoot();
            this.entityManager.addBullet(
                this.entityManager.player.x,
                this.entityManager.player.y,
                closestMonster.x,
                closestMonster.y,
                this.bulletRadius
            );
            // 答對會增加子彈大小（威力感）
            this.bulletRadius = Math.min(25, this.bulletRadius + 2);
        } else {
            // 答錯了
            this.consecutiveWrong++;
            SoundManager.wrong();
            this.slowDownTimer = 5000; // 減速 5 秒作為緩衝

            // 答錯會減少子彈大小
            this.bulletRadius = Math.max(5, this.bulletRadius - 2);

            this.callbacks.onWrongAnswer && this.callbacks.onWrongAnswer();
        }
    }

    /**
     * 獲取目前離玩家最近（最下方）且可被射擊的怪物
     */
    getClosestMonster() {
        let lowest = null;
        let maxY = -Infinity;
        const playerY = this.entityManager.player.y;

        for (let m of this.entityManager.monsters) {
            // 忽略已死亡或太靠近玩家（已經重疊）的怪物
            // 緩衝區設為 60px (怪物半徑 + 玩家半徑)
            if (m.y > maxY && m.alive && m.y < (playerY - 60 * this.scaleFactor)) {
                maxY = m.y;
                lowest = m;
            }
        }
        return lowest;
    }

    /**
     * 遊戲主迴圈
     */
    loop(timestamp) {
        if (this.state !== 'playing') return;
        if (this.paused) return;

        let dt = timestamp - this.lastTime;
        // 修正負值的 dt (部分瀏覽器 performance.now 可能與 rAF timestamp 有微小差異)
        if (dt < 0) dt = 0;

        const safeDt = Math.min(dt, 50); // 避免掉幀時數值過大
        this.lastTime = timestamp;

        this.update(safeDt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    /**
     * 更新遊戲邏輯
     * @param {number} dt - delta time (毫秒)
     */
    update(dt) {
        this.updateClouds(dt); // 更新背景雲朵

        // 0. 勝利判定
        if (this.score >= this.winningScore) {
            this.gameWin();
            return;
        }

        // 1. 等級管理
        if (this.score > this.level * 100) {
            this.level++;
            // 等級越高生成間隔越短，最小 1 秒
            this.spawnInterval = Math.max(1000, 2500 - (this.level * 150));
            this.levelUpRestTimer = 5000; // 升級後給予 5 秒的減速緩衝
        }

        // 2. 怪物生成邏輯
        this.spawnTimer += dt;
        const currentCount = this.entityManager.monsters.length;

        // 尋找最高（Y值最小）的怪物，確保生成時有垂直間隔，避免重疊
        let highestY = Infinity;
        for (let m of this.entityManager.monsters) {
            if (m.alive && m.y < highestY) highestY = m.y;
        }

        // 基礎間隔 ~200px
        // 規則：每擊殺一隻，間隔縮減 1% (即每 10 次擊殺縮減約 10%)
        const kills = Math.floor(this.score / 10);
        const baseGap = 200;
        const dynamicGap = baseGap * Math.pow(0.99, kills);
        const minGap = Math.max(90, dynamicGap);

        const canSpawn = (highestY === Infinity) || (highestY > (-50 + minGap));

        // 如果場上怪物少於 3 隻且間隔超過 0.5 秒，強制嘗試生成
        if (currentCount < 3 && this.spawnTimer > 500) {
            if (canSpawn) {
                this.spawnMonster();
                this.spawnTimer = 0;
            }
        }
        // 正常生成間隔，上限 5 隻
        else if (this.spawnTimer > this.spawnInterval) {
            if (currentCount < 5 && canSpawn) {
                this.spawnMonster();
                this.spawnTimer = 0;
            }
        }

        // 3. 更新實體位置
        const speedFactor = dt / 16.66; // 以 60fps 為基準的係數

        // 處理全局減速效果
        let globalSpeedMultiplier = 1;

        // 答錯減速
        if (this.slowDownTimer > 0) {
            this.slowDownTimer -= dt;
            globalSpeedMultiplier *= 0.5; // 基礎減速 50%

            // 連續出錯時給予更多寬限
            if (this.consecutiveWrong > 1) {
                globalSpeedMultiplier *= 0.8; // 再額外減速 20%
            }
        }

        // 升級緩衝減速
        if (this.levelUpRestTimer > 0) {
            this.levelUpRestTimer -= dt;
            globalSpeedMultiplier *= 0.8; // 減速 20%
        }

        const escapedCount = this.entityManager.update(speedFactor, this.width, this.height, globalSpeedMultiplier);

        // 處理怪逃脫
        if (escapedCount && escapedCount > 0) {
            for (let i = 0; i < escapedCount; i++) {
                SoundManager.wrong();
                this.lives--;
            }
            this.callbacks.onLives(this.lives);
            this.callbacks.onWrongAnswer();
            if (this.lives <= 0) this.gameOver();

            this.updateOptions();
        }

        // 4. 碰撞偵測
        this.checkCollisions();

        // 5. 更新 UI 選項按鈕
        this.updateOptions();
    }

    /**
     * 生成一隻新怪物
     */
    spawnMonster() {
        const problem = this.mathSystem.generateProblem();

        // 計算安全的 X 座標，避免文字超出邊界
        const fs = Math.max(16, Math.floor(24 * this.scaleFactor * 1.5));
        this.ctx.font = `bold ${fs}px "Arial Rounded MT Bold", "ZhuyinFont", sans-serif`;
        const textW = this.ctx.measureText(problem.equation).width;

        const minX = textW / 2 + 20; // 20px 邊距
        const maxX = this.width - textW / 2 - 20;

        let x;
        if (maxX > minX) {
            x = Math.random() * (maxX - minX) + minX;
        } else {
            x = this.width / 2;
        }

        // 速度隨擊殺數增加：基礎 0.5 + 每擊殺增加 10% (0.05)
        const kills = Math.floor(this.score / 10);
        const baseSpeed = 0.5;
        const speed = baseSpeed * (1 + 0.1 * kills);

        this.entityManager.addMonster({
            x: x,
            y: -50,
            speed: speed,
            equation: problem.equation,
            answer: problem.answer,
            color: this.getRandomColor(),
            options: problem.options
        });
    }

    /**
     * 獲取隨機粉嫩顏色（怪物外型）
     */
    getRandomColor() {
        const colors = [
            '#FFB7E1', // 粉紅
            '#A2E8FA', // 青藍
            '#D7F9F1', // 薄荷綠
            '#FFF5BA', // 奶油黃
            '#E0BBE4'  // 薰衣草紫
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 更新當前目標怪物及選項按鈕
     */
    updateOptions() {
        this.targetMonster = this.getClosestMonster();
        if (this.targetMonster) {
            this.callbacks.onOptions(this.targetMonster.options);
        } else {
            this.callbacks.onOptions([]);
        }
    }

    /**
     * 檢查子彈與怪物的碰撞
     */
    checkCollisions() {
        for (let b of this.entityManager.bullets) {
            for (let m of this.entityManager.monsters) {
                if (b.alive && m.alive && Collision.checkCircle(b, m)) {
                    b.alive = false;
                    m.alive = false;
                    SoundManager.explosion();
                    this.entityManager.createExplosion(m.x, m.y, m.color);
                    this.score += 10;
                    this.callbacks.onScore(this.score);
                    this.callbacks.onCorrectAnswer && this.callbacks.onCorrectAnswer();
                }
            }
        }
    }

    /**
     * 遊戲失敗處理
     */
    gameOver() {
        this.state = 'gameover';
        SoundManager.stopBGM();
        this.callbacks.onGameOver(this.score, false);
    }

    /**
     * 遊戲勝利處理
     */
    gameWin() {
        this.state = 'gamewin';
        SoundManager.playVictoryBGM();

        // 延遲 10 秒才顯示結算畫面，讓玩家沉浸在慶祝音樂中
        if (this.victoryTimer) clearTimeout(this.victoryTimer);
        this.victoryTimer = setTimeout(() => {
            this.callbacks.onGameOver(this.score, true);
        }, 10000);
    }

    /**
     * 渲染遊戲畫面
     */
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 繪製背景雲朵
        this.drawClouds();

        // 繪製玩家 (可愛的小飛船)
        const p = this.entityManager.player;
        const ctx = this.ctx;

        ctx.fillStyle = '#FFB7E1'; // 粉色主體

        // 身體 (橢圓)
        const s = this.scaleFactor;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 25 * s, 35 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // 翅膀
        ctx.fillStyle = '#A2E8FA'; // 青色翅膀
        ctx.beginPath();
        ctx.ellipse(p.x - 25 * s, p.y + 10 * s, 15 * s, 10 * s, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(p.x + 25 * s, p.y + 10 * s, 15 * s, 10 * s, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 駕駛艙
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();

        // 繪製怪物
        const fs = Math.max(16, Math.floor(24 * this.scaleFactor * 1.5));
        this.ctx.font = `bold ${fs}px "Arial Rounded MT Bold", "ZhuyinFont", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let m of this.entityManager.monsters) {
            if (!m.alive) continue;

            this.ctx.fillStyle = m.color;

            // 繪製怪物身體 (圓形)
            this.ctx.beginPath();
            const bodyR = Math.max(0, m.radius * m.scale * this.scaleFactor);
            this.ctx.arc(m.x, m.y, bodyR, 0, Math.PI * 2);
            this.ctx.fill();

            // 繪製耳朵 (可愛小熊風格)
            const r = Math.max(0, m.radius * m.scale * this.scaleFactor);
            this.ctx.beginPath();
            this.ctx.arc(m.x - r * 0.7, m.y - r * 0.7, r * 0.4, 0, Math.PI * 2); // 左耳
            this.ctx.arc(m.x + r * 0.7, m.y - r * 0.7, r * 0.4, 0, Math.PI * 2); // 右耳
            this.ctx.fill();

            if (m.scale > 0.8) {
                // 為算式增加背景半透明圓角框，確保在任何背景顏色下都清晰
                const textW = this.ctx.measureText(m.equation).width;
                const textH = 26;
                const padding = 10;

                const bx = m.x - textW / 2 - padding / 2;
                const by = m.y - textH / 2;
                const bw = textW + padding;
                const bh = textH;
                const br = 8;

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                this.ctx.beginPath();
                this.ctx.moveTo(bx + br, by);
                this.ctx.lineTo(bx + bw - br, by);
                this.ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
                this.ctx.lineTo(bx + bw, by + bh - br);
                this.ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
                this.ctx.lineTo(bx + br, by + bh);
                this.ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
                this.ctx.lineTo(bx, by + br);
                this.ctx.quadraticCurveTo(bx, by, bx + br, by);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#4A4A4A'; // 算式文字顏色 (深灰色)
                this.ctx.fillText(m.equation, m.x, m.y);
            }

            // 繪製瞄準提示 (下方的紅色橫線)
            if (m === this.targetMonster) {
                const textW = this.ctx.measureText(m.equation).width;
                const lineY = m.y + (fs * 0.6);

                this.ctx.strokeStyle = '#FF3366';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(m.x - textW / 2, lineY);
                this.ctx.lineTo(m.x + textW / 2, lineY);
                this.ctx.stroke();
            }
        }

        // 繪製子彈
        this.ctx.fillStyle = '#FFFF00';
        for (let b of this.entityManager.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius * this.scaleFactor, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // 繪製爆炸粒子
        for (let pt of this.entityManager.particles) {
            this.ctx.globalAlpha = pt.life;
            this.ctx.fillStyle = pt.color;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, Math.random() * 3 + 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }

    /**
     * 初始化背景雲朵
     */
    initClouds() {
        this.clouds = [];
        const count = 8;
        for (let i = 0; i < count; i++) {
            this.clouds.push(this.createCloud(true));
        }
    }

    /**
     * 創建一個隨機雲朵物件
     */
    createCloud(randomY = false) {
        const s = this.scaleFactor || 1;
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : -150 * s,
            speed: (Math.random() * 0.05 + 0.02) * s, // 緩慢飄動
            size: (Math.random() * 50 + 50),
            opacity: Math.random() * 0.15 + 0.05,
            puffs: Array.from({ length: 4 }, () => ({
                dx: (Math.random() - 0.5) * 80,
                dy: (Math.random() - 0.5) * 40,
                r: Math.random() * 0.4 + 0.6
            }))
        };
    }

    /**
     * 更新雲朵位置
     */
    updateClouds(dt) {
        const s = this.scaleFactor || 1;
        for (let i = 0; i < this.clouds.length; i++) {
            const c = this.clouds[i];
            c.y += c.speed * dt;
            // 飄出畫布後重置到上方
            if (c.y > this.height + 150 * s) {
                this.clouds[i] = this.createCloud(false);
            }
        }
    }

    /**
     * 繪製背景雲朵
     */
    drawClouds() {
        const s = this.scaleFactor || 1;
        for (let c of this.clouds) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
            this.ctx.beginPath();
            for (let p of c.puffs) {
                const cx = c.x + p.dx * s;
                const cy = c.y + p.dy * s;
                const r = c.size * p.r * s;
                this.ctx.moveTo(cx + r, cy);
                this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            }
            this.ctx.fill();
        }
    }
}

