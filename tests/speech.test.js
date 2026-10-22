import test from 'node:test'
import assert from 'node:assert/strict'
import { TTSManager } from '../src/logic/TTSManager.js'

test('數字不被普通回饋打斷，只保留最新回饋，勝敗可搶占', (t) => {
    const spoken = []
    const previousWindow = globalThis.window
    const previousUtterance = globalThis.SpeechSynthesisUtterance
    globalThis.window = { speechSynthesis: {
        speak: (value) => spoken.push(value), cancel: () => {}
    } }
    globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text } }
    TTSManager.setEnabled(true)
    t.after(() => {
        TTSManager.setEnabled(false)
        globalThis.window = previousWindow
        globalThis.SpeechSynthesisUtterance = previousUtterance
    })
    TTSManager.speak('5', 'zh', 'number')
    TTSManager.speak('好棒', 'zh', 'feedback')
    TTSManager.speak('再試一次', 'zh', 'feedback')
    assert.deepEqual(spoken.map(value => value.text), ['5'])
    spoken[0].onend()
    assert.deepEqual(spoken.map(value => value.text), ['5', '再試一次'])
    TTSManager.speak('恭喜', 'zh', 'result')
    spoken[1].onend()
    assert.deepEqual(spoken.map(value => value.text), ['5', '再試一次', '恭喜'])
    TTSManager.setEnabled(false)
    spoken[2].onend()
    TTSManager.speak('不可播放', 'zh')
    assert.equal(spoken.length, 3)
})

test('瀏覽器沒有語音 API 時靜音與朗讀均可降級', () => {
    const previousWindow = globalThis.window
    globalThis.window = {}
    try {
        assert.doesNotThrow(() => TTSManager.setEnabled(false))
        TTSManager.setEnabled(true)
        assert.doesNotThrow(() => TTSManager.speak('5', 'zh', 'number'))
    } finally { globalThis.window = previousWindow }
})
