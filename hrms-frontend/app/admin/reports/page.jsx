'use client';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import { formatCurrency } from '../../../utils/formatters';

const REPORT_TYPES = [
  {
    value: 'attendance', short: 'Attendance', label: 'Attendance Report',
    desc: 'Presence, punctuality & hours worked',
    color: 'var(--color-info)', hex: '#2563eb', bg: 'var(--color-info-bg)', border: 'var(--color-primary-border)',
    icon: (c = 'var(--color-info)') => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/>
      </svg>
    ),
  },
  {
    value: 'payroll', short: 'Payroll', label: 'Payroll Report',
    desc: 'Salary, deductions & net compensation',
    color: 'var(--color-success)', hex: '#16a34a', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)',
    icon: (c = 'var(--color-success)') => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    value: 'tasks', short: 'Tasks', label: 'Task Report',
    desc: 'Assignments, completion & progress tracking',
    color: 'var(--color-purple)', hex: '#7c3aed', bg: 'var(--color-purple-bg)', border: 'var(--color-purple-border)',
    icon: (c = 'var(--color-purple)') => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
];

const PERIODS = [
  { value: 'week', label: 'Week', full: 'This Week' },
  { value: 'month', label: 'Month', full: 'This Month' },
  { value: 'quarter', label: 'Quarter', full: 'This Quarter' },
  { value: 'year', label: 'Year', full: 'This Year' },
];

