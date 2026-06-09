# Pet Calendar - 設置指南

## 步驟 1: 創建 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com)
2. 點擊 **「+」** 創建新的空白電子表格
3. 命名為 `Pet Calendar Database`
4. **複製這個 Spreadsheet 的 ID**
   - URL 中 `.../d/` 和 `/edit` 之間的部分就是 ID
   - 例如: `https://docs.google.com/spreadsheets/d/ABC123xyz.../edit`
   - ID 是: `ABC123xyz...`

## 步驟 2: 創建 Google Apps Script

1. 在 Google Sheet 中，點擊 **Extensions > Apps Script**
2. 刪除所有默認代碼
3. 複製 `apps-script/Code.js` 的全部內容粘貼進去
4. 在頂部的 `CONFIG` 部分，替換 `SPREADSHEET_ID` 為你的 Google Sheet ID:
   ```javascript
   const SPREADSHEET_ID = '你的_Sheet_ID'; // 例如: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
   ```
5. 確認 `ADMIN_EMAIL` 是你的 email:
   ```javascript
   const ADMIN_EMAIL = 'alan.yoshiki@gmail.com';
   ```
6. 點擊 **Save** (💾)
7. 首次運行 setup:
   - 在函數下拉菜單中選擇 `setupSpreadsheet`
   - 點擊 **Run**
   - 授予權限（第一次需要）
8. 部署為 Web App:
   - 點擊 **Deploy > New deployment**
   - 選擇類型: **Web app**
   - 描述: `Pet Calendar API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone with Google account`
   - 點擊 **Deploy**
   - **複製 Web App URL**

## 步驟 3: 更新前端 API URL

1. 打開 `index.html`
2. 找到這行（約第 750 行）:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. 替換為你的 Web App URL

## 步驟 4: 部署到 GitHub Pages

### 方法 A: 使用 GitHub CLI
```bash
cd pet-calendar
git init
git add index.html
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/alan9820/pet-calendar.git
git push -u origin main
```

### 方法 B: 手動上傳
1. 在 GitHub 創建新 repo `pet-calendar`
2. 上傳 `index.html`

### 啟用 GitHub Pages
1. 在 GitHub repo 頁面，點擊 **Settings > Pages**
2. Source: `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`
4. 點擊 **Save**
5. 等待幾分鐘，你的網站就會上線:
   `https://alan9820.github.io/pet-calendar/`

## 步驟 5: 測試

1. 前往你的 GitHub Pages URL
2. 點擊「立即註冊」創建新帳戶
3. 登入後添加你的寵物
4. 測試添加事件、飲食記錄、大便記錄

## 登入 Admin 面板

1. 用 ADMIN_EMAIL 註冊/登入
2. 在 Dashboard 點擊「👑 管理」按鈕
3. 可以查看所有用戶和數據

## 數據結構

你的 Google Sheet 會自動創建以下工作表:
- **Users** - 用戶帳戶
- **Pets** - 寵物資料
- **Events** - 行事曆事件
- **FoodLogs** - 飲食記錄
- **PoopLogs** - 大便記錄
- **HealthLogs** - 健康記錄

## 故障排除

### CORS 錯誤
如果看到 CORS 錯誤，確保 Google Apps Script 部署設置為 `Anyone with Google account`。

### 401 Unauthorized
確保前端 `API_URL` 與部署的 Web App URL 完全匹配。

### 數據不顯示
運行 `setupSpreadsheet()` 函數確保所有工作表和標題正確創建。

## 文件結構

```
pet-calendar/
├── index.html          # 完整的前端應用
├── apps-script/
│   └── Code.js        # Google Apps Script 後端
├── SPEC.md            # 規格說明書
└── SETUP.md           # 本設置指南
```
