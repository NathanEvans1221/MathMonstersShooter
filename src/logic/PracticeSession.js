/** 十題的作答紀錄；不儲存個資或跨局資料。 */
export class PracticeSession {
    constructor() {
        this.total = 10
        this.records = []
        this.current = null
    }

    get complete() { return this.records.length >= this.total }

    begin(problem) {
        if (this.current || this.complete) return false
        this.current = { equation: problem.equation, answer: problem.answer,
            attempts: 0, firstCorrect: false }
        return true
    }

    answer(value) {
        if (!this.current) return false
        const correct = this.current.answer === value
        this.current.attempts++
        if (this.current.attempts === 1) this.current.firstCorrect = correct
        return correct
    }

    finish(outcome) {
        if (!this.current) return false
        this.records.push({ ...this.current, outcome })
        this.current = null
        return true
    }

    summary() {
        const completed = this.records.length
        return {
            completed, total: this.total,
            correctCount: this.records.filter(record => record.outcome === 'hit').length,
            firstAccuracy: completed ? Math.round(this.records.filter(record =>
                record.firstCorrect).length / completed * 100) : 0,
            review: this.records.filter(record => !record.firstCorrect || record.outcome === 'escaped')
                .map(record => ({ ...record }))
        }
    }
}
