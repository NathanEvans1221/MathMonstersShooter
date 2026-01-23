/**
 * 數學題目生成系統
 * 負責產生 0-20 範圍內的加減法題目，並生成干擾選項
 */
export class MathSystem {
  constructor() {
    this.mode = 'add'; // 預設加法
  }

  setMode(mode) {
    this.mode = mode || 'add';
  }

  /**
   * 生成一個新的數學問題
   * @returns {Object} 包含算式、答案與選項的物件
   */
  generateProblem() {
    let problem;
    switch (this.mode) {
      case 'mul':
        problem = this.generateMultiplication();
        break;
      case 'sub':
        problem = this.generateSubtraction();
        break;
      case 'add':
      default:
        problem = this.generateAddition();
        break;
    }

    const options = this.generateOptions(problem.answer);
    return {
      equation: problem.equation,
      answer: problem.answer,
      options: options
    };
  }

  generateAddition() {
    // 加法：一位數 + 一位數 (0-9 + 0-9) = 0-18
    const a = Math.floor(Math.random() * 10); // 0-9
    const b = Math.floor(Math.random() * 10); // 0-9
    return {
      equation: `${a} + ${b} = ?`,
      answer: a + b
    };
  }

  generateSubtraction() {
    // 減法：答案為 0-9 (非負一位數)，減數為 0-9
    // 公式：被減數 - 減數 = 答案
    // -> 被減數 = 答案 + 減數
    const answer = Math.floor(Math.random() * 10); // 0-9
    const right = Math.floor(Math.random() * 10); // 0-9
    const left = answer + right; // 0-18
    return {
      equation: `${left} - ${right} = ?`,
      answer: answer
    };
  }

  generateMultiplication() {
    // 乘法：一位數 * 一位數 (1-9 * 1-9) = 1-81
    const a = Math.floor(Math.random() * 9) + 1; // 1-9
    const b = Math.floor(Math.random() * 9) + 1; // 1-9
    return {
      equation: `${a} × ${b} = ?`,
      answer: a * b
    };
  }

  /**
   * 生成選擇題的選項 (1 個正確答案 + 2 個干擾項)
   * @param {number} correctValue - 正確答案
   * @returns {number[]} 隨機排序後的選項陣列
   */
  generateOptions(correctValue) {
    const options = new Set([correctValue]);
    const range = this.mode === 'mul' ? 81 : 20; // 根據模式調整干擾項可能的範圍

    while (options.size < 3) {
      // 生成與答案接近的干擾項
      // 乘法時誤差放大一些 (+/- 1~10)，加減法維持小誤差 (+/- 1~3)
      const maxOffset = this.mode === 'mul' ? 10 : 3;
      const offset = (Math.floor(Math.random() * maxOffset) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const val = correctValue + offset;

      // 確保選項為正數且在合理範圍內
      if (val >= 0 && val <= range + 10) {
        options.add(val);
      } else {
        // 如果偏移後超出範圍，則隨機生成一個範圍內的數字
        options.add(Math.floor(Math.random() * (range + 1)));
      }
    }
    // 打亂選項順序
    return Array.from(options).sort(() => Math.random() - 0.5);
  }
}

