# 系統架構與流程圖

## 1. 系統架構圖 (System Architecture)

```mermaid
graph TD
    User[使用者 (Browser)]
    
    subgraph Frontend [前端 (Frontend)]
        UI[網頁介面 (HTML/CSS)]
        Logic[應用邏輯 (app.js)]
        API_Client[Fetch API]
    end

    subgraph Backend [後端 (Node.js/Express)]
        Server[Web Server]
        Router[路由 (Routes)]
        Repo[資料存取層 (Repositories)]
    end

    subgraph Database [資料庫 (MongoDB)]
        DB[(MongoDB)]
    end

    User <-->|互動| UI
    UI <--> Logic
    Logic <--> API_Client
    API_Client <-->|HTTP Request/Response| Server
    Server <--> Router
    Router <--> Repo
    Repo <-->|CRUD Operations| DB
```

## 2. 資料流 CRUD 流程圖 (Data Flow)

描述：使用者透過前端進行操作（如報名活動），資料流經後端處理並寫入資料庫的過程。

```mermaid
sequenceDiagram
    autonumber
    participant U as 使用者
    participant F as 前端 (app.js)
    participant S as 後端 API (Routes)
    participant R as Repository
    participant D as 資料庫 (MongoDB)

    Note over U, F: 動作：報名活動

    U->>F: 點擊「送出報名」
    F->>F: 驗證表單資料
    F->>S: POST /api/registrations (JSON)
    
    Note over S, R: 後端處理

    S->>S: 驗證請求參數
    S->>R: 呼叫 register()
    
    R->>D: findOne (檢查重複報名)
    D-->>R: 回傳查詢結果
    
    alt 已重複報名
        R-->>S: Return Error (409)
        S-->>F: Response 409 Conflict
        F-->>U: 顯示「重複報名」提示
    else 未重複
        R->>D: insertOne (寫入資料)
        D-->>R: Acknowledge
        R-->>S: Return Success
        S-->>F: Response 200 OK
        F-->>U: 顯示「報名成功」並更新列表
    end
```
