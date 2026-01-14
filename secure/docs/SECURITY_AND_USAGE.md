# 安全設計與使用流程說明

本文件詳細說明本專案的安全設計功能以及系統的操作流程。

## 一、 安全設計說明 (Security Design)

本系統針對常見的網頁應用程式弱點進行了以下防護措施，確保資料與使用者的安全。

### 1. 身份驗證與授權 (Authentication & Authorization)
- **JWT (JSON Web Token)**: 使用 JWT 進行無狀態的身份驗證。使用者登入後會取得一組 Token，後續請求需帶上此 Token 才能存取受保護的 API。
- **密碼雜湊 (Password Hashing)**: 使用 `bcrypt` 對使用者密碼進行加密儲存。即使資料庫外洩，攻擊者也無法直接取得原始密碼。
- **角色權限控制 (Role-Based Access Control, RBAC)**:
    - **Admin (管理員)**: 擁有最高權限，可新增、修改、刪除活動，查看所有報名名單，並執行簽到/取消報名等操作。
    - **User (一般使用者)**: 僅能瀏覽活動、報名活動、查看自己的報名紀錄以及取消自己的報名。
    - 系統在 API 層級 (`middleware/authMiddleware.js`) 嚴格檢查使用者角色，防止越權存取。

### 2. 輸入驗證 (Input Validation)
- **Joi 驗證**: 使用 `joi` 套件針對所有 API 的輸入資料進行嚴格驗證。
    - **註冊**: 檢查 Email 格式、密碼長度、電話號碼格式 (僅允許數字與連字號)。
    - **活動建立**: 檢查日期格式、名額是否為正整數等。
    - 防止惡意或錯誤格式的資料進入資料庫，減少 SQL Injection (雖然使用 MongoDB 為 NoSQL，但仍需防範 NoSQL Injection) 或其他資料異常風險。

### 3. 流量限制 (Rate Limiting)
- **登入防護**: 針對登入 API `/api/auth/login` 實作了速率限制 (Rate Limit)。
    - 設定：每分鐘最多允許 5 次登入嘗試。
    - 目的：防止暴力破解 (Brute Force Attack) 密碼。

### 4. 資料庫安全
- **MongoDB 連線**: 使用環境變數 (`.env`) 管理資料庫連線字串，避免將敏感資訊 (如帳密、主機位置) 硬編碼在程式碼中。
- **環境隔離**: 使用 Docker Compose 建立獨立的 MongoDB 容器，與主機環境隔離。

---

## 二、 系統使用流程 (Usage Flow)

### 1. 系統啟動
確保已安裝 Docker 與 Node.js。
```bash
# 1. 啟動資料庫
cd docker
docker compose up -d

# 2. 啟動後端伺服器
cd ../server
npm install
npm run dev
```
伺服器啟動後，請開啟瀏覽器訪問 `http://localhost:3001`。

### 2. 使用者註冊與登入
1.  **註冊**: 進入首頁點擊 "Sign Up"，輸入姓名、Email、密碼與電話進行註冊。
2.  **登入**: 註冊成功後，點擊 "Sign In" 輸入 Email 與密碼登入。登入成功後 Token 會儲存於 LocalStorage。

### 3. 活動瀏覽與報名 (一般使用者)
1.  **瀏覽活動**: 登入後在首頁可看到所有活動列表 (卡片式呈現)。
2.  **報名**: 點擊活動卡片上的 "Register" 按鈕。
    - 若名額已滿或已報名過，系統會提示錯誤。
    - 報名成功後，該活動會顯示 "Registered"。
3.  **查看我的報名**: 點擊導覽列的 "My Registrations"，可查看已報名的活動列表。
4.  **取消報名**: 在 "My Registrations" 頁面，點擊 "Cancel" 可取消報名。

### 4. 後台管理 (管理員)
> **注意**: 需在資料庫將使用者 `role` 欄位設定為 `admin` 才能使用管理功能。
1.  **新增活動**: 登入 Admin 帳號後，可使用 API 或未來擴充的管理介面新增活動。
2.  **管理名單**: 可查看特定活動的報名人員清單。
3.  **協助簽到**: 管理員可針對報名紀錄進行 "Check In" (簽到) 動作。

### 5. 系統清理 (開發測試用)
若需清空測試資料，可執行伺服器提供的清除腳本 (請謹慎使用)：
```bash
cd server
node clear_events.js
```
此指令將清空所有活動與報名紀錄。
