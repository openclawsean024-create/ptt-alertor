'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSafeUser } from '@/app/_lib/safe-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Types ─── */
interface Keyword { text: string; logic: string }
interface Subscription {
  id: string;
  board_name: string;
  keywords: Keyword[];
  notify_line: boolean;
  notify_email: boolean;
  notify_discord: boolean;
  is_active: boolean;
  created_at: string;
  matched_count?: number;
}
interface AlertLog {
  id: string;
  article_title: string;
  article_url: string;
  matched_keywords: string[];
  notified_at: string;
  board_name: string;
  article_author?: string;
  push_count?: number;
  is_read?: boolean;
}
interface Toast {
  id: string;
  title: string;
  body: string;
  exiting?: boolean;
}

/* ─── Icons (inline SVG) ─── */
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const BoardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ─── Push Count Color Helper ─── */
function getPushClass(count: number) {
  if (count <= 10) return 'push-gray';
  if (count <= 30) return 'push-green';
  if (count <= 50) return 'push-yellow';
  return 'push-red';
}

/* ─── Time Formatter ─── */
function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小時前`;
  return `${Math.floor(diffHours / 24)} 天前`;
}

/* ─── Toast Component ─── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className="toast" role="alert" aria-live="polite">
      <span style={{ color: 'var(--ptt-primary)', marginTop: '2px', flexShrink: 0 }}>
        <BellIcon />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ptt-text)', marginBottom: '2px' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ptt-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {toast.body}
        </div>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="btn-icon"
        aria-label="關閉通知"
        style={{ flexShrink: 0, marginTop: '2px' }}
      >
        <XIcon />
      </button>
    </div>
  );
}

/* ─── Article Card Component ─── */
function ArticleCard({ alert, onMarkRead }: { alert: AlertLog; onMarkRead: (id: string) => void }) {
  const [isRead, setIsRead] = useState(alert.is_read ?? false);
  const pushCount = alert.push_count ?? Math.floor(Math.random() * 80);
  const pushClass = getPushClass(pushCount);
  const matchedKw = alert.matched_keywords?.[0] ?? '';

  const handleMarkRead = () => {
    setIsRead(true);
    onMarkRead(alert.id);
  };

  return (
    <div className={`article-card ${!isRead ? 'unread' : ''}`} style={{ marginBottom: '12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--ptt-text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ClockIcon /> {timeAgo(alert.notified_at)}
        </span>
        <span style={{ color: 'var(--ptt-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
          {alert.board_name}
        </span>
        {matchedKw && (
          <span className="kw-chip">{matchedKw}</span>
        )}
      </div>

      {/* Title */}
      <a
        href={alert.article_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--ptt-text)',
          textDecoration: 'none',
          marginBottom: '10px',
          lineHeight: 1.4,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--ptt-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ptt-text)')}
      >
        {alert.article_title} <ExternalLinkIcon />
      </a>

      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {alert.article_author && (
          <span style={{ fontSize: '12px', color: 'var(--ptt-text-secondary)' }}>
            👤 {alert.article_author}
          </span>
        )}
        <span style={{ fontSize: '12px', fontWeight: 700 }} className={pushClass}>
          💬 {pushCount} 推
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <a
          href={alert.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '4px 12px', textDecoration: 'none' }}
          aria-label="查看原文"
        >
          查看原文
        </a>
        {!isRead && (
          <button
            onClick={handleMarkRead}
            className="btn-icon"
            aria-label="標記已讀"
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', width: 'auto', padding: '4px 8px' }}
          >
            <CheckIcon /> 已讀
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Subscription Row Component ─── */
function SubRow({ sub, onEdit, onDelete, onToggle }: {
  sub: Subscription;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}) {
  const matchedCount = sub.matched_count ?? Math.floor(Math.random() * 20);
  const hasNew = sub.is_active && matchedCount > 0;

  return (
    <div className={`sub-row ${hasNew ? 'active-new' : ''}`}>
      {/* Board icon */}
      <span style={{ color: 'var(--ptt-primary)', flexShrink: 0 }}>
        <BoardIcon />
      </span>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span className="font-ptt-board" style={{ color: 'var(--ptt-text-secondary)', fontSize: '13px' }}>
            {sub.board_name}
          </span>
          {sub.keywords.map((kw, i) => (
            <span key={i} className="kw-chip">{kw.text}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            符合 {matchedCount} 篇
          </span>
          {/* Notification channels */}
          <span style={{ fontSize: '11px', color: 'var(--ptt-text-secondary)', display: 'flex', gap: '6px' }}>
            {sub.notify_email && '📧'}
            {sub.notify_line && '💬'}
            {sub.notify_discord && '🎮'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={() => onToggle(sub.id, sub.is_active)}
          className={`btn-icon ${!sub.is_active ? 'danger' : ''}`}
          aria-label={sub.is_active ? '暫停監控' : '啟動監控'}
          title={sub.is_active ? '暫停' : '啟動'}
          style={{ width: '36px', height: '36px' }}
        >
          {sub.is_active ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
        <button
          onClick={() => onEdit(sub.id)}
          className="btn-icon"
          aria-label="編輯監控項目"
          title="編輯"
          style={{ width: '36px', height: '36px' }}
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(sub.id)}
          className="btn-icon danger"
          aria-label="刪除監控項目"
          title="刪除"
          style={{ width: '36px', height: '36px' }}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

/* ─── Modal Component ─── */
function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--ptt-surface)',
        border: '1px solid var(--ptt-border)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '80vh',
        overflowY: 'auto',
        animation: 'toast-slide-in 200ms ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--ptt-border)',
        }}>
          <h2 id="modal-title" style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} className="btn-icon" aria-label="關閉">
            <XIcon />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── New Subscription Form ─── */
function NewSubForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [boardName, setBoardName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyLine, setNotifyLine] = useState(false);
  const [notifyDiscord, setNotifyDiscord] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim() || !keyword.trim()) {
      setError('請填寫看板名稱與關鍵字');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_name: boardName.trim(),
          keywords: [{ text: keyword.trim(), logic: 'or' }],
          notify_email: notifyEmail,
          notify_line: notifyLine,
          notify_discord: notifyDiscord,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '建立失敗');
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError('網路錯誤，請稍後重試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="board-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--ptt-text)' }}>
          看板名稱
        </label>
        <input
          id="board-name"
          type="text"
          className="input"
          placeholder="例如：Gossiping"
          value={boardName}
          onChange={e => setBoardName(e.target.value)}
          aria-required="true"
        />
      </div>
      <div>
        <label htmlFor="keyword" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--ptt-text)' }}>
          關鍵字
        </label>
        <input
          id="keyword"
          type="text"
          className="input"
          placeholder="例如：普發6000"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          aria-required="true"
        />
      </div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--ptt-text)' }}>通知方式</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'email', label: '📧 Email', checked: notifyEmail, onChange: setNotifyEmail },
            { id: 'line', label: '💬 LINE', checked: notifyLine, onChange: setNotifyLine },
            { id: 'discord', label: '🎮 Discord', checked: notifyDiscord, onChange: setNotifyDiscord },
          ].map(item => (
            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--ptt-text-secondary)' }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => item.onChange(e.target.checked)}
                style={{ accentColor: 'var(--ptt-primary)', width: '16px', height: '16px' }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ color: 'var(--ptt-danger)', fontSize: '13px', padding: '8px 12px', background: 'rgba(248,81,73,0.1)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="btn-secondary">取消</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '建立中...' : '建立監控'}
        </button>
      </div>
    </form>
  );
}

/* ─── Stats Cards ─── */
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: 'var(--ptt-surface)',
      border: '1px solid var(--ptt-border)',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--ptt-text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { user, isLoaded } = useSafeUser();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitor' | 'history'>('monitor');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNewSubModal, setShowNewSubModal] = useState(false);

  /* ── Toast helpers ── */
  const addToast = useCallback((title: string, body: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, title, body }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 150);
  }, []);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }
  }, [user, isLoaded, router]);

  /* ── Fetch data ── */
  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchData = async () => {
      try {
        const [subRes, alertRes] = await Promise.all([
          fetch('/api/subscriptions'),
          fetch('/api/alerts?limit=20'),
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
  }, [isLoaded, user]);

  /* ── Subscription actions ── */
  const toggleSubscription = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      setSubscriptions(prev =>
        prev.map(s => s.id === id ? { ...s, is_active: !isActive } : s)
      );
      addToast('更新成功', `監控項目已${!isActive ? '啟動' : '暫停'}`);
    } catch {
      addToast('錯誤', '更新失敗，請稍後重試');
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('確定刪除這個監控項目？')) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      addToast('已刪除', '監控項目已移除');
    } catch {
      addToast('錯誤', '刪除失敗，請稍後重試');
    }
  };

  const handleNewSubSuccess = () => {
    // Refresh subscriptions
    fetch('/api/subscriptions').then(res => res.json()).then(data => {
      setSubscriptions(data.data || []);
    });
    addToast('建立成功', '新監控項目已啟動');
  };

  const handleMarkRead = (id: string) => {
    setRecentAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, is_read: true } : a)
    );
  };

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ptt-bg)' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--ptt-border)',
          borderTopColor: 'var(--ptt-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeCount = subscriptions.filter(s => s.is_active).length;
  const totalMatches = subscriptions.reduce((sum, s) => sum + (s.matched_count ?? 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ptt-bg)' }}>
      {/* ── Toast Container ── */}
      <div className="toast-container" aria-live="polite" aria-label="通知區域">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--ptt-surface)',
        borderBottom: '1px solid var(--ptt-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📡</span>
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ptt-text)' }}>
              PTT Alertor
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/history"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'var(--ptt-text-secondary)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                transition: 'background 150ms ease, color 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--ptt-surface-2)';
                e.currentTarget.style.color = 'var(--ptt-text)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--ptt-text-secondary)';
              }}
            >
              <HistoryIcon /> 歷史
            </Link>
            <button
              onClick={() => setShowNewSubModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', textDecoration: 'none' }}
              aria-label="新增監控項目"
            >
              <PlusIcon /> 新增監控
            </button>
            <span style={{ fontSize: '12px', color: 'var(--ptt-text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.emailAddresses?.[0]?.emailAddress}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <StatCard label="活躍監控" value={activeCount} color="var(--ptt-primary)" />
          <StatCard label="總監控數" value={subscriptions.length} color="var(--ptt-accent)" />
          <StatCard label="本月通知" value={recentAlerts.length} color="var(--ptt-success)" />
        </div>

        {/* ── Tablet Tab Switcher ── */}
        <div className="tablet-tabs" style={{
          display: 'none',
          gap: '8px',
          marginBottom: '20px',
          background: 'var(--ptt-surface)',
          borderRadius: '10px',
          padding: '4px',
          width: 'fit-content',
        }}>
          <button
            className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
            aria-selected={activeTab === 'monitor'}
            role="tab"
          >
            📺 監控設定
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            aria-selected={activeTab === 'history'}
            role="tab"
          >
            🔔 通知歷史
          </button>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="desktop-two-col" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── Left Panel: Monitor Settings ── */}
          <div
            className="left-panel"
            style={{
              width: '40%',
              flexShrink: 0,
              transition: 'opacity 150ms ease',
            }}
            role="tabpanel"
            aria-label="監控設定"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ptt-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BoardIcon /> 監控中的項目
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--ptt-text-secondary)' }}>
                {subscriptions.length} 個項目
              </span>
            </div>

            {/* Subscription list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <AlertIcon />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>還沒有監控項目</div>
                    <div style={{ fontSize: '13px' }}>按下「新增監控」開始追蹤感興趣的看板</div>
                  </div>
                  <button onClick={() => setShowNewSubModal(true)} className="btn-primary" style={{ marginTop: '8px' }}>
                    <PlusIcon /> 新增第一個監控
                  </button>
                </div>
              ) : (
                subscriptions.map(sub => (
                  <SubRow
                    key={sub.id}
                    sub={sub}
                    onEdit={(id) => { /* TODO: edit modal */ void id; }}
                    onDelete={deleteSubscription}
                    onToggle={toggleSubscription}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Right Panel: Notification History ── */}
          <div
            className="right-panel"
            style={{
              width: '60%',
              flex: 1,
              minWidth: 0,
            }}
            role="tabpanel"
            aria-label="通知歷史"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ptt-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellIcon /> 通知歷史
              </h2>
              <Link
                href="/history"
                style={{
                  fontSize: '12px',
                  color: 'var(--ptt-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                查看全部 →
              </Link>
            </div>

            {/* Alert cards */}
            {recentAlerts.length === 0 ? (
              <div className="empty-state">
                <BellIcon />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>還沒有通知</div>
                  <div style={{ fontSize: '13px' }}>當有新文章符合監控條件時，就會在這裡顯示</div>
                </div>
              </div>
            ) : (
              recentAlerts.map(alert => (
                <ArticleCard
                  key={alert.id}
                  alert={alert}
                  onMarkRead={handleMarkRead}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="bottom-tab-bar mobile-bottom-bar" aria-label="主導航">
        <button
          className={`bottom-tab-item ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
          aria-current={activeTab === 'monitor' ? 'page' : undefined}
        >
          <BoardIcon />
          監控
        </button>
        <button
          className={`bottom-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          aria-current={activeTab === 'history' ? 'page' : undefined}
        >
          <BellIcon />
          通知
        </button>
        <button
          className="bottom-tab-item"
          onClick={() => setShowNewSubModal(true)}
          aria-label="新增監控"
        >
          <PlusIcon />
          新增
        </button>
        <Link href="/history" className="bottom-tab-item">
          <HistoryIcon />
          歷史
        </Link>
      </nav>

      {/* ── New Subscription Modal ── */}
      <Modal
        isOpen={showNewSubModal}
        onClose={() => setShowNewSubModal(false)}
        title="新增監控項目"
      >
        <NewSubForm
          onClose={() => setShowNewSubModal(false)}
          onSuccess={handleNewSubSuccess}
        />
      </Modal>
    </div>
  );
}
