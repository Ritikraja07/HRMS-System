'use client';
// useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { requestNotificationPermission, onForegroundMessage } from '../lib/firebase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    // Prevent fetching if no session cookie exists
    const hasSession = typeof document !== 'undefined' && document.cookie.includes('hrms_session=');
    if (!hasSession) return;

    setLoading(true);
    try {
      const res = await api.get('/api/notifications?limit=30');
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unread_count);
      }
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 429) {
        console.error('Failed to fetch notifications:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Setup FCM foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      if (payload.notification) {
        addNotification({
          id: Date.now().toString(),
          title: payload.notification.title,
          message: payload.notification.body,
          is_read: false,
          type: 'general',
          created_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchNotifications, addNotification]);

  const requestPushPermission = useCallback(async () => {
    const token = await requestNotificationPermission();
    if (token) {
      try {
        await api.patch('/api/auth/fcm-token', { fcm_token: token });
      } catch {}
    }
    return token;
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    addNotification,
    requestPushPermission,
  };
};

export default useNotifications;
