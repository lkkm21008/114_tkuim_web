# API 規格說明文件  
Activity Registration & Participant Management System

- Base URL：`http://localhost:3001`
- 資料格式：`application/json`
- ID 格式：MongoDB ObjectId（24 位十六進位字串）

---

## 一、活動（Events）

### 1. 新增活動
- **URL**：`/api/events`
- **Method**：`POST`

#### Request Body
| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| title | string | 是 | 活動名稱 |
| date | string | 是 | 日期（YYYY-MM-DD） |
| location | string | 是 | 活動地點 |
| quota | number | 是 | 名額 |
| description | string | 否 | 活動描述 |

#### Response（200）
```json
{
  "ok": true,
  "event": {
    "_id": "65a1b2c3d4e5f67890123456",
    "title": "期末專題 Demo Day",
    "date": "2026-01-10",
    "location": "E201 教室",
    "quota": 30,
    "description": "可留空"
  }
}
```

###  2. 取得活動列表
- **URL**：`/api/events`
- **Method**：`GET`

#### Response（200）
```json
[
  {
    "_id": "65a1b2c3d4e5f67890123456",
    "title": "期末專題 Demo Day",
    "date": "2026-01-10",
    "location": "E201 教室",
    "quota": 30,
    "description": "可留空"
  }
]
```

###  3. 刪除活動
- **URL**：`/api/events/:id`
- **Method**：`DELETE`

Path Parameter
|---|---|---|
參數	  說明
id	     活動ID

#### Response（200）
```json
  { "ok": true }
```

###  4. 查詢活動報名名單
- **URL**：`/api/events/:eventId/registrations`
- **Method**：`GET`

Path Parameter
參數	  說明
|---|---|---|
eventId	     活動ID

#### Response（200）
```json
 [
  {
    "_id": "65b111111111111111111111",
    "eventId": "65a1b2c3d4e5f67890123456",
    "participantId": "65c222222222222222222222",
    "checkedIn": false,
    "registeredAt": "2026-01-06T12:00:00.000Z",
    "checkedInAt": null,
    "participant": {
      "name": "王小明",
      "email": "ming@test.com",
      "phone": "0912-345-678"
    }
  }
]
```
## 二、參與者（Participants）

###  1. 新增參與者
- **URL**：`/api/participants`
- **Method**：`POST`

#### Response（200）
```json

  {
  "ok": true,
  "participant": {
    "_id": "65c222222222222222222222",
    "name": "王小明",
    "email": "ming@test.com",
    "phone": "0912-345-678"
  }
}

```
###  2. 取得參與者列表
- **URL**：`/api/participants`
- **Method**：`GET`

#### Response（200）
```json
[
  {
    "_id": "65c222222222222222222222",
    "name": "王小明",
    "email": "ming@test.com",
    "phone": "0912-345-678"
  }
]
```

###  3. 刪除參與者
- **URL**：`/api/participants/:id`
- **Method**：`DELETE`
| 參數 | 說明     |
| -- | ------ |
| id | 參與者 ID |

#### Response（200）
```json
{ "ok": true }
```
## 三、報名（Registrations）
### 1. 活動報名
- **URL**：`/api/registrations`
- **Method**：`POST`
| 欄位            | 型別     | 必填 | 說明     |
| ------------- | ------ | -- | ------ |
| eventId       | string | 是  | 活動 ID  |
| participantId | string | 是  | 參與者 ID |

#### Response（200）
```json
{
  "ok": true,
  "registration": {
    "_id": "65b111111111111111111111",
    "eventId": "65a1b2c3d4e5f67890123456",
    "participantId": "65c222222222222222222222",
    "checkedIn": false,
    "registeredAt": "2026-01-06T12:00:00.000Z",
    "checkedInAt": null
  }
}
```

#### 重複報名（409）
```json
{
  "ok": false,
  "error": "Already registered"
}
```

###  2. 簽到
- **URL**：`/api/registrations/:id/checkin`
- **Method**：`PATCH`
| 參數 | 說明      |
| -- | ------- |
| id | 報名紀錄 ID |

#### Response（200）
```json
{ "ok": true }
```

###  3. 取消報名
- **URL**：`/api/registrations/:id`
- **Method**：`DELETE`

#### Response（200）
```json
{ "ok": true }
```
## 四、錯誤回應格式
```json
{
  "ok": false,
  "error": "錯誤訊息說明"
}
```