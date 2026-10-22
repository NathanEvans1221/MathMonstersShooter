/** 答案快捷鍵與背景暫停；生命週期由 App 管理。 */
export class InputController {
    constructor(target, callbacks) {
        this.target = target
        this.callbacks = callbacks
        this.onKey = (event) => {
            const tag = event.target?.tagName
            if (callbacks.getState() !== 'playing' || event.repeat || event.ctrlKey
                || event.metaKey || event.altKey || event.target?.isContentEditable
                || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
            if (!['1', '2', '3'].includes(event.key)) return
            const value = callbacks.getOptions()[Number(event.key) - 1]
            if (value === undefined) return
            event.preventDefault()
            callbacks.onAnswer(value)
        }
        this.onVisibility = () => {
            if (target.hidden && callbacks.getState() === 'playing') callbacks.onPause()
        }
    }

    start() {
        this.target.addEventListener('keydown', this.onKey)
        this.target.addEventListener('visibilitychange', this.onVisibility)
    }

    stop() {
        this.target.removeEventListener('keydown', this.onKey)
        this.target.removeEventListener('visibilitychange', this.onVisibility)
    }
}
