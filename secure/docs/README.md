# 活動報名與參與者管理系統 (Activity Registration System)

本專案為一套完整的活動報名管理系統，採用前後端分離架構，提供使用者註冊、活動報名以及管理員後台管理功能。本文件說明專案的功能、架構、部署方式以及資料庫設計。

---

## 一、 專案概述 (Project Overview)

### 1. 專案功能
- **活動管理**: 管理員可新增、修改、刪除活動資訊 (名稱、日期、地點、名額等)。
- **參與者系統**: 使用者可註冊帳號、登入系統，並管理個人資料。
- **報名與簽到**: 使用者可報名活動，管理員可查看名單並協助簽到。
- **安全防護**: 實作 JWT 驗證、輸入過濾、流量限制等多層次安全機制。

### 2. 系統架構
本系統採用 **Client-Server** 架構：
- **前端 (Frontend)**: 原生 HTML/CSS/JavaScript，透過 Fetch API 與後端溝通。
- **後端 (Backend)**: Node.js + Express 框架，提供 RESTful API。
- **資料庫 (Database)**: MongoDB (NoSQL)，使用 Docker 容器化部署。

### 3. 部署方式與運行流程
- **部署**: 使用 Docker Compose 啟動 MongoDB，Node.js 應用程式直接運行於本機 (或亦可容器化)。
- **流程**:
    1.  啟動資料庫容器。
    2.  啟動後端 API Server。
    3.  使用者透過瀏覽器存取前端頁面。

---

## 二、 專案完整原始碼結構

專案目錄結構如下：

```
final_project/
├── docker/                 # Docker 配置
│   └── docker-compose.yml  # MongoDB 服務定義
├── server/                 # 後端伺服器核心代碼
│   ├── public/             # 前端靜態資源 (HTML, CSS, JS)
│   ├── routes/             # API 路由定義 (Auth, Events, Participants, Registrations)
│   ├── middleware/         # 中介軟體 (Auth, Validation, Rate Limit)
│   ├── repositories/       # 資料庫存取層 (Data Access Layer)
│   ├── app.js              # 應用程式入口點
│   ├── db.js               # 資料庫連線設定
│   └── package.json        # 專案依賴配置
├── docs/                   # 專案文件
├── SECURITY_AND_USAGE.md   # 安全設計與詳細使用說明
└── README.md               # 本文件
```

---

## 三、 安全設計說明 (Security Design)

本專案高度重視安全性，實作了以下防護措施：

- **身份驗證**: 使用 **JWT** 確保 API 存取安全。
- **密碼保護**: 使用 **bcrypt** 加密儲存使用者密碼。
- **輸入驗證**: 使用 **Joi** 嚴格驗證所有輸入資料，防範注入攻擊。
- **流量限制**: 針對登入介面實作 **Rate Limiting** 防止暴力破解。

詳細安全設計內容請參閱專案根目錄下的 [**SECURITY_AND_USAGE.md**](SECURITY_AND_USAGE.md)。

---

## 四、 專案測試的運行環境

測試本專案建議使用以下環境：

- **作業系統**: Windows 10/11, macOS, 或 Linux
- **Runtime**: Node.js v14 以上 (建議 v18 LTS)
- **Container Runtime**: Docker Desktop (包含 Docker Compose)
- **測試工具**: Google Chrome / Edge 瀏覽器, Postman (選用)

---

## 五、 資料庫建置方式與資料表設計

本系統使用 **MongoDB**，資料庫名稱預設為 `tkuim_final` (可於 `.env` 設定)。

### Collection 設計 (Schema)

#### 1. Participants (參與者/使用者)
儲存使用者的登入與基本資訊。
```javascript
{
  "_id": ObjectId("..."),
  "name": "王大明",
  "email": "user@example.com", // 唯一索引
  "password": "$2b$10$...",    // 加密後的密碼 (敏感資料已遮蔽)
  "phone": "0912-345-678",
  "role": "user"               // "user" 或 "admin"
}
```

#### 2. Events (活動)
儲存活動詳細資訊。
```javascript
{
  "_id": ObjectId("..."),
  "title": "資安研討會",
  "date": "2024-12-25",
  "description": "探討 Web 安全...",
  "location": "A101 會議室",
  "price": 0,
  "quota": 100
}
```

#### 3. Registrations (報名紀錄)
關聯活動與參與者，記錄報名狀態。
```javascript
{
  "_id": ObjectId("..."),
  "eventId": ObjectId("..."),       // 關聯 Events
  "participantId": ObjectId("..."), // 關聯 Participants
  "status": "success",              // "success", "cancelled"
  "hasCheckedIn": false,            // 簽到狀態
  "registeredAt": ISODate("...")
}
```

---

## 六、 快速開始 (Quick Start)

1.  **啟動資料庫**:
    ```bash
    cd docker
    docker compose up -d
    ```

2.  **安裝依賴並啟動伺服器**:
    ```bash
    cd server
    npm install
    npm run dev
    ```

3.  **開啟應用程式**:
    瀏覽器輸入 `http://localhost:3001`
