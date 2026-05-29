'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '../../../components/ui/AppLayout';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/axios';
import { formatTime, getAvatarUrl } from '../../../utils/formatters';

function CountUp({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/api/manager/dashboard')
      .then(res => { if (res.data.success) setDashboard(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats            = dashboard?.stats || {};
  const pendingApprovals = dashboard?.pending_approvals || [];
  const teamAttendance   = dashboard?.team_attendance_today || [];

  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const attendancePct = stats.team_size > 0
    ? Math.round(((stats.present_today || 0) / stats.team_size) * 100)
    : 0;

  const kpis = [
    {
      key: 'team_size', label: 'Team Size',
      hex: '#2563eb', color: 'var(--color-info)', bg: 'var(--color-info-bg)',
      gradient: 'linear-gradient(145deg, var(--color-info-bg) 0%, var(--color-card) 65%)',
      icon: <TeamIcon />, footer: 'Total headcount',
    },
    {
      key: 'present_today', label: 'Present Today',
      hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)',
      gradient: 'linear-gradient(145deg, var(--color-success-bg) 0%, var(--color-card) 65%)',
      icon: <PresentIcon />, footer: stats.team_size > 0 ? `${attendancePct}% attendance rate` : 'No data yet',
    },
    {
      key: 'on_break', label: 'On Break',
      hex: '#d97706', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)',
      gradient: 'linear-gradient(145deg, var(--color-warning-bg) 0%, var(--color-card) 65%)',
      icon: <BreakIcon />, footer: 'Currently paused',
    },
    {
      key: 'absent_today', label: 'Absent Today',
      hex: '#dc2626', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)',
      gradient: 'linear-gradient(145deg, var(--color-danger-bg) 0%, var(--color-card) 65%)',
      icon: <AbsentIcon />,
      footer: stats.team_size > 0 ? `${Math.round(((stats.absent_today || 0) / stats.team_size) * 100)}% of team` : 'No data yet',
    },
    {
      key: 'pending_leaves', label: 'Pending Leaves',
      hex: '#7c3aed', color: 'var(--color-purple)', bg: 'var(--color-purple-bg)',
      gradient: 'linear-gradient(145deg, var(--color-purple-bg) 0%, var(--color-card) 65%)',
      icon: <LeaveIcon />,
      footer: (stats.pending_leaves || 0) > 0 ? 'Awaiting review' : 'All cleared',
    },
    {
      key: 'active_tasks', label: 'Active Tasks',
      hex: '#0891b2', color: '#0891b2', bg: 'rgba(8,145,178,0.1)',
      gradient: 'linear-gradient(145deg, rgba(8,145,178,0.08) 0%, var(--color-card) 65%)',
      icon: <TasksIcon />, footer: 'In progress',
    },
  ];

  const quickLinks = [
    { label: 'Leave Approvals', sub: 'Review requests', href: '/manager/approvals', hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: <ApprovalIcon />, badge: stats.pending_leaves || 0 },
    { label: 'My Team',         sub: 'View all members', href: '/manager/team',     hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    icon: <TeamIcon /> },
    { label: 'Assign Tasks',    sub: 'Manage workload',  href: '/tasks',            hex: '#7c3aed', color: 'var(--color-purple)',  bg: 'var(--color-purple-bg)',  icon: <TasksIcon /> },
    { label: 'Team Projects',   sub: 'Track progress',   href: '/projects',         hex: '#d97706', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: <ProjectIcon /> },
  ];

  return (
    <AppLayout title="Manager Dashboard">
      <style>{`
        @keyframes skelSlide { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes dashPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.78)} }
        .skel { background: linear-gradient(90deg, var(--color-border) 0%, var(--color-bg-subtle) 40%, var(--color-bg-subtle) 60%, var(--color-border) 100%); background-size: 300% 100%; animation: skelSlide 1.6s ease-in-out infinite; border-radius: 10px; }
        .kpi-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .kpi-card:hover { transform: translateY(-4px); }
        .qlink { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .qlink:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .att-row:hover { background: var(--color-bg-hover) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Greeting Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3a8f 0%, #1e40af 45%, #2563eb 100%)',
          borderRadius: 20, padding: '28px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
          boxShadow: '0 8px 32px rgba(30,64,175,0.30)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: 200, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -70, right: 80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.035)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{dateStr}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', padding: '2px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)' }}>
                Manager
              </span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              {greeting}, {user?.full_name?.split(' ')[0] || 'Manager'} 👋
            </h2>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              {loading ? 'Loading team data…' :
                (stats.pending_leaves || 0) > 0
                  ? `You have ${stats.pending_leaves} pending leave request${stats.pending_leaves !== 1 ? 's' : ''} awaiting review.`
                  : `${stats.present_today || 0} of ${stats.team_size || 0} team members are present today.`
              }
            </p>
          </div>

          {/* Attendance ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
              <circle cx="45" cy="45" r="36" fill="none" stroke="#4ade80" strokeWidth="7"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - attendancePct / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{loading ? '—' : `${attendancePct}%`}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Present</span>
            </div>
          </div>
        </div>

        {/* ── KPI Strip — all 6 in one row ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '14px 16px' }}>
                <div className="skel" style={{ width: 60, height: 9, marginBottom: 10 }} />
                <div className="skel" style={{ width: 40, height: 28, marginBottom: 8 }} />
                <div className="skel" style={{ width: 70, height: 8 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {kpis.map((k, i) => (
              <div key={i} className="kpi-card" style={{
                background: 'var(--color-card)', borderRadius: 12,
                border: '1px solid var(--color-border)', borderTop: `3px solid ${k.hex}`,
                padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.3 }}>{k.label}</p>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'scale(0.72)', transformOrigin: 'center' }}>
                    {k.icon}
                  </div>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                  <CountUp value={stats[k.key] ?? 0} />
                </p>
                <span style={{ fontSize: 11, fontWeight: 600, color: k.color }}>{k.footer}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Middle row: Quick Actions + Attendance Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

          {/* Quick Actions */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Quick Actions</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Jump to your most-used features</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {quickLinks.map(a => (
                <Link key={a.href} href={a.href} className="qlink" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', textDecoration: 'none', position: 'relative' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.icon}
                    {a.badge > 0 && (
                      <span style={{ position: 'absolute', top: 10, left: 46, minWidth: 18, height: 18, borderRadius: 100, background: 'var(--color-danger)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--color-card)' }}>
                        {a.badge > 99 ? '99+' : a.badge}
                      </span>
                    )}
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

          {/* Attendance Breakdown */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Today's Breakdown</p>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ height: 36 }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Present',  value: stats.present_today || 0, color: 'var(--color-success)', hex: '#16a34a' },
                  { label: 'On Break', value: stats.on_break || 0,      color: 'var(--color-warning)', hex: '#d97706' },
                  { label: 'Absent',   value: stats.absent_today || 0,  color: 'var(--color-danger)',  hex: '#dc2626' },
                ].map(r => {
                  const pct = stats.team_size > 0 ? Math.round((r.value / stats.team_size) * 100) : 0;
                  return (
                    <div key={r.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>{r.label}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: r.color }}>{r.value} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-light)' }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 5, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 100, width: `${pct}%`, background: r.hex, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>Total team</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>{stats.team_size || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom row: Pending Approvals + Team Attendance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Pending Approvals */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Pending Approvals</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  {loading ? '—' : pendingApprovals.length === 0 ? 'All clear' : `${pendingApprovals.length} awaiting review`}
                </p>
              </div>
              <Link href="/manager/approvals" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                View all <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="skel" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="skel" style={{ height: 11, marginBottom: 6 }} /><div className="skel" style={{ height: 10, width: '55%' }} /></div></div>)}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>All caught up!</p>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>No pending leave requests.</p>
              </div>
            ) : (
              <div>
                {pendingApprovals.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="att-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < Math.min(pendingApprovals.length, 5) - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.12s' }}>
                    <img src={getAvatarUrl(a.user?.avatar_url, a.user?.full_name)} alt={a.user?.full_name} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.user?.full_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>
                        {a.type} leave · {a.days} day{a.days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', fontSize: 11.5, fontWeight: 700, color: 'var(--color-warning)', flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'dashPulse 2s ease-in-out infinite', display: 'block' }} />
                      Pending
                    </span>
                  </div>
                ))}
                {pendingApprovals.length > 5 && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <Link href="/manager/approvals" style={{ fontSize: 12.5, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                      +{pendingApprovals.length - 5} more — View all
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team Attendance */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Team Attendance</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>Live status today</p>
              </div>
              <Link href="/manager/team" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                Full view <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(4)].map((_, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="skel" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="skel" style={{ height: 11, marginBottom: 6 }} /><div className="skel" style={{ height: 10, width: '50%' }} /></div><div className="skel" style={{ width: 68, height: 22, borderRadius: 20 }} /></div>)}
              </div>
            ) : teamAttendance.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--color-info-bg)', border: '1px solid var(--color-primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <TeamIcon color="var(--color-info)" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px' }}>No punch-ins yet</p>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>Team members haven't clocked in today.</p>
              </div>
            ) : (
              <div>
                {teamAttendance.slice(0, 5).map((att, i) => {
                  const isWorking = att.punch_in && !att.punch_out && !att.on_break_since;
                  const isOnBreak = !!att.on_break_since && !att.punch_out;
                  const isDone    = !!att.punch_out;
                  const s = isOnBreak
                    ? { label: 'On Break', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', dot: '#f59e0b' }
                    : isWorking
                    ? { label: 'Working',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', dot: '#22c55e' }
                    : isDone
                    ? { label: 'Done',     color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)', dot: '#3b82f6' }
                    : { label: 'Absent',   color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)', dot: '#ef4444' };
                  return (
                    <div key={att.id} className="att-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: i < Math.min(teamAttendance.length, 5) - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.12s' }}>
                      <img src={getAvatarUrl(att.user?.avatar_url, att.user?.full_name)} alt={att.user?.full_name} style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.user?.full_name || 'Unknown'}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                          {att.user?.department || '—'}
                          {att.punch_in && <span style={{ marginLeft: 6, color: 'var(--color-text-light)' }}>· In {formatTime(att.punch_in)}</span>}
                        </p>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, fontSize: 11.5, fontWeight: 700, color: s.color, flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'block', animation: (isWorking || isOnBreak) ? 'dashPulse 2s ease-in-out infinite' : 'none' }} />
                        {s.label}
                      </span>
                    </div>
                  );
                })}
                {teamAttendance.length > 5 && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <Link href="/manager/team" style={{ fontSize: 12.5, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                      +{teamAttendance.length - 5} more — Full view
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function TeamIcon({ color = 'currentColor' }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function PresentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function BreakIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
}
function AbsentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
}
function LeaveIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function TasksIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function ApprovalIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function ProjectIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
}
