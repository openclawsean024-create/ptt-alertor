'use client';

import { useState, useEffect } from 'react';
import { useSafeUser } from '@/app/_lib/safe-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, isLoaded } = useSafeUser();
  const router = useRouter();

  const [lineToken, setLineToken] = useState('');
  const [email, setEmail] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect=/settings');
      return;
    }

    // Load existing settings
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // We only get "has_line", "has_email", "has_discord" — mask tokens
          // For now, just show empty fields (user re-enters)
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
  }, [user, isLoaded, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_token: lineToken || null,
          email: email || null,
          discord_webhook: discordWebhook || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setLineToken('');
        setDiscordWebhook('');
      } else {
        setErrorMsg(data.error || '儲存失敗');
      }
    } catch {
      setErrorMsg('網路錯誤');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">📡 PTT Alertor — 通知設定</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← 返回儀表板</Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">通知管道設定</h2>
          <p className="text-sm text-gray-500 mb-6">
            設定你的通知管道，符合條件的新文章會自動發送通知。
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              設定已儲存！
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* LINE Notify */}
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">💬 LINE Notify Token</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  從{' '}
                  <a
                    href="https://notify-bot.line.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    LINE Notify
                  </a>{' '}
                  取得個人權杖，留空可移除設定
                </p>
              </label>
              <input
                type="text"
                value={lineToken}
                onChange={e => setLineToken(e.target.value)}
                placeholder="例：abcdefghijklmnopqrstuvwxyz1234567890"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">📧 Email 通知</span>
                <p className="text-xs text-gray-400 mt-0.5">接收通知的電子信箱</p>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="例：your@email.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Discord */}
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">🎮 Discord Webhook URL</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  在 Discord 頻道設定 → 整合 → Webhook 取得 URL，留空可移除設定
                </p>
              </label>
              <input
                type="text"
                value={discordWebhook}
                onChange={e => setDiscordWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '儲存中...' : '儲存設定'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-medium text-yellow-800 mb-1">⚠️ 隱私說明</h3>
          <p className="text-sm text-yellow-700">
            你的 LINE Token、Email 和 Discord Webhook URL 只用於發送 PTT 文章通知，
            不會用於任何其他用途，也不會分享給第三方。
          </p>
        </div>
      </main>
    </div>
  );
}
