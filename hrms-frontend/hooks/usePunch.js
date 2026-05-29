'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const AUTO_BREAK_DELAY_MS = 5 * 60 * 1000; // 5 minutes

export const usePunch = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);       // net work seconds (breaks excluded)
  const [breakElapsed, setBreakElapsed] = useState(0); // current break seconds (live)

  const fetchTodayStatus = useCallback(async () => {
    // Prevent fetching if no session cookie exists
    const hasSession = typeof document !== 'undefined' && document.cookie.includes('hrms_session=');
    if (!hasSession) return;

    try {
      const res = await api.get('/api/attendance/today');
      if (res.data.success) setAttendance(res.data.data.attendance);
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 429) {
        console.error('Failed to fetch punch status:', err.message);
      }
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  // Live timers — both work elapsed and current break elapsed
  useEffect(() => {
    if (!attendance?.punch_in) {
      setElapsed(0);
      setBreakElapsed(0);
      return;
    }

    const update = () => {
      const punchInMs = new Date(attendance.punch_in).getTime();
      const punchOutMs = attendance.punch_out
        ? new Date(attendance.punch_out).getTime()
        : Date.now();
      const completedBreakMs = (attendance.break_minutes || 0) * 60000;

      let ongoingBreakMs = 0;
      if (attendance.on_break_since && !attendance.punch_out) {
        ongoingBreakMs = Date.now() - new Date(attendance.on_break_since).getTime();
        setBreakElapsed(Math.floor(ongoingBreakMs / 1000));
      } else {
        setBreakElapsed(0);
      }

      const workMs = Math.max(0, punchOutMs - punchInMs - completedBreakMs - ongoingBreakMs);
      setElapsed(Math.floor(workMs / 1000));
    };

    update();
    // Stop ticking once shift is fully complete (punched out, not on break)
    if (attendance.punch_out && !attendance.on_break_since) return;

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [attendance]);

  const punchIn = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/attendance/punch-in');
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        toast.success('Punched in successfully!');
        return res.data.data.attendance;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to punch in';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const punchOut = useCallback(async (isEarlyLeave = false) => {
    setLoading(true);
    try {
      const res = await api.post('/api/attendance/punch-out', { isEarlyLeave });
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        toast.success(isEarlyLeave ? 'Marked as half day!' : 'Punched out successfully!');
        return res.data.data.attendance;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to punch out';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const startBreak = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/attendance/break/start');
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        toast.success('Break started — enjoy your break!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  }, []);

  const endBreak = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/attendance/break/end');
      if (res.data.success) {
        setAttendance(res.data.data.attendance);
        toast.success('Welcome back!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  }, []);

  // Derived state machine — single source of truth
  const state = !attendance?.punch_in
    ? 'not_started'
    : attendance.on_break_since
    ? 'on_break'
    : !attendance.punch_out
    ? 'working'
    : 'completed';

  // Keep a ref so the visibility timer always reads the latest state without re-registering
  const stateRef = useRef(null);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Auto-break: screen lock / tab hidden for 5+ minutes triggers break automatically
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let hiddenTimer = null;
    let autoBreakFired = false;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimer = setTimeout(async () => {
          if (stateRef.current !== 'working') return;
          try {
            const res = await api.post('/api/attendance/break/start');
            if (res.data.success) {
              setAttendance(res.data.data.attendance);
              autoBreakFired = true;
            }
          } catch {
            // Silently ignore — e.g. already on break
          }
        }, AUTO_BREAK_DELAY_MS);
      } else {
        clearTimeout(hiddenTimer);
        hiddenTimer = null;
        if (autoBreakFired) {
          toast('Break started automatically — you were away for 5+ minutes.', {
            icon: '☕',
            duration: 6000,
          });
          autoBreakFired = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(hiddenTimer);
    };
  }, []); // runs once; stateRef keeps it current without re-registering

  const isPunchedIn  = state === 'working';
  const isPunchedOut = state === 'completed';
  const isOnBreak    = state === 'on_break';
  const workMinutes  = attendance?.work_minutes || Math.floor(elapsed / 60);

  const formatSeconds = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    attendance,
    loading,
    elapsed,
    breakElapsed,
    formatElapsed: () => formatSeconds(elapsed),
    formatBreakElapsed: () => formatSeconds(breakElapsed),
    isPunchedIn,
    isPunchedOut,
    isOnBreak,
    state,
    workMinutes,
    punchIn,
    punchOut,
    startBreak,
    endBreak,
    fetchTodayStatus,
  };
};

export default usePunch;
