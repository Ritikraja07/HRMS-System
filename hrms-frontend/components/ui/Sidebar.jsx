'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  'check-square': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  'message-circle': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  'calendar-off': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 21L3 3"/><path d="M21 7H3M7 3v4M17 3v2M3 11v9a2 2 0 002 2h13"/>
    </svg>
  ),
  'file-text': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'bar-chart': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  'check-circle': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'user-plus': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  'pie-chart': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>
    </svg>
  ),
  'log-out': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  megaphone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const NAV_GROUPS = [
  {
    label: 'Main',
    hrefs: ['/dashboard', '/punch'],
  },
  {
    label: 'Work',
    hrefs: ['/tasks', '/projects', '/communication', '/announcements', '/updates'],
  },
  {
    label: 'HR',
    hrefs: ['/attendance', '/leave', '/payslips', '/profile'],
  },
  {
    label: 'Management',
    hrefs: ['/manager/dashboard', '/manager/approvals', '/manager/team'],
  },
  {
    label: 'Admin',
    hrefs: ['/admin/dashboard', '/admin/employees', '/admin/onboarding', '/admin/announcements', '/admin/reports', '/admin/shifts'],
  },
];

const ROLE_COLORS = {
  admin: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  manager: { bg: 'rgba(67, 56, 202, 0.1)', color: '#4338ca' },
  employee: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
};

export const Sidebar = ({ user, onLogout, navItems, navBadges = {}, mobileOpen, onMobileClose }) => {
  const pathname = usePathname();

  const role = user?.role || 'employee';
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.employee;

  const navItemMap = {};
  navItems.forEach(item => { navItemMap[item.href] = item; });

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '24px 24px 20px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>HRMS</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-light)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Workforce Platform</div>
          </div>
        </div>

        {/* Close button — mobile only */}
        <button
          className="flex lg:hidden items-center justify-center"
          onClick={onMobileClose}
          aria-label="Close menu"
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'transparent', border: 'none',
            color: 'var(--color-text-muted)', cursor: 'pointer',
            transition: 'background 0.2s ease', marginLeft: '8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {Icons.x}
        </button>
      </div>

      {/* User Profile Card */}
      <div style={{ padding: '20px 20px 24px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 12,
          background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)',
        }}>
          <img
            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=2563eb&color=fff&size=64&bold=true`}
            alt={user?.full_name}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--color-card)' }}
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=2563eb&color=fff&size=64`; }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 100, display: 'inline-block', marginTop: 4,
              background: roleStyle.bg, color: roleStyle.color,
            }}>
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {NAV_GROUPS.map(group => {
          const groupNavItems = group.hrefs
            .map(href => navItemMap[href])
            .filter(Boolean);
          if (groupNavItems.length === 0) return null;

          return (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--color-text-light)',
                padding: '8px 12px', marginBottom: 4,
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {groupNavItems.map(item => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '0 12px', height: 44, borderRadius: 8,
                        textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        background: isActive ? 'var(--color-primary-light)' : 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text)'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; } }}
                    >
                      <span style={{ display: 'flex', flexShrink: 0 }}>
                        {Icons[item.icon]}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {navBadges[item.href] > 0 && (
                        <span style={{
                          minWidth: 18, height: 18, borderRadius: 100,
                          background: 'var(--color-danger)', color: '#fff',
                          fontSize: 10, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 5px', lineHeight: 1, flexShrink: 0,
                        }}>
                          {navBadges[item.href] > 99 ? '99+' : navBadges[item.href]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', height: 44, border: 'none', background: 'transparent', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px',
            borderRadius: 8, color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <span style={{ display: 'flex', flexShrink: 0 }}>{Icons['log-out']}</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile sidebar — slides in */}
      <aside
        className="lg:hidden"
        style={{
          position: 'fixed', left: 0, top: 0, height: '100%',
          width: 'var(--sidebar-width)', zIndex: 45,
          background: 'var(--color-card)',
          borderRight: '1px solid var(--color-border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {content}
      </aside>

      {/* Desktop sidebar — always visible, fixed */}
      <aside
        className="sidebar hidden lg:flex"
        style={{ flexDirection: 'column', width: 'var(--sidebar-width)', background: 'var(--color-card)', borderRight: '1px solid var(--color-border)' }}
      >
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
