import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">📡 PTT Alertor</span>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">登入</Link>
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">定價</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700">
            開始使用
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          追蹤 PTT 關鍵字<br />
          <span className="text-blue-600">不再錯過任何重要資訊</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          選擇看板、設定關鍵字，符合條件時第一時間透過 LINE / Email / Discord 通知你
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/subscribe" className="px-8 py-4 bg-blue-600 text-white text-lg rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200">
            免費建立訂閱
          </Link>
          <Link href="/pricing" className="px-8 py-4 bg-white text-gray-700 text-lg rounded-xl font-semibold hover:bg-gray-50 border border-gray-200">
            查看方案
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { icon: '🔍', title: '智慧關鍵字', desc: '支援 AND/OR 邏輯，靈活設定多組關鍵字' },
            { icon: '💬', title: '多元通知', desc: 'LINE Notify、Email、Discord，第一時間通知' },
            { icon: '⚡', title: '雲端爬蟲', desc: '穩定運行，不佔用你的網路和 IP' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <div className="mt-20 text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">適用場景</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { board: 'Stock', keyword: '台積電 + 熊本', use: '追蹤半導體產業動態' },
              { board: 'Tech_Job', keyword: 'SRE + 80k', use: '找到符合條件的工作機會' },
              { board: 'Gossiping', keyword: '政策 + 重大', use: '掌握重大時事議論' },
              { board: 'NBA', keyword: '勇士 + 交易', use: '追蹤球隊交易傳聞' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm flex items-start gap-4">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono">/{c.board}</div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">關鍵字：{c.keyword}</div>
                  <div className="text-sm text-gray-500">{c.use}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
