'use client';

import { useState, useEffect } from 'react';
import { useSafeUser } from '@/app/_lib/safe-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TIERS = {
  free: {
    name: '免費',
    color: 'gray',
    limits: { boards: 1, keywords: 3, interval: 3600, history: 7, notifyLimit: 50 },
  },
  light: {
    name: '輕量',
    price: '$30/月',
    color: 'blue',
    limits: { boards: 5, keywords: 20, interval: 1800, history: 30, notifyLimit: 500 },
  },
  pro: {
    name: '專業',
    price: '$99/月',
    color: 'purple',
    limits: { boards: -1, keywords: -1, interval: 30, history: 90, notifyLimit: 5000 },
  },
};

const HOT_BOARDS = [
  { name: 'Gossiping', alias: '八卦板', category: 'social' },
  { name: 'Stock', alias: '股板', category: 'finance' },
  { name: 'Tech_Job', alias: '科技業板', category: 'career' },
  { name: 'Soft_Job', alias: '軟工板', category: 'career' },
  { name: 'NBA', alias: 'NBA板', category: 'sports' },
  { name: 'Baseball', alias: '棒球板', category: 'sports' },
  { name: 'Movie', alias: '電影板', category: 'entertainment' },
  { name: 'TechNews', alias: '科技板', category: 'news' },
  { name: 'Crypto', alias: '加密貨幣', category: 'finance' },
  { name: 'MobileComm', alias: '手機板', category: 'tech' },
  { name: 'WomenTalk', alias: '女性板', category: 'social' },
  { name: 'Beauty', alias: '美妝板', category: 'lifestyle' },
  { name: 'Muscle', alias: '健身板', category: 'health' },
  { name: 'Food', alias: '美食板', category: 'lifestyle' },
  { name: 'Travel', alias: '旅遊板', category: 'lifestyle' },
  { name: 'BabyMother', alias: '媽寶板', category: 'family' },
  { name: 'C_Chat', alias: 'C#/.NET板', category: 'tech' },
  { name: 'Python', alias: 'Python板', category: 'tech' },
  { name: 'Linux', alias: 'Linux板', category: 'tech' },
  { name: 'Hardware', alias: '硬體板', category: 'tech' },
  { name: 'PC_Shopping', alias: '筆電選購板', category: 'tech' },
  { name: 'LoL', alias: '英雄聯盟板', category: 'gaming' },
  { name: 'marvel', alias: '漫威板', category: 'entertainment' },
  { name: 'Japan_Travel', alias: '日本旅遊板', category: 'travel' },
  { name: 'Insurance', alias: '保險板', category: 'finance' },
  { name: 'Car', alias: '汽車板', category: 'transport' },
  { name: 'Tainan', alias: '台南板', category: 'regional' },
  { name: 'Taipei', alias: '台北板', category: 'regional' },
  { name: 'StudyAbroad', alias: '留學板', category: 'education' },
];

