'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TIERS = [
  {
    id: 'free',
    name: '免費',
    price: '$0',
    period: '永久',
    color: 'gray',
    features: ['1 個看板', '3 組關鍵字', '每 5 分鐘檢查', '7 天通知歷史', 'Email 通知'],
    limits: { boards: 1, keywords: 3, interval: 300, history: 7 },
  },
  {
    id: 'light',
    name: '輕量',
    price: '$99',
    period: '/月',
    color: 'blue',
    popular: true,
    features: ['5 個看板', '20 組關鍵字', '每 1 分鐘檢查', '30 天通知歷史', 'LINE + Email + Discord'],
    limits: { boards: 5, keywords: 20, interval: 60, history: 30 },
  },
  {
    id: 'pro',
    name: '專業',
    price: '$299',
    period: '/月',
    color: 'purple',
    features: ['無上限看板', '無上限關鍵字', '每 30 秒檢查', '90 天通知歷史', '所有通知管道'],
    limits: { boards: -1, keywords: -1, interval: 30, history: 90 },
  },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSelect = async (tierId: string) => {
    if (!user) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }
    setSelectedTier(tierId);
    // In production, integrate with Stripe/LemonSqueezy for payment
    alert(`感謝選擇 ${tierId === 'free' ? '免費' : tierId === 'light' ? '輕量' : '專業'} 方案！`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">📡 PTT Alertor</Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">前往儀表板</Link>
              ) : (
                <Link href="/sign-in" className="text-sm text-blue-600 hover:underline">登入</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">選擇你的方案</h1>
          <p className="text-lg text-gray-600">從今天起，不再錯過 PTT 任何重要資訊</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const colorClasses: Record<string, { bg: string; border: string; button: string; popular: string }> = {
              gray: { bg: 'bg-white', border: 'border-gray-200', button: 'bg-gray-900 text-white hover:bg-gray-800', popular: '' },
              blue: { bg: 'bg-white', border: 'border-blue-500', button: 'bg-blue-600 text-white hover:bg-blue-700', popular: 'ring-2 ring-blue-500' },
              purple: { bg: 'bg-white', border: 'border-gray-200', button: 'bg-purple-600 text-white hover:bg-purple-700', popular: '' },
            };
            const colors = colorClasses[tier.color];

            return (
              <div
                key={tier.id}
                className={`${colors.bg} rounded-2xl border-2 ${colors.border} ${colors.popular} p-6 flex flex-col`}
              >
                {tier.popular && (
                  <span className="self-start px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                    熱門選擇
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-green-500">✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(tier.id)}
                  disabled={selectedTier === tier.id}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${colors.button} disabled:opacity-50`}
                >
                  {selectedTier === tier.id ? '已選擇' : user && tier.id !== 'free' ? '立即升級' : '開始使用'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>所有方案皆可隨時升級或降級 • 付費方案 7 天內可退款</p>
          <p className="mt-2">需要客製化方案？<a href="mailto:support@pttalertor.com" className="text-blue-600 hover:underline">聯絡我們</a></p>
        </div>
      </main>
    </div>
  );
}
