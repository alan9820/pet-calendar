# Pet Calendar - 設置指南

## ✅ 已完成 (Pre-configured)

Google Sheet 已自動創建並設置好！
- **Spreadsheet URL**: https://docs.google.com/spreadsheets/d/1YZtyCxhjJeNteKBGGjwDd9xO4PryVvbLYHE3yN3U1CU/edit
- **Spreadsheet ID**: `1YZtyCxhjJeNteKBGGjwDd9xO4PryVvbLYHE3yN3U1CU`
- **已創建的工作表**: Users, Pets, Events, FoodLogs, PoopLogs, HealthLogs

---

## 步驟 1: 創建 Google Apps Script（需手動）

1. 前往 https://script.google.com
2. 點擊 **+ New project**
3. 命名為 `Pet Calendar API`
4. **刪除所有默認代碼**

## 步驟 2: 粘貼後端代碼

1. 打開 `apps-script/Code.js` 文件
2. 複製全部內容
3. 粘貼到 Apps Script 編輯器中

## 步驟 3: 部署為 Web App

1. 點擊 **Deploy > New deployment**
2. 點擊 **Select type** > **Web app**
3. 設置：
   - **Description**: `Pet Calendar API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone with Google account`
4. 點擊 **Deploy**
5. **複製 Web App URL**（類似 `https://script.google.com/macros/s/XXXXX/exec`）

## 步驟 4: 更新前端 API URL

1. 打開 `index.html`
2. 找到約第 832 行
3. 將 `let API_URL = '';` 改為：
   ```javascript
   let API_URL = '你的Web App URL';
   ```

## 步驟 5: 部署到 GitHub Pages

```bash
cd pet-calendar
git init
git add index.html
git commit -m "Add Pet Calendar frontend"
git remote add origin https://github.com/alan9820/pet-calendar.git
git push -u origin main
```

然後在 GitHub repo  Settings > Pages 啟用 GitHub Pages。

---

## 測試

1. 前往你的 GitHub Pages URL（例如：`https://alan9820.github.io/pet-calendar/`）
2. 點擊「立即註冊」創建帳戶
3. 登入後添加寵物
4. 測試添加事件、飲食記錄、大便記錄

## Admin 登入

用以下電郵註冊/登入即可使用 Admin 功能：
- **Email**: `alan.yoshiki@gmail.com`

---

## 文件結構

```
pet-calendar/
├── index.html          # 前端應用
├── apps-script/
│   └── Code.js        # Google Apps Script 後端
├── SPEC.md            # 規格說明書
└── SETUP.md           # 本設置指南
```
