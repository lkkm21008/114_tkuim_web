# 活動報名與參與者管理系統

## 一、專案主題與目標
本專題為一套「活動報名與參與者管理系統」，提供管理者建立活動、管理參與者資料，並讓參與者進行活動報名與簽到。

系統目標如下：
- 提供活動基本資料的新增、查詢、修改與刪除（CRUD）
- 管理參與者基本資訊
- 支援活動報名、名單查詢與簽到功能
- 提供簡易前端介面，方便操作與展示
- 採用前後端分離架構，符合實務開發流程

---

## 二、技術選擇與原因

### 1. Node.js + Express
- 使用 JavaScript 作為後端開發語言，學習成本低
- Express 框架輕量、彈性高，適合實作 RESTful API
- 容易與前端 fetch / AJAX 整合

### 2. MongoDB
- NoSQL 文件型資料庫，結構彈性高
- 適合活動、參與者、報名資料等關聯結構
- 搭配 ObjectId 進行資料關聯，實作簡單

### 3. Docker
- 使用 Docker Compose 啟動 MongoDB
- 確保開發環境一致，助教可快速執行專案
- 避免安裝資料庫造成環境問題

### 4. 原生 HTML / CSS / JavaScript
- 不依賴大型前端框架，降低複雜度
- 直接透過 fetch 呼叫後端 API
- 清楚展示前後端分離概念

---

## 三、系統架構說明

### 專案結構
final_project/
├─ docker/
│ └─ docker-compose.yml # MongoDB 容器設定
├─ server/
│ ├─ app.js # Express 入口
│ ├─ db.js # MongoDB 連線設定
│ ├─ routes/ # API 路由
│ │ ├─ events.js
│ │ ├─ participants.js
│ │ └─ registrations.js
│ ├─ repositories/ # 資料存取層
│ ├─ public/ # 前端頁面
│ │ ├─ index.html
│ │ ├─ app.js
│ │ └─ styles.css
│ ├─ api.http # API 測試文件
│ ├─ package.json
│ └─ .env 
└─ README.md


### 架構說明
- 前端透過 `fetch` 呼叫後端 REST API
- 後端採用 MVC 類似分層：
  - routes：處理 HTTP 請求
  - repositories：負責資料庫操作
- MongoDB 透過 Docker Compose 啟動
- 靜態前端頁面由 Express 提供 (`express.static`)

---

## 四、功能說明

### 活動管理
- 新增活動（名稱、日期、地點、名額、描述）
- 查詢活動列表
- 刪除活動

### 參與者管理
- 新增參與者（姓名、Email、電話）
- 查詢參與者列表
- 刪除參與者

### 報名 / 名單 / 簽到
- 選擇活動與參與者進行報名
- 查詢活動報名名單
- 參與者簽到 / 取消簽到

---

## 五、安裝與執行指引

### 1. 環境需求
- Node.js（建議 v18 以上）
- Docker 與 Docker Compose

### 2. 啟動 MongoDB
```bash
cd final_project/docker
docker compose up -d
cd final_project/server
npm install
npm run dev
啟動成功後，終端機會顯示：
[DB] Connected to MongoDB
Server running on port 3001
在瀏覽器開啟：
http://localhost:3001/
```
## 六、API 測試方式

本專案提供 api.http 檔案，可使用 VS Code REST Client 套件測試所有 API。

測試內容包含：

- 活動 CRUD

- 參與者 CRUD

- 活動報名

- 名單查詢

- 簽到與取消簽到
