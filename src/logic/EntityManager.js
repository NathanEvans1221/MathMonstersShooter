import { Collision } from './Collision.js';

export class EntityManager {
    constructor() {
        this.monsters = [];
        this.bullets = [];
        this.particles = [];
        this.player = { x: 0, y: 0, radius: 30 };
    }

    reset() {
        this.monsters = [];
        this.bullets = [];
        this.particles = [];
    }

    addMonster(data) {
        this.monsters.push({
            ...data,
            radius: 35,
            scale: 0,
            alive: true
        });
    }

    addBullet(startX, startY, targetX, targetY) {
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const speed = 15;
        this.bullets.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 5,
            color: '#00F3FF',
            alive: true
        });
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const speed = Math.random() * 5 + 2;
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                color: color || '#FFA500'
            });
        }
    }

    update(dt, width, height) {
        const hasActiveBullets = this.bullets.length > 0;
        let escaped = 0;

        // Update Monsters
        for (let m of this.monsters) {
            if (m.scale < 1) m.scale += 0.05 * dt;

            // Stop moving if bullets are active
            if (!hasActiveBullets) {
                m.y += m.speed * dt;
            }

            if (Collision.isOffScreenBottom(m, height)) {
                m.alive = false;
                escaped++;
            }
        }

        // Update Bullets
        for (let b of this.bullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (Collision.isOffScreen(b, width, height)) {
                b.alive = false;
            }
        }

        // Update Particles
        for (let p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= p.decay * dt;
        }

        // Cleanup
        this.monsters = this.monsters.filter(m => m.alive);
        this.bullets = this.bullets.filter(b => b.alive);
        this.particles = this.particles.filter(p => p.life > 0);

        return escaped;
    }
}
