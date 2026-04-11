import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'PTT Alertor — 關鍵字追蹤訂閱服務',
  description: '追蹤 PTT 看板關鍵字，符合條件時第一時間通知你',
};

async function Providers({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
