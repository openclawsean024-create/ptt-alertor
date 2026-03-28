'use client';

import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">登入 PTT Alertor</h1>
        <p className="text-gray-600 mb-8">
          認證功能設定中，請稍候。<br />
          若需立即使用，請聯繫客服開通帳號。
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            返回首頁
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 border border-gray-200"
          >
            前往儀表板 →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          認證服務由 Clerk 提供支援
        </p>
      </div>
    </div>
  );
}
