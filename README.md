# PTT Alertor

讓你不再錯過 PTT 任何重要資訊的關鍵字追蹤訂閱服務。

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres
- **Auth**: Clerk
- **Queue**: BullMQ + Redis
- **Deployment**: Vercel

## Features (MVP)
- [x] 看板選擇（多選）
- [x] 關鍵字訂閱（AND/OR 邏輯）
- [x] 即時通知（LINE / Email / Discord）
- [x] 帳號系統
- [x] 通知歷史

## Getting Started
```bash
npm install
npm run dev
```

## Environment Variables
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
REDIS_URL=
LINE_NOTIFY_TOKEN=
DISCORD_WEBHOOK_URL=
```
