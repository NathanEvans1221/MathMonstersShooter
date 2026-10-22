import test from 'node:test'
import assert from 'node:assert/strict'
import { PracticeSession } from '../src/logic/PracticeSession.js'
import { addTarget, createHarness } from './helpers.js'

test('十題只記首次正確率，重複結算不灌分並保留複習題', () => {
    const session = new PracticeSession()
    for (let i = 0; i < 10; i++) {
        assert.equal(session.begin({ equation: '2 + 3 = ?', answer: 5 }), true)
        if (i < 2) session.answer(4)
        if (i !== 9) session.answer(5)
        assert.equal(session.finish(i === 9 ? 'escaped' : 'hit'), true)
        assert.equal(session.finish('hit'), false)
    }
    const summary = session.summary()
    assert.equal(session.complete, true)
    assert.equal(session.begin({ answer: 5 }), false)
    assert.equal(summary.completed, 10)
    assert.equal(summary.correctCount, 9)
    assert.equal(summary.firstAccuracy, 70)
    assert.equal(summary.review.length, 3)
})

test('練習十題完成才結束，漏題不提前失敗，新局清除紀錄', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start({ sessionType: 'practice', mode: 'sub' })
    for (let i = 0; i < 10; i++) {
        engine.spawnMonster()
        assert.equal(engine.entityManager.monsters.length, 1)
        engine.entityManager.monsters[0].y = 1000
        engine.update(16)
    }
    assert.equal(events.endings.length, 1)
    assert.equal(events.endings[0][2].completed, 10)
    assert.equal(events.endings[0][2].firstAccuracy, 0)
    assert.equal(engine.lives, 3)
    await engine.start()
    assert.equal(engine.practice.summary().completed, 0)
})

test('連點正確答案只發射一次，不重複計算嘗試與結算', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start({ sessionType: 'practice' })
    engine.spawnMonster()
    const monster = engine.entityManager.monsters[0]
    monster.y = 100
    engine.updateOptions()
    engine.handleAnswer(monster.answer)
    engine.handleAnswer(monster.answer)
    assert.equal(engine.entityManager.bullets.length, 1)
    assert.equal(engine.practice.current.attempts, 1)
    engine.entityManager.bullets[0].x = monster.x
    engine.entityManager.bullets[0].y = monster.y
    engine.checkCollisions()
    engine.checkCollisions()
    assert.equal(engine.practice.summary().completed, 1)
    assert.equal(engine.score, 10)
    assert.equal(events.endings.length, 0)
})
