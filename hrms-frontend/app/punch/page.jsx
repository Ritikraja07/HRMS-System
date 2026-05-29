'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { usePunch } from '../../hooks/usePunch';
import { formatTime, formatDuration } from '../../utils/formatters';
import api from '../../lib/axios';

const RING_COLOR = {
  not_started: '#cbd5e1',
  working:     '#2563eb',
  on_break:    '#f59e0b',
  completed:   '#16a34a',
};

const CARD_GRADIENT = {
  not_started: 'linear-gradient(145deg, var(--color-bg-subtle) 0%, var(--color-bg-hover) 100%)',
  working:     'linear-gradient(145deg, var(--color-card) 0%, var(--color-info-bg) 100%)',
  on_break:    'linear-gradient(145deg, var(--color-card) 0%, var(--color-warning-bg) 100%)',
  completed:   'linear-gradient(145deg, var(--color-card) 0%, var(--color-success-bg) 100%)',
};

const STATUS_BADGE = {
  not_started: { label: 'Not Started',    bg: 'var(--color-bg-subtle)',   color: 'var(--color-text-muted)', dot: '#94a3b8' },
  working:     { label: 'Working',        bg: 'var(--color-info-bg)',     color: 'var(--color-info)',       dot: '#3b82f6' },
  on_break:    { label: 'On Break',       bg: 'var(--color-warning-bg)',  color: 'var(--color-warning)',    dot: '#f59e0b' },
  completed:   { label: 'Shift Complete', bg: 'var(--color-success-bg)',  color: 'var(--color-success)',    dot: '#22c55e' },
};

