import test from 'node:test'
import assert from 'node:assert/strict'
import { MathSystem } from '../src/logic/MathSystem.js'
import { Collision } from '../src/logic/Collision.js'
import { EntityManager } from '../src/logic/EntityManager.js'
import { addTarget, createHarness, seededRandom } from './helpers.js'

for (const mode of ['add', 'sub', 'mul']) {
    test(`${mode} 題目計算正確且三個選項不同、包含正解`, (t) => {
        t.mock.method(Math, 'random', seededRandom())
        const math = new MathSystem()
        math.setMode(mode)
        for (let i = 0; i < 500; i++) {
            const problem = math.generateProblem()
            const [left, , right] = problem.equation.split(' ')
            const a = Number(left), b = Number(right)
            const answer = mode === 'add' ? a + b : mode === 'sub' ? a - b : a * b
            assert.equal(problem.answer, answer)
            assert.equal(new Set(problem.options).size, 3)
            assert.ok(problem.options.includes(answer))
            assert.ok(answer >= 0 && answer <= (mode === 'mul' ? 81 : mode === 'sub' ? 9 : 18))
            assert.ok(b >= (mode === 'mul' ? 1 : 0) && b <= 9)
        }
    })
}

test('圓形碰撞與邊界判斷', () => {
    assert.equal(Collision.checkCircle({ x: 0, y: 0, radius: 5 },
        { x: 9, y: 0, radius: 5 }), true)
    assert.equal(Collision.checkCircle({ x: 0, y: 0, radius: 5 },
        { x: 11, y: 0, radius: 5 }), false)
    assert.equal(Collision.isOffScreenBottom({ y: 110, radius: 5 }, 100), true)
    assert.equal(Collision.isOffScreen({ x: -10, y: 20, radius: 5 }, 100, 100), true)
})

test('子彈存在時怪物時停，子彈仍前進', () => {
    const entities = new EntityManager()
    entities.addMonster({ x: 100, y: 100, speed: 1 })
    entities.addBullet(100, 300, 100, 100)
    entities.update(1, 600, 900)
    assert.equal(entities.monsters[0].y, 100)
    assert.ok(entities.bullets[0].y < 300)
    entities.bullets = []
    entities.update(1, 600, 900)
    assert.equal(entities.monsters[0].y, 101)
})

test('命中只計一次十分並產生爆炸粒子', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start()
    addTarget(engine)
    engine.entityManager.addBullet(300, 100, 300, 100)
    engine.checkCollisions()
    engine.checkCollisions()
    assert.equal(engine.score, 10)
    assert.equal(events.scores.at(-1), 10)
    assert.equal(engine.entityManager.particles.length, 20)
})

test('漏怪扣命且歸零回報失敗', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start()
    engine.lives = 1
    addTarget(engine, { y: 950 })
    engine.update(16)
    assert.equal(engine.lives, 0)
    assert.deepEqual(events.endings, [[0, false]])
})

test('達到目標分數回報勝利', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start({ difficulty: 'medium' })
    engine.score = 350
    engine.update(16)
    assert.deepEqual(events.endings, [[350, true]])
})

test('暫停拒絕答案且保留分數，恢復可再次射擊', async (t) => {
    const { engine } = createHarness(t)
    await engine.start()
    addTarget(engine)
    engine.score = 40
    engine.setPaused(true)
    engine.handleAnswer(5)
    assert.equal(engine.entityManager.bullets.length, 0)
    engine.setPaused(false)
    engine.handleAnswer(5)
    assert.equal(engine.entityManager.bullets.length, 1)
    assert.equal(engine.score, 40)
})
