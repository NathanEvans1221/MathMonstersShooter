/** 提供解題方向，不包含最終答案；顯示文字由 i18n 管理。 */
export function getMathHint(equation) {
    const match = /^(\d+) ([+\-×]) (\d+) = \?$/.exec(equation)
    if (!match) return null
    const a = Number(match[1]), b = Number(match[3])
    if (match[2] === '+') {
        if (a < 10 && a + b > 10) {
            const gap = 10 - a
            return { key: 'hint_make_ten', params: { expression: `${a} + ${gap} + ${b - gap}` } }
        }
        return { key: 'hint_add', params: { a, b } }
    }
    if (match[2] === '-') return { key: 'hint_sub', params: { a, b } }
    return { key: 'hint_mul', params: { a, b,
        expression: Array.from({ length: Math.min(a, 9) }, () => b).join(' + ') } }
}