export default function SubscribePage() {
  const { user, isLoaded } = useSafeUser();
  const router = useRouter();

  const [boardSearch, setBoardSearch] = useState('');
  const [boardResults, setBoardResults] = useState(HOT_BOARDS);
  const [isSearchingBoards, setIsSearchingBoards] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [keywords, setKeywords] = useState<{ text: string; logic: 'AND' | 'OR' }[]>([
    { text: '', logic: 'OR' },
  ]);
  const [notifyLine, setNotifyLine] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyDiscord, setNotifyDiscord] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 訂閱頁面預設為 free tier（實際方案需資料庫讀取）
  const currentTier: 'free' | 'light' | 'pro' = 'free';
  const tier = TIERS[currentTier];
  const tierLimits = tier.limits;

  const displayedBoards = boardResults;

  const filledKeywords = keywords.filter((k) => k.text.trim());

  // 等級提示
  const showUpgradeBanner =
    filledKeywords.length >= tierLimits.keywords && tierLimits.keywords !== -1;

  // 搜尋看板
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearchingBoards(true);
      try {
        const res = await fetch(`/api/boards?search=${encodeURIComponent(boardSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setBoardResults(data.data || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setIsSearchingBoards(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [boardSearch]);

  const addKeyword = () => {
    if (tierLimits.keywords !== -1 && filledKeywords.length >= tierLimits.keywords) {
      setErrorMsg(`免費方案最多 ${tierLimits.keywords} 組關鍵字，請先升級方案`);
      return;
    }
    setKeywords([...keywords, { text: '', logic: 'OR' }]);
    setErrorMsg('');
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
    if (!selectedBoard || !filledKeywords.length) return;

    if (tierLimits.keywords !== -1 && filledKeywords.length > tierLimits.keywords) {
      setErrorMsg(`免費方案最多 ${tierLimits.keywords} 組關鍵字，請先升級方案`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_name: selectedBoard,
          keywords: filledKeywords,
          notify_line: notifyLine,
          notify_email: notifyEmail,
          notify_discord: notifyDiscord,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setErrorMsg(data.error || '建立失敗，請稍後再試');
      }
    } catch (error) {
      setErrorMsg('網路錯誤，請檢查網路連線後再試');
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
        {/* Tier Banner */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">目前方案</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                currentTier === 'free' ? 'bg-gray-400' : currentTier === 'light' ? 'bg-blue-500' : 'bg-purple-500'
              }`}>
                {TIERS[currentTier as keyof typeof TIERS].name}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              免費方案：1 個看板 / 3 組關鍵字（需資料庫整合才能讀取真實方案）
            </div>
          </div>
          <Link
            href="/pricing"
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            升級方案 →
          </Link>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">新增訂閱</h1>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← 回到儀表板</Link>
        </div>
        <p className="text-gray-600 mb-8">選擇看板 + 設定關鍵字，設定你的監控條件</p>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            訂閱建立成功！即將跳轉至儀表板...
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Board Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">選擇看板</h2>
              <span className="text-xs text-gray-400">
                {selectedBoard ? '1 / 1' : '0 / 1'}（免費方案上限 1 個）
              </span>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              placeholder="搜尋看板名稱，如：股板、科技業..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Selected Board Display */}
            {selectedBoard && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-700">
                    {boardResults.find((b) => b.name === selectedBoard)?.alias || selectedBoard}
                  </span>
                  <span className="text-blue-500 text-sm ml-2">/{selectedBoard}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBoard('')}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  清除
                </button>
              </div>
            )}

            {/* Board Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {isSearchingBoards ? (
                <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                  搜尋中...
                </div>
              ) : displayedBoards.length === 0 ? (
                <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                  找不到符合「{boardSearch}」的看板
                </div>
              ) : (
                displayedBoards.map((board) => (
                  <button
                    key={board.name}
                    type="button"
                    onClick={() => {
                      setSelectedBoard(board.name);
                      setBoardSearch('');
                    }}
                    disabled={!!selectedBoard && selectedBoard !== board.name}
                    className={`p-2 rounded-lg border-2 text-left transition-all text-sm ${
                      selectedBoard === board.name
                        ? 'border-blue-500 bg-blue-50'
                        : !!selectedBoard
                        ? 'border-gray-100 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{board.alias}</div>
                    <div className="text-xs text-gray-400">/{board.name}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Keyword Subscription */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">關鍵字設定</h2>
              <span className="text-xs text-gray-400">
                {filledKeywords.length} / {tierLimits.keywords === -1 ? '無上限' : tierLimits.keywords}
              </span>
            </div>

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
              className={`mt-3 text-sm ${filledKeywords.length >= (tierLimits.keywords === -1 ? 999 : tierLimits.keywords) ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`}
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
              <label className="flex items-center gap-3 cursor-pointer opacity-50">
                <input
                  type="checkbox"
                  checked={notifyLine}
                  onChange={(e) => setNotifyLine(e.target.checked)}
                  disabled
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span>💬 LINE Notify <span className="text-xs text-gray-400">（輕量以上方案）</span></span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer opacity-50">
                <input
                  type="checkbox"
                  checked={notifyDiscord}
                  onChange={(e) => setNotifyDiscord(e.target.checked)}
                  disabled
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span>🎮 Discord Webhook <span className="text-xs text-gray-400">（輕量以上方案）</span></span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedBoard || !filledKeywords.length}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '建立中...' : '建立訂閱'}
          </button>
        </form>
      </div>
    </div>
  );
}
