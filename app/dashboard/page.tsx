'use client';

import { useState, useEffect } from 'react';
import { useSafeUser } from '@/app/_lib/safe-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subscription {
  id: string;
  board_name: string;
  keywords: { text: string; logic: string }[];
  notify_line: boolean;
  notify_email: boolean;
  notify_discord: boolean;
  is_active: boolean;
  created_at: string;
}

interface AlertLog {
  id: string;
  article_title: string;
  article_url: string;
  matched_keywords: string[];
  notified_at: string;
  board_name: string;
}

export default function DashboardPage() {
  const { user, isLoaded } = useSafeUser();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in');
      return;
    }

    const fetchData = async () => {
      try {
        const [subRes, alertRes] = await Promise.all([
          fetch('/api/subscriptions'),
          fetch('/api/alerts?limit=10'),
        ]);

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscriptions(data.data || []);
        }
        if (alertRes.ok) {
          const data = await alertRes.json();
          setRecentAlerts(data.data || []);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isLoaded, router]);

  const toggleSubscription = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s))
      );
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('確定刪除這個訂閱？')) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeCount = subscriptions.filter((s) => s.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">📡 PTT Alertor</h1>
          <div className="flex items-center gap-4">
            <Link href="/subscribe" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              + 新增訂閱
            </Link>
            <span className="text-sm text-gray-600">{user?.emailAddresses?.[0]?.emailAddress || '未登入'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">{activeCount}</div>
            <div className="text-sm text-gray-500 mt-1">活躍訂閱</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{subscriptions.length}</div>
            <div className="text-sm text-gray-500 mt-1">總訂閱數</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{recentAlerts.length}</div>
            <div className="text-sm text-gray-500 mt-1">本月通知</div>
          </div>
        </div>

        {/* Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">我的訂閱</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {subscriptions.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="mb-4">還沒有任何訂閱</p>
                <Link href="/subscribe" className="text-blue-600 hover:underline">
                  建立第一個訂閱 →
                </Link>
              </div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">/{sub.board_name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sub.is_active ? '運行中' : '已暫停'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>關鍵字：</span>
                      {sub.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          {kw.text}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {sub.notify_email && <span>📧</span>}
                      {sub.notify_line && <span>💬</span>}
                      {sub.notify_discord && <span>🎮</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSubscription(sub.id, sub.is_active)}
                      className={`px-3 py-1 text-sm rounded-lg border ${
                        sub.is_active
                          ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {sub.is_active ? '暫停' : '啟動'}
                    </button>
                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold">近期通知</h2>
            <Link href="/history" className="text-sm text-blue-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentAlerts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">還沒有任何通知記錄</div>
            ) : (
              recentAlerts.slice(0, 5).map((alert) => (
                <a
                  key={alert.id}
                  href={alert.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{alert.article_title}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-blue-600">/{alert.board_name}</span>
                        <span>•</span>
                        <span>{new Date(alert.notified_at).toLocaleString('zh-TW')}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {alert.matched_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
