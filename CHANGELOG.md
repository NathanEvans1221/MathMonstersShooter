# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-01-18

### Added
- 初始化 Vue 3 + Vite 專案架構。
- 新增及實作 `MathSystem.js` 負責 0-20 加減法題目生成。
- 新增及實作 `GameEngine.js` 處理遊戲主循環、狀態管理。
- 新增及實作 `EntityManager.js` 管理怪物、子彈、粒子實體。
- 新增 `GameCanvas`, `StartScreen`, `GameHUD`, `AnswerPanel` 等 Vue UI 組件。
- 新增 Neon Space (霓虹太空) 視覺風格與 CSS Design Tokens。
- 新增 Web Audio API 音效管理 (`SoundManager`)。
- 新增「時停機制」：當子彈飛行時，怪物暫停移動以確保命中體驗。
- 新增多語系支援 (i18n)：支援英文與繁體中文介面切換。
- 新增字型支援：導入「王漢宗注音字型」，介面中文自動附帶注音。
- 視覺優化：調整為中性高對比配色（深灰底、白/金字），提升長時間遊玩的舒適度與可讀性。
- 視覺優化：移除所有光暈 (Glow) 與陰影特效，確保中文字與注音符號線條清晰銳利。

### Changed
- 優化 UI 佈局：將玩家飛船位置上調，避免遮擋底部答案選項。
- 調整遊戲機制：怪物觸底時改為扣除生命值而非立即結束遊戲。
- 調整平衡性：大幅降低怪物基礎下降速度與隨關卡增長的幅度，提升低年級玩家友善度。
- 調整平衡性：限制同場怪物數量至少 3 隻、至多 5 隻，避免畫面過於空曠或擁擠。
- 修正 `EntityManager` 迴圈邏輯，修復多隻怪物同時觸底可能導致的計數錯誤。
