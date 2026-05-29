'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate, getAvatarUrl, formatInitials } from '../../../utils/formatters';
import { DEPARTMENTS } from '../../../utils/constants';
import { useAuth } from '../../../hooks/useAuth';

// CSS-variable colours — dark mode safe
const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'var(--color-purple)',  hex: '#7c3aed', bg: 'var(--color-purple-bg)',  border: 'var(--color-purple-border)'  },
  { value: 'admin',       label: 'Admin',       color: 'var(--color-danger)',  hex: '#dc2626', bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)'  },
  { value: 'manager',     label: 'Manager',     color: 'var(--color-info)',    hex: '#2563eb', bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)' },
  { value: 'employee',    label: 'Employee',    color: 'var(--color-success)', hex: '#16a34a', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)' },
];

const getRoleMeta = (role) => ROLES.find(r => r.value === (role || '').toLowerCase()) || ROLES[3];

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 8,
  fontSize: 13.5, background: 'var(--color-input-bg)', color: 'var(--color-text)',
  boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const m = getRoleMeta(role);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: m.bg, color: m.color, border: `1px solid ${m.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.hex, display: 'block' }} />
      {m.label}
    </span>
  );
}

function Avatar({ name, url, size = 36 }) {
  return url
    ? <img src={url} alt={name} onError={e => { e.target.src = getAvatarUrl(null, name); }} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 700 }}>
        {formatInitials(name)}
      </div>;
}

function FieldGroup({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function RoleSelector({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {ROLES.map(r => (
        <button type="button" key={r.value} onClick={() => onChange(r.value)} style={{
          padding: '10px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
          border: `2px solid ${value === r.value ? r.hex : 'var(--color-border)'}`,
          background: value === r.value ? r.bg : 'var(--color-bg-subtle)',
          transition: 'all 0.15s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.hex, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: value === r.value ? r.color : 'var(--color-text)' }}>{r.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, maxWidth = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, subtitle, icon, onClose }) {
  return (
    <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employee', department: '', phone: '', designation: '' });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) { toast.error('Name, email and password are required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await api.post('/api/admin/employees', form);
      toast.success(`${getRoleMeta(form.role).label} "${form.full_name}" created!`);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const ACCESS = {
    super_admin: 'Full access — all admin, manager & employee pages',
    admin:       'Admin panel, employee management, reports & payroll',
    manager:     'Manager dashboard, team view & leave approvals',
    employee:    'Dashboard, tasks, attendance, leaves & payslips',
  };
  const m = getRoleMeta(form.role);

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader title="Create New User" subtitle="Add a new user and assign their role" onClose={onClose}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
      />
      <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        <FieldGroup label="Role" required>
          <RoleSelector value={form.role} onChange={v => set('role', v)} />
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldGroup label="Full Name" required>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="John Doe" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
          </FieldGroup>
          <FieldGroup label="Email Address" required>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
          </FieldGroup>
        </div>

        <FieldGroup label="Password" required>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
            <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
              {showPwd
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldGroup label="Department">
            <select value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle}>
              <option value="">— Select —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Phone">
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
          </FieldGroup>
        </div>

        <FieldGroup label="Designation">
          <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Developer, HR Executive…" style={inputStyle} />
        </FieldGroup>

        {/* Access info */}
        <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 9, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ margin: 0, fontSize: 12.5, color: m.color, fontWeight: 500 }}>{ACCESS[form.role]}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
            {saving ? 'Creating…' : `Create ${getRoleMeta(form.role).label}`}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ role: user.role || 'employee', department: user.department || '', designation: user.designation || '', is_active: user.is_active !== false });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}`, form);
      toast.success('User updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={480}>
      {/* Header with avatar */}
      <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={user.full_name} url={user.avatar_url} size={44} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{user.full_name}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{user.email}</p>
        </div>
        <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FieldGroup label="Role">
          <RoleSelector value={form.role} onChange={v => set('role', v)} />
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldGroup label="Department">
            <select value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle}>
              <option value="">— None —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Designation">
            <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Developer" style={inputStyle} />
          </FieldGroup>
        </div>

        {/* Active / Inactive toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: form.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', borderRadius: 12, border: `1px solid ${form.is_active ? 'var(--color-success-border)' : 'var(--color-danger-border)'}` }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: form.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {form.is_active ? 'Account Active' : 'Account Inactive'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
              {form.is_active ? 'User can log in and access the system' : 'User cannot log in'}
            </p>
          </div>
          <button type="button" onClick={() => set('is_active', !form.is_active)} style={{ padding: '7px 16px', border: 'none', borderRadius: 8, background: form.is_active ? 'var(--color-danger)' : 'var(--color-success)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {form.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteConfirmModal({ user, currentUserRole, onClose, onDeleted }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isPrivilegedTarget = ['admin', 'super_admin'].includes(user.role);
  const canDelete = currentUserRole === 'super_admin' || !isPrivilegedTarget;

  const handleDelete = async () => {
    if (confirm !== user.full_name) { toast.error('Name does not match'); return; }
    setDeleting(true);
    try {
      await api.delete(`/api/admin/employees/${user.id}`);
      toast.success(`${user.full_name} has been removed`);
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally { setDeleting(false); }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={460}>
      {/* Danger header */}
      <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-danger-border)', background: 'var(--color-danger-bg)', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-danger)' }}>Remove User</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>This action is permanent and cannot be undone</p>
        </div>
        <button onClick={onClose} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-bg-subtle)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
          <Avatar name={user.full_name} url={user.avatar_url} size={40} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{user.full_name}</p>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {!canDelete ? (
          <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 700, margin: '0 0 4px' }}>Permission denied</p>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>Only a Super Admin can remove Admin or Super Admin accounts.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                Removing this user will permanently delete their account. Attendance, payslip and task history may be affected.
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Type <span style={{ fontWeight: 800, color: 'var(--color-danger)' }}>{user.full_name}</span> to confirm
              </label>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={user.full_name}
                style={{ ...inputStyle, borderColor: confirm && confirm !== user.full_name ? 'var(--color-danger)' : 'var(--color-border)' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting || confirm !== user.full_name} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 9, background: confirm === user.full_name ? 'var(--color-danger)' : 'var(--color-border)', color: confirm === user.full_name ? '#fff' : 'var(--color-text-muted)', fontSize: 13.5, fontWeight: 700, cursor: confirm === user.full_name && !deleting ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                {deleting ? 'Removing…' : 'Remove User'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 500 });
      if (search)     params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/api/users?${params}`);
      if (res.data.success) setUsers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { toast.error('Failed to fetch users'); }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const stats = useMemo(() => ({
    total:      users.length,
    superAdmin: users.filter(u => u.role === 'super_admin').length,
    admin:      users.filter(u => u.role === 'admin').length,
    manager:    users.filter(u => u.role === 'manager').length,
    employee:   users.filter(u => u.role === 'employee').length,
    active:     users.filter(u => u.is_active).length,
  }), [users]);

  const kpiStrip = [
    { label: 'Total',       value: stats.total,      hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)'    },
    { label: 'Super Admin', value: stats.superAdmin, hex: '#7c3aed', color: 'var(--color-purple)',  bg: 'var(--color-purple-bg)'  },
    { label: 'Admin',       value: stats.admin,      hex: '#dc2626', color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)'  },
    { label: 'Manager',     value: stats.manager,    hex: '#2563eb', color: 'var(--color-info)',    bg: 'var(--color-info-bg)'    },
    { label: 'Employee',    value: stats.employee,   hex: '#16a34a', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    { label: 'Active',      value: stats.active,     hex: '#0891b2', color: '#0891b2',              bg: 'rgba(8,145,178,0.1)'     },
  ];

  return (
    <AppLayout title="User Management">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .urow:hover td { background: var(--color-bg-subtle) !important; }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>User Management</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Create users and manage their roles, departments and access</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.28)', transition: 'opacity 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        </div>

        {/* ── KPI Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {kpiStrip.map(s => (
            <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderTop: `3px solid ${s.hex}`, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search & Filter ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department…" style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--color-bg-subtle)', borderRadius: 16, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
                {search || roleFilter ? 'No users match your filters' : 'No users yet'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
                {search || roleFilter ? 'Try adjusting your search or filters.' : 'Add the first user to get started.'}
              </p>
              {!search && !roleFilter && (
                <button onClick={() => setShowCreate(true)} style={{ padding: '9px 22px', border: 'none', borderRadius: 9, background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
                  Add First User
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-subtle)' }}>
                    {['User', 'Role', 'Designation', 'Department', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="urow" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <Avatar name={u.full_name} url={u.avatar_url} size={36} />
                          <div>
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{u.full_name}</p>
                            <p style={{ fontSize: 11.5, color: 'var(--color-text-light)', margin: '1px 0 0' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 18px' }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: '13px 18px' }}>
                        {u.designation
                          ? <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', background: 'var(--color-bg-subtle)', padding: '3px 10px', borderRadius: 6, border: '1px solid var(--color-border)' }}>{u.designation}</span>
                          : <span style={{ color: 'var(--color-text-light)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {u.department || <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {u.phone || <span style={{ color: 'var(--color-text-light)' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: u.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: u.is_active ? 'var(--color-success)' : 'var(--color-danger)', border: `1px solid ${u.is_active ? 'var(--color-success-border)' : 'var(--color-danger-border)'}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#22c55e' : '#ef4444', display: 'block' }} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 18px', fontSize: 12.5, color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setEditUser(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid var(--color-border)', borderRadius: 7, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                          <button onClick={() => setDeleteUser(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '1px solid var(--color-danger-border)', borderRadius: 7, background: 'var(--color-danger-bg)', color: 'var(--color-danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)'; }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>{users.length} user{users.length !== 1 ? 's' : ''} shown</span>
                {(search || roleFilter) && <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Filtered results</span>}
              </div>
            </div>
          )}
        </div>

      </div>

      {showCreate  && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchUsers(); }} />}
      {editUser    && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchUsers(); }} />}
      {deleteUser  && <DeleteConfirmModal user={deleteUser} currentUserRole={currentUser?.role} onClose={() => setDeleteUser(null)} onDeleted={() => { setDeleteUser(null); fetchUsers(); }} />}
    </AppLayout>
  );
}
