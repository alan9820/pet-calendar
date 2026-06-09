# Pet Calendar CRM - 規格說明書

## 1. Overview

**名稱**: Pet Calendar  
**用途**: 寵物主人記錄寵物行為、飲食、健康狀況的 CRM 系統  
**目標用戶**: 寵物主人（客户）/ 管理者（Alan）

## 2. Architecture

- **Frontend**: GitHub Pages (Static HTML/CSS/JS)
- **Backend**: Google Apps Script (REST API)
- **Database**: Google Sheets

## 3. Features

### 3.1 Authentication
- 用戶可以 self-register (email + password)
- 用戶可以 login/logout
- Admin (Alan) 可以管理所有用戶和寵物
- 密碼用 SHA-256 hash 存入 Google Sheet

### 3.2 Pet Management
- 用戶可以新增/編輯/刪除寵物
- 寵物資料：名字、種類（狗/貓/其他）、品種、出生日期、相片 URL

### 3.3 CRM Features (Tabbed Interface)

#### Tab 1: 行事曆 (Calendar)
- 月視圖顯示所有事件
- 事件類型：獸醫、藥物、驅蟲、梳毛、洗澡、其他
- 可新增/編輯/刪除事件

#### Tab 2: 飲食記錄 (Food Log)
- 日期時間
- 食物名稱
- 卡路里
- 分量 (g)
- 備註

#### Tab 3: 大便記錄 (Poop Log)
- 日期時間
- 質地 (水/稀/爛/軟團/硬粒)
- 評分 (1-7)
- 備註

#### Tab 4: 健康報告 (Health Report)
- 體重記錄
- 症狀記錄
- 醫療記錄摘要

### 3.4 Admin Panel
- 查看所有用戶
- 查看所有寵物
- 查看所有記錄

## 4. Data Model (Google Sheets)

### Sheet: Users
| Column | Type |
|--------|------|
| userId | string |
| email | string |
| passwordHash | string |
| name | string |
| role | string (user/admin) |
| createdAt | datetime |

### Sheet: Pets
| Column | Type |
|--------|------|
| petId | string |
| userId | string |
| name | string |
| type | string |
| breed | string |
| birthDate | date |
| photoUrl | string |
| createdAt | datetime |

### Sheet: Events
| Column | Type |
|--------|------|
| eventId | string |
| petId | string |
| title | string |
| type | string |
| datetime | datetime |
| notes | string |
| createdAt | datetime |

### Sheet: FoodLogs
| Column | Type |
|--------|------|
| logId | string |
| petId | string |
| datetime | datetime |
| foodName | string |
| calories | number |
| portion | number |
| notes | string |

### Sheet: PoopLogs
| Column | Type |
|--------|------|
| logId | string |
| petId | string |
| datetime | datetime |
| texture | string |
| score | number |
| notes | string |

### Sheet: HealthLogs
| Column | Type |
|--------|------|
| logId | string |
| petId | string |
| datetime | datetime |
| weight | number |
| symptoms | string |
| notes | string |

## 5. API Endpoints (Google Apps Script)

```
POST /api/register - 註冊新帳戶
POST /api/login - 登入
GET  /api/pets - 獲取用戶的寵物列表
POST /api/pets - 新增寵物
PUT  /api/pets/:id - 更新寵物
DEL  /api/pets/:id - 刪除寵物
GET  /api/events/:petId - 獲取事件
POST /api/events - 新增事件
PUT  /api/events/:id - 更新事件
DEL  /api/events/:id - 刪除事件
GET  /api/food/:petId - 獲取食物記錄
POST /api/food - 新增食物記錄
GET  /api/poop/:petId - 獲取大便記錄
POST /api/poop - 新增大便記錄
GET  /api/health/:petId - 獲取健康記錄
POST /api/health - 新增健康記錄
GET  /api/admin/users - 獲取所有用戶 (admin only)
```

## 6. Security

- 密碼使用 SHA-256 hash
- ユーザー只能訪問自己的寵物數據
- Admin 可以訪問所有數據
- API 需要 valid session token

## 7. URL Structure

- GitHub Repo: `https://github.com/alan9820/pet-calendar`
- Website: `https://alan9820.github.io/pet-calendar/`
- Google Apps Script: `https://script.google.com/...` (hidden backend)

## 8. Design

- 配色: 柔和的綠色/米色系 (自然/健康感)
- Font: Nunito (Google Fonts) - 友善可愛的字體
- Icons: Emoji based (🐕 🐈 💊 💉 🍖 💩)
- 響應式設計 (mobile-first)

## 9. Tech Stack

- HTML5 + CSS3 + Vanilla JavaScript
- Google Apps Script (ES5+)
- Google Sheets (Database)
- GitHub Pages (Hosting)
