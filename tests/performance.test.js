import test from 'node:test'
import assert from 'node:assert/strict'
import { createHarness, addTarget } from './helpers.js'

test('目標不變不重複通知，失去目標只清空一次', async (t) => {
    const { engine, events } = createHarness(t)
    await engine.start()
    const before = events.options.length
    const monster = addTarget(engine)
    engine.updateOptions()
    engine.updateOptions()
    engine.updateOptions()
    assert.equal(events.options.length - before, 1)
    monster.alive = false
    engine.updateOptions()
    engine.updateOptions()
    assert.equal(events.options.length - before, 2)
    assert.deepEqual(events.options.at(-1), [])
})

test('算式寬度跨幀快取，縮放與字型更新使快取失效', async (t) => {
    const harness = createHarness(t)
    const { engine } = harness
    await engine.start()
    const monster = addTarget(engine)
    monster.scale = 1
    engine.updateOptions()
    engine.draw()
    const measured = harness.measurements
    engine.draw()
    assert.equal(harness.measurements, measured)
    engine.resize(300, 700)
    assert.ok(harness.measurements > measured)
    const afterResize = harness.measurements
    engine.invalidateTextMetrics()
    engine.draw()
    assert.ok(harness.measurements > afterResize)
})

test('粒子半徑在生成時決定並維持穩定', async (t) => {
    const { engine } = createHarness(t)
    await engine.start()
    engine.entityManager.createExplosion(200, 200, '#fff')
    const radii = engine.entityManager.particles.map(particle => particle.radius)
    assert.ok(radii.every(radius => radius >= 1 && radius <= 4))
    engine.draw()
    engine.draw()
    assert.deepEqual(engine.entityManager.particles.map(particle => particle.radius), radii)
})
