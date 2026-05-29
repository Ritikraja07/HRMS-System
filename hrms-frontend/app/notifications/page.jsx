'use client';
import { useState } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/formatters';

const TYPE_META = {
  task:       { label: 'Task',       color: '#2563eb', bg: 'var(--color-info-bg)',    icon: <TaskIcon /> },
  leave:      { label: 'Leave',      color: '#d97706', bg: 'var(--color-warning-bg)', icon: <LeaveIcon /> },
  payslip:    { label: 'Payslip',    color: '#16a34a', bg: 'var(--color-success-bg)', icon: <PayslipIcon /> },
  attendance: { label: 'Attendance', color: '#0891b2', bg: 'rgba(8,145,178,0.1)',     icon: <AttendanceIcon /> },
  project:    { label: 'Project',    color: '#7c3aed', bg: 'var(--color-purple-bg)',  icon: <ProjectIcon /> },
  message:    { label: 'Message',    color: '#db2777', bg: 'rgba(219,39,119,0.1)',    icon: <MessageIcon /> },
  update:     { label: 'Update',     color: '#ea580c', bg: 'var(--color-orange-bg)',  icon: <UpdateIcon /> },
  general:    { label: 'General',    color: '#64748b', bg: 'var(--color-bg-subtle)',  icon: <BellIcon /> },
};

const getMeta = (type) => TYPE_META[type] || TYPE_META.general;

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all'    ? notifications
                 : activeTab === 'unread' ? notifications.filter(n => !n.is_read)
                 :                          notifications.filter(n => n.is_read);

  const counts = {
    all:    notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    read:   notifications.filter(n => n.is_read).length,
  };

  const TABS = [
    { key: 'all',    label: 'All',    color: '#2563eb' },
    { key: 'unread', label: 'Unread', color: '#d97706' },
    { key: 'read',   label: 'Read',   color: '#16a34a' },
  ];

  return (
    <AppLayout title="Notifications">
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(217,119,6,0.3)', position: 'relative' }}>
              <BellIcon color="#fff" size={22} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Notifications</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: '1px solid var(--color-primary-border)', borderRadius: 9, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              <CheckAllIcon /> Mark all as read
            </button>
          )}
        </div>

        {/* ── Notification feed card ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>

          {/* Tab bar */}
          <div style={{ padding: '0 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-subtle)' }}>
            <div style={{ display: 'flex' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: activeTab === t.key ? 700 : 500,
                  color: activeTab === t.key ? t.color : 'var(--color-text-muted)',
                  borderBottom: `2px solid ${activeTab === t.key ? t.color : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  {t.label}
                  {counts[t.key] > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: activeTab === t.key ? t.color : 'var(--color-border)', color: activeTab === t.key ? '#fff' : 'var(--color-text-muted)' }}>
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-light)', fontWeight: 500, paddingRight: 4 }}>
              {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading notifications…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BellOffIcon />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>
                {activeTab === 'unread' ? 'No unread notifications' : activeTab === 'read' ? 'No read notifications' : 'All clear!'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                {activeTab === 'all' ? "You're all caught up. No notifications yet." : `No ${activeTab} notifications to show.`}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((n, i) => {
                const meta = getMeta(n.type);
                const isLast = i === filtered.length - 1;
                return (
                  <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                    style={{
                      display: 'flex', gap: 16, padding: '16px 20px',
                      cursor: !n.is_read ? 'pointer' : 'default',
                      background: !n.is_read ? 'var(--color-primary-light)' : 'transparent',
                      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = !n.is_read ? 'var(--color-primary-light)' : 'transparent'; }}
                  >
                    {/* Type icon */}
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: !n.is_read ? meta.color : meta.bg, color: !n.is_read ? '#fff' : meta.color, transition: 'background 0.2s' }}>
                      {meta.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: !n.is_read ? 700 : 500, color: 'var(--color-text)', margin: 0, lineHeight: 1.4 }}>{n.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {!n.is_read && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', display: 'block', flexShrink: 0 }} />
                          )}
                          <span style={{ fontSize: 11, color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>{formatRelativeTime(n.created_at)}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                      {n.type && (
                        <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: meta.bg, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function BellIcon({ color = 'currentColor', size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function BellOffIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function CheckAllIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function TaskIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
}
function LeaveIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function PayslipIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
}
function AttendanceIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function ProjectIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
}
function MessageIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function UpdateIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
