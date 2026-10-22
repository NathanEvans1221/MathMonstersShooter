# Project Memory

## 變更管理規範 (Change Management)
- **主要記錄檔**：`CHANGELOG.md` (位於專案根目錄)。
- **記錄標準**：採用 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 格式。
- **語言要求**：所有變更內容說明必須使用 **繁體中文**。
- **觸發時機**：當執行以下操作時，必須同步更新 `CHANGELOG.md`：
    1. **新增功能/技能**：例如引入新的 Skill 或 Workflow。
    2. **結構調整**：例如修改目錄結構、核心規則 (`GEMINI.md`)。
    3. **重大內容更新**：例如新增主要文檔、重構現有筆記。
- **操作方式**：在 `CHANGELOG.md` 的 `[Unreleased]` 或當日日期區塊下，新增對應的 `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security` 項目。

## Git 提交規範 (Git Commit Standards)
- **格式結構**：`<type>(<scope>): <subject>`
    - 第一行：簡短標題，不超過 50 字元。
    - 第二行：空行。
    - 第三行：詳細描述（每行不超過 72 字元）。
- **Type 類型**：
    - `✨ feat` (新功能), `🐛 fix` (修正), `📝 docs` (文件)
    - `💄 style` (格式), `♻️ refactor` (重構), `⚡️ perf` (效能優化)
    - `🧪 test` (測試相關), `🔧 chore` (雜項), `⏪️ revert` (回滾)
- **Subject 主旨**：使用 **繁體中文**，簡短描述變更。
- **Body 內容**：詳細描述變更內容、原因及背景，使用 **繁體中文**。

---

## 開發指令 (Development Commands)

### 建置與開發
| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 (Vite hot reload) |
| `npm run build` | 生產環境建置 (dist 目錄) |
| `npm run preview` | 預覽建置後的成品 |

### 測試
使用 Node.js 內建測試工具，執行 `npm.cmd test`。測試位於 `tests/`，不依賴真實音訊。
瀏覽器驗證方式與限制見 `docs/verification/README.md`。

### Linting
本專案目前**尚未配置** ESLint 或 Prettier。如有需要，可引入相關工具。

---

## 程式碼風格指南 (Code Style Guidelines)

### 專案技術棧
- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Build Tool**: Vite 7.x
- **Rendering**: HTML5 Canvas (遊戲核心)
- **Styling**: Vanilla CSS
- **State**: Vue Reactivity API
- **i18n**: vue-i18n
- **Language**: JavaScript (ES6+，無 TypeScript)

### 命名慣例 (Naming Conventions)
| 類型 | 規則 | 範例 |
|------|------|------|
| Vue 組件 | PascalCase | `GameCanvas.vue`, `AnswerPanel.vue` |
| JS 類別 | PascalCase | `GameEngine`, `EntityManager` |
| 函式/方法 | camelCase | `handleAnswer()`, `spawnMonster()` |
| 常數 | UPPER_SNAKE_CASE | `SPAWN_INTERVAL`, `BULLET_RADIUS` |
| CSS class | kebab-case | `.neon-button`, `.gameover-screen` |
| 檔案 (邏輯模組) | PascalCase | `MathSystem.js`, `Collision.js` |
| 檔案 (非組件) | camelCase | `main.js`, `i18n.js`, `style.css` |

### Imports 語法
- 使用 ES6 Modules (`import`/`export`)
- 優先使用相對路徑導入同層級或子目錄模組
- Vue 組件導入擺放於 `<script setup>` 頂部
- 邏輯模組導入置於 JavaScript 檔案頂部

```javascript
// ✅ 正確順序
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GameCanvas from './components/GameCanvas.vue'
import { MathSystem } from './logic/MathSystem.js'
import { SoundManager } from './logic/SoundManager.js'
```

