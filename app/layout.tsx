import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTT Alertor — 關鍵字追蹤訂閱服務',
  description: '追蹤 PTT 看板關鍵字，符合條件時第一時間通知你',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="zh-TW">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
