'use client';
import { useState, useRef } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { DEPARTMENTS } from '../../utils/constants';

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 9,
  fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-input-bg)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current_password) { toast.error('Current password is required'); return; }
    if (form.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (form.new_password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.patch('/api/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success('Password changed successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const PasswordField = ({ label, k, showKey }) => (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[k]}
          onChange={e => set(k, e.target.value)}
          placeholder="••••••••"
          style={{ ...inputStyle, paddingRight: 42 }}
          onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
          {show[showKey]
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
    </div>
  );

  const strength = (() => {
    const p = form.new_password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['var(--color-danger)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-success)'];
    return { score, label: labels[score - 1] || 'Weak', color: colors[score - 1] || colors[0] };
  })();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>Change Password</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>Update your account password</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PasswordField label="Current Password" k="current_password" showKey="current" />
          <PasswordField label="New Password" k="new_password" showKey="new" />

          {/* Password strength */}
          {strength && (
            <div style={{ marginTop: -8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 10, background: i <= strength.score ? strength.color : 'var(--color-border)', transition: 'background 0.2s' }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
            </div>
          )}

          <PasswordField label="Confirm New Password" k="confirm_password" showKey="confirm" />

          {/* Match indicator */}
          {form.confirm_password && (
            <p style={{ margin: '-8px 0 0', fontSize: 12, fontWeight: 600, color: form.new_password === form.confirm_password ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {form.new_password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--color-border)', borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      position: 'relative', display: 'inline-flex', height: 22, width: 40, alignItems: 'center',
      borderRadius: 100, background: value ? 'var(--color-primary)' : 'var(--color-border)',
      border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        display: 'inline-block', height: 17, width: 17, borderRadius: '50%', background: '#fff',
        transform: value ? 'translateX(21px)' : 'translateX(2px)', transition: 'transform 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      }} />
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
      {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{subtitle}</p>}
    </div>
  );
}

// ── Row for settings toggles ──────────────────────────────────────────────────
function SettingRow({ icon, label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-bg-subtle)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-card)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-text-muted)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
        {description && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{description}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const fileRef = useRef();

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    realtime_alerts:    true,
    email_notifications: true,
    task_reminders:     true,
    leave_updates:      true,
    payslip_alerts:     true,
    attendance_alerts:  false,
  });
  const setNotif = (key, val) => setNotifPrefs(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    // Department is always managed via User Management — never from self-service profile
    const payload = { full_name: form.full_name, phone: form.phone };
    try {
      const res = await api.put(`/api/users/${user.id}`, payload);
      if (res.data.success) {
        updateUser(res.data.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const res = await api.patch(`/api/users/${user.id}/avatar`, { avatar_base64: ev.target.result, file_type: file.type });
          if (res.data.success) { updateUser({ avatar_url: res.data.data.avatar_url }); toast.success('Avatar updated!'); }
        } catch { toast.error('Failed to upload avatar'); }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch { setUploadingAvatar(false); }
  };

  const isAdminUser = ['admin', 'super_admin'].includes(user?.role);

  const roleColor = { admin: '#dc2626', manager: '#2563eb', employee: '#16a34a', super_admin: '#7c3aed' };
  const roleBg    = { admin: 'var(--color-danger-bg)', manager: 'var(--color-info-bg)', employee: 'var(--color-success-bg)', super_admin: 'var(--color-purple-bg)' };

  const TABS = [
    { key: 'account',       label: 'Account Settings',      icon: <UserIcon /> },
    { key: 'notifications', label: 'Notification Settings', icon: <BellIcon /> },
    { key: 'privacy',       label: 'Privacy & Security',    icon: <ShieldIcon /> },
  ];

  return (
    <AppLayout title="My Profile">
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
            <UserIcon color="#fff" size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>My Profile</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Manage your personal information, notifications and security</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Left: Avatar card + tab nav ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar card */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=eff6ff&color=2563eb&size=128&bold=true`}
                  alt={user?.full_name}
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-card)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=eff6ff&color=2563eb&size=128`; }}
                />
                <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid var(--color-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  {uploadingAvatar ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'block', animation: 'spin 0.7s linear infinite' }} /> : <CameraIcon />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>

              <h3 style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{user?.full_name}</h3>
              <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--color-text-muted)' }}>{user?.email}</p>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: roleBg[user?.role] || 'var(--color-bg-subtle)', color: roleColor[user?.role] || 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </span>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Department</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{user?.department || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Member since</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{new Date(user?.created_at).getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                  background: activeTab === t.key ? 'var(--color-primary-light)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${activeTab === t.key ? 'var(--color-primary)' : 'transparent'}`,
                  borderBottom: '1px solid var(--color-border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}
                  onMouseEnter={e => { if (activeTab !== t.key) e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
                  onMouseLeave={e => { if (activeTab !== t.key) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ flexShrink: 0 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500 }}>{t.label}</span>
                  {activeTab === t.key && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Tab content ── */}
          <div>

            {/* ── Tab 1: Account Settings ── */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Personal info */}
                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Personal Information" subtitle="Update your name, phone, and department" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                          Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name"
                          onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Phone</label>
                        <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91-XXXXX-XXXXX"
                          onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                          onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Email</label>
                      <input style={{ ...inputStyle, background: 'var(--color-bg-subtle)', color: 'var(--color-text-light)', cursor: 'not-allowed' }} value={user?.email || ''} disabled />
                      <p style={{ fontSize: 11, color: 'var(--color-text-light)', margin: '4px 0 0' }}>Email address cannot be changed</p>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Department</label>
                      <div style={{ ...inputStyle, background: 'var(--color-bg-subtle)', color: user?.department ? 'var(--color-text)' : 'var(--color-text-light)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{user?.department || 'Not assigned'}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-border)', padding: '2px 8px', borderRadius: 6 }}>Admin managed</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--color-text-light)', margin: '4px 0 0' }}>Department is managed via User Management</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                      <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.28)', transition: 'opacity 0.15s' }}>
                        <SaveIcon /> {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account info */}
                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Account Information" subtitle="Your account details and role" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Employee ID', value: user?.id?.slice(0, 8).toUpperCase() || '—' },
                      { label: 'Role',        value: user?.role?.replace('_', ' ') || '—' },
                      { label: 'Department',  value: user?.department || '—' },
                      { label: 'Joined',      value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--color-bg-subtle)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{r.label}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', textTransform: r.label === 'Role' ? 'capitalize' : 'none' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 2: Notification Settings ── */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Delivery Channels" subtitle="Choose how you want to receive notifications" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SettingRow
                      icon={<BellIcon size={16} />}
                      label="Real-time Alerts"
                      description="In-app push notifications for immediate updates"
                      value={notifPrefs.realtime_alerts}
                      onChange={v => setNotif('realtime_alerts', v)}
                    />
                    <SettingRow
                      icon={<EmailIcon />}
                      label="Email Notifications"
                      description="Receive important updates to your email"
                      value={notifPrefs.email_notifications}
                      onChange={v => setNotif('email_notifications', v)}
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Notification Types" subtitle="Select which events trigger notifications" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SettingRow
                      icon={<TaskNotifIcon />}
                      label="Task Reminders"
                      description="Due dates, assignments, and task status changes"
                      value={notifPrefs.task_reminders}
                      onChange={v => setNotif('task_reminders', v)}
                    />
                    <SettingRow
                      icon={<LeaveNotifIcon />}
                      label="Leave Updates"
                      description="Approvals, rejections, and leave request changes"
                      value={notifPrefs.leave_updates}
                      onChange={v => setNotif('leave_updates', v)}
                    />
                    <SettingRow
                      icon={<PayslipNotifIcon />}
                      label="Payslip Alerts"
                      description="When a new payslip is published"
                      value={notifPrefs.payslip_alerts}
                      onChange={v => setNotif('payslip_alerts', v)}
                    />
                    <SettingRow
                      icon={<AttendanceNotifIcon />}
                      label="Attendance Alerts"
                      description="Punch reminders and attendance anomalies"
                      value={notifPrefs.attendance_alerts}
                      onChange={v => setNotif('attendance_alerts', v)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => toast.success('Notification preferences saved!')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.28)', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                    <SaveIcon /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab 3: Privacy & Security ── */}
            {activeTab === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Password & Authentication" subtitle="Manage your login credentials and security" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Change Password */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--color-bg-subtle)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>Password</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Last changed: Never</p>
                      </div>
                      <button onClick={() => setShowPasswordModal(true)} style={{ padding: '7px 16px', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 8, background: 'var(--color-card)', color: '#2563eb', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = '#2563eb'; }}>
                        Change Password
                      </button>
                    </div>
                    {/* 2FA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--color-bg-subtle)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>Two-Factor Authentication</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Not enabled — adds an extra layer of security</p>
                      </div>
                      <button onClick={() => toast('2FA setup coming soon')} style={{ padding: '7px 16px', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 8, background: 'var(--color-card)', color: '#16a34a', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-card)'; e.currentTarget.style.color = '#16a34a'; }}>
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', padding: '24px 24px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <SectionHeader title="Privacy Preferences" subtitle="Control your data visibility and account activity" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SettingRow
                      icon={<EyeIcon />}
                      label="Profile Visibility"
                      description="Allow other employees to view your profile"
                      value={true}
                      onChange={() => toast('Privacy settings will be available soon')}
                    />
                    <SettingRow
                      icon={<ActivityIcon />}
                      label="Activity Status"
                      description="Show when you're active on the platform"
                      value={true}
                      onChange={() => toast('Privacy settings will be available soon')}
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--color-danger-bg)', borderRadius: 14, border: '1px solid var(--color-danger-border)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WarningIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: 'var(--color-danger)' }}>Danger Zone</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)' }}>Permanent account actions. Contact your administrator.</p>
                  </div>
                  <button style={{ padding: '7px 14px', border: '1px solid var(--color-danger-border)', borderRadius: 8, background: 'var(--color-card)', color: 'var(--color-danger)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => toast.error('Please contact your administrator to deactivate your account.')}>
                    Deactivate Account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function UserIcon({ color = 'currentColor', size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function BellIcon({ size = 18, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function ShieldIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function CameraIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function EmailIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function TaskNotifIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
}
function LeaveNotifIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function PayslipNotifIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
}
function AttendanceNotifIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function ActivityIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function WarningIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
