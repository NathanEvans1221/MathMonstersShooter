import test from 'node:test'
import assert from 'node:assert/strict'
import { getProgress } from '../src/logic/Progress.js'

test('進度依當局目標計算且百分比與剩餘數有上下限', () => {
    assert.deepEqual(getProgress(0, 250), { percent: 0, remaining: 25 })
    assert.deepEqual(getProgress(200, 250), { percent: 80, remaining: 5 })
    assert.deepEqual(getProgress(350, 350), { percent: 100, remaining: 0 })
    assert.deepEqual(getProgress(450, 400), { percent: 100, remaining: 0 })
    assert.deepEqual(getProgress(-5, 400), { percent: 0, remaining: 40 })
    assert.deepEqual(getProgress(NaN, 0), { percent: 0, remaining: 0 })
})