const KPI_ICONS = {
  records: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  present: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  absent: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  clock: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  gross: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  deductions: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  net: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  progress: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  rate: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

function CountUp({ value, duration = 900, fmt = 'num', suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    if (!isFinite(numVal)) return;
    let raf;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // cubic ease-out
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(ease(p) * numVal);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(numVal);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numVal, duration]);

  const formatted = (() => {
    if (fmt === 'currency') {
      // Animate the raw number, then format with ₹ and Indian comma system
      const rounded = Math.round(display);
      return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(rounded);
    }
    if (fmt === 'decimal') {
      return `${prefix}${display.toFixed(1)}${suffix}`;
    }
    // default: integer
    return `${prefix}${Math.round(display).toLocaleString('en-IN')}${suffix}`;
  })();

  return <>{formatted}</>;
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [period, setPeriod]         = useState('month');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => { fetchReport(); }, [reportType, period]);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await api.get(`/api/admin/reports?type=${reportType}&period=${period}`);
      if (res.data.success) { setData(res.data.data); setLastUpdated(new Date()); }
    } catch {}
    setLoading(false);
  };

  const s         = data?.stats     || {};
  const breakdown = data?.breakdown || [];
  const maxVal    = Math.max(...breakdown.map(b => b.value || 0), 1);
  const totalVal  = breakdown.reduce((acc, b) => acc + (b.value || 0), 0);
  const activeType   = REPORT_TYPES.find(t => t.value === reportType);
  const activePeriod = PERIODS.find(p => p.value === period);

  const exportCSV = () => {
    if (!breakdown.length) return;
    const rows = [['Rank', 'Name', 'Value', 'Share %']];
    breakdown.forEach((item, i) => {
      const val = item.value || 0;
      const pct = totalVal ? Math.round(val / totalVal * 100) : 0;
      rows.push([i + 1, item.label || `Item ${i + 1}`, val, pct + '%']);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportType}-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getKpis = () => {
    const attRate = s.total_records ? Math.round((s.present_count || 0) / s.total_records * 100) : 0;
    const absRate = s.total_records ? Math.round((s.absent_count  || 0) / s.total_records * 100) : 0;
    const dedPct  = s.total_gross   ? Math.round((s.total_deductions || 0) / s.total_gross * 100) : 0;

    if (reportType === 'attendance') return [
      { label: 'Total Records',  value: s.total_records  || 0, fmt: 'num',  icon: 'records',  color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    context: 'Attendance entries logged' },
      { label: 'Present Days',   value: s.present_count  || 0, fmt: 'num',  icon: 'present',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', context: `${attRate}% attendance rate` },
      { label: 'Absent Days',    value: s.absent_count   || 0, fmt: 'num',  icon: 'absent',   color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  context: `${absRate}% absence rate` },
      { label: 'Avg Hours / Day',value: ((s.avg_work_minutes || 0) / 60).toFixed(1), fmt: 'str', suffix: 'h', icon: 'clock', color: 'var(--color-purple)', bg: 'var(--color-purple-bg)', context: 'Average daily work hours' },
    ];
    if (reportType === 'payroll') return [
      { label: 'Total Payslips',   value: s.total_payslips   || 0, fmt: 'num',      icon: 'records',    color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    context: 'Salary entries processed' },
      { label: 'Gross Pay',        value: s.total_gross      || 0, fmt: 'currency', icon: 'gross',      color: 'var(--color-success)', bg: 'var(--color-success-bg)', context: 'Total before deductions' },
      { label: 'Total Deductions', value: s.total_deductions || 0, fmt: 'currency', icon: 'deductions', color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  context: `${dedPct}% of gross pay` },
      { label: 'Net Pay',          value: s.total_net        || 0, fmt: 'currency', icon: 'net',        color: 'var(--color-purple)', bg: 'var(--color-purple-bg)', context: 'Total take-home amount' },
    ];
    return [
      { label: 'Total Tasks',    value: s.total_tasks       || 0, fmt: 'num', icon: 'records',  color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    context: 'All assigned tasks' },
      { label: 'Completed',      value: s.completed_tasks   || 0, fmt: 'num', icon: 'present',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', context: `${s.completion_rate || 0}% completion rate` },
      { label: 'In Progress',    value: s.in_progress_tasks || 0, fmt: 'num', icon: 'progress', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', context: 'Currently being worked on' },
      { label: 'Completion Rate',value: s.completion_rate   || 0, fmt: 'str', suffix: '%', icon: 'rate', color: 'var(--color-purple)', bg: 'var(--color-purple-bg)', context: 'Tasks completed vs total' },
    ];
  };


  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const kpis = getKpis();

  return (
    <AppLayout title="Reports & Analytics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Reports</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Reports &amp; Analytics
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--color-text-light)' }}>
              {activeType?.label} · {activePeriod?.full}
              {timeStr && <span style={{ marginLeft: 10, color: 'var(--color-text-light)' }}>· Refreshed {timeStr}</span>}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={fetchReport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-card)', color: 'var(--color-text-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Refresh
            </button>

            <div ref={exportRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setExportOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, background: activeType?.color || 'var(--color-primary)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${activeType?.hex || '#2563eb'}40` }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>
                Export
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {exportOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-elevated)', zIndex: 200, minWidth: 168, overflow: 'hidden' }}>
                  {[
                    {
                      label: 'Print Report',
                      action: () => { window.print(); setExportOpen(false); },
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
                    },
                    {
                      label: 'Export as CSV',
                      action: () => { exportCSV(); setExportOpen(false); },
                      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
                    },
                  ].map(opt => (
                    <button key={opt.label} onClick={opt.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', textAlign: 'left' }}
                    >
                      <span style={{ color: 'var(--color-text-light)' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Bar + Period ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex' }}>
              {REPORT_TYPES.map(t => (
                <button key={t.value} onClick={() => setReportType(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '14px 18px', border: 'none', cursor: 'pointer',
                    background: 'transparent', fontSize: 13, fontWeight: 600,
                    color: reportType === t.value ? t.color : 'var(--color-text-muted)',
                    borderBottom: `2px solid ${reportType === t.value ? t.color : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ opacity: reportType === t.value ? 1 : 0.45 }}>{t.icon(t.color)}</span>
                  {t.short}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 2, background: 'var(--color-bg-subtle)', borderRadius: 8, padding: 3, border: '1px solid var(--color-border)' }}>
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  style={{
                    padding: '5px 13px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: period === p.value ? 'var(--color-card)' : 'transparent',
                    color: period === p.value ? activeType?.color || 'var(--color-primary)' : 'var(--color-text-light)',
                    boxShadow: period === p.value ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '9px 20px', background: activeType?.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ opacity: 0.6 }}>{activeType?.icon(activeType?.color)}</span>
            <span style={{ fontSize: 12, color: activeType?.color, fontWeight: 500 }}>{activeType?.desc}</span>
            {breakdown.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: activeType?.color + '18', color: activeType?.color }}>
                {breakdown.length} records
              </span>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[...Array(4)].map((_,i) => <div key={i} className="shimmer" style={{ height: 108, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {kpis.map(k => (
              <div key={k.label} style={{
                background: 'var(--color-card)', borderRadius: 12,
                border: '1px solid var(--color-border)', padding: '16px 18px',
                boxShadow: 'var(--shadow-card)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, maxWidth: 100 }}>{k.label}</p>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(KPI_ICONS[k.icon] || KPI_ICONS.records)(k.color)}
                  </div>
                </div>
                <p style={{ margin: '0 0 5px', fontSize: 28, fontWeight: 800, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {k.fmt === 'num'      && <CountUp value={k.value} fmt="num" />}
                  {k.fmt === 'currency' && <CountUp value={k.value} fmt="currency" />}
                  {k.fmt === 'str'      && <CountUp value={parseFloat(k.value) || 0} fmt="decimal" suffix={k.suffix || ''} />}
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 11.5, color: 'var(--color-text-light)' }}>{k.context}</p>
                <div style={{ height: 3, borderRadius: 99, background: k.bg }}>
                  <div style={{ height: '100%', width: '55%', background: k.color, borderRadius: 99, opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Chart + Top Entries ── */}
        {!loading && breakdown.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

            {/* Vertical Bar Chart */}
            <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{activeType?.short} Distribution</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--color-text-light)' }}>Visual breakdown · {activePeriod?.full}</p>
                </div>
              </div>
              <div style={{ padding: '20px 20px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 180 }}>
                  {/* Y-axis */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 156, flexShrink: 0, paddingBottom: 2 }}>
                    {[4, 3, 2, 1, 0].map(i => (
                      <span key={i} style={{ fontSize: 9, color: 'var(--color-text-light)', textAlign: 'right', display: 'block', lineHeight: 1 }}>
                        {Math.round((i / 4) * maxVal)}
                      </span>
                    ))}
                  </div>

                  {/* Bars area */}
                  <div style={{ flex: 1, position: 'relative', height: 180 }}>
                    {/* Horizontal gridlines */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 156, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ height: 1, background: 'var(--color-border)', width: '100%' }} />
                      ))}
                    </div>

                    {/* Bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 156, paddingTop: 0 }}>
                      {breakdown.slice(0, 12).map((item, i) => {
                        const val    = item.value || 0;
                        const barH   = Math.max(Math.round((val / maxVal) * 148), val > 0 ? 4 : 0);
                        const hex    = activeType?.hex || '#2563eb';
                        const op     = Math.max(0.35, 1 - (i * 0.055));
                        return (
                          <div key={i} title={`${item.label}: ${val}`}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
                          >
                            <div style={{
                              width: '100%', height: barH,
                              background: `linear-gradient(180deg, ${hex}99, ${hex})`,
                              borderRadius: '4px 4px 0 0',
                              opacity: op,
                              boxShadow: barH > 8 ? `0 -2px 6px ${hex}30` : 'none',
                              transition: 'height 1s cubic-bezier(0.34,1.56,0.64,1)',
                            }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis labels */}
                    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                      {breakdown.slice(0, 12).map((item, i) => (
                        <div key={i} style={{ flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontSize: 9, color: 'var(--color-text-light)', display: 'block', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(item.label || '').slice(0, 7)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Entries */}
            <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Top 5 Entries</h3>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--color-text-light)' }}>Highest values this {period}</p>
              </div>
              <div style={{ padding: '10px 0' }}>
                {breakdown.slice(0, 5).map((item, i) => {
                  const val     = item.value || 0;
                  const pct     = totalVal ? Math.round(val / totalVal * 100) : 0;
                  const display = reportType === 'payroll' ? formatCurrency(val) : val;
                  const medals  = ['🥇','🥈','🥉'];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 18px' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: i < 3 ? activeType?.bg : 'var(--color-bg-subtle)', color: activeType?.color, fontSize: i < 3 ? 14 : 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i < 3 ? medals[i] : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 5px', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label || `Item ${i + 1}`}
                        </p>
                        <div style={{ height: 4, background: 'var(--color-bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: activeType?.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{display}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-light)' }}>{pct}% share</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Summary footer */}
              <div style={{ margin: '0 18px 14px', padding: '10px 14px', background: activeType?.bg, borderRadius: 9, border: `1px solid ${activeType?.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: activeType?.color, fontWeight: 600 }}>Total ({breakdown.length} entries)</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: activeType?.color }}>
                  {reportType === 'payroll' ? formatCurrency(totalVal) : totalVal}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Full Data Table ── */}
        {!loading && breakdown.length > 0 && (
          <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Detailed Breakdown</h3>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--color-text-light)' }}>{breakdown.length} records · {activePeriod?.full}</p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-subtle)' }}>
                  {['#', 'Name', 'Value', '% Share', 'Distribution'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-light)',
                      textAlign: i <= 1 ? 'left' : i === 4 ? 'left' : 'right',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      width: i === 0 ? 48 : i === 3 ? 80 : i === 4 ? 180 : 'auto',
                      borderBottom: '1px solid var(--color-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, i) => {
                  const val     = item.value || 0;
                  const pct     = totalVal ? Math.round(val / totalVal * 100) : 0;
                  const display = reportType === 'payroll' ? formatCurrency(val) : val;
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--color-border)', background: i % 2 === 0 ? 'var(--color-card)' : 'var(--color-table-stripe)' }}>
                      <td style={{ padding: '11px 20px', fontSize: 12, color: 'var(--color-text-light)', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.label || `Item ${i + 1}`}</span>
                      </td>
                      <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{display}</span>
                      </td>
                      <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: activeType?.bg, color: activeType?.color }}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px' }}>
                        <div style={{ height: 6, background: 'var(--color-bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: activeType?.color, opacity: 0.65, borderRadius: 99, transition: 'width 0.7s ease' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                  <td colSpan={2} style={{ padding: '12px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>
                    Grand Total
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
                    {reportType === 'payroll' ? formatCurrency(totalVal) : totalVal}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: activeType?.bg, color: activeType?.color }}>100%</span>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 11.5, color: 'var(--color-text-light)' }}>
                    {breakdown.length} entries
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && breakdown.length === 0 && (
          <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '80px 20px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>No data available</p>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-light)', margin: '0 0 20px' }}>
              No {activeType?.label?.toLowerCase()} records found for {activePeriod?.full?.toLowerCase()}.
            </p>
            <button onClick={fetchReport}
              style={{ padding: '9px 22px', borderRadius: 8, border: `1px solid ${activeType?.border}`, background: activeType?.bg, color: activeType?.color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
