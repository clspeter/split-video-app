# Split Video App

一個使用 React Native 和 Expo 開發的影片分割應用程式，可以將長影片分割成指定時長的片段。

## 功能特色

- 🎥 選擇本地影片檔案
- ✂️ 使用 FFmpeg 進行影片分割
- ⏱️ 可自訂分割時長（預設 1 分鐘）
- 📱 支援 iOS 和 Android
- 🌍 多語言支援（英文）
- 🎨 現代化 UI 設計，支援深色模式
- 📊 即時進度追蹤

## 技術架構

### 核心技術

- **Expo**: 跨平台開發框架
- **React Native**: 原生應用開發
- **TypeScript**: 型別安全的 JavaScript
- **Nativewind**: Tailwind CSS 的 React Native 版本

### 主要套件

- **ffmpeg-kit-react-native**: 影片處理核心
- **expo-document-picker**: 檔案選擇
- **expo-file-system**: 檔案系統操作
- **expo-media-library**: 媒體庫存取

### 狀態管理

- **Zustand**: 輕量級狀態管理
- **React Query**: 伺服器狀態管理

## 安裝與設定

### 前置需求

- Node.js 18+
- pnpm 10+
- Expo CLI
- Android Studio / Xcode（用於原生建置）

### 安裝步驟

1. 克隆專案

```bash
git clone <repository-url>
cd split-video-app
```

2. 安裝依賴

```bash
pnpm install
```

3. 啟動開發伺服器

```bash
pnpm start
```

4. 在裝置上測試

```bash
# Android
pnpm android

# iOS
pnpm ios
```

## 使用方法

### 基本操作流程

1. **選擇影片**

   - 點擊「選擇影片」按鈕
   - 從裝置選擇要分割的影片檔案
   - 支援 MP4、MOV、AVI 等常見格式

2. **設定分割參數**

   - 輸入分割時長（秒）
   - 預設為 60 秒（1 分鐘）
   - 建議根據影片內容調整

3. **開始分割**

   - 點擊「開始分割」按鈕
   - 系統會顯示處理進度
   - 分割完成後會顯示結果列表

4. **管理結果**
   - 查看分割後的影片片段
   - 將片段儲存到相簿
   - 清除結果重新開始

### 權限要求

應用程式需要以下權限：

- **儲存權限**: 存取裝置儲存空間
- **媒體權限**: 存取媒體庫
- **相機權限**: 錄製影片（如需要）

## 專案結構

```
src/
├── api/           # API 相關程式碼
├── app/           # 主要頁面和路由
│   ├── split-video.tsx    # 影片分割頁面
│   └── ...
├── components/    # 共用元件
│   ├── ui/       # 核心 UI 元件
│   └── ...
├── lib/          # 共用函式庫
├── translations/ # 多語言檔案
└── types/        # TypeScript 型別定義
```

## 開發指南

### 程式碼風格

- 使用 TypeScript 進行型別檢查
- 遵循 ESLint 規則
- 使用 Prettier 進行程式碼格式化
- 元件使用函數式寫法

### 測試

```bash
# 執行所有測試
pnpm test

# 監控模式
pnpm test:watch

# 生成覆蓋率報告
pnpm test:ci
```

### 建置

```bash
# 預建置
pnpm prebuild

# 建置 APK
pnpm android

# 建置 IPA
pnpm ios
```

## 故障排除

### 常見問題

1. **FFmpeg 執行失敗**

   - 檢查影片格式是否支援
   - 確認影片檔案完整性
   - 檢查裝置儲存空間

2. **權限被拒絕**

   - 在設定中手動授予權限
   - 重新安裝應用程式
   - 檢查系統權限設定

3. **影片分割失敗**
   - 確認影片時長足夠
   - 檢查分割時長設定
   - 嘗試重新選擇影片

### 除錯技巧

- 使用 `console.log` 輸出 FFmpeg 命令
- 檢查裝置日誌
- 使用 Expo DevTools 進行除錯

## 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 發起 Pull Request

## 授權

本專案採用 MIT 授權條款。

## 支援

如有問題或建議，請：

- 提交 Issue
- 發起討論
- 聯繫開發團隊

---

**注意**: 本應用程式僅供學習和研究使用，請遵守相關法律法規。
