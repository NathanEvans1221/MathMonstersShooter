/** 單一語音與一筆最新待播內容，避免鼓勵語打斷答案或堆積。 */
export class TTSManager {
    static enabled = true
    static active = null
    static pending = null
    static generation = 0

    static clear() {
        this.generation++
        this.active = null
        this.pending = null
        globalThis.window?.speechSynthesis?.cancel()
    }

    static setEnabled(value) {
        this.enabled = value
        if (!value) this.clear()
    }

    /** result > navigation > number > feedback。 */
    static speak(text, locale, kind = 'navigation') {
        const synth = globalThis.window?.speechSynthesis
        if (!this.enabled || !synth || !globalThis.SpeechSynthesisUtterance) return
        const priority = { feedback: 0, number: 1, navigation: 2, result: 3 }[kind] ?? 0
        const request = { text, locale, priority, expires: performance.now() + 2000 }
        if (this.active && priority <= this.active.priority) {
            if (!this.pending || priority >= this.pending.priority) this.pending = request
            return
        }
        this.clear()
        this.play(request)
    }

    static play(request) {
        const synth = globalThis.window?.speechSynthesis
        if (!this.enabled || !synth || request.expires < performance.now()) return
        const generation = ++this.generation
        const utterance = new SpeechSynthesisUtterance(request.text)
        utterance.lang = request.locale === 'zh' ? 'zh-TW' : 'en-US'
        utterance.rate = 1.5
        utterance.pitch = 1.1
        this.active = request
        const finished = () => {
            if (generation !== this.generation) return
            this.active = null
            const pending = this.pending
            this.pending = null
            if (pending) this.play(pending)
        }
        utterance.onend = finished
        utterance.onerror = finished
        try { synth.speak(utterance) } catch { finished() }
    }
}
