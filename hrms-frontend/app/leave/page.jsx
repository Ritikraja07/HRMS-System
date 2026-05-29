'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';
import { LEAVE_TYPES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

// CSS-variable-based colors so dark mode works automatically
const LEAVE_META = {
  casual:    { label: 'Casual Leave',    color: 'var(--color-info)',       hex: '#2563eb', bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)', balanceKey: 'casual_leave' },
  sick:      { label: 'Sick Leave',      color: 'var(--color-orange)',      hex: '#ea580c', bg: 'var(--color-orange-bg)', border: 'var(--color-orange-border)',   balanceKey: 'sick_leave' },
  earned:    { label: 'Earned Leave',    color: 'var(--color-purple)',      hex: '#7c3aed', bg: 'var(--color-purple-bg)', border: 'var(--color-purple-border)',   balanceKey: 'earned_leave' },
  maternity: { label: 'Maternity Leave', color: '#db2777',                  hex: '#db2777', bg: 'rgba(219,39,119,0.1)',   border: 'rgba(219,39,119,0.22)',        balanceKey: null },
  paternity: { label: 'Paternity Leave', color: '#0891b2',                  hex: '#0891b2', bg: 'rgba(8,145,178,0.1)',    border: 'rgba(8,145,178,0.22)',         balanceKey: null },
  unpaid:    { label: 'Unpaid Leave',    color: 'var(--color-text-muted)',  hex: '#64748b', bg: 'var(--color-bg-subtle)', border: 'var(--color-border)',          balanceKey: null },
};

const getMeta = (type) => LEAVE_META[type] || { label: type, color: 'var(--color-text-muted)', hex: '#64748b', bg: 'var(--color-bg-subtle)', border: 'var(--color-border)', balanceKey: null };

const STATUS = {
  pending:   { label: 'Pending',   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', dot: '#f59e0b' },
  approved:  { label: 'Approved',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', dot: '#22c55e' },
  rejected:  { label: 'Rejected',  color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)',  dot: '#ef4444' },
  cancelled: { label: 'Cancelled', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', border: 'var(--color-border)', dot: '#94a3b8' },
};

const getStatus = (s) => STATUS[s] || STATUS.pending;

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8,
  fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-input-bg)',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
};

// ── CountUp animation ─────────────────────────────────────────────────────────
function CountUp({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const end = Number(value);
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (1 - Math.pow(1 - p, 3)) * (end - from)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

// ── KPI Balance Card ──────────────────────────────────────────────────────────
function BalanceCard({ label, icon, color, hex, bg, total, used }) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 16,
      border: '1px solid var(--color-border)', borderTop: `3px solid ${hex}`,
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = ''; }}>

      {/* Top row: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-text-light)', fontWeight: 500 }}>{used} used · {total} total</p>
        </div>
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-2px', lineHeight: 1 }}>
          <CountUp value={remaining} />
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>days left</span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>Used</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${hex}, ${hex}bb)`, borderRadius: 10, transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Apply Leave Modal ─────────────────────────────────────────────────────────
function ApplyLeaveModal({ onClose, onSubmitted, balance, used }) {
  const [form, setForm] = useState({ type: 'casual', from_date: '', to_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const days = useMemo(() => {
    if (!form.from_date || !form.to_date) return 0;
    return Math.max(1, Math.floor((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1);
  }, [form.from_date, form.to_date]);

  const meta = getMeta(form.type);
  const available = meta.balanceKey ? Math.max(0, (Number(balance[meta.balanceKey]) || 0) - (Number(used[form.type]) || 0)) : null;
  const insufficient = available !== null && days > available;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date) { toast.error('Please select a date range'); return; }
    if (form.reason.trim().length < 10) { toast.error('Reason must be at least 10 characters'); return; }
    if (new Date(form.to_date) < new Date(form.from_date)) { toast.error('End date must be after start date'); return; }
    setSaving(true);
    try {
      await api.post('/api/leave', { ...form, days });
      toast.success('Leave request submitted successfully!');
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>

        {/* Modal header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LeaveFormIcon />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>Apply for Leave</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>Submit a new leave request for approval</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Leave type selector */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
              Leave Type <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LEAVE_TYPES.map(t => {
                const m = getMeta(t.value);
                const isSelected = form.type === t.value;
                const avail = m.balanceKey ? Math.max(0, (Number(balance[m.balanceKey]) || 0) - (Number(used[t.value]) || 0)) : null;
                return (
                  <button type="button" key={t.value} onClick={() => set('type', t.value)} style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${isSelected ? m.hex : 'var(--color-border)'}`,
                    background: isSelected ? m.bg : 'var(--color-bg-subtle)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.hex, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? m.color : 'var(--color-text)' }}>{t.label}</span>
                      </div>
                      {avail !== null && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: isSelected ? m.color : 'var(--color-text-light)', background: isSelected ? m.bg : 'var(--color-bg-subtle)', padding: '1px 7px', borderRadius: 6, border: `1px solid ${isSelected ? m.hex + '40' : 'var(--color-border)'}` }}>
                          {avail}d
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 10 }}>
              Date Range <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['from_date', 'From Date'], ['to_date', 'To Date']].map(([key, lbl]) => (
                <div key={key}>
                  <p style={{ margin: '0 0 5px', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>{lbl}</p>
                  <input type="date" value={form[key]} onChange={e => set(key, e.target.value)}
                    min={key === 'to_date' ? form.from_date : undefined}
                    style={inputStyle} />
                </div>
              ))}
            </div>
            {days > 0 && (
              <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 9, background: insufficient ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', border: `1px solid ${insufficient ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: insufficient ? 'var(--color-danger)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {days} day{days !== 1 ? 's' : ''} requested
                </span>
                {insufficient && <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>Exceeds balance</span>}
                {!insufficient && available !== null && <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>{available - days} days remaining</span>}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
              Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
              placeholder="Describe the reason for your leave request (min. 10 characters)…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: form.reason.length >= 10 ? 'var(--color-success)' : 'var(--color-text-light)', textAlign: 'right', fontWeight: 500 }}>
              {form.reason.length} / 10 min
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || insufficient} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 9, background: saving || insufficient ? 'var(--color-border)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: saving || insufficient ? 'var(--color-text-muted)' : '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving || insufficient ? 'not-allowed' : 'pointer', boxShadow: saving || insufficient ? 'none' : '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}>
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Leave Record Row ──────────────────────────────────────────────────────────
function LeaveRow({ leave, onCancel }) {
  const meta   = getMeta(leave.type);
  const status = getStatus(leave.status);

  return (
    <div style={{
      background: 'var(--color-card)', borderRadius: 12,
      border: '1px solid var(--color-border)', borderLeft: `4px solid ${meta.hex}`,
      padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>

      {/* Leave type icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <LeaveTypeIcon type={leave.type} hex={meta.hex} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{meta.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, padding: '2px 9px', borderRadius: 6, border: `1px solid ${meta.hex}28` }}>
              {leave.days} day{leave.days !== 1 ? 's' : ''}
            </span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: status.bg, color: status.color, border: `1px solid ${status.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, display: 'block' }} />
            {status.label}
          </span>
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: leave.reason ? 8 : 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {formatDate(leave.from_date)}
            {leave.from_date !== leave.to_date && <> &rarr; {formatDate(leave.to_date)}</>}
          </span>
        </div>

        {/* Reason */}
        {leave.reason && (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {leave.reason}
          </p>
        )}

        {/* Manager comment */}
        {leave.approval_comment && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', background: 'var(--color-bg-subtle)', borderRadius: 8, padding: '7px 10px', marginTop: 8, border: '1px solid var(--color-border)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{leave.approval_comment}</span>
          </div>
        )}
      </div>

      {leave.status === 'pending' && (
        <button onClick={() => onCancel(leave.id)} style={{ flexShrink: 0, padding: '5px 13px', border: '1px solid var(--color-danger-border)', borderRadius: 7, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)'; }}>
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeavePage() {
  const { user, session } = useAuth();
  const { on } = useSocket(user?.id, session?.access_token);
  const [leaves,  setLeaves]  = useState([]);
  const [balance, setBalance] = useState({});
  const [used,    setUsed]    = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab,  setActiveTab]  = useState('all');
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lr, br] = await Promise.all([api.get('/api/leave'), api.get('/api/leave/balance')]);
      if (lr.data.success) setLeaves(lr.data.data.leave_requests || []);
      if (br.data.success) { setBalance(br.data.data.balance || {}); setUsed(br.data.data.used || {}); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (!user) return;
    return on('leave:updated', fetchData);
  }, [user, on, fetchData]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await api.patch(`/api/leave/${id}/cancel`);
      toast.success('Leave request cancelled');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const counts = useMemo(() => ({
    all:      leaves.length,
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  }), [leaves]);

  const filtered = activeTab === 'all' ? leaves : leaves.filter(l => l.status === activeTab);

  const totalBalance = ['casual_leave','sick_leave','earned_leave'].reduce((s, k) => s + (Number(balance[k]) || 0), 0);
  const totalUsed    = ['casual','sick','earned'].reduce((s, k) => s + (Number(used[k]) || 0), 0);

  const TABS = [
    { key: 'all',      label: 'All',      color: '#2563eb' },
    { key: 'pending',  label: 'Pending',  color: '#d97706' },
    { key: 'approved', label: 'Approved', color: '#16a34a' },
    { key: 'rejected', label: 'Rejected', color: '#dc2626' },
  ];

  return (
    <AppLayout title="Leave Management">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
              <PageHeaderIcon />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Leave Management</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Track your leave balance and manage requests</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.28)', transition: 'opacity 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Apply for Leave
          </button>
        </div>

        {/* ── KPI Balance Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <BalanceCard
            label="Total Balance" hex="#2563eb" color="var(--color-info)" bg="var(--color-info-bg)"
            total={totalBalance} used={totalUsed}
            icon={<TotalBalanceIcon />}
          />
          <BalanceCard
            label="Casual Leave" hex="#2563eb" color="var(--color-info)" bg="var(--color-info-bg)"
            total={Number(balance.casual_leave) || 0} used={Number(used.casual) || 0}
            icon={<CasualLeaveIcon />}
          />
          <BalanceCard
            label="Sick Leave" hex="#ea580c" color="var(--color-orange)" bg="var(--color-orange-bg)"
            total={Number(balance.sick_leave) || 0} used={Number(used.sick) || 0}
            icon={<SickLeaveIcon />}
          />
          <BalanceCard
            label="Earned Leave" hex="#7c3aed" color="var(--color-purple)" bg="var(--color-purple-bg)"
            total={Number(balance.earned_leave) || 0} used={Number(used.earned) || 0}
            icon={<EarnedLeaveIcon />}
          />
        </div>

        {/* ── Leave History ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>

          {/* Tab bar */}
          <div style={{ padding: '0 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-bg-subtle)' }}>
            <div style={{ display: 'flex' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: activeTab === t.key ? 700 : 500,
                  color: activeTab === t.key ? t.color : 'var(--color-text-muted)',
                  borderBottom: `2px solid ${activeTab === t.key ? t.color : 'transparent'}`,
                  marginBottom: -1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  {t.label}
                  {counts[t.key] > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: activeTab === t.key ? t.color : 'var(--color-border)', color: activeTab === t.key ? '#fff' : 'var(--color-text-muted)' }}>
                      {counts[t.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-light)', fontWeight: 500, paddingRight: 4 }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: 20 }}>
            {loading ? (
              <div style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTop: `3px solid #2563eb`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading leave requests…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '56px 20px', textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, background: 'var(--color-bg-subtle)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--color-border)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
                  {activeTab === 'all' ? 'No leave requests yet' : `No ${activeTab} requests`}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
                  {activeTab === 'all' ? 'Apply for leave when you need time off.' : `You have no ${activeTab} leave requests.`}
                </p>
                {activeTab === 'all' && (
                  <button onClick={() => setShowModal(true)} style={{ padding: '9px 22px', border: 'none', borderRadius: 9, background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
                    Apply for Leave
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(leave => (
                  <LeaveRow key={leave.id} leave={leave} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ApplyLeaveModal
          onClose={() => setShowModal(false)}
          onSubmitted={() => { setShowModal(false); fetchData(); }}
          balance={balance}
          used={used}
        />
      )}
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function PageHeaderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  );
}

function LeaveFormIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

// Corporate KPI icons
function TotalBalanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
      <line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}

function CasualLeaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function SickLeaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}

function EarnedLeaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}

function LeaveTypeIcon({ type, hex }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: hex, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'sick')      return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
  if (type === 'earned')    return <svg {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
  if (type === 'maternity' || type === 'paternity') return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
  if (type === 'unpaid')    return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
  // default (casual)
  return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
