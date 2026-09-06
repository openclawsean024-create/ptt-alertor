# ptt-alertor · PRD 變更日誌

> 對齊 SPEC v3.0 契約（v3.0.2 = fleet alignment 版本）
> 維護者：Sean 10-repo-fleet
> 最後更新：2026-09-06

---

## v3.0.2 — 2026-09-06 by Sean 10-repo-fleet

**類型**：Fleet alignment（不改動規格書 §1–§19 正文）
**動機**：將 ptt-alertor 對齊 10-repo-fleet 的 SPEC v3.0 fleet 標準（其他 39 個 sibling repos 皆已升級到 v3.0.2）

### 變更內容

1. **frontmatter 升級**
   - 版本：v3.0 → **v3.0.2**
   - 維護者：Sophia (CPO) for Sean → **Sean 10-repo-fleet**
   - 新增 v3.0.2 說明段落（不改動 v3.0 sweet-spot rewrite 結論）

2. **新增 CHANGELOG.md**（本檔）
   - 串接 v2.0 (initial) → v3.0 (sweet-spot rewrite) → v3.0.2 (fleet alignment) 三層歷史

3. **新增 `.github/workflows/ci.yml`**（原本 repo 無 GHA workflow）
   - 對齊 SPEC v3.0 §7 標準 4-job 結構（lint/test/build/deploy → vercel）
   - 觸發：push to main + pull_request + workflow_dispatch
   - `permissions: contents: read + id-token: write`（Vercel deploy 用）
   - `concurrency: ci-${{ github.ref }} cancel-in-progress: true`
   - `cache: 'npm'` 啟用（此 repo 有 package.json）
   - vercel-action 用 `secrets.VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`

4. **Lint error 修正（minimal patches）**
   - `app/api/subscriptions/[id]/route.ts:29` — `Record<string, any>` → `Record<string, string | boolean | Date>`（type safety，無行為改變）
   - `app/dashboard/page.tsx:164` — `Math.random()` during render → `useState` lazy initializer（純函式化，無行為改變）
   - `app/dashboard/page.tsx:254` — 同上
   - `src/lib/auth.ts:22,31,32,38,39` — `as any` × 5 → 引入 `interface AppUser` + `as unknown as AppUser` 雙型別斷言（type safety，無行為改變）
   - 結果：lint 從 8 errors / 12 warnings → **0 errors / 12 warnings**（剩 12 個 unused vars / fonts 警告，非阻斷）

5. **新增 unit test**（原本 repo 無測試）
   - `tests/keywords.test.ts` — 8 個 test（matchKeywords AND/OR/empty/single + parseNotificationSettings null/object/string）
   - 用 Node 20 內建 `node:test` 跑（零新 deps）
   - 結果：**8/8 pass** (`node --import tsx --test tests/keywords.test.ts`)

6. **Build 補強**
   - `npm run build` → ✅ 成功（Next.js 16.2.1 Turbopack，21 個 route 全部 type check 通過）
   - 0 TypeScript errors

7. **不變更項目（per task constraints）**
   - `PRD/SPEC.md` §1–§19 規格書正文（v3.0 sweet-spot rewrite 7.2/10 已完備）
   - `app/api/**` 9 個 route（auth/alerts/boards/cron/settings/stripe/subscriptions）
   - `app/dashboard/page.tsx` / `app/sign-in/page.tsx` / `app/sign-up/page.tsx` / `app/subscribe/page.tsx` / `app/pricing/page.tsx` / `app/history/page.tsx` / `app/settings/page.tsx`（UI 邏輯不動，僅修 lint error）
   - `lib/keywords.ts` / `lib/notifications.ts` / `lib/ptt.ts` / `lib/stripe.ts` / `lib/db.ts`（純函式 + 業務邏輯不動）
   - `prisma/schema.sql`（DB schema 不動）
   - `vercel.json` cron（每日 0:00 跑 `/api/cron/crawl`）
   - `next.config.ts` / `tsconfig.json` / `eslint.config.mjs` / `postcss.config.mjs`
   - `SETUP_DATABASE.md` / `AGENTS.md` / `CLAUDE.md`（既有文件）

### Deploy 契約

- 目標：**Vercel**（既有 `vercel.json` + `next.config.ts` 已配置）
- Live：https://ptt-alertor-olive.vercel.app
- 觸發：push to main（自動 vercel-action deploy）
- Cron：每日 0:00 自動跑 `/api/cron/crawl`（PTT 看板爬蟲）
- Secret：需 `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`（owner 在 Vercel 後台設定）+ DB / Redis / Clerk / Stripe keys

### 驗證證據

| Check | Result |
|---|---|
| `npm install --legacy-peer-deps` | ✅ success (npm registry resolved all 25+ deps) |
| `npm run lint` | ✅ 0 errors / 12 warnings (warnings: unused vars + custom font — non-blocking) |
| `npm run build` | ✅ pass (Next.js 16.2.1 Turbopack, 21 routes) |
| `node --import tsx --test tests/keywords.test.ts` | ✅ 8 passed, 0 failed |
| New `.github/workflows/ci.yml` | ✅ 4-job SPEC v3.0 standard |

---

## v3.0 — 2026-07-19 (sweet-spot rewrite by Sophia (CPO) for Sean)

**類型**：Major rewrite (sweet-spot 3/10 → 7.2/10)
**動機**：原始版本目標族群過寬（368 萬 TAM 包含鄉民/學生/KOL 等低付費意願族群），無法與既有開源工具差異化

### 變更摘要

- 重新鎖定「**股票當沖族 + 求職秒殺族**」兩個付費意願最高的子族群（人數預估 8-12 萬）
- 加入「**AI 摘要 + LINE 一鍵轉傳同溫層**」差異化功能
- Tech stack：Next.js 14 + TypeScript + Tailwind CSS + Vercel Postgres + Clerk Auth + BullMQ + Redis
- 已實作 features：看板選擇（多選）、關鍵字訂閱（AND/OR 邏輯）、即時通知（LINE / Email / Discord）、帳號系統、通知歷史
- Live：https://ptt-alertor-olive.vercel.app
- sweet-spot 5 問體檢詳見 SPEC §15

---

## v2.0 — initial (pre-sweet-spot)

- 通用 PTT 關鍵字追蹤訂閱服務
- 宣稱服務「台股投資人 300 萬 + 求職 10 萬 + 行銷研究 3,000 + 鄉民 50 萬 + KOL 5 萬」共 368 萬 TAM
- 後由 v3.0 sweet-spot rewrite 取代
