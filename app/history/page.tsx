'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface AlertLog {
  id: string;
  board_name: string;
  article_title: string;
  article_url: string;
  article_author: string;
  matched_keywords: string[];
  notified_at: string;
  notification_channel: string;
}

export default function HistoryPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect=/history');
      return;
    }

    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/alerts?limit=${limit}&page=${page}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.data || []);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, isLoaded, router, page]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">📡 PTT Alertor — 通知歷史</h1>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">← 返回儀表板</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {alerts.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">
              還沒有任何通知記錄
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <a
                  key={alert.id}
                  href={alert.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">/{alert.board_name}</span>
                      {alert.notification_channel === 'line' && <span className="text-xs text-green-600">💬 LINE</span>}
                      {alert.notification_channel === 'email' && <span className="text-xs text-gray-500">📧 Email</span>}
                      {alert.notification_channel === 'discord' && <span className="text-xs text-indigo-600">🎮 Discord</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(alert.notified_at).toLocaleString('zh-TW')}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{alert.article_title}</h3>
                  <div className="flex flex-wrap items-center gap-1">
                    匹配：
                    {alert.matched_keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                  {alert.article_author && (
                    <div className="text-xs text-gray-400 mt-1">作者：{alert.article_author}</div>
                  )}
                </a>
              ))}
            </div>
          )}

          {alerts.length === limit && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                上一頁
              </button>
              <span className="text-sm text-gray-500">第 {page} 頁</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={alerts.length < limit}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
