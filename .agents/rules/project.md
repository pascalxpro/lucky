# A-riiqi-lucky 抽獎投票系統

## 專案概述
互動式投票與抽獎平台，支援多種遊戲模式（轉盤、刮刮樂、拉霸機）、機率控制、獎品庫存管理、得獎者資料收集、音效、數據儀表板、獎品出貨追蹤。

## 技術棧
- **框架**：Next.js 16 + React 19 + TypeScript
- **樣式**：Tailwind CSS、shadcn/ui
- **資料庫**：SQLite（better-sqlite3）透過 Prisma ORM
- **音效**：Howler.js
- **拖放**：@dnd-kit
- **圖表**：Recharts
- **報表**：xlsx

## 資料庫：SQLite

- 使用 `better-sqlite3`，**不是** PostgreSQL，不需要外部 DB 服務
- DB 檔案路徑：`./prisma/dev.db`

```bash
npm run db:push      # 推送 schema（開發用）
npm run db:seed      # 初始化種子資料
npm run db:reset     # 強制重置 DB + 重新 seed（會清空所有資料）
```

## 部署：雙環境

### NAS Docker
- container 名稱：`riiqi-lucky`，對外 port：`3003`
- SQLite DB 存在 volume `lucky-data`（掛載至 `/app/prisma`）→ 資料持久保存
- 上傳檔案存在 volume `lucky-uploads`（掛載至 `/app/uploads`）

### Zeabur
- 設定檔：`zeabur.json`（指向同一個 `Dockerfile`）
- ✅ 已掛載 Persistent Volume：`/app/prisma` 與 `/app/uploads`，資料不會消失

### 啟動邏輯（docker-entrypoint.sh）
每次 container 啟動自動執行：
1. DB 若不存在 → 自動建立資料表 + 種子資料
2. 執行 inline schema migration（ALTER TABLE）
3. 啟動 `node server.js`

**不要**用 `prisma migrate` 管理正式環境 schema，新增欄位要在 entrypoint.sh 裡加 ALTER TABLE 判斷。

## 重要規則
- SQLite 不支援多個 container 同時寫入，不要橫向擴展
- `better-sqlite3` 是同步 API，不要在 API routes 裡用 `await` 包它
