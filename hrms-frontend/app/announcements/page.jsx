'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import api from '../../lib/axios';

const READ_IDS_KEY = 'hrms_read_announcements';

const getReadIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_IDS_KEY) || '[]')); }
  catch { return new Set(); }
};

const persistReadIds = (set) => {
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new CustomEvent('hrms:announcements:read'));
};

const TYPES = {
  general: { label: 'General', color: 'var(--color-primary)',  bg: 'var(--color-info-bg)',     border: 'var(--color-primary-border)', icon: <MegaphoneIcon /> },
  policy:  { label: 'Policy',  color: 'var(--color-purple)',   bg: 'var(--color-purple-bg)',   border: 'var(--color-purple-border)',  icon: <PolicyIcon /> },
  holiday: { label: 'Holiday', color: 'var(--color-success)',  bg: 'var(--color-success-bg)',  border: 'var(--color-success-border)', icon: <HolidayIcon /> },
  event:   { label: 'Event',   color: 'var(--color-warning)',  bg: 'var(--color-warning-bg)',  border: 'var(--color-warning-border)', icon: <EventIcon /> },
  urgent:  { label: 'Urgent',  color: 'var(--color-danger)',   bg: 'var(--color-danger-bg)',   border: 'var(--color-danger-border)',  icon: <UrgentIcon /> },
};

function AnnouncementCard({ item, isUnread, onMarkRead }) {
  const [expanded, setExpanded] = useState(false);
  const t = TYPES[item.type] || TYPES.general;
  const isLong = item.content.length > 220;

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${item.is_pinned ? 'var(--color-warning-border)' : isUnread ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
      boxShadow: isUnread ? '0 2px 12px rgba(37,99,235,0.08)' : 'var(--shadow-card)',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      <div style={{ display: 'flex' }}>
        {/* Left accent bar */}
        <div style={{ width: 4, background: isUnread ? 'var(--color-primary)' : t.color, flexShrink: 0, transition: 'background 0.3s' }} />

        <div style={{ padding: '18px 20px', flex: 1 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              {/* Unread dot */}
              {isUnread && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                {t.icon} {t.label}
              </span>
              {item.is_pinned && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}>
                  📌 Pinned
                </span>
              )}
              {item.type === 'urgent' && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)' }}>
                  Action Required
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {isUnread && (
                <button onClick={() => onMarkRead(item.id)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  borderRadius: 8, border: '1px solid var(--color-primary-border)',
                  background: 'var(--color-info-bg)', color: 'var(--color-primary)',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-info-bg)'; e.currentTarget.style.color = 'var(--color-primary)'; }}>
                  <CheckIcon /> Mark as read
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 style={{ margin: '0 0 10px', fontSize: 15.5, fontWeight: isUnread ? 800 : 700, color: 'var(--color-text)', lineHeight: 1.4 }}>
            {item.title}
          </h3>

          {/* Content */}
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-muted)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {isLong && !expanded ? item.content.slice(0, 220) + '…' : item.content}
          </p>

          {isLong && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: t.color, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              {expanded ? 'Show less ▲' : 'Read more ▼'}
            </button>
          )}

          {/* Footer */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={item.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author?.full_name || 'HR')}&background=64748b&color=fff&size=32&bold=true`}
              style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
              onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=HR&background=64748b&color=fff&size=32'; }}
            />
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}>{item.author?.full_name || 'HR Team'}</span>
              {item.author?.designation && <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}> · {item.author.designation}</span>}
            </div>
            {item.expires_at && (
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Expires {new Date(item.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [readIds,  setReadIds]  = useState(() => getReadIds());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/announcements');
        if (res.data.success) setItems(res.data.data.announcements || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleMarkRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(String(id));
      persistReadIds(next);
      return next;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      items.forEach(a => next.add(String(a.id)));
      persistReadIds(next);
      return next;
    });
  }, [items]);

  const unreadCount = items.filter(a => !readIds.has(String(a.id))).length;
  const filtered    = filter === 'all' ? items : items.filter(a => a.type === filter);
  const pinned      = filtered.filter(a => a.is_pinned);
  const regular     = filtered.filter(a => !a.is_pinned);

  return (
    <AppLayout title="Announcements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
              <MegaphoneIcon color="#fff" size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Announcements</h1>
                {unreadCount > 0 && (
                  <span style={{ minWidth: 22, height: 22, borderRadius: 100, background: 'var(--color-danger)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Company notices, policy updates and upcoming events</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
              border: '1px solid var(--color-primary-border)', borderRadius: 9,
              background: 'var(--color-info-bg)', color: 'var(--color-primary)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              <CheckAllIcon /> Mark all as read
            </button>
          )}
        </div>

        {/* Stats strip */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Total',   value: items.length,                              color: 'var(--color-text)',    bg: 'var(--color-card)' },
              { label: 'Unread',  value: unreadCount,                               color: 'var(--color-primary)', bg: 'var(--color-info-bg)' },
              { label: 'Pinned',  value: items.filter(a => a.is_pinned).length,     color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '10px 18px', borderRadius: 12, background: s.bg, border: '1px solid var(--color-border)', textAlign: 'center', minWidth: 80 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ key: 'all', label: 'All' }, ...Object.entries(TYPES).map(([k, t]) => ({ key: k, label: t.label }))].map(tab => {
            const count = tab.key === 'all' ? items.length : items.filter(a => a.type === tab.key).length;
            if (count === 0 && tab.key !== 'all') return null;
            const active = filter === tab.key;
            const tabUnread = tab.key === 'all'
              ? unreadCount
              : items.filter(a => a.type === tab.key && !readIds.has(String(a.id))).length;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transition: 'all 0.12s', position: 'relative',
              }}>
                {tab.key !== 'all' && TYPES[tab.key]?.icon}
                {tab.label}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: active ? 'var(--color-primary)' : 'var(--color-bg-subtle)', color: active ? '#fff' : 'var(--color-text-light)' }}>
                  {count}
                </span>
                {tabUnread > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: 'var(--color-danger)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-bg)' }}>
                    {tabUnread > 9 ? '9+' : tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 160, borderRadius: 14 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MegaphoneIcon size={26} color="var(--color-text-light)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>No announcements</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Nothing to show right now. Check back later.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pinned.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📌 Pinned</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-warning-border)', marginLeft: 4 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pinned.map(item => (
                    <AnnouncementCard key={item.id} item={item} isUnread={!readIds.has(String(item.id))} onMarkRead={handleMarkRead} />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)', marginLeft: 4 }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {regular.map(item => (
                    <AnnouncementCard key={item.id} item={item} isUnread={!readIds.has(String(item.id))} onMarkRead={handleMarkRead} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function MegaphoneIcon({ color = 'currentColor', size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>;
}
function PolicyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function HolidayIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;
}
function EventIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function UrgentIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function CheckIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function CheckAllIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
