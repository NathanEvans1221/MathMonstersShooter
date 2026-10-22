import test from 'node:test'
import assert from 'node:assert/strict'
import { MathSystem } from '../src/logic/MathSystem.js'
import { createHarness, seededRandom } from './helpers.js'

test('簡單模式限制小數字，所有題目與選項仍正確', (t) => {
    t.mock.method(Math, 'random', seededRandom())
    const math = new MathSystem()
    math.setDifficulty('easy')
    for (const mode of ['add', 'sub', 'mul']) {
        math.setMode(mode)
        for (let i = 0; i < 100; i++) {
            const problem = math.generateProblem()
            const [a, , b] = problem.equation.split(' ')
            assert.ok(Number(b) <= 5)
            if (mode !== 'sub') assert.ok(Number(a) <= 5)
            else assert.ok(problem.answer <= 5)
            assert.ok(problem.options.includes(problem.answer))
        }
    }
})

test('難度同時影響初速與通關，無效設定採預設', async (t) => {
    const { engine } = createHarness(t)
    const speeds = []
    for (const [difficulty, winningScore] of [['easy', 250], ['medium', 350], ['hard', 400]]) {
        await engine.start({ mode: 'mul', difficulty })
        engine.spawnMonster()
        speeds.push(engine.entityManager.monsters[0].speed)
        assert.equal(engine.winningScore, winningScore)
    }
    assert.deepEqual(speeds, [0.35, 0.5, 0.65])
    await engine.start({ mode: 'bad', difficulty: 'bad' })
    assert.deepEqual(engine.settings, { mode: 'add', difficulty: 'medium' })
})

test('達到一百分整數門檻就觸發喘息，不必等到一百一十分', async (t) => {
    const { engine } = createHarness(t)
    await engine.start()
    engine.score = 100
    engine.update(16)
    assert.equal(engine.level, 2)
    assert.ok(engine.levelUpRestTimer > 4900)
})
