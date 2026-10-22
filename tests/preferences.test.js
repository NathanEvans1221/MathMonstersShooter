import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPreferences, savePreferences, readHighScore } from '../src/logic/Preferences.js'
import { InputController } from '../src/logic/InputController.js'

test('偏好恢復並過濾無效資料，儲存失敗仍可繼續', () => {
    const storage = { getItem: () => '{"locale":"en","muted":true,"mode":"mul","difficulty":"bad"}' }
    assert.deepEqual(loadPreferences(storage),
        { locale: 'en', muted: true, mode: 'mul', difficulty: 'medium' })
    assert.equal(loadPreferences({ getItem() { throw Error('blocked') } }).locale, 'zh')
    assert.equal(savePreferences({}, { setItem() { throw Error('full') } }), false)
    assert.equal(readHighScore({ getItem: () => 'NaN' }), 0)
})

test('快捷鍵僅遊玩時有效，不接受長按與編輯欄位，卸載後解除', () => {
    const target = new EventTarget()
    let state = 'playing'
    const answers = []
    const controller = new InputController(target, {
        getState: () => state, getOptions: () => [3, 7, 9],
        onAnswer: (value) => answers.push(value), onPause: () => { state = 'paused' }
    })
    const key = (value, extra = {}) => {
        const event = new Event('keydown', { cancelable: true })
        Object.assign(event, { key: value, ...extra })
        target.dispatchEvent(event)
    }
    controller.start()
    key('2')
    key('1', { repeat: true })
    state = 'paused'
    key('1')
    state = 'playing'
    target.hidden = true
    target.dispatchEvent(new Event('visibilitychange'))
    assert.equal(state, 'paused')
    target.hidden = false
    target.dispatchEvent(new Event('visibilitychange'))
    assert.equal(state, 'paused')
    controller.stop()
    state = 'playing'
    key('3')
    assert.deepEqual(answers, [7])
})
