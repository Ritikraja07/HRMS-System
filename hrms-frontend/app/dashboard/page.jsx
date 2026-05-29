'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/ui/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import { usePunch } from '../../hooks/usePunch';
import api from '../../lib/axios';
import { formatTime, formatDuration } from '../../utils/formatters';

const PRIORITY_STYLE = {
  urgent: { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  label: 'Urgent' },
  high:   { bg: 'rgba(249,115,22,0.12)',   color: '#ea580c',              label: 'High' },
  medium: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Medium' },
  low:    { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Low' },
};
const STATUS_STYLE = {
  pending:     { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Pending' },
  in_progress: { bg: 'var(--color-info-bg)',    color: 'var(--color-info)',    label: 'In Progress' },
  completed:   { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Completed' },
  rejected:    { bg: 'var(--color-danger-bg)',  color: 'var(--color-danger)',  label: 'Rejected' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { attendance, state, formatElapsed, elapsed } = usePunch();
  const [tasks,   setTasks]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, pending: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/api/tasks?limit=5')
      .then(res => {
        if (res.data.success) {
          const data = res.data.data;
          setTasks(data.slice(0, 5));
          setStats({
            total:     res.data.pagination?.total || data.length,
            pending:   data.filter(t => t.status === 'pending').length,
            completed: data.filter(t => t.status === 'completed').length,
            rejected:  data.filter(t => t.status === 'rejected').length,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isPunchedIn  = state === 'working';
  const isOnBreak    = state === 'on_break';
  const isCompleted  = state === 'completed';
  const netMins      = attendance?.work_minutes || Math.floor(elapsed / 60);
  const shiftPct     = Math.min(100, Math.round((netMins / 480) * 100));
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const kpis = [
    {
      title: 'Total Tasks', value: stats.total,
      color: 'var(--color-info)', hex: '#2563eb',
      iconBg: 'rgba(37,99,235,0.12)',
      gradient: 'linear-gradient(145deg, var(--color-info-bg) 0%, var(--color-card) 65%)',
      icon: <TaskIcon />,
      footer: stats.total === 0 ? 'No tasks yet' : `${stats.total} task${stats.total !== 1 ? 's' : ''} assigned`,
      footerColor: 'var(--color-text-muted)',
    },
    {
      title: 'Pending', value: stats.pending,
      color: 'var(--color-warning)', hex: '#d97706',
      iconBg: 'rgba(217,119,6,0.12)',
      gradient: 'linear-gradient(145deg, var(--color-warning-bg) 0%, var(--color-card) 65%)',
      icon: <ClockIcon />,
      footer: stats.pending > 0 ? `${stats.pending} need${stats.pending === 1 ? 's' : ''} attention` : 'All cleared',
      footerColor: stats.pending > 0 ? 'var(--color-warning)' : 'var(--color-success)',
    },
    {
      title: 'Completed', value: stats.completed,
      color: 'var(--color-success)', hex: '#16a34a',
      iconBg: 'rgba(22,163,74,0.12)',
      gradient: 'linear-gradient(145deg, var(--color-success-bg) 0%, var(--color-card) 65%)',
      icon: <CheckIcon />,
      footer: stats.total > 0 ? `${completionRate}% completion rate` : 'No tasks yet',
      footerColor: completionRate >= 75 ? 'var(--color-success)' : 'var(--color-text-muted)',
    },
    {
      title: 'Rejected', value: stats.rejected,
      color: 'var(--color-danger)', hex: '#dc2626',
      iconBg: 'rgba(220,38,38,0.12)',
      gradient: 'linear-gradient(145deg, var(--color-danger-bg) 0%, var(--color-card) 65%)',
      icon: <CrossIcon />,
      footer: stats.rejected > 0 ? `${stats.rejected} need${stats.rejected === 1 ? 's' : ''} review` : 'None rejected',
      footerColor: stats.rejected > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
    },
  ];

  const quickLinks = [
    { label: 'Punch In / Out',   sub: 'Track work hours',    href: '/punch',      color: '#2563eb', iconBg: 'rgba(37,99,235,0.12)',  icon: <PunchIcon /> },
    { label: 'My Tasks',         sub: 'View assignments',    href: '/tasks',      color: '#16a34a', iconBg: 'rgba(22,163,74,0.12)',  icon: <ListIcon /> },
    { label: 'Attendance',       sub: 'Monthly history',     href: '/attendance', color: '#d97706', iconBg: 'rgba(217,119,6,0.12)',  icon: <CalIcon /> },
    { label: 'Projects',         sub: 'Active work',         href: '/projects',   color: '#7c3aed', iconBg: 'rgba(124,58,237,0.12)', icon: <FolderIcon /> },
    { label: 'Work From Home',   sub: 'Apply for WFH',       href: '/leave',      color: '#059669', iconBg: 'rgba(5,150,105,0.12)',  icon: <HomeIcon /> },
    { label: 'Leave Requests',   sub: 'Manage your leaves',  href: '/leave',      color: '#0891b2', iconBg: 'rgba(8,145,178,0.12)',  icon: <LeaveIcon /> },
  ];

  const attStatus = isPunchedIn ? { label: 'Working',    dot: '#22c55e', bg: 'var(--color-success-bg)', color: 'var(--color-success)' }
                  : isOnBreak   ? { label: 'On Break',   dot: '#f59e0b', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' }
                  : isCompleted ? { label: 'Shift Done', dot: '#3b82f6', bg: 'var(--color-info-bg)',    color: 'var(--color-info)' }
                  :               { label: 'Not Started', dot: '#94a3b8', bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-muted)' };

  return (
    <AppLayout title="Dashboard">
      <style>{`
        @keyframes dashPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.78)} }
        @keyframes skelSlide { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .skel {
          background: linear-gradient(90deg, var(--color-border) 0%, var(--color-bg-subtle) 40%, var(--color-bg-subtle) 60%, var(--color-border) 100%);
          background-size: 300% 100%;
          animation: skelSlide 1.6s ease-in-out infinite;
          border-radius: 8px;
        }
        .kpi-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .kpi-hover:hover { transform: translateY(-4px); }
        .qlink { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }
        .qlink:hover { transform: translateY(-2px); }
        .task-row { transition: background 0.12s ease; }
        .task-row:hover { background: var(--color-bg-subtle) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Greeting Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3a8f 0%, #1e40af 40%, #2563eb 100%)',
          borderRadius: 20, padding: '28px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
          boxShadow: '0 8px 32px rgba(30,64,175,0.30)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -60, right: 180, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -70, right: 60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.035)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, left: '40%', width: 1, height: '60%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />

          {/* Left: Greeting */}
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{dateStr}</span>
              {user?.role && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', padding: '2px 10px', borderRadius: 100, letterSpacing: '0.05em', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {user.role.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              {greeting}, {user?.full_name?.split(' ')[0] || 'there'} 👋
            </h2>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 400 }}>
              {isPunchedIn
                ? "You're clocked in and making progress. Keep it up!"
                : isOnBreak
                ? "You're on a break. Your progress is saved."
                : isCompleted
                ? "Great work today! Your shift is complete."
                : "You haven't clocked in yet. Have a productive day!"}
            </p>
          </div>

          {/* Right: Live clock + attendance pill */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, position: 'relative', flexShrink: 0 }}>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace', letterSpacing: '-1px', lineHeight: 1 }}>{timeStr}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 18px', minWidth: 180 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', display: 'block', flexShrink: 0,
                background: isPunchedIn ? '#4ade80' : isOnBreak ? '#fbbf24' : '#94a3b8',
                boxShadow: isPunchedIn ? '0 0 0 3px rgba(74,222,128,0.3)' : isOnBreak ? '0 0 0 3px rgba(251,191,36,0.3)' : 'none',
                animation: (isPunchedIn || isOnBreak) ? 'dashPulse 2s ease-in-out infinite' : 'none',
              }} />
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {isPunchedIn ? 'Time Worked' : isOnBreak ? 'On Break' : isCompleted ? 'Total Today' : 'Not Started'}
                </p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                  {(isPunchedIn || isOnBreak || isCompleted) ? formatDuration(netMins) : '— : —'}
                </p>
              </div>
            </div>
            {attendance?.punch_in && (
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', margin: 0, textAlign: 'right' }}>
                In at {formatTime(attendance.punch_in)}{attendance.punch_out ? ` · Out at ${formatTime(attendance.punch_out)}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-border)', padding: '22px 20px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div className="skel" style={{ width: 72, height: 10, marginBottom: 14 }} />
                    <div className="skel" style={{ width: 52, height: 36 }} />
                  </div>
                  <div className="skel" style={{ width: 44, height: 44, borderRadius: 12 }} />
                </div>
                <div className="skel" style={{ width: 100, height: 10, marginTop: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {kpis.map((k, i) => (
              <div key={i} className="kpi-hover" style={{
                background: k.gradient, borderRadius: 16,
                border: '1px solid var(--color-border)', borderLeft: `4px solid ${k.hex}`,
                padding: '22px 20px 18px',
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                cursor: 'default',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{k.title}</p>
                    <p style={{ fontSize: 40, fontWeight: 900, color: 'var(--color-text)', margin: 0, lineHeight: 1, letterSpacing: '-2px' }}>
                      <CountUp value={k.value} />
                    </p>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: k.iconBg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {k.icon}
                  </div>
                </div>
                {/* Consistent footer for all 4 cards */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: k.footerColor }}>{k.footer}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Middle Row: Attendance + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

          {/* Today's Attendance */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            {/* Card header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Today's Attendance</p>
              {/* Status chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: attStatus.bg, border: `1px solid ${attStatus.dot}30` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: attStatus.dot, display: 'block', animation: (isPunchedIn || isOnBreak) ? 'dashPulse 2s ease-in-out infinite' : 'none' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: attStatus.color }}>{attStatus.label}</span>
              </div>
            </div>

            {/* Stats rows */}
            <div style={{ padding: '14px 20px', flex: 1 }}>
              {[
                { label: 'Punch In',   value: attendance?.punch_in  ? formatTime(attendance.punch_in)  : '—' },
                { label: 'Punch Out',  value: attendance?.punch_out ? formatTime(attendance.punch_out) : '—' },
                { label: 'Work Hours', value: formatDuration(netMins), accent: true },
                { label: 'Break',      value: formatDuration(attendance?.break_minutes || 0) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.accent ? 'var(--color-primary)' : 'var(--color-text)' }}>{r.value}</span>
                </div>
              ))}

              {/* Shift progress bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shift Progress</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: shiftPct >= 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{shiftPct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 100, width: `${shiftPct}%`, background: shiftPct >= 100 ? 'var(--color-success)' : 'var(--color-primary)', transition: 'width 1s linear, background 0.4s' }} />
                </div>
              </div>
            </div>

            {/* CTA — links to punch page */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
              <Link
                href="/punch"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 10, textDecoration: 'none',
                  background: isCompleted ? 'var(--color-bg-subtle)' : 'var(--color-primary)',
                  color: isCompleted ? 'var(--color-text-muted)' : '#fff',
                  fontWeight: 700, fontSize: 13.5,
                  border: isCompleted ? '1px solid var(--color-border)' : 'none',
                  boxShadow: isCompleted ? 'none' : '0 4px 14px rgba(37,99,235,0.28)',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}
              >
                <PunchIcon size={15} />
                {isPunchedIn ? 'Manage Attendance' : isOnBreak ? 'Back from Break' : isCompleted ? 'View Punch History' : 'Punch In Now'}
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Quick Actions</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>Jump to your most-used features</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {quickLinks.map(a => (
                <Link key={a.href} href={a.href} className="qlink" style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  borderRadius: 14, background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border)', textDecoration: 'none',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: a.iconBg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{a.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>{a.sub}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Tasks ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Recent Tasks</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>Your latest assigned work</p>
            </div>
            <Link href="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', padding: '7px 14px', borderRadius: 8, background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <div className="skel" style={{ flex: 1, height: 13 }} />
                  <div className="skel" style={{ width: 100, height: 13 }} />
                  <div className="skel" style={{ width: 64, height: 22, borderRadius: 100 }} />
                  <div className="skel" style={{ width: 80, height: 22, borderRadius: 100 }} />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckIcon />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>All clear!</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>No tasks assigned. Enjoy your day!</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 110px 120px', padding: '10px 24px', background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                {['Task', 'Project', 'Priority', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                ))}
              </div>
              {tasks.map((task, i) => {
                const ps = PRIORITY_STYLE[task.priority] || { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: task.priority || '—' };
                const ss = STATUS_STYLE[task.status]    || { bg: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', label: task.status || '—' };
                const isLast = i === tasks.length - 1;
                return (
                  <div key={task.id} className="task-row" style={{ display: 'grid', gridTemplateColumns: '1fr 180px 110px 120px', padding: '14px 24px', alignItems: 'center', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
                    <div style={{ minWidth: 0, paddingRight: 16 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
                      {task.due_date && (
                        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>{task.project?.name || '—'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: ps.bg, color: ps.color, width: 'fit-content' }}>{ps.label}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: ss.bg, color: ss.color, width: 'fit-content' }}>{ss.label}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function CountUp({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display}</>;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function TaskIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>; }
function ClockIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function CheckIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success)' }}><polyline points="20 6 9 17 4 12"/></svg>; }
function CrossIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PunchIcon({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function ListIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function CalIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function FolderIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function HomeIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function LeaveIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>; }
