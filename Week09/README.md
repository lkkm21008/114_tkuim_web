

### 1️ 啟動後端 (Server)

進入 server 資料夾並安裝套件：

```bash
cd server
npm install
```

啟動後端：

```bash
npm run dev
```

成功會看到：

```
Server ready on http://localhost:3001
```

---

### 2 啟動前端 (Client)

#### 若使用 VS Code Live Server：

1. 安裝 Live Server 外掛  
2. 右鍵 `signup_form.html` → **Open with Live Server**

#### 若使用 Vite（可選）：

```bash
cd client
npm install
npm run dev
```

---

## 🔌 API 文件

### ✔ GET /api/signup  
取得所有註冊資料

**Response 範例：**

```json
[
  {
    "id": "123abc",
    "name": "test",
    "email": "test@test.com",
    "password": "123456",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---


**Request Body 範例：**

```json
{
  "name": "test",
  "email": "a@b.com",
  "password": "123"
}
```

**回傳：**

```json
{
  {
    "error": "phone 為必填"
}
}
```

---

## API 測試方式

### 使用 Postman

1. 打開 Postman  

2. 測試包含：
   - GET /api/signup
   - POST /api/signup（成功與錯誤）
3. - Export 成signup_collection.js

