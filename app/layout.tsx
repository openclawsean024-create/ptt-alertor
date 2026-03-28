import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTT Alertor — 關鍵字追蹤訂閱服務',
  description: '追蹤 PTT 看板關鍵字，符合條件時第一時間通知你',
};

// Conditionally wrap with ClerkProvider only when keys are available
async function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return <>{children}</>;
  }
  const { ClerkProvider } = await import('@clerk/nextjs');
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