### 程式碼格式
- 使用 **4 空格** 縮排 (非 Tab)
- 一行不超過 **100 字元** (可視情況調整)
- 物件屬性簡寫置於宣告開頭
- 類別方法之間保留 **一個空行**
- 區塊註解使用 `/** */`，行內註解使用 `//`

```javascript
// 類別屬性宣告範例
export class GameEngine {
    constructor(canvas, callbacks) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.callbacks = callbacks
        
        this.mathSystem = new MathSystem()
        this.entityManager = new EntityManager()
    }
}
```

### 類別與模組設計
- 每個邏輯模組應為 **單一職責** (SRP)
- 遊戲核心邏輯置於 `src/logic/` 目錄
- Vue 組件置於 `src/components/` 目錄
- 公開方法 (Public API) 置於類別頂部，私有方法置於底部
- 使用 JSDoc 註解公開方法之用途與參數

```javascript
/**
 * 處理玩家輸入的答案
 * @param {number} value - 選取的答案數值
 */
handleAnswer(value) {
    // implementation
}
```

### 錯誤處理 (Error Handling)
- 圖片載入失敗等非致命錯誤使用 `console.error` 記錄
- 使用 try-catch 包覆可能失敗的 Async 操作
- 遊戲邏輯異常應設計為不影響玩家體驗 (降級處理)

```javascript
this.playerImage.onerror = (e) => {
    console.error("Player ship image failed to load:", e)
}
```

### Vue 組件規範
- 使用 `<script setup>` 語法糖
- 組件內順序：`<script setup>` → `<template>` → `<style scoped>`
- Props 定義使用 `defineProps`，Emit 使用 `defineEmits`
- 樣式使用 `scoped` 避免污染全域
- 響應式狀態 (`ref`/`reactive`) 置於 `<script setup>` 頂部

### CSS 樣式規範
- 使用 CSS 變數管理主題色彩
- 優先使用 Flexbox 排版
- 避免行內樣式，統一置於 `<style>` 區塊
- 響應式設計使用相對單位 (`rem`, `%`, `vw/vh`)

### Vue i18n 使用
- 所有 UI 文字必須透過 `t('key')` 取得
- 避免直接在 template 中硬編碼文字
- i18n 設定檔位於 `src/i18n.js`

---

## 專案目錄結構

```
MathMonstersShooter/
├── src/
│   ├── logic/              # 遊戲核心邏輯 (pure JS)
│   │   ├── GameEngine.js   # 遊戲主引擎
│   │   ├── EntityManager.js # 實體管理
│   │   ├── MathSystem.js   # 數學題目生成
│   │   ├── Collision.js    # 碰撞偵測
│   │   ├── SoundManager.js # 音效管理
│   │   └── TTSManager.js   # 語音合成
│   ├── components/         # Vue 組件
│   │   ├── GameCanvas.vue
│   │   ├── GameHUD.vue
│   │   ├── AnswerPanel.vue
│   │   └── StartScreen.vue
│   ├── App.vue             # 根組件
│   ├── main.js             # 入口檔
│   ├── i18n.js             # 國際化設定
│   └── style.css           # 全域樣式
├── public/
│   ├── images/             # 遊戲圖片資源
│   └── fonts/             # 字型檔案
├── index.html
├── vite.config.js
├── package.json
└── AGENTS.md
```

---

## 常見工作流程

### 新增遊戲功能
1. 先於 `src/logic/` 中實作核心邏輯 (無 DOM 依賴)
2. 若需暴露方法給 Vue，於現有 class 中擴充
3. 在 Vue 組件中引入並使用
4. 更新 `CHANGELOG.md` 並 commit

### 修改 UI 樣式
- 全域變數定義於 `src/style.css`
- 組件樣式寫在各自 `.vue` 檔的 `<style scoped>` 中
- Neon Space 主題色：`#0B0F29` (背景), `#00F3FF` (青), `#FF00FF` (洋紅)

---

*Last updated: 2026-02-20*
