'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '../../../components/ui/AppLayout';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../lib/axios';
import { formatCurrency } from '../../../utils/formatters';

function CountUp({ value, duration = 800, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const num = typeof value === 'number' ? value : 0;
    if (!num) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display}{suffix}</>;
}

function RingProgress({ pct, size = 86, stroke = 7, color, label, sub }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>{label}</p>
        {sub && <p style={{ margin: '1px 0 0', fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{sub}</p>}
      </div>
    </div>
  );
}

const DEPT_COLORS = ['#60a5fa','#34d399','#fbbf24','#a78bfa','#f87171','#22d3ee','#f472b6','#4ade80','#fb923c','#818cf8'];

const ROLE_CONFIG = [
  { key: 'super_admin', label: 'Super Admin', color: 'var(--color-purple)',  bg: 'var(--color-purple-bg)',  border: 'var(--color-purple-border)' },
  { key: 'admin',       label: 'Admin',       color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)' },
  { key: 'manager',     label: 'Manager',     color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)' },
  { key: 'employee',    label: 'Employee',    color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s         = data?.stats || {};
  const dept      = data?.department_breakdown || {};
  const role      = data?.role_breakdown || {};
  const totalDept = Object.values(dept).reduce((a, b) => a + b, 0) || 1;
  const totalRole = Object.values(role).reduce((a, b) => a + b, 0) || 1;
  const attendPct = s.total_employees ? Math.round((s.present_today || 0)    / s.total_employees * 100) : 0;
  const taskPct   = s.total_tasks     ? Math.round((s.completed_tasks || 0)  / s.total_tasks     * 100) : 0;
  const activePct = s.total_employees ? Math.round((s.active_employees || 0) / s.total_employees * 100) : 0;

  const hour    = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const kpis = [
    { label: 'Total Employees', value: s.total_employees ?? 0, hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    gradient: 'linear-gradient(145deg,var(--color-info-bg) 0%,var(--color-card) 65%)',    icon: <EmpIcon />,    footer: `${s.active_employees ?? 0} active today`,        href: '/admin/employees' },
    { label: 'Present Today',   value: s.present_today ?? 0,   hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)', gradient: 'linear-gradient(145deg,var(--color-success-bg) 0%,var(--color-card) 65%)', icon: <CheckIcon />,  footer: `${attendPct}% attendance rate`,                   href: null },
    { label: 'Pending Leaves',  value: s.pending_leaves ?? 0,  hex: '#d97706', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', gradient: 'linear-gradient(145deg,var(--color-warning-bg) 0%,var(--color-card) 65%)', icon: <LeaveIcon />,  footer: (s.pending_leaves || 0) > 0 ? 'Needs review' : 'All clear', href: '/manager/approvals' },
    { label: 'Monthly Payroll', value: null, raw: formatCurrency(s.total_payroll ?? 0), hex: '#7c3aed', color: 'var(--color-purple)', bg: 'var(--color-purple-bg)', gradient: 'linear-gradient(145deg,var(--color-purple-bg) 0%,var(--color-card) 65%)', icon: <PayrollIcon />, footer: 'Published this month', href: '/payslips' },
  ];

  const quickActions = [
    { label: 'User Management', sub: 'Manage employees',  href: '/admin/employees',   hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    icon: <EmpIcon /> },
    { label: 'Onboarding',      sub: 'Add new members',   href: '/admin/onboarding',  hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: <OnboardIcon /> },
    { label: 'Leave Approvals', sub: 'Review requests',   href: '/manager/approvals', hex: '#d97706', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: <LeaveIcon /> },
    { label: 'Payroll',         sub: 'Generate payslips', href: '/payslips',          hex: '#7c3aed', color: 'var(--color-purple)',  bg: 'var(--color-purple-bg)',  icon: <PayrollIcon /> },
    { label: 'Reports',         sub: 'Analytics & data',  href: '/admin/reports',     hex: '#0891b2', color: '#0891b2',              bg: 'rgba(8,145,178,0.1)',     icon: <ReportIcon /> },
    { label: 'Shifts',          sub: 'Manage schedules',  href: '/admin/shifts',      hex: '#db2777', color: '#db2777',              bg: 'rgba(219,39,119,0.1)',    icon: <ShiftIcon /> },
  ];

  return (
    <AppLayout title="Admin Dashboard">
      <style>{`
        @keyframes skelSlide { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .skel { background: linear-gradient(90deg,var(--color-border) 0%,var(--color-bg-subtle) 40%,var(--color-bg-subtle) 60%,var(--color-border) 100%); background-size:300% 100%; animation:skelSlide 1.6s ease-in-out infinite; border-radius:10px; }
        .kpi-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .kpi-hover:hover { transform: translateY(-4px); }
        .qlink { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .qlink:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
        .dept-row:hover { background: var(--color-bg-hover) !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Hero Banner ── */}
        <div style={{
          borderRadius: 20, padding: '28px 36px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 45%, #1e40af 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
          boxShadow: '0 12px 40px rgba(30,64,175,0.32)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: 240, width: 220, height: 220, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -70, right: 80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', pointerEvents: 'none' }} />

          {/* Left: greeting + actions */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{dateStr}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', padding: '2px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)' }}>
                Administrator
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
              {greeting}, {user?.full_name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>
              {loading ? 'Loading dashboard…' : `${s.total_employees ?? 0} employees · ${s.present_today ?? 0} present · ${s.pending_leaves ?? 0} pending leave${(s.pending_leaves ?? 0) !== 1 ? 's' : ''}`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/admin/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, background: '#fff', color: '#1e40af', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Employee
              </Link>
              <Link href="/admin/reports" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                View Reports
              </Link>
            </div>
          </div>

          {/* Right: ring metrics */}
          <div style={{ display: 'flex', gap: 32, position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <RingProgress pct={attendPct} color="#34d399" label="Attendance" sub={`${s.present_today ?? 0} present`} />
            <RingProgress pct={taskPct}   color="#60a5fa" label="Tasks Done" sub={`${s.completed_tasks ?? 0} complete`} />
            <RingProgress pct={activePct} color="#a78bfa" label="Active"     sub={`${s.active_employees ?? 0} active`} />
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[...Array(4)].map((_,i) => (
              <div key={i} style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '22px 20px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div><div className="skel" style={{ width: 80, height: 10, marginBottom: 12 }} /><div className="skel" style={{ width: 56, height: 36 }} /></div>
                  <div className="skel" style={{ width: 44, height: 44, borderRadius: 12 }} />
                </div>
                <div className="skel" style={{ width: 110, height: 9, marginTop: 10 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {kpis.map((k, i) => (
              <div key={i} className="kpi-hover" style={{ background: k.gradient, borderRadius: 16, border: '1px solid var(--color-border)', borderLeft: `4px solid ${k.hex}`, padding: '22px 20px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', cursor: k.href ? 'pointer' : 'default' }}
                onClick={() => k.href && (window.location.href = k.href)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
                    <p style={{ margin: 0, fontSize: 38, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-2px', lineHeight: 1 }}>
                      {k.raw ? k.raw : <CountUp value={k.value} />}
                    </p>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {k.icon}
                  </div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: k.color }}>{k.footer}</span>
                  {k.href && <span style={{ fontSize: 11, color: 'var(--color-text-light)', fontWeight: 500 }}>Click to view →</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Quick Actions</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Jump to key administration areas</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} className="qlink" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 12px', borderRadius: 14, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', textDecoration: 'none', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{a.label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom row: Dept breakdown + Role + Tasks ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          {/* Department Breakdown */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Department Breakdown</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{loading ? '—' : `${totalDept} employees · ${Object.keys(dept).length} departments`}</p>
              </div>
              <Link href="/admin/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)' }}>
                View all <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading ? (
                [...Array(5)].map((_,i) => <div key={i}><div className="skel" style={{ height: 10, marginBottom: 8 }} /><div className="skel" style={{ height: 6 }} /></div>)
              ) : Object.keys(dept).length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', fontSize: 13, textAlign: 'center', padding: '32px 0', margin: 0 }}>No department data available</p>
              ) : (
                Object.entries(dept).sort(([,a],[,b]) => b - a).map(([name, count], i) => {
                  const pct = Math.round(count / totalDept * 100);
                  const c = DEPT_COLORS[i % DEPT_COLORS.length];
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, flexShrink: 0 }} />
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{count}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c + '22', color: c, minWidth: 36, textAlign: 'center' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${c}cc, ${c})`, borderRadius: 99, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Role Distribution */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Role Distribution</p>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[...Array(4)].map((_,i) => <div key={i} className="skel" style={{ height: 72 }} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ROLE_CONFIG.map(r => {
                    const count = role[r.key] || 0;
                    const pct   = Math.round(count / totalRole * 100);
                    return (
                      <div key={r.key} style={{ padding: '12px 14px', borderRadius: 12, background: r.bg, border: `1px solid ${r.border}` }}>
                        <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</p>
                        <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: r.color, lineHeight: 1 }}>{count}</p>
                        <div style={{ height: 3, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 99, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Overview */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '20px 22px', flex: 1, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Task Overview</p>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(3)].map((_,i) => <div key={i} className="skel" style={{ height: 44 }} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Total Tasks',  value: s.total_tasks     || 0, pct: 100,            color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)' },
                    { label: 'Completed',    value: s.completed_tasks || 0, pct: taskPct,         color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
                    { label: 'In Progress',  value: (s.total_tasks || 0) - (s.completed_tasks || 0), pct: 100 - taskPct, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)' },
                  ].map(t => (
                    <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: t.bg, borderRadius: 10, border: `1px solid ${t.border}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{t.label}</span>
                      <div style={{ width: 56, height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.pct}%`, background: t.color, borderRadius: 99, transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: t.color, minWidth: 24, textAlign: 'right' }}>{t.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function EmpIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function CheckIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function LeaveIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function PayrollIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function OnboardIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>; }
function ReportIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function ShiftIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
