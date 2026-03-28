'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  board_name: string;
  keywords: { text: string; logic: 'AND' | 'OR' }[];
  notify_line: boolean;
  notify_email: boolean;
  notify_discord: boolean;
  is_active: boolean;
  created_at: string;
}

const POPULAR_BOARDS = [
  { name: 'Stock', alias: '股板', category: 'finance' },
  { name: 'Tech_Job', alias: '科技業板', category: 'career' },
  { name: 'Soft_Job', alias: '軟工板', category: 'career' },
  { name: 'Gossiping', alias: '八卦板', category: 'social' },
  { name: 'NBA', alias: 'NBA板', category: 'sports' },
  { name: 'Baseball', alias: '棒球板', category: 'sports' },
  { name: 'Movie', alias: '電影板', category: 'entertainment' },
  { name: 'TechNews', alias: '科技板', category: 'news' },
  { name: 'Crypto', alias: '加密貨幣', category: 'finance' },
  { name: 'MobileComm', alias: '手機板', category: 'tech' },
];

export default function SubscribePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [selectedBoard, setSelectedBoard] = useState('');
  const [keywords, setKeywords] = useState<{ text: string; logic: 'AND' | 'OR' }[]>([
    { text: '', logic: 'OR' },
  ]);
  const [notifyLine, setNotifyLine] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDiscord, setNotifyDiscord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const addKeyword = () => {
    setKeywords([...keywords, { text: '', logic: 'OR' }]);
  };

  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  const updateKeyword = (index: number, field: 'text' | 'logic', value: string) => {
    const updated = [...keywords];
    if (field === 'logic') {
      updated[index].logic = value as 'AND' | 'OR';
    } else {
      updated[index].text = value;
    }
    setKeywords(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard || !keywords.some((k) => k.text.trim())) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_name: selectedBoard,
          keywords: keywords.filter((k) => k.text.trim()),
          notify_line: notifyLine,
          notify_email: notifyEmail,
          notify_discord: notifyDiscord,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">新增訂閱</h1>
        <p className="text-gray-600 mb-8">選擇看板 + 設定關鍵字，設定你的監控條件</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            訂閱建立成功！即將跳轉至儀表板...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Board Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">選擇看板</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POPULAR_BOARDS.map((board) => (
                <button
                  key={board.name}
                  type="button"
                  onClick={() => setSelectedBoard(board.name)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedBoard === board.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{board.alias}</div>
                  <div className="text-xs text-gray-500">{board.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Keyword Subscription */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">關鍵字設定</h2>
            <div className="space-y-3">
              {keywords.map((kw, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <select
                      value={kw.logic}
                      onChange={(e) => updateKeyword(index, 'logic', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="OR">OR</option>
                      <option value="AND">AND</option>
                    </select>
                  )}
                  {index === 0 && <span className="text-sm text-gray-400 w-16">關鍵字</span>}
                  <input
                    type="text"
                    value={kw.text}
                    onChange={(e) => updateKeyword(index, 'text', e.target.value)}
                    placeholder="輸入關鍵字，如：台積電、護國神山"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {keywords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addKeyword}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              + 新增關鍵字
            </button>
          </div>

          {/* Notification Channels */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">通知方式</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span>📧 Email 通知</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyLine}
                  onChange={(e) => setNotifyLine(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span>💬 LINE Notify</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyDiscord}
                  onChange={(e) => setNotifyDiscord(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span>🎮 Discord Webhook</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedBoard || !keywords.some((k) => k.text.trim())}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '建立中...' : '建立訂閱'}
          </button>
        </form>
      </div>
    </div>
  );
}
