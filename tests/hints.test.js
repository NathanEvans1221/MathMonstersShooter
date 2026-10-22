import test from 'node:test'
import assert from 'node:assert/strict'
import { getMathHint } from '../src/logic/MathHints.js'
import { addTarget, createHarness } from './helpers.js'

test('加法湊十、減法倒數、乘法分組提示不直接揭露答案', () => {
    assert.deepEqual(getMathHint('8 + 5 = ?'),
        { key: 'hint_make_ten', params: { expression: '8 + 2 + 3' } })
    assert.deepEqual(getMathHint('7 - 3 = ?'),
        { key: 'hint_sub', params: { a: 7, b: 3 } })
    assert.deepEqual(getMathHint('2 × 3 = ?'),
        { key: 'hint_mul', params: { a: 2, b: 3, expression: '3 + 3' } })
    assert.equal(getMathHint('invalid'), null)
})

test('同題連錯兩次提示，換目標與答對清除', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start()
    const first = addTarget(engine)
    engine.updateOptions()
    engine.handleAnswer(4)
    assert.equal(events.hints.at(-1), null)
    engine.handleAnswer(4)
    assert.equal(events.hints.at(-1).key, 'hint_add')
    first.alive = false
    addTarget(engine)
    engine.updateOptions()
    assert.equal(events.hints.at(-1), null)
    engine.handleAnswer(4)
    assert.equal(events.hints.at(-1), null)
    engine.handleAnswer(4)
    engine.handleAnswer(5)
    assert.equal(events.hints.at(-1), null)
})
