# PTT Alertor — 資料庫設定指南

## 选项一：Vercel Postgres（推荐）

### 步骤 1: 创建数据库

1. 打开 Vercel Dashboard: https://vercel.com/dashboard
2. 进入 `seans-projects-7dc76219` 项目
3. 點擊 **Storage** → **Create Database** → 選擇 **Neon** (或 Vercel Postgres)
4. 選擇方案（ Hobby 免費方案即可）
5. 建立完成後，Vercel 會自動將 `DATABASE_URL` 等環境變數注入專案

### 步骤 2: 套用 Schema

建立資料庫連線後，執行：

```bash
cd ~/workspaces/alan/ptt-alertor
vercel env pull .env.local   # 把 Vercel 的環境變數拉下來
npm run db:setup             # 套用資料表 Schema
```

---

## 选项二：独立 Neon 数据库（更简单）

### 步骤 1: 创建免费 Neon 账号

1. 前往 https://neon.tech 注册（可用 GitHub 登入）
2. 建立 Project → 選擇 **Taiwan (asia-northeast-1)** 作為區域
3. 建立完成後在 Dashboard 複製 **Connection string**

### 步骤 2: 設定環境變數

```bash
cd ~/workspaces/alan/ptt-alertor

# 將以下內容寫入 .env.local
cat >> .env.local << 'EOF'
DATABASE_URL=postgres://user:password@ep-xxx-xxx-123456.tokyo-1.neon.tech/neondb?sslmode=require
EOF
```

### 步骤 3: 套用 Schema

```bash
cd ~/workspaces/alan/ptt-alertor
npm run db:setup
```

### 步骤 4: 將 DATABASE_URL 加入 Vercel

```bash
vercel env add DATABASE_URL production
# 貼上你的 Neon Connection String
```

---

## 验证数据库已正确設定

```bash
curl "https://ptt-alertor-indol.vercel.app/api/subscriptions" \
  -H "Authorization: Bearer <your_clerk_token>"
```

如果回傳 `[]`（而非錯誤），表示資料庫連線正常。

---

## 資料表結構

| 表格 | 用途 |
|------|------|
| `users` | 使用者資料（ Clerk ID、通知渠道、方案 tier）|
| `subscriptions` | 訂閱設定（板塊、關鍵字、通知方式）|
| `alert_logs` | 觸發記錄 |
| `boards` | 看板參考表（快取熱門看板）|