export default function PunchPage() {
  const {
    attendance, state, loading,
    formatElapsed, formatBreakElapsed,
    workMinutes, breakElapsed, elapsed,
    punchIn, punchOut, startBreak, endBreak,
    isOnBreak,
  } = usePunch();

  const [monthAttendance, setMonthAttendance] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMonth = useCallback(async () => {
    try {
      const now = new Date();
      const res = await api.get(`/api/attendance/my?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (res.data.success) setMonthAttendance(res.data.data.attendance || []);
    } catch {}
  }, []);

  // Fetch on mount and whenever today's attendance record changes
  useEffect(() => { fetchMonth(); }, [fetchMonth]);
  useEffect(() => { if (attendance !== undefined) fetchMonth(); }, [attendance, fetchMonth]);

  // Compute work minutes from punch times when DB value is missing (old records)
  const getWorkMins = (r) => {
    if (r.work_minutes) return r.work_minutes;
    if (r.punch_in && r.punch_out) {
      const ms = new Date(r.punch_out).getTime() - new Date(r.punch_in).getTime();
      return Math.max(0, Math.floor(ms / 60000) - (r.break_minutes || 0));
    }
    return 0;
  };

  const isWeekend = [0, 6].includes(new Date().getDay()); // 0 = Sunday, 6 = Saturday

  // Live minutes for the active session (DB stores 0 until punch-out)
  const liveMinutes = (state === 'working' || state === 'on_break') ? Math.floor(elapsed / 60) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = monthAttendance.find(a => a.date === todayStr);

  const presentDays = monthAttendance.filter(a => a.status === 'present' || a.status === 'half_day').length
    + (liveMinutes > 0 && todayRecord && !todayRecord.status ? 1 : 0);

  // Total working days (Mon–Fri) from month start up to and including today
  // absent = totalWorkingDays - presentDays  (professional: present + absent = total)
  const absentDays = (() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // include today fully
    let totalWorkingDays = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor <= now) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) totalWorkingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }
    const presentCount = monthAttendance.filter(a => a.status === 'present' || a.status === 'half_day').length
      + (liveMinutes > 0 && todayRecord && !todayRecord.status ? 1 : 0);
    return Math.max(0, totalWorkingDays - presentCount);
  })();
  const totalMinutes = monthAttendance.reduce((s, a) => s + getWorkMins(a), 0) + liveMinutes;
  const avgHours = (() => {
    const workedCount = monthAttendance.filter(a => a.status === 'present' || a.status === 'half_day').length
      + (liveMinutes > 0 ? 1 : 0);
    return workedCount ? formatDuration(Math.round(totalMinutes / workedCount)) : '—';
  })();

  // Build full list: every Mon–Fri up to today, with absent rows for missing days
  const fullMonthRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = [];
    const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    while (cursor <= today) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const dateStr = cursor.toISOString().split('T')[0];
        const record = monthAttendance.find(a => a.date === dateStr);
        rows.push(record || { date: dateStr, punch_in: null, punch_out: null, status: 'absent', work_minutes: 0, break_minutes: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return rows.reverse(); // most recent first
  }, [monthAttendance]);

  useEffect(() => { setCurrentPage(1); }, [fullMonthRows]);

  const totalPages = Math.ceil(fullMonthRows.length / rowsPerPage);
  const currentRows = fullMonthRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const netWorkMins = attendance?.work_minutes || Math.floor(elapsed / 60);
  const ringProgress = Math.min(1, netWorkMins / 480); // 480 = 8h

  // Hero timer display
  const timerText = state === 'not_started'
    ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : state === 'on_break'
    ? formatBreakElapsed()
    : state === 'completed'
    ? formatDuration(attendance?.work_minutes || workMinutes)
    : formatElapsed();

  const timerSub = {
    not_started: currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    working:     'Net work time today',
    on_break:    `Break since ${attendance?.on_break_since ? formatTime(attendance.on_break_since) : '—'}`,
    completed:   'Total work hours today',
  }[state];

  const badge = STATUS_BADGE[state];
  const ringColor = RING_COLOR[state];

  return (
    <AppLayout title="Punch In / Out">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

        {/* Page header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Attendance</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Track your work hours and attendance history</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── Left: Hero punch card ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              borderRadius: 20,
              background: CARD_GRADIENT[state],
              border: `1.5px solid ${isOnBreak ? 'rgba(245,158,11,0.5)' : 'var(--color-border)'}`,
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
              padding: '36px 40px',
              transition: 'background 0.4s ease, border-color 0.3s',
              position: 'relative',
              overflow: 'hidden',
            }}>

              {/* Top row: label + date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
                  TODAY'S ATTENDANCE
                </span>
                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 100, background: badge.bg, border: `1.5px solid ${badge.dot}40` }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: badge.dot, flexShrink: 0,
                    boxShadow: `0 0 0 2px ${badge.dot}30`,
                    animation: (state === 'working' || state === 'on_break') ? 'statusPulse 2s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: badge.color, letterSpacing: '0.02em' }}>{badge.label}</span>
                </div>
              </div>

              {/* Ring + timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                <RingTimer progress={ringProgress} color={ringColor} state={state} />

                <div style={{ flex: 1 }}>
                  {/* Timer */}
                  <p style={{
                    fontSize: state === 'not_started' ? 44 : 52,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-1.5px',
                    fontFamily: 'monospace',
                    color: ringColor,
                    lineHeight: 1,
                    transition: 'color 0.3s',
                  }}>
                    {timerText}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0 0', fontWeight: 500 }}>
                    {timerSub}
                  </p>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
                    {isWeekend && state === 'not_started' && (
                      <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--color-warning-bg)', border: '1.5px solid var(--color-warning)', color: 'var(--color-warning)', fontSize: 13.5, fontWeight: 600 }}>
                        Punch-in is not available on weekends.
                      </div>
                    )}

                    {state === 'not_started' && !isWeekend && (
                      <PunchButton onClick={punchIn} disabled={loading} color="#2563eb" label="Punch In" icon={<PlayIcon />} />
                    )}

                    {state === 'working' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <PunchButton onClick={startBreak} disabled={loading} color="#f59e0b" label="Go on Break" icon={<CoffeeIcon />} variant="outline" />
                        <PunchButton onClick={() => punchOut(false)} disabled={loading} color="#ef4444" label="End Shift" icon={<StopIcon />} />
                      </div>
                    )}

                    {state === 'on_break' && (
                      <PunchButton onClick={endBreak} disabled={loading} color="#16a34a" label="Back from Break" icon={<PlayIcon />} wide />
                    )}

                    {state === 'completed' && (
                      <div style={{ padding: '8px 0' }}>
                        <p style={{ fontSize: 22, margin: '0 0 6px' }}>🎉</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)', margin: '0 0 2px' }}>
                          {attendance?.status === 'half_day' ? 'Half Day Marked!' : 'Great work today!'}
                        </p>
                        <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>See you tomorrow.</p>
                      </div>
                    )}

                    {state === 'working' && (
                      <button onClick={() => punchOut(true)} disabled={loading} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontSize: 12, color: 'var(--color-text-light)', textDecoration: 'underline', textAlign: 'left',
                        opacity: loading ? 0.4 : 0.6, width: 'fit-content',
                      }}>
                        Mark as Half Day instead
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom stat strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12, marginTop: 32, paddingTop: 24,
                borderTop: '1px solid var(--color-border)',
              }}>
                <MiniStat label="Punched In"  value={attendance?.punch_in ? formatTime(attendance.punch_in) : '—'} />
                <MiniStat label="Punched Out" value={attendance?.punch_out ? formatTime(attendance.punch_out) : '—'} />
                <MiniStat
                  label="Break Taken"
                  value={formatDuration(attendance?.break_minutes || 0)}
                  accent={isOnBreak}
                  suffix={isOnBreak ? '+live' : ''}
                />
              </div>

              <style>{`
                @keyframes statusPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.85); } }
              `}</style>
            </div>

            {/* Monthly Punch History table */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '28px 28px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--color-text)' }}>Monthly Punch History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      {['Date','In','Out','Worked','Break','Status'].map(h => (
                        <th key={h} style={{ padding: '0 12px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--color-border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((log, i) => {
                      const isAbsent = log.status === 'absent';
                      const isHalfDay = log.status === 'half_day';
                      const isPresent = log.status === 'present';
                      return (
                        <tr key={log.id || log.date} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-bg-subtle)', opacity: isAbsent ? 0.72 : 1 }}>
                          <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 600, color: isAbsent ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                            {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>{log.punch_in ? formatTime(log.punch_in) : '—'}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>{log.punch_out ? formatTime(log.punch_out) : '—'}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 600, color: isAbsent ? 'var(--color-text-light)' : 'var(--color-primary)' }}>{getWorkMins(log) > 0 ? formatDuration(getWorkMins(log)) : '—'}</td>
                          <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>{log.break_minutes ? formatDuration(log.break_minutes) : '—'}</td>
                          <td style={{ padding: '11px 12px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700,
                              background: isPresent ? 'var(--color-success-bg)' : isHalfDay ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                              color: isPresent ? 'var(--color-success)' : isHalfDay ? 'var(--color-warning)' : 'var(--color-danger)',
                            }}>
                              {isPresent ? 'Present' : isHalfDay ? 'Half Day' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                    {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, fullMonthRows.length)} of {fullMonthRows.length} days
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-secondary" style={{ fontSize: 12.5, padding: '6px 14px', opacity: currentPage === 1 ? 0.4 : 1 }}>← Prev</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-secondary" style={{ fontSize: 12.5, padding: '6px 14px', opacity: currentPage === totalPages ? 0.4 : 1 }}>Next →</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Today's Timeline */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 20px' }}>Today's Timeline</h3>

              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 7, top: 14, bottom: 14, width: 2, background: 'var(--color-border)', borderRadius: 2 }} />

                {[
                  { label: 'Punch In',     value: attendance?.punch_in ? formatTime(attendance.punch_in) : null,     color: '#16a34a', active: !!attendance?.punch_in },
                  ...(isOnBreak && attendance?.on_break_since ? [{ label: 'Break Started', value: formatTime(attendance.on_break_since), color: '#f59e0b', active: true, pulsing: true }] : []),
                  { label: 'Punch Out',    value: attendance?.punch_out ? formatTime(attendance.punch_out) : null,    color: '#ef4444', active: !!attendance?.punch_out },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', position: 'relative' }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                      background: item.active ? item.color : 'var(--color-border)',
                      border: `3px solid ${item.active ? item.color + '30' : 'var(--color-border)'}`,
                      boxShadow: item.active ? `0 0 0 3px ${item.color}20` : 'none',
                      animation: item.pulsing ? 'statusPulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{item.label}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 14, fontWeight: 700, color: item.active ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                        {item.value || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Duration stats */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Work Duration', value: formatDuration(netWorkMins), color: 'var(--color-primary)', bold: true },
                  { label: 'Break Time',    value: formatDuration(attendance?.break_minutes || 0), suffix: isOnBreak ? '+live' : '', color: isOnBreak ? 'var(--color-warning)' : 'var(--color-text)' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{r.label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: r.color }}>
                      {r.value}
                      {r.suffix && <span style={{ fontSize: 10.5, marginLeft: 3, color: 'var(--color-warning)', fontWeight: 600 }}>{r.suffix}</span>}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress toward 8h */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-light)' }}>Progress toward 8h shift</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: ringColor }}>{Math.min(100, Math.round(ringProgress * 100))}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 100, width: `${Math.min(100, ringProgress * 100)}%`, background: ringColor, transition: 'width 1s linear, background 0.4s' }} />
                </div>
              </div>
            </div>

            {/* Monthly summary */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Present',     value: presentDays,             color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: '✅' },
                  { label: 'Absent',      value: absentDays,              color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  icon: '❌' },
                  { label: 'Total Hours', value: formatDuration(totalMinutes), color: 'var(--color-info)', bg: 'var(--color-info-bg)', icon: '⏱' },
                  { label: 'Avg / Day',   value: avgHours,                color: '#a855f7', bg: 'rgba(168,85,247,0.12)',    icon: '📊' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 14px', borderRadius: 12, background: s.bg, border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: '4px 0 2px', lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {monthAttendance.length > 0 && (
                <div style={{ background: 'var(--color-bg-subtle)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>Attendance Rate</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-success)' }}>{Math.round((presentDays / monthAttendance.length) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, width: `${(presentDays / monthAttendance.length) * 100}%`, background: 'var(--color-success)' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function RingTimer({ progress, color, state }) {
  const size = 180;
  const r = 72;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (state === 'not_started' ? 0 : progress));

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--color-border)" strokeWidth={9} />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
        />
      </svg>
      {/* Center label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
          {state === 'not_started' ? '—' : `${Math.min(100, Math.round(progress * 100))}%`}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {state === 'not_started' ? 'of 8h' : state === 'on_break' ? 'paused' : state === 'completed' ? 'done' : 'of 8h'}
        </span>
      </div>
    </div>
  );
}

function PunchButton({ onClick, disabled, color, label, icon, variant = 'solid', wide = false }) {
  const isSolid = variant === 'solid';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: wide ? '14px 36px' : '13px 24px',
        borderRadius: 12,
        border: isSolid ? 'none' : `2px solid ${color}`,
        background: isSolid ? color : `${color}10`,
        color: isSolid ? '#fff' : color,
        fontWeight: 700, fontSize: 14.5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        boxShadow: isSolid ? `0 4px 18px ${color}40` : 'none',
        transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isSolid ? `0 7px 22px ${color}50` : 'none'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isSolid ? `0 4px 18px ${color}40` : 'none'; }}
    >
      {icon}
      {label}
    </button>
  );
}

function MiniStat({ label, value, accent = false, suffix = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: accent ? 'var(--color-warning)' : 'var(--color-text)' }}>
        {value}
        {suffix && <span style={{ fontSize: 10.5, marginLeft: 4, color: 'var(--color-warning)', fontWeight: 600 }}>{suffix}</span>}
      </span>
    </div>
  );
}

// SVG icon components — no emoji, clean vectors
function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
}
function StopIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>;
}
function CoffeeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
}
