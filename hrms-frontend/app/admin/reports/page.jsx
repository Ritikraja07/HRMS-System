'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import { formatCurrency } from '../../../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    value: 'attendance', label: 'Attendance', desc: 'Presence, punctuality & hours worked',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    value: 'payroll', label: 'Payroll', desc: 'Salary, deductions & net compensation',
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
  },
  {
    value: 'tasks', label: 'Tasks', desc: 'Assignments, completion & progress',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
  },
];

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'This Year' },
];

const TASK_COLORS = {
  completed:   { color: '#16a34a', bg: '#f0fdf4' },
  in_progress: { color: '#d97706', bg: '#fffbeb' },
  pending:     { color: '#2563eb', bg: '#eff6ff' },
  rejected:    { color: '#dc2626', bg: '#fef2f2' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDarkMode = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark';

const getChartTheme = (dark) => ({
  grid:  dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  tick:  dark ? '#8da0bc' : '#94a3b8',
  card:  dark ? '#1c2536' : '#ffffff',
  text:  dark ? '#dde3ed' : '#1e293b',
  muted: dark ? '#8da0bc' : '#64748b',
  border:dark ? '#2a3a52' : '#e2e8f0',
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 12,
      border: '1px solid var(--color-border)', padding: '18px 20px',
      boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </p>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-light)' }}>{sub}</p>
      </div>
    </div>
  );
}

function Shimmer({ h = 120 }) {
  return <div className="shimmer" style={{ height: h, borderRadius: 12 }} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  calendar: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:    (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:        (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  clock:    (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  dollar:   (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  minus:    (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  trending: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  task:     (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  refresh:  (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  download: (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
  print:    (c='currentColor') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  chart:    (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('attendance');
  const [period, setPeriod]         = useState('month');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [dark, setDark]             = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  // Sync dark-mode state with data-theme attribute
  useEffect(() => {
    setDark(isDarkMode());
    const obs = new MutationObserver(() => setDark(isDarkMode()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => { fetchReport(); }, [reportType, period]);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await api.get(`/api/admin/reports?type=${reportType}&period=${period}`);
      if (res.data.success) setData(res.data.data);
    } catch {}
    setLoading(false);
  }, [reportType, period]);

  const exportCSV = useCallback(() => {
    const breakdown = data?.breakdown || [];
    if (!breakdown.length) return;
    const total = breakdown.reduce((s, b) => s + (b.value || 0), 0);
    const rows = [['Rank', 'Name', 'Value', 'Share %']];
    breakdown.forEach((item, i) => {
      const pct = total ? Math.round((item.value || 0) / total * 100) : 0;
      rows.push([i + 1, item.label, item.value, pct + '%']);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `${reportType}-report-${period}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }, [data, reportType, period]);

  const ct = REPORT_TYPES.find(t => t.value === reportType);
  const cp = PERIODS.find(p => p.value === period);
  const stats     = data?.stats     || {};
  const breakdown = data?.breakdown || [];
  const theme     = getChartTheme(dark);

  // ── KPI config ──
  const kpis = reportType === 'attendance' ? [
    { label: 'Total Records',   value: stats.total_records  ?? 0, sub: 'Attendance entries',      color: '#2563eb', bg: '#eff6ff', icon: Icon.calendar('#2563eb') },
    { label: 'Present Days',    value: stats.present_count  ?? 0, sub: `${stats.total_records ? Math.round((stats.present_count||0)/stats.total_records*100) : 0}% attendance rate`, color: '#16a34a', bg: '#f0fdf4', icon: Icon.check('#16a34a') },
    { label: 'Absent Days',     value: stats.absent_count   ?? 0, sub: `${stats.total_records ? Math.round((stats.absent_count||0)/stats.total_records*100) : 0}% absence rate`,  color: '#dc2626', bg: '#fef2f2', icon: Icon.x('#dc2626') },
    { label: 'Avg Hours / Day', value: `${((stats.avg_work_minutes||0)/60).toFixed(1)}h`, sub: 'Average daily hours', color: '#7c3aed', bg: '#f5f3ff', icon: Icon.clock('#7c3aed') },
  ] : reportType === 'payroll' ? [
    { label: 'Total Payslips',   value: stats.total_payslips   ?? 0,                    sub: 'Published payslips',     color: '#2563eb', bg: '#eff6ff', icon: Icon.calendar('#2563eb') },
    { label: 'Gross Pay',        value: formatCurrency(stats.total_gross      || 0),    sub: 'Before deductions',       color: '#16a34a', bg: '#f0fdf4', icon: Icon.dollar('#16a34a') },
    { label: 'Total Deductions', value: formatCurrency(stats.total_deductions || 0),    sub: `${stats.total_gross ? Math.round((stats.total_deductions||0)/stats.total_gross*100) : 0}% of gross`, color: '#dc2626', bg: '#fef2f2', icon: Icon.minus('#dc2626') },
    { label: 'Net Pay',          value: formatCurrency(stats.total_net        || 0),    sub: 'Total take-home',          color: '#7c3aed', bg: '#f5f3ff', icon: Icon.trending('#7c3aed') },
  ] : [
    { label: 'Total Tasks',     value: stats.total_tasks       ?? 0, sub: 'All assigned tasks',       color: '#2563eb', bg: '#eff6ff', icon: Icon.task('#2563eb') },
    { label: 'Completed',       value: stats.completed_tasks   ?? 0, sub: `${stats.completion_rate || 0}% completion rate`, color: '#16a34a', bg: '#f0fdf4', icon: Icon.check('#16a34a') },
    { label: 'In Progress',     value: stats.in_progress_tasks ?? 0, sub: 'Currently active',          color: '#d97706', bg: '#fffbeb', icon: Icon.clock('#d97706') },
    { label: 'Completion Rate', value: `${stats.completion_rate || 0}%`, sub: 'Completed vs total',   color: '#7c3aed', bg: '#f5f3ff', icon: Icon.chart('#7c3aed') },
  ];

  // ── Chart data ──
  const barData = {
    labels: breakdown.slice(0, 14).map(b => b.label),
    datasets: [{
      label: ct?.label,
      data: breakdown.slice(0, 14).map(b => b.value || 0),
      backgroundColor: ct?.color + 'cc',
      borderColor: ct?.color,
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const doughnutData = {
    labels: breakdown.map(b => b.label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
    datasets: [{
      data: breakdown.map(b => b.value || 0),
      backgroundColor: breakdown.map(b => (TASK_COLORS[b.label]?.color || '#94a3b8') + 'cc'),
      borderColor: breakdown.map(b => TASK_COLORS[b.label]?.color || '#94a3b8'),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.card,
        titleColor: theme.text,
        bodyColor: theme.muted,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => reportType === 'payroll'
            ? ` ${formatCurrency(ctx.raw)}`
            : ` ${ctx.raw} records`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: theme.grid, drawBorder: false },
        ticks: {
          color: theme.tick, font: { size: 10 },
          maxRotation: 45,
          callback: (_, i) => {
            const lbl = breakdown[i]?.label || '';
            return lbl.length > 8 ? lbl.slice(0, 8) + '…' : lbl;
          },
        },
        border: { display: false },
      },
      y: {
        grid: { color: theme.grid, drawBorder: false },
        ticks: {
          color: theme.tick, font: { size: 10 },
          callback: (v) => reportType === 'payroll'
            ? `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
            : v,
        },
        border: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.card,
        titleColor: theme.text,
        bodyColor: theme.muted,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const totalVal = breakdown.reduce((s, b) => s + (b.value || 0), 0);

  return (
    <AppLayout title="Reports & Analytics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Reports</span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Reports &amp; Analytics
            </h2>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-light)' }}>
              {ct?.label} · {cp?.label}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchReport} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-card)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
            >
              {Icon.refresh()} Refresh
            </button>

            <div ref={exportRef} style={{ position: 'relative' }}>
              <button onClick={() => setExportOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, background: ct?.color, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 2px 8px ${ct?.color}40` }}
              >
                {Icon.download()} Export
              </button>
              {exportOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-elevated)', zIndex: 200, minWidth: 160, overflow: 'hidden' }}>
                  {[
                    { label: 'Export CSV', icon: Icon.download(), action: () => { exportCSV(); setExportOpen(false); } },
                    { label: 'Print',      icon: Icon.print(),    action: () => { window.print(); setExportOpen(false); } },
                  ].map(opt => (
                    <button key={opt.label} onClick={opt.action}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', textAlign: 'left' }}
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

        {/* ── Controls: Type + Period ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 0 }}>
            {/* Report type tabs */}
            <div style={{ display: 'flex' }}>
              {REPORT_TYPES.map(t => (
                <button key={t.value} onClick={() => setReportType(t.value)}
                  style={{
                    padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13.5, fontWeight: 600,
                    color: reportType === t.value ? t.color : 'var(--color-text-muted)',
                    borderBottom: `2px solid ${reportType === t.value ? t.color : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Period pills */}
            <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    border: period === p.value ? `1.5px solid ${ct?.color}` : '1.5px solid transparent',
                    background: period === p.value ? ct?.bg : 'transparent',
                    color: period === p.value ? ct?.color : 'var(--color-text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type descriptor */}
          <div style={{ padding: '9px 20px', background: ct?.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: ct?.color, fontWeight: 500 }}>{ct?.desc}</span>
            {!loading && breakdown.length > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: ct?.color + '18', color: ct?.color }}>
                {breakdown.length} records
              </span>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[...Array(4)].map((_, i) => <Shimmer key={i} h={115} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {kpis.map(k => (
              <StatCard key={k.label} {...k} />
            ))}
          </div>
        )}

        {/* ── Chart + Summary ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            <Shimmer h={300} />
            <Shimmer h={300} />
          </div>
        ) : breakdown.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

            {/* Chart */}
            <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {ct?.label} Distribution
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-light)' }}>
                  {cp?.label} · {breakdown.length} data points
                </p>
              </div>
              <div style={{ padding: 20, height: 260 }}>
                {reportType === 'tasks' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: '100%' }}>
                    <div style={{ width: 200, height: 200, flexShrink: 0 }}>
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      {breakdown.map((b) => {
                        const tc = TASK_COLORS[b.label] || { color: '#94a3b8', bg: 'var(--color-bg-subtle)' };
                        const pct = totalVal ? Math.round((b.value || 0) / totalVal * 100) : 0;
                        return (
                          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, color: 'var(--color-text)', fontWeight: 500, flex: 1, textTransform: 'capitalize' }}>
                              {b.label.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: tc.color }}>{b.value}</span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-light)', width: 34, textAlign: 'right' }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Bar data={barData} options={barOptions} />
                )}
              </div>
            </div>

            {/* Top 5 */}
            <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Top Entries</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-light)' }}>Highest values · {cp?.label}</p>
              </div>
              <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                {breakdown.slice(0, 5).map((item, i) => {
                  const val     = item.value || 0;
                  const pct     = totalVal ? Math.round(val / totalVal * 100) : 0;
                  const display = reportType === 'payroll' ? formatCurrency(val) : val;
                  const medals  = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: i < 3 ? ct?.bg : 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: i < 3 ? 14 : 11, fontWeight: 700, color: ct?.color }}>
                        {i < 3 ? medals[i] : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                          {(item.label || '').replace(/_/g, ' ')}
                        </p>
                        <div style={{ height: 3, background: 'var(--color-bg-subtle)', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: ct?.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>{display}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-light)' }}>{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ margin: '0 16px 14px', padding: '10px 14px', background: ct?.bg, borderRadius: 9, border: `1px solid ${ct?.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: ct?.color, fontWeight: 600 }}>Total · {breakdown.length} entries</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: ct?.color }}>
                  {reportType === 'payroll' ? formatCurrency(totalVal) : totalVal}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Full Data Table ── */}
        {!loading && breakdown.length > 0 && (
          <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Detailed Breakdown</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-light)' }}>{breakdown.length} records · {cp?.label}</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-subtle)' }}>
                    {['#', 'Name', 'Value', 'Share', 'Distribution'].map((h, i) => (
                      <th key={h} style={{
                        padding: '10px 20px', fontSize: 10.5, fontWeight: 700,
                        color: 'var(--color-text-light)', textAlign: i <= 1 ? 'left' : i === 4 ? 'left' : 'right',
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        borderBottom: '1px solid var(--color-border)',
                        width: i === 0 ? 48 : i === 3 ? 76 : i === 4 ? 160 : 'auto',
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
                        <td style={{ padding: '11px 20px', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                          {(item.label || '').replace(/_/g, ' ')}
                        </td>
                        <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{display}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ct?.bg, color: ct?.color }}>
                            {pct}%
                          </span>
                        </td>
                        <td style={{ padding: '11px 20px' }}>
                          <div style={{ height: 5, background: 'var(--color-bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: ct?.color, opacity: 0.7, borderRadius: 99, transition: 'width 0.6s ease' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                    <td colSpan={2} style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Grand Total</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: 'var(--color-text)' }}>
                      {reportType === 'payroll' ? formatCurrency(totalVal) : totalVal}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ct?.bg, color: ct?.color }}>100%</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--color-text-light)' }}>{breakdown.length} entries</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && breakdown.length === 0 && (
          <div style={{ background: 'var(--color-card)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '72px 20px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {Icon.chart('var(--color-text-light)')}
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>No data available</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-light)', margin: '0 0 20px' }}>
              No {ct?.label.toLowerCase()} records found for {cp?.label.toLowerCase()}.
            </p>
            <button onClick={fetchReport}
              style={{ padding: '9px 22px', borderRadius: 8, border: `1px solid ${ct?.border}`, background: ct?.bg, color: ct?.color, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
