'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import { formatCurrency, formatMonth, formatInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

function getLast12Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
    });
  }
  return months;
}

function calcNet(f) {
  const earn = +f.basic_salary + +f.hra + +f.transport_allowance + +f.other_allowances;
  const ded  = +f.pf_deduction + +f.tax_deduction + +f.other_deductions;
  return earn - ded;
}

const EMPTY_FORM = {
  basic_salary: '', hra: '', transport_allowance: '', other_allowances: '',
  pf_deduction: '', tax_deduction: '', other_deductions: '',
};

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    published: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', dot: '#22c55e', label: 'Published' },
    draft:     { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', dot: '#f59e0b', label: 'Draft' },
    none:      { bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-muted)', border: 'var(--color-border)', dot: '#94a3b8', label: 'Not Generated' },
  };
  const s = map[status] || map.none;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size = 36 }) {
  return avatarUrl
    ? <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : (
      <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 700 }}>
        {formatInitials(name)}
      </div>
    );
}

// ── Payslip Detail ────────────────────────────────────────────────────────────
function PayslipDetail({ payslip, onClose, isModal = false }) {
  if (!payslip) return null;
  const totalEarnings   = +payslip.basic_salary + +payslip.hra + +payslip.transport_allowance + +payslip.other_allowances;
  const totalDeductions = +payslip.pf_deduction + +payslip.tax_deduction + +payslip.other_deductions;
  const net = payslip.net_salary ?? (totalEarnings - totalDeductions);

  const lineRows = (items) => items.filter(r => +r.value > 0).map(r => (
    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '7px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{r.label}</span>
      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatCurrency(r.value)}</span>
    </div>
  ));

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Gross Earnings',   value: formatCurrency(totalEarnings),   color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
          { label: 'Total Deductions', value: formatCurrency(totalDeductions),  color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)' },
          { label: 'Net Take-Home',    value: formatCurrency(net),              color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '14px 12px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings / Deductions breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 14, background: 'var(--color-success)', borderRadius: 2 }} />
            Earnings
          </div>
          {lineRows([
            { label: 'Basic Salary',         value: payslip.basic_salary },
            { label: 'House Rent Allowance', value: payslip.hra },
            { label: 'Transport Allowance',  value: payslip.transport_allowance },
            { label: 'Other Allowances',     value: payslip.other_allowances },
          ])}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, padding: '10px 0 0', marginTop: 4, borderTop: '2px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text)' }}>Gross Total</span>
            <span style={{ color: 'var(--color-success)' }}>{formatCurrency(totalEarnings)}</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 14, background: 'var(--color-danger)', borderRadius: 2 }} />
            Deductions
          </div>
          {lineRows([
            { label: 'PF Deduction',       value: payslip.pf_deduction },
            { label: 'Tax Deduction (TDS)', value: payslip.tax_deduction },
            { label: 'Other Deductions',   value: payslip.other_deductions },
          ])}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, padding: '10px 0 0', marginTop: 4, borderTop: '2px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text)' }}>Total Deductions</span>
            <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Net salary banner */}
      <div style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-primary-border)', borderRadius: 14, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--color-info)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net Salary · Take Home</div>
          {payslip.user && <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 3, fontWeight: 500 }}>{payslip.user.full_name} · {formatMonth(payslip.month)}</div>}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--color-info)', letterSpacing: '-1px' }}>{formatCurrency(net)}</div>
      </div>

      {payslip.file_url && (
        <a href={payslip.signed_url || payslip.file_url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '11px 20px', background: 'var(--color-primary)', color: '#fff', borderRadius: 9, fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.28)', transition: 'opacity 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          <DownloadIcon /> Download PDF
        </a>
      )}
    </div>
  );

  if (isModal) return content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Payslip — {formatMonth(payslip.month)}</h3>
        <StatusBadge status={payslip.status} />
      </div>
      <div className="card-padded">{content}</div>
    </div>
  );
}

// ── Payslip Form Modal (admin) ─────────────────────────────────────────────────
const numInputStyle = {
  width: '100%', padding: '9px 10px 9px 28px', border: '1px solid var(--color-border)', borderRadius: 8,
  fontSize: 13.5, background: 'var(--color-input-bg)', color: 'var(--color-text)',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
};

