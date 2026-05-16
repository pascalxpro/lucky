---
name: deploy-zeabur
description: 將 riiqi-lucky 部署到 Zeabur 雲端平台。當使用者說「部署到雲端」、「更新 Zeabur」、「deploy zeabur」時使用。
---

# Deploy to Zeabur

## 部署前確認
1. 程式碼已儲存，沒有未完成的修改
2. 已登入 Zeabur（`zeabur auth login`）
3. 如果有環境變數變動，提醒使用者到 Zeabur 後台更新

## 部署指令

```bash
zeabur deploy
```

## 部署後確認
```bash
zeabur logs
```

觀察 log，確認：
- `docker-entrypoint.sh` 正常執行
- DB 初始化或 migration 成功（若是全新部署）
- 服務成功啟動

## Zeabur 上的 Persistent Volume 狀態
✅ 已設定：
- `/app/prisma` — SQLite DB（資料不會因重啟消失）
- `/app/uploads` — 上傳檔案

## 與 NAS 部署的差異

| 項目 | NAS Docker | Zeabur |
|------|-----------|--------|
| Port | 3003 | 由 Zeabur 分配 |
| DB | volume `lucky-data` | Persistent Volume `/app/prisma` |
| 部署方式 | `docker compose up -d --build` | `zeabur deploy` |

## 注意事項
- Zeabur 和 NAS 是**獨立環境**，資料庫不共用
- Zeabur 重新部署不會清除 Persistent Volume 的資料
- 若需要回退，到 Zeabur 後台選擇前一個 deployment 重新啟用
