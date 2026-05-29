'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { DEPARTMENTS } from '../../../utils/constants';

const ROLES = [
  { value: 'employee',    label: 'Employee',    desc: 'Standard access to personal pages',   color: 'var(--color-success)', hex: '#16a34a', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
  { value: 'manager',     label: 'Manager',     desc: 'Team management & leave approvals',   color: 'var(--color-info)',    hex: '#2563eb', bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)' },
  { value: 'admin',       label: 'Admin',       desc: 'Full admin panel & user management',  color: 'var(--color-danger)',  hex: '#dc2626', bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)' },
  { value: 'super_admin', label: 'Super Admin', desc: 'Unrestricted access to all features', color: 'var(--color-purple)', hex: '#7c3aed', bg: 'var(--color-purple-bg)',  border: 'var(--color-purple-border)' },
];

const LEAVE_DEFAULTS = [
  { key: 'casual_leave', label: 'Casual Leave', color: 'var(--color-warning)', hex: '#d97706', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', icon: <SunIcon /> },
  { key: 'sick_leave',   label: 'Sick Leave',   color: 'var(--color-danger)',  hex: '#dc2626', bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)',  icon: <HeartIcon /> },
  { key: 'earned_leave', label: 'Earned Leave', color: 'var(--color-purple)',  hex: '#7c3aed', bg: 'var(--color-purple-bg)', border: 'var(--color-purple-border)',  icon: <AwardIcon /> },
];

const inp = (err) => ({
  width: '100%', padding: '10px 12px',
  border: `1.5px solid ${err ? 'var(--color-danger-border)' : 'var(--color-border)'}`,
  borderRadius: 9, fontSize: 13.5, color: 'var(--color-text)',
  background: err ? 'var(--color-danger-bg)' : 'var(--color-input-bg)',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit',
});

function Field({ label, required, error, children }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 11.5, color: 'var(--color-danger)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

function SectionCard({ icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
          {subtitle && <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'employee',
    department: '', phone: '', designation: '',
    casual_leave: 12, sick_leave: 10, earned_leave: 15,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.department) e.department = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.post('/api/admin/employees', form);
      if (res.data.success) {
        toast.success(`${form.full_name} has been onboarded successfully!`);
        router.push('/admin/employees');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    }
    setSaving(false);
  };

  const selectedRole = ROLES.find(r => r.value === form.role) || ROLES[0];
  const initials = form.full_name.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const focusStyle = (e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; };
  const blurStyle  = (err) => (e) => { e.target.style.borderColor = err ? 'var(--color-danger-border)' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; };

  return (
    <AppLayout title="Employee Onboarding">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #16a34a 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(22,163,74,0.28)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Employee Onboarding</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Create a new employee account and configure their access</p>
            </div>
          </div>
          <button onClick={() => router.push('/admin/employees')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-card)', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Users
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>

          {/* ── Left: Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Personal Information */}
            <SectionCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              iconBg="var(--color-info-bg)" iconColor="var(--color-info)"
              title="Personal Information" subtitle="Basic details of the new employee">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Full Name" required error={errors.full_name}>
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Rahul Sharma" style={inp(errors.full_name)} onFocus={focusStyle} onBlur={blurStyle(errors.full_name)} />
                </Field>
                <Field label="Email Address" required error={errors.email}>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@company.com" style={inp(errors.email)} onFocus={focusStyle} onBlur={blurStyle(errors.email)} />
                </Field>
                <Field label="Phone Number">
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" style={inp(false)} onFocus={focusStyle} onBlur={blurStyle(false)} />
                </Field>
                <Field label="Designation">
                  <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Developer" style={inp(false)} onFocus={focusStyle} onBlur={blurStyle(false)} />
                </Field>
              </div>
            </SectionCard>

            {/* Account Setup */}
            <SectionCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
              iconBg="var(--color-success-bg)" iconColor="var(--color-success)"
              title="Account Setup" subtitle="Login credentials and department assignment">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Password" required error={errors.password}>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" style={{ ...inp(errors.password), paddingRight: 42 }} onFocus={focusStyle} onBlur={blurStyle(errors.password)} />
                    <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}>
                      {showPwd
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </Field>
                <Field label="Department" required error={errors.department}>
                  <select value={form.department} onChange={e => set('department', e.target.value)} style={{ ...inp(errors.department), cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle(errors.department)}>
                    <option value="">— Select department —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>
            </SectionCard>

            {/* Access Role */}
            <SectionCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              iconBg="var(--color-purple-bg)" iconColor="var(--color-purple)"
              title="Access Role" subtitle="Determines what the employee can access">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)} style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${form.role === r.value ? r.hex : 'var(--color-border)'}`,
                    background: form.role === r.value ? r.bg : 'var(--color-bg-subtle)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.hex, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: form.role === r.value ? r.color : 'var(--color-text)' }}>{r.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Leave Balance */}
            <SectionCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              iconBg="var(--color-warning-bg)" iconColor="var(--color-warning)"
              title="Leave Balance" subtitle="Annual leave entitlement for this employee">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {LEAVE_DEFAULTS.map(l => (
                  <div key={l.key} style={{ padding: '16px', borderRadius: 12, background: l.bg, border: `1px solid ${l.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-card)', color: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {l.icon}
                      </div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: l.color, lineHeight: 1.3 }}>{l.label}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => set(l.key, Math.max(0, form[l.key] - 1))} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${l.border}`, background: 'var(--color-card)', color: l.color, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>−</button>
                      <input type="number" min="0" max="365" value={form[l.key]} onChange={e => set(l.key, parseInt(e.target.value) || 0)} style={{ flex: 1, padding: '6px 8px', border: `1px solid ${l.border}`, borderRadius: 7, fontSize: 15, fontWeight: 800, color: l.color, textAlign: 'center', background: 'var(--color-card)', outline: 'none', fontFamily: 'inherit' }} />
                      <button type="button" onClick={() => set(l.key, form[l.key] + 1)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${l.border}`, background: 'var(--color-card)', color: l.color, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>+</button>
                    </div>
                    <p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>days / year</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 8 }}>
              <button onClick={() => router.push('/admin/employees')} style={{ padding: '11px 24px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-card)', color: 'var(--color-text-muted)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} style={{ padding: '11px 28px', border: 'none', borderRadius: 9, background: saving ? 'var(--color-border)' : 'linear-gradient(135deg,#16a34a,#15803d)', color: saving ? 'var(--color-text-muted)' : '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(22,163,74,0.3)', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'opacity 0.15s' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                {saving ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>Creating Account…</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Create Employee</>
                )}
              </button>
            </div>
          </div>

          {/* ── Right: Live Preview ── */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Employee Preview Card */}
            <div style={{ background: 'linear-gradient(135deg,#1a3a8f 0%,#1e40af 50%,#2563eb 100%)', borderRadius: 16, padding: '24px 20px', boxShadow: '0 8px 32px rgba(30,64,175,0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
              <p style={{ margin: '0 0 16px', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Preview</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: selectedRole.hex + '50', border: `3px solid ${selectedRole.hex}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {initials}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>{form.full_name || 'Employee Name'}</p>
                  {form.designation && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>{form.designation}</p>}
                  {form.email && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{form.email}</p>}
                </div>
                <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: selectedRole.hex + '35', border: `1px solid ${selectedRole.hex}70`, color: '#fff' }}>
                  {selectedRole.label}
                </span>
                {form.department && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
                    {form.department}
                  </span>
                )}
              </div>
            </div>

            {/* Leave Summary */}
            <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Leave Allocation</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {LEAVE_DEFAULTS.map(l => (
                  <div key={l.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{l.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: l.color }}>{form[l.key]} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-light)' }}>days</span></span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>{form.casual_leave + form.sick_leave + form.earned_leave} days</span>
                </div>
              </div>
            </div>

            {/* Access level info */}
            <div style={{ background: selectedRole.bg, borderRadius: 14, border: `1px solid ${selectedRole.border}`, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedRole.hex, display: 'block' }} />
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: selectedRole.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Access Level</p>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: selectedRole.color, lineHeight: 1.5 }}>{selectedRole.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── SVG Icons for leave types ─────────────────────────────────────────────────
function SunIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function HeartIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
}
function AwardIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
}
