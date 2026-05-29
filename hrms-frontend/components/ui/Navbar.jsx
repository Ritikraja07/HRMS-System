'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '../../utils/formatters';

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const TYPE_CONFIG = {
  task:       { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  leave:      { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  payslip:    { bg: 'var(--color-success-bg)', color: 'var(--color-success)',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  attendance: { bg: 'rgba(8,145,178,0.1)',     color: '#0891b2',                 icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  project:    { bg: 'var(--color-purple-bg)',  color: 'var(--color-purple)',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> },
  message:    { bg: 'rgba(219,39,119,0.1)',    color: '#db2777',                 icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  update:     { bg: 'var(--color-orange-bg)',  color: 'var(--color-orange)',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  general:    { bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-muted)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
};

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export const Navbar = ({ title, user, notifications = [], unreadCount = 0, onMarkRead, onMarkAllRead, onMenuOpen }) => {
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="topbar" style={{ paddingLeft: 24, paddingRight: 24, gap: 16 }}>
      {/* Hamburger — mobile only */}
      <button
        className="flex lg:hidden items-center justify-center"
        onClick={onMenuOpen}
        aria-label="Open menu"
        style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          border: '1px solid var(--color-border)', background: 'var(--color-card)',
          color: 'var(--color-text)', cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; }}
      >
        <MenuIcon />
      </button>

      {/* Left */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 className="page-title" style={{ fontSize: 17 }}>{title}</h1>
        <p className="page-subtitle hidden sm:block">
          {greeting()}, {user?.full_name?.split(' ')[0]} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Theme toggle */}
        <button
          onClick={() => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
              document.documentElement.removeAttribute('data-theme');
              localStorage.setItem('theme', 'light');
            } else {
              document.documentElement.setAttribute('data-theme', 'dark');
              localStorage.setItem('theme', 'dark');
            }
          }}
          style={{
            padding: '8px', borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'var(--color-card)',
            color: 'var(--color-text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; }}
          aria-label="Toggle Theme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
          </svg>
        </button>

        {/* Notification bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            style={{
              position: 'relative', padding: '8px', borderRadius: 8,
              border: '1px solid var(--color-border)', background: 'var(--color-card)',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; }}
            aria-label="Notifications"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                minWidth: 18, height: 18, borderRadius: 100,
                background: 'var(--color-danger)', border: '2px solid var(--color-card)',
                color: '#fff', fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', lineHeight: 1,
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="fade-in" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 380, background: 'var(--color-card)',
              border: '1px solid var(--color-border)', borderRadius: 12,
              boxShadow: 'var(--shadow-elevated)', zIndex: 100, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 100, background: 'var(--color-info-bg)', color: 'var(--color-info)',
                    }}>{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <BellIcon />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>All caught up!</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>No new notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => {
                    const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && onMarkRead?.(n.id)}
                        style={{
                          display: 'flex', gap: 12, padding: '12px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          background: !n.is_read ? 'var(--color-primary-light)' : 'transparent',
                          cursor: !n.is_read ? 'pointer' : 'default', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = !n.is_read ? 'var(--color-primary-light)' : 'transparent'; }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: !n.is_read ? tc.color : tc.bg,
                          color: !n.is_read ? '#fff' : tc.color,
                        }}>
                          {tc.icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: !n.is_read ? 700 : 500, color: 'var(--color-text)', margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                            {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 3, display: 'block' }} />}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '3px 0 0', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: 'var(--color-text-light)', margin: '4px 0 0', fontWeight: 500 }}>{formatRelativeTime(n.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View all footer */}
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 16px' }}>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotif(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 13, fontWeight: 700, color: 'var(--color-primary)',
                    background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  View all notifications
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} className="hidden sm:block" />

        {/* User chip */}
        <Link href="/profile" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 12px 6px 6px',
          borderRadius: 8, border: '1px solid var(--color-border)',
          background: 'var(--color-card)', textDecoration: 'none',
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <img
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=64748b&color=fff&size=64&bold=true`}
            alt={user?.full_name}
            style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }}
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=2563eb&color=fff&size=64`; }}
          />
          <div className="hidden sm:block">
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2, margin: 0 }}>
              {user?.full_name?.split(' ')[0]}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-light)', margin: 0, textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
