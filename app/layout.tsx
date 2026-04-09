import type { Metadata } from 'next';
import Link from 'next/link';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTT Alertor — 關鍵字追蹤訂閱服務',
  description: '追蹤 PTT 看板關鍵字，符合條件時第一時間通知你',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <Providers>{children}</Providers>
        <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                <span className="font-semibold text-gray-200">📡 PTT Alertor</span>
                <span className="mx-2">·</span>
                <span>關鍵字追蹤訂閱服務</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link href="/subscribe" className="hover:text-white transition-colors">訂閱方案</Link>
                <Link href="/pricing" className="hover:text-white transition-colors">定價</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">控制台</Link>
                <Link href="/settings" className="hover:text-white transition-colors">設定</Link>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-4 pt-4 text-center text-xs">
              © 2026 PTT Alertor. PTT 為台灣批踢踢實業坊之註冊財產。
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
