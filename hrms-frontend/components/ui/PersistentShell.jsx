'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { LoadingScreen } from './Badge';
import { TitleProvider, useTitleContext } from './TitleContext';
import { useAuth, AuthProvider } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useSocket } from '../../hooks/useSocket';
import { getNavItems } from '../../utils/roleGuard';
import { Toaster } from 'react-hot-toast';
import api from '../../lib/axios';

const PUBLIC_ROUTES = ['/login', '/'];
const READ_IDS_KEY = 'hrms_read_announcements';

const getReadIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_IDS_KEY) || '[]')); }
  catch { return new Set(); }
};

function Shell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementBadge, setAnnouncementBadge] = useState(0);
  const { user, session, loading, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, addNotification, requestPushPermission } = useNotifications();
  const { on } = useSocket(user?.id, session?.access_token);
  const { title } = useTitleContext();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isPublicRoute, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = on('notification:new', (notification) => {
      addNotification(notification);
    });
    return unsub;
  }, [user, on, addNotification]);

  // Request push notification permission once user is authenticated
  useEffect(() => {
    if (user) requestPushPermission();
  }, [user, requestPushPermission]);

  // Fetch unread announcement count using per-ID tracking
  const fetchAnnouncementBadge = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/announcements?limit=100');
      if (res.data.success) {
        const all = res.data.data.announcements || [];
        const readIds = getReadIds();
        const unread = all.filter(a => !readIds.has(String(a.id))).length;
        setAnnouncementBadge(unread);
      }
    } catch {}
  }, [user]);

  useEffect(() => { fetchAnnouncementBadge(); }, [fetchAnnouncementBadge]);

  // Re-sync badge when announcements are marked read from the announcements page
  useEffect(() => {
    const handler = () => fetchAnnouncementBadge();
    window.addEventListener('hrms:announcements:read', handler);
    return () => window.removeEventListener('hrms:announcements:read', handler);
  }, [fetchAnnouncementBadge]);

  // Login / redirect pages — no chrome
  if (isPublicRoute) return <>{children}</>;

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  const navItems = getNavItems(user.role);
  const navBadges = { '/announcements': announcementBadge, '/admin/announcements': announcementBadge };

  return (
    <div className="app-layout" style={{ background: 'var(--color-bg)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            fontSize: '13.5px',
            boxShadow: 'var(--shadow-elevated)',
          },
          success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-card)' } },
          error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-card)' } },
        }}
      />
      <Sidebar
        user={user}
        onLogout={logout}
        navItems={navItems}
        navBadges={navBadges}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="main-content">
        <Navbar
          title={title}
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function PersistentShell({ children }) {
  return (
    <AuthProvider>
      <TitleProvider>
        <Shell>{children}</Shell>
      </TitleProvider>
    </AuthProvider>
  );
}
