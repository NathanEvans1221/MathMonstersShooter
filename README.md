# Math Monsters Shooter（數學怪物射手）

供國小低年級練習加減乘法的瀏覽器遊戲。選答案發射子彈，透過射擊闖關或十題練習獲得即時回饋。

![遊戲畫面](./images/math-monsters-shooter.png)

## 啟動與驗證

需要符合 Vite 7 要求的 Node.js（20.19+ 或 22.12+），本輪使用 Node 24。

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 43187
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

- `npm test`：Node 內建測試，無額外測試框架；目前 30 項。
- `npm run build`：輸出至 `dist/`。
- 尚未配置 Lint 指令或 CI 工作流程。
- Windows 若 5173 埠無法監聽，可採上述 43187 埠。

## 玩法

| 難度 | 運算元／減法答案與減數上限 | 下降初速 | 每次擊殺加速係數 | 闖關目標 |
|---|---:|---:|---:|---:|
| 簡單 | 5 | 0.35 | 0.06 | 250 分 |
| 中等 | 9 | 0.5 | 0.08 | 350 分 |
| 困難 | 9 | 0.65 | 0.10 | 400 分 |

速度單位以 60fps 基準換算；新怪物速度為初速 ×（1 + 係數 × 累積擊殺數）。
加法運算元從 0 開始；乘法從 1 開始。減法先產生非負答案與減數，再相加得到被減數，
因此被減數可以是 0，簡單模式最多 10，中等／困難最多 18。

**射擊闖關**：三條生命，擊殺加 10 分，漏怪扣一條生命；答錯不扣命，怪物減速五秒。
連續答錯額外減速，同題連錯兩次顯示解題提示。每達 100 分門檻，怪物減速 20% 五秒。
畫面最多五隻怪物；有子彈飛行時怪物暫停移動，期間不接受其他答案。

**十題練習**：一次一題，共十題。答錯仍可嘗試，擊殺或漏題後進入下一題；漏題不提前結束。
摘要顯示最終解出的題數、首次作答正確率與待複習題目。首次正確率以十題為分母，
未作答的漏題也算未答對；答錯後修正不會增加首次正確率。練習結果不寫入闖關最高分。

## 操作與偏好

- 點擊／觸控答案；桌面也可按 `1`、`2`、`3` 選擇由左至右的答案。
- 支援暫停、恢復、退出與保留原設定重試。
- 切到背景會自動暫停，回來後由玩家手動繼續。
- 語言、靜音、運算模式、難度及闖關最高分保存在本機 `localStorage`。
- 儲存被封鎖時以當次記憶體狀態運作；不需登入，沒有後端或資料庫。
- 支援繁體中文與英文，音效使用 Web Audio，朗讀使用 Speech Synthesis。
  發聲需符合瀏覽器互動政策，語音與音色依裝置而異。

## 架構

| 位置 | 職責 |
|---|---|
| `src/App.vue` | 畫面狀態、音訊偏好、最高分、摘要與鍵盤生命週期 |
| `src/components/GameCanvas.vue` | 引擎與 Vue 橋接、尺寸／字型監聽與卸載清理 |
| `src/logic/GameEngine.js` | 單一 RAF 循環、出怪、答題、碰撞、勝敗與局次保護 |
| `EntityManager.js`、`Collision.js` | 實體移動、粒子及圓形碰撞 |
| `GameSettings.js`、`MathSystem.js`、`MathHints.js` | 共用難度、出題及學習提示 |
| `PracticeSession.js` | 十題作答、首次正確率與複習紀錄 |
| `Preferences.js`、`InputController.js`、`Progress.js` | 儲存降級、操作與進度計算 |
| `SoundManager.js`、`TTSManager.js` | 合成音效、背景音樂與有優先序的語音 |

技術棧為 Vue 3、vue-i18n、Vite 7、JavaScript、Canvas 與原生 CSS。
版本從 `package.json` 注入首頁，不另硬編碼。

## 瀏覽器驗證

測試腳本使用 Playwright 與本機 Edge，需先在 43187 埠啟動開發伺服器。
Playwright 不屬於正式遊戲依賴；若環境未提供，可另外安裝：

```powershell
npm.cmd install --no-save --package-lock=false playwright
node scripts/browser-smoke.cjs
node scripts/benchmark.cjs
```

若環境已提供 Playwright，可將 `PLAYWRIGHT_MODULE_PATH` 設成其套件目錄。
腳本只在測試瀏覽器攔截的模組回應中擷取引擎，不在產品程式加入測試掛鉤。

完整驗證範圍與限制見 [驗證紀錄](docs/verification/README.md)，
效能量測見 [效能紀錄](docs/verification/performance.md)。

## 部署與限制

`wrangler.json` 將 `dist/` 設為 Cloudflare Workers 靜態資產目錄。先建置，再以已安裝且完成
授權的 Wrangler 執行 `wrangler deploy`。本輪僅推送原始碼，未執行部署。

[既有展示連結](https://math-monsters-shooter.liawchiisen.workers.dev/) 未驗證是否已包含本輪修改。
尚未實作 PWA／Service Worker，首次離線開啟及離線重新載入沒有保證。

注音字型位於 `public/fonts/ZhuyinFont.woff2`，為子集字型；新增中文時需檢查缺字。
若持有原始 TTF，可依 UI 用字重新產生 WOFF2 子集；原始 TTF 目前不在此儲存庫。
新摘要使用系統字型以維持閱讀清晰度。

詳細現行規則與未實作項目見 [PRD](PRD.md)，維護建議見 [OPTIMIZATION](OPTIMIZATION.md)。
