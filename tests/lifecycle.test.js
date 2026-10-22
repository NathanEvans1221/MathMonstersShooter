import test from 'node:test'
import assert from 'node:assert/strict'
import { createHarness } from './helpers.js'

test('重複恢復只保留一個動畫排程，暫停會取消', async (t) => {
    const { engine, frames, tick } = createHarness(t)
    await engine.start()
    engine.setPaused(false)
    engine.setPaused(false)
    assert.equal(frames.size, 1)
    engine.setPaused(true)
    assert.equal(frames.size, 0)
    engine.resume()
    tick(performance.now() + 16)
    assert.equal(frames.size, 1)
})

test('重試保留設定並完整重置當局', async (t) => {
    const { engine, frames } = createHarness(t)
    await engine.start({ mode: 'mul', difficulty: 'hard' })
    engine.spawnTimer = 800
    engine.score = 30
    await engine.start()
    assert.equal(engine.mathSystem.mode, 'mul')
    assert.equal(engine.winningScore, 400)
    assert.equal(engine.spawnTimer, 0)
    assert.equal(engine.score, 0)
    assert.equal(frames.size, 1)
})

test('結束後不被 resume 復活，勝利延遲可被 stop 清除', async (t) => {
    const { engine, frames, timers } = createHarness(t)
    await engine.start()
    engine.gameWin()
    assert.equal(frames.size, 0)
    assert.equal(timers.size, 1)
    engine.stop()
    engine.resume()
    assert.equal(engine.state, 'idle')
    assert.equal(timers.size, 0)
    assert.equal(frames.size, 0)
})

test('舊的非同步 start 不得覆蓋新局或離開後復活', async (t) => {
    const { engine, frames } = createHarness(t)
    let release
    engine.preloadImages = () => new Promise((resolve) => { release = resolve })
    const pending = engine.start({ mode: 'mul' })
    engine.stop()
    release()
    assert.equal(await pending, false)
    assert.equal(engine.state, 'idle')
    assert.equal(frames.size, 0)
})

test('已載入失敗的圖片不讓重新開始永遠等待', async (t) => {
    const { engine } = createHarness(t)
    engine.playerImage.naturalWidth = 0
    let finished = false
    const preload = engine.preloadImages().then(() => { finished = true })
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(finished, true)
    await preload
})