function PayslipFormModal({ employee, month, existing, onClose, onSaved }) {
  const [form, setForm] = useState(existing
    ? { basic_salary: existing.basic_salary || '', hra: existing.hra || '', transport_allowance: existing.transport_allowance || '', other_allowances: existing.other_allowances || '', pf_deduction: existing.pf_deduction || '', tax_deduction: existing.tax_deduction || '', other_deductions: existing.other_deductions || '' }
    : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const net = calcNet(form);

  const handleSave = async (publish = false) => {
    if (!form.basic_salary) { toast.error('Basic salary is required'); return; }
    setSaving(true);
    try {
      if (existing) await api.put(`/api/payslips/${existing.id}`, { ...form, ...(publish ? { status: 'published' } : {}) });
      else           await api.post('/api/payslips', { user_id: employee.id, month, ...form, publish });
      toast.success(publish ? 'Payslip published!' : 'Payslip saved as draft');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payslip');
    } finally { setSaving(false); }
  };

  const Field = ({ label, k, hint }) => (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--color-text-light)', fontWeight: 700, pointerEvents: 'none' }}>₹</span>
        <input type="number" min="0" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0.00" style={numInputStyle} />
      </div>
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-light)', margin: '3px 0 0' }}>{hint}</p>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>

        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PayslipIcon color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>{existing ? 'Edit Payslip' : 'Create Payslip'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{employee.full_name} · {formatMonth(month)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Earnings */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 14, background: 'var(--color-success)', borderRadius: 2 }} />Earnings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Basic Salary *" k="basic_salary" />
              <Field label="HRA" k="hra" hint="House Rent Allowance" />
              <Field label="Transport Allowance" k="transport_allowance" />
              <Field label="Other Allowances" k="other_allowances" />
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 14, background: 'var(--color-danger)', borderRadius: 2 }} />Deductions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="PF Deduction" k="pf_deduction" />
              <Field label="Tax (TDS)" k="tax_deduction" />
              <Field label="Other Deductions" k="other_deductions" />
            </div>
          </div>

          {/* Net preview */}
          <div style={{ background: net >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${net >= 0 ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`, borderRadius: 10, padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Calculated Net Salary</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: net >= 0 ? 'var(--color-success)' : 'var(--color-danger)', letterSpacing: '-0.5px' }}>{formatCurrency(net)}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
              {saving ? 'Publishing…' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payslip View Modal ────────────────────────────────────────────────────────
function PayslipViewModal({ payslip, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PayslipIcon color="#2563eb" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>Payslip Details</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{payslip.user?.full_name || '—'} · {formatMonth(payslip.month)}</p>
          </div>
          <StatusBadge status={payslip.status} />
          <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', marginLeft: 4, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: '22px 26px' }}>
          <PayslipDetail payslip={payslip} isModal />
        </div>
      </div>
    </div>
  );
}

// ── Admin: Payroll Management ─────────────────────────────────────────────────
function PayrollManagementView() {
  const MONTHS = useMemo(() => getLast12Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  const [employees, setEmployees]   = useState([]);
  const [payslips,  setPayslips]    = useState([]);
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [loadingPay,  setLoadingPay]  = useState(true);
  const [formModal,   setFormModal]   = useState(null);
  const [viewModal,   setViewModal]   = useState(null);
  const [publishing,  setPublishing]  = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoadingEmps(true);
    try {
      const res = await api.get('/api/users?limit=500');
      if (res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.users || []);
        setEmployees(list.filter(u => ['employee', 'manager'].includes((u.role || '').toLowerCase())));
      }
    } catch {}
    setLoadingEmps(false);
  }, []);

  const fetchPayslips = useCallback(async () => {
    setLoadingPay(true);
    try {
      const res = await api.get(`/api/payslips?month=${selectedMonth}`);
      if (res.data.success) setPayslips(res.data.data.payslips);
    } catch {}
    setLoadingPay(false);
  }, [selectedMonth]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const payslipMap = useMemo(() => {
    const m = {};
    payslips.forEach(p => { m[p.user_id] = p; });
    return m;
  }, [payslips]);

  const stats = useMemo(() => {
    const published    = payslips.filter(p => p.status === 'published').length;
    const draft        = payslips.filter(p => p.status === 'draft').length;
    const total        = employees.length;
    const notGenerated = total - published - draft;
    const totalNet     = payslips.filter(p => p.status === 'published').reduce((s, p) => s + (Number(p.net_salary) || 0), 0);
    return { total, published, draft, notGenerated, totalNet };
  }, [employees, payslips]);

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    return employees.filter(e => !q || e.full_name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q));
  }, [employees, searchQ]);

  const handleBulkPublish = async () => {
    if (stats.draft === 0) { toast.error('No draft payslips to publish'); return; }
    if (!confirm(`Publish all ${stats.draft} draft payslip(s) for ${MONTHS.find(m => m.value === selectedMonth)?.label}?`)) return;
    setPublishing(true);
    try {
      const res = await api.post('/api/payslips/bulk-publish', { month: selectedMonth });
      toast.success(res.data.message || 'Payslips published!');
      fetchPayslips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk publish failed');
    } finally { setPublishing(false); }
  };

  const handlePublishOne = async (payslip) => {
    try {
      await api.put(`/api/payslips/${payslip.id}`, { status: 'published' });
      toast.success('Payslip published!');
      fetchPayslips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const onSaved = () => { setFormModal(null); fetchPayslips(); };
  const loading = loadingEmps || loadingPay;

  const kpis = [
    { label: 'Total Employees', value: stats.total,        hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    icon: <TeamIcon /> },
    { label: 'Published',       value: stats.published,    hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: <PublishedIcon /> },
    { label: 'Draft',           value: stats.draft,        hex: '#d97706', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: <DraftIcon /> },
    { label: 'Not Generated',   value: stats.notGenerated, hex: '#64748b', color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', icon: <PendingIcon /> },
  ];

  return (
    <AppLayout title="Payroll Management">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .trow:hover td { background: var(--color-bg-subtle) !important; }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
              <PayslipIcon color="#fff" size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Payroll Management</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Create and publish employee payslips month-wise</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13.5, background: 'var(--color-card)', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <button onClick={handleBulkPublish} disabled={publishing || stats.draft === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', borderRadius: 9, background: stats.draft > 0 ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'var(--color-bg-subtle)', color: stats.draft > 0 ? '#fff' : 'var(--color-text-muted)', fontSize: 13.5, fontWeight: 700, cursor: stats.draft > 0 ? 'pointer' : 'not-allowed', boxShadow: stats.draft > 0 ? '0 4px 12px rgba(22,163,74,0.28)' : 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (stats.draft > 0) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              <SendIcon />
              {publishing ? 'Publishing…' : `Publish All Drafts${stats.draft > 0 ? ` (${stats.draft})` : ''}`}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', borderLeft: `4px solid ${k.hex}`, padding: '20px 20px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', transition: 'transform 0.18s, box-shadow 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {k.icon}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 38, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-2px', lineHeight: 1 }}>{k.value}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: k.color }}>
                  {k.label === 'Published' && stats.total > 0 ? `${Math.round((k.value / stats.total) * 100)}% coverage` :
                   k.label === 'Draft' && k.value > 0 ? 'Awaiting publish' :
                   k.label === 'Not Generated' && k.value > 0 ? 'Need payslips' :
                   k.value === 0 ? 'All good' : 'This month'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Table */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          {/* Table toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--color-bg-subtle)' }}>
            <div style={{ position: 'relative', maxWidth: 300, flex: 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by name, department…"
                style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5, background: 'var(--color-input-bg)', color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{filtered.length} employee{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading payroll data…</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-subtle)' }}>
                    {['Employee', 'Department', 'Basic Salary', 'Net Salary', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => {
                    const ps = payslipMap[emp.id];
                    return (
                      <tr key={emp.id} className="trow" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <Avatar name={emp.full_name} avatarUrl={emp.avatar_url} size={34} />
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{emp.full_name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--color-text-light)' }}>{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                          {emp.department || <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                          {ps ? formatCurrency(ps.basic_salary) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 14, fontWeight: 800, color: 'var(--color-info)', letterSpacing: '-0.3px' }}>
                          {ps ? formatCurrency(ps.net_salary ?? 0) : <span style={{ color: 'var(--color-text-light)', fontWeight: 400, fontSize: 13 }}>—</span>}
                        </td>
                        <td style={{ padding: '13px 18px' }}><StatusBadge status={ps ? ps.status : 'none'} /></td>
                        <td style={{ padding: '13px 18px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!ps && (
                              <button onClick={() => setFormModal({ employee: emp, existing: null })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1px solid var(--color-primary-border)', borderRadius: 7, background: 'var(--color-info-bg)', color: 'var(--color-info)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Create
                              </button>
                            )}
                            {ps?.status === 'draft' && (
                              <>
                                <button onClick={() => setFormModal({ employee: emp, existing: ps })}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1px solid var(--color-border)', borderRadius: 7, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Edit
                                </button>
                                <button onClick={() => handlePublishOne(ps)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: 'none', borderRadius: 7, background: 'var(--color-success)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                  <SendIcon size={10} /> Publish
                                </button>
                              </>
                            )}
                            {ps?.status === 'published' && (
                              <button onClick={() => setViewModal(ps)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1px solid var(--color-border)', borderRadius: 7, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: 13 }}>No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {formModal && <PayslipFormModal employee={formModal.employee} month={selectedMonth} existing={formModal.existing} onClose={() => setFormModal(null)} onSaved={onSaved} />}
      {viewModal  && <PayslipViewModal payslip={viewModal} onClose={() => setViewModal(null)} />}
    </AppLayout>
  );
}

// ── Employee: My Payslips ─────────────────────────────────────────────────────
function EmployeePayslipView() {
  const [payslips, setPayslips] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/payslips');
        if (res.data.success) setPayslips(res.data.data.payslips);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const active = selected || payslips[0] || null;

  return (
    <AppLayout title="My Payslips">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            <PayslipIcon color="#fff" size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>My Payslips</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>View and download your salary statements</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Sidebar list */}
          <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Payslip History</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{payslips.length} record{payslips.length !== 1 ? 's' : ''}</p>
            </div>

            {loading ? (
              <div style={{ padding: 44, textAlign: 'center' }}>
                <div style={{ width: 28, height: 28, border: '3px solid var(--color-border)', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : payslips.length === 0 ? (
              <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                <div style={{ width: 50, height: 50, background: 'var(--color-bg-subtle)', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <PayslipIcon color="var(--color-text-light)" size={22} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-light)', margin: 0, fontWeight: 500 }}>No payslips yet</p>
              </div>
            ) : (
              <div>
                {payslips.map(p => {
                  const isActive = active?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelected(p)} style={{ width: '100%', padding: '14px 18px', background: isActive ? 'var(--color-primary-light)' : 'transparent', border: 'none', borderBottom: '1px solid var(--color-border)', borderLeft: `3px solid ${isActive ? '#2563eb' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px' }}>{formatMonth(p.month)}</p>
                          <p style={{ fontSize: 12.5, color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', margin: 0, fontWeight: 700 }}>{formatCurrency(p.net_salary)}</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {active ? (
            <PayslipDetail payslip={active} />
          ) : (
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '64px 20px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 60, height: 60, background: 'var(--color-bg-subtle)', borderRadius: 16, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <PayslipIcon color="var(--color-text-light)" size={26} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>No payslip selected</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Select a month from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function PayslipsPage() {
  const { isManagerOrAdmin } = useAuth();
  return isManagerOrAdmin ? <PayrollManagementView /> : <EmployeePayslipView />;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function PayslipIcon({ color = 'currentColor', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="14" x2="8" y2="14"/>
      <line x1="6" y1="17" x2="10" y2="17"/>
    </svg>
  );
}
function TeamIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;
}
function PublishedIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function DraftIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function SendIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>;
}
function DownloadIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
