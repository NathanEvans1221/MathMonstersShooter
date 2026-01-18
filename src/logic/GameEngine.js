import { MathSystem } from './MathSystem.js';
import { EntityManager } from './EntityManager.js';
import { Collision } from './Collision.js';
import { SoundManager } from './SoundManager.js';

export class GameEngine {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.mathSystem = new MathSystem();
        this.entityManager = new EntityManager();

        this.width = canvas.width;
        this.height = canvas.height;

        this.state = 'idle';
        this.targetMonster = null; // Track current target
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2500;
        this.slowDownTimer = 0;

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.scaleFactor = 1; // Default scale

        this.paused = false; // Pause state

        this.loop = this.loop.bind(this);
    }

    init() {
        this.entityManager.reset();
    }

    // Pause control
    setPaused(val) {
        this.paused = val;
        if (!val) {
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;

        // Calculate scale factor (Base width 600px)
        this.scaleFactor = Math.min(1, w / 600);

        if (this.entityManager.player) {
            this.entityManager.player.x = w / 2;
            this.entityManager.player.y = h - (350 * Math.max(0.6, this.scaleFactor));
        }
        this.draw(); // Redraw on resize if paused
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.spawnInterval = 2500;
        this.slowDownTimer = 0;
        this.entityManager.reset();
        this.paused = false;
        this.state = 'playing';

        // Set player init pos
        this.entityManager.player.x = this.width / 2;
        this.entityManager.player.y = this.height - (350 * Math.max(0.6, this.scaleFactor));


        this.callbacks.onScore(this.score);
        this.callbacks.onLives(this.lives);
        this.callbacks.onOptions([]);

        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    resume() {
        if (this.state !== 'playing' || this.paused) {
            this.state = 'playing';
            this.paused = false;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop);
        }
    }

    stop() {
        this.state = 'idle';
    }

    handleAnswer(value) {
        if (this.state !== 'playing' || this.paused) return; // Ignore input if paused

        const closestMonster = this.getClosestMonster();
        if (!closestMonster) return;

        if (closestMonster.answer === value) {
            SoundManager.shoot();
            this.entityManager.addBullet(
                this.entityManager.player.x,
                this.entityManager.player.y,
                closestMonster.x,
                closestMonster.y
            );
        } else {
            SoundManager.wrong();
            this.slowDownTimer = 1000; // Slow down for 1 second
            this.callbacks.onWrongAnswer && this.callbacks.onWrongAnswer();
        }
    }

    getClosestMonster() {
        let lowest = null;
        let maxY = -Infinity;
        const playerY = this.entityManager.player.y;

        for (let m of this.entityManager.monsters) {
            // Ignore monsters that are already overlapping or past the player (too close to shoot)
            // Buffer of 60px (approx monster radius + player radius)
            if (m.y > maxY && m.alive && m.y < (playerY - 60 * this.scaleFactor)) {
                maxY = m.y;
                lowest = m;
            }
        }
        return lowest;
    }

    loop(timestamp) {
        if (this.state !== 'playing') return;
        if (this.paused) return; // Stop loop if paused

        let dt = timestamp - this.lastTime;
        // Fix for negative dt (if performance.now > rAF timestamp)
        if (dt < 0) dt = 0;

        const safeDt = Math.min(dt, 50);
        this.lastTime = timestamp;

        this.update(safeDt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        // 0. Win Condition
        if (this.score >= 500) {
            this.gameWin();
            return;
        }

        // 1. Level Management
        if (this.score > this.level * 100) {
            this.level++;
            this.spawnInterval = Math.max(1000, 2500 - (this.level * 150));
        }

        // 2. Spawning
        this.spawnTimer += dt;
        const currentCount = this.entityManager.monsters.length;

        // Check vertical spacing (Avoid crowding)
        // Find the highest monster (smallest y) to ensure gap
        let highestY = Infinity;
        for (let m of this.entityManager.monsters) {
            if (m.alive && m.y < highestY) highestY = m.y;
        }

        // Monster radius is ~40. Diameter ~80. 
        // Base gap ~200.
        // Rule: Reduce gap by 1% per kill. (Equivalent to ~10% per 10 kills).
        // Formula: 200 * (0.99 ^ score/10) -- assuming score is 10 per kill.
        // Kills = this.score / 10.
        const kills = Math.floor(this.score / 10);
        const baseGap = 200;
        const dynamicGap = baseGap * Math.pow(0.99, kills);
        const minGap = Math.max(90, dynamicGap);

        const canSpawn = (highestY === Infinity) || (highestY > (-50 + minGap));

        // Force spawn if less than 3 (and space allows)
        if (currentCount < 3 && this.spawnTimer > 500) {
            if (canSpawn) {
                this.spawnMonster();
                this.spawnTimer = 0;
            }
        }
        // Normal spawn interval up to 5 max
        else if (this.spawnTimer > this.spawnInterval) {
            if (currentCount < 5 && canSpawn) {
                this.spawnMonster();
                this.spawnTimer = 0;
            }
        }

        // 3. Update Entities 
        const speedFactor = dt / 16.66;

        // Handle slow down effect
        let globalSpeedMultiplier = 1;
        if (this.slowDownTimer > 0) {
            this.slowDownTimer -= dt;
            globalSpeedMultiplier = 0.5; // Slow down by half
        }

        const escapedCount = this.entityManager.update(speedFactor, this.width, this.height, globalSpeedMultiplier);

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

        // 4. Collision
        this.checkCollisions();

        // 5. Update UI Options
        this.updateOptions();
    }

    spawnMonster() {
        const problem = this.mathSystem.generateProblem();
        const margin = 50;
        const x = Math.random() * (this.width - margin * 2) + margin;

        // Calculate speed based on kills: Base 0.5 + 10% (0.05) per kill
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

    getRandomColor() {
        // Pastel / Macaron colors (Cute)
        const colors = [
            '#FFB7E1', // Pink
            '#A2E8FA', // Cyan
            '#D7F9F1', // Mint
            '#FFF5BA', // Cream Yellow
            '#E0BBE4'  // Lavender
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateOptions() {
        this.targetMonster = this.getClosestMonster();
        if (this.targetMonster) {
            this.callbacks.onOptions(this.targetMonster.options);
        } else {
            this.callbacks.onOptions([]);
        }
    }

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

    gameOver() {
        this.state = 'gameover';
        this.callbacks.onGameOver(this.score, false); // false = lost
    }

    gameWin() {
        this.state = 'gamewin';
        this.callbacks.onGameOver(this.score, true); // true = win
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Player (Cute Ship)
        const p = this.entityManager.player;
        const ctx = this.ctx;

        ctx.fillStyle = '#FFB7E1'; // Pink body

        // Body (Ellipse)
        const s = this.scaleFactor;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 25 * s, 35 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings (Rounded)
        ctx.fillStyle = '#A2E8FA'; // Cyan wings
        ctx.beginPath();
        ctx.ellipse(p.x - 25 * s, p.y + 10 * s, 15 * s, 10 * s, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(p.x + 25 * s, p.y + 10 * s, 15 * s, 10 * s, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit window
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10 * s, 10 * s, 0, Math.PI * 2);
        ctx.fill();

        // Draw Monsters
        // Draw Monsters
        // Draw Monsters
        const fs = Math.max(16, Math.floor(24 * this.scaleFactor * 1.5)); // Scale up by 1.5x
        this.ctx.font = `bold ${fs}px "Arial Rounded MT Bold", "ZhuyinFont", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let m of this.entityManager.monsters) {
            if (!m.alive) continue;

            this.ctx.fillStyle = m.color;

            // Draw Monster Body (Circle)
            this.ctx.beginPath();
            const bodyR = Math.max(0, m.radius * m.scale * this.scaleFactor);
            this.ctx.arc(m.x, m.y, bodyR, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw Ears (Cute Bear Style)
            const r = Math.max(0, m.radius * m.scale * this.scaleFactor); // Apply scaleFactor
            this.ctx.beginPath();
            this.ctx.arc(m.x - r * 0.7, m.y - r * 0.7, r * 0.4, 0, Math.PI * 2); // Left ear
            this.ctx.arc(m.x + r * 0.7, m.y - r * 0.7, r * 0.4, 0, Math.PI * 2); // Right ear
            this.ctx.fill();

            // Draw a cute face? 
            // Just eyes are enough to suggest "Monster" without cluttering the Equation
            // Actually, the equation is in the center. We can draw eyes above the equation?
            // Equation is 'bold 24px'. It takes center space.
            // Let's keep it simple shape-wise to readable text.
            // The "Ears" make it cute enough.

            if (m.scale > 0.8) {
                // Text Background for clarity
                const textW = this.ctx.measureText(m.equation).width;
                const textH = 26; // Approx font height
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

                this.ctx.fillStyle = '#4A4A4A'; // Dark text
                this.ctx.fillText(m.equation, m.x, m.y);
            }

            // Draw Targeting Indicator (Red Underline)
            if (m === this.targetMonster) {
                const textW = this.ctx.measureText(m.equation).width;
                const lineY = m.y + (fs * 0.6); // Slightly below center

                this.ctx.strokeStyle = '#FF3366'; // Red
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(m.x - textW / 2, lineY);
                this.ctx.lineTo(m.x + textW / 2, lineY);
                this.ctx.stroke();
            }
        }

        // Draw Bullets
        this.ctx.fillStyle = '#FFFF00';
        for (let b of this.entityManager.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius * this.scaleFactor, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.shadowBlur = 0;

        // Draw Particles
        for (let pt of this.entityManager.particles) {
            this.ctx.globalAlpha = pt.life;
            this.ctx.fillStyle = pt.color;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, Math.random() * 3 + 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }
}
