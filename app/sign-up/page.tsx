'use client';

import { useState } from 'react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Bypass mode: registration is disabled, show confirmation
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-xl font-semibold mb-2">開通中</h1>
          <p className="text-gray-500">帳戶建立請求已收到，我開通後將通知你。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">註冊 PTT Alertor</h1>
        <p className="text-sm text-gray-500">成員功能籌備中，請留下 email 開通時通知你。</p>
        <input className="w-full rounded border p-3" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full rounded border p-3" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="w-full rounded bg-black p-3 text-white disabled:opacity-50" disabled={loading} type="submit">{loading ? '處理中...' : '註冊'}</button>
        <p className="text-xs text-center text-gray-400">成員功能上線中，現已進入搶先體驗。</p>
      </form>
    </div>
  );
}
