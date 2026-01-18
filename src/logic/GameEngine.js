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
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2500;

        this.score = 0;
        this.lives = 3;
        this.level = 1;

        this.loop = this.loop.bind(this);
    }

    init() {
        this.entityManager.reset();
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;
        if (this.entityManager.player) {
            this.entityManager.player.x = w / 2;
            this.entityManager.player.y = h - 180;
        }
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.spawnInterval = 2500;
        this.entityManager.reset();

        // Set player init pos
        this.entityManager.player.x = this.width / 2;
        this.entityManager.player.y = this.height - 180;

        this.state = 'playing';

        this.callbacks.onScore(this.score);
        this.callbacks.onLives(this.lives);
        this.callbacks.onOptions([]);

        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.state = 'idle';
    }

    handleAnswer(value) {
        if (this.state !== 'playing') return;

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
            this.callbacks.onWrongAnswer && this.callbacks.onWrongAnswer();
        }
    }

    getClosestMonster() {
        let lowest = null;
        let maxY = -Infinity;
        for (let m of this.entityManager.monsters) {
            if (m.y > maxY && m.alive) {
                maxY = m.y;
                lowest = m;
            }
        }
        return lowest;
    }

    loop(timestamp) {
        if (this.state !== 'playing') return;
        const dt = timestamp - this.lastTime;
        const safeDt = Math.min(dt, 50);
        this.lastTime = timestamp;

        this.update(safeDt);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
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
        // Rule: Reduce gap by 1/10 for every 10 kills (every level).
        // Formula: 200 * (0.9 ^ (level - 1))
        // Hard limit: 90 (slightly more than diameter to prevent overlap)
        const baseGap = 200;
        const dynamicGap = baseGap * Math.pow(0.9, this.level - 1);
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

        const escapedCount = this.entityManager.update(speedFactor, this.width, this.height);

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

        this.entityManager.addMonster({
            x: x,
            y: -50,
            speed: (0.5 + (this.level * 0.1)), // Slower speed for better playability
            equation: problem.equation,
            answer: problem.answer,
            color: this.getRandomColor(),
            options: problem.options
        });
    }

    getRandomColor() {
        // Darker shades to ensure white text is readable
        const colors = ['#C62828', '#1565C0', '#2E7D32', '#EF6C00', '#6A1B9A'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateOptions() {
        const closest = this.getClosestMonster();
        if (closest) {
            this.callbacks.onOptions(closest.options);
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
                }
            }
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.callbacks.onGameOver(this.score);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Player
        const p = this.entityManager.player;
        this.ctx.fillStyle = '#00F3FF';

        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y - 40);
        this.ctx.lineTo(p.x - 25, p.y + 20);
        this.ctx.lineTo(p.x + 25, p.y + 20);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw Monsters
        this.ctx.font = 'bold 24px "Arial Rounded MT Bold", "ZhuyinFont", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let m of this.entityManager.monsters) {
            if (!m.alive) continue;

            this.ctx.fillStyle = m.color;
            this.ctx.beginPath();
            this.ctx.arc(m.x, m.y, m.radius * m.scale, 0, Math.PI * 2);
            this.ctx.fill();


            this.ctx.fillStyle = '#FFFFFF';
            if (m.scale > 0.8) {
                this.ctx.fillText(m.equation, m.x, m.y);
            }
        }

        // Draw Bullets
        this.ctx.fillStyle = '#FFFF00';
        for (let b of this.entityManager.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
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
