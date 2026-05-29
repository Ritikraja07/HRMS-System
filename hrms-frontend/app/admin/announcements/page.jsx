'use client';
import { useState, useEffect } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';

const TYPES = {
  general: { label: 'General', color: 'var(--color-info)',    hex: '#2563eb', bg: 'var(--color-info-bg)',    border: 'var(--color-primary-border)', icon: <MegaphoneIcon /> },
  policy:  { label: 'Policy',  color: 'var(--color-purple)',  hex: '#7c3aed', bg: 'var(--color-purple-bg)', border: 'var(--color-purple-border)',  icon: <PolicyIcon /> },
  holiday: { label: 'Holiday', color: 'var(--color-success)', hex: '#16a34a', bg: 'var(--color-success-bg)',border: 'var(--color-success-border)', icon: <HolidayIcon /> },
  event:   { label: 'Event',   color: 'var(--color-warning)', hex: '#d97706', bg: 'var(--color-warning-bg)',border: 'var(--color-warning-border)', icon: <EventIcon /> },
  urgent:  { label: 'Urgent',  color: 'var(--color-danger)',  hex: '#dc2626', bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)',  icon: <UrgentIcon /> },
};

const EMPTY = { title: '', content: '', type: 'general', is_pinned: false, expires_at: '' };

const inp = {
  width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)',
  borderRadius: 9, fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-input-bg)',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s',
};

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function Modal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item
    ? { title: item.title, content: item.content, type: item.type, is_pinned: item.is_pinned, expires_at: item.expires_at || '' }
    : EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim())   return toast.error('Title is required');
    if (!form.content.trim()) return toast.error('Content is required');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const t = TYPES[form.type] || TYPES.general;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-card)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MegaphoneIcon color="#fff" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--color-text)' }}>
              {item ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
              {item ? 'Update this announcement' : 'Broadcast a notice to all employees'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Type selector */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>Type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(TYPES).map(([key, tp]) => (
                <button key={key} type="button" onClick={() => set('type', key)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
                  border: `1.5px solid ${form.type === key ? tp.hex : 'var(--color-border)'}`,
                  background: form.type === key ? tp.bg : 'var(--color-bg-subtle)',
                  color: form.type === key ? tp.color : 'var(--color-text-muted)',
                  fontSize: 12.5, fontWeight: 600, transition: 'all 0.12s',
                }}>
                  <span style={{ color: form.type === key ? tp.color : 'var(--color-text-light)' }}>{tp.icon}</span>
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Office closed on Monday" style={inp}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Content */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Message <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write the full announcement…" rows={4}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.65 }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          {/* Expiry + Pin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                Expiry Date <span style={{ fontSize: 10.5, color: 'var(--color-text-light)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} style={inp} />
            </div>
            <button type="button" onClick={() => set('is_pinned', !form.is_pinned)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap',
              border: `1.5px solid ${form.is_pinned ? 'var(--color-warning-border)' : 'var(--color-border)'}`,
              background: form.is_pinned ? 'var(--color-warning-bg)' : 'var(--color-bg-subtle)',
              color: form.is_pinned ? 'var(--color-warning)' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            }}>
              <PinIcon /> {form.is_pinned ? 'Pinned' : 'Pin to top'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 26px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 26px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${t.hex}, ${t.hex}cc)`, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1, boxShadow: `0 4px 12px ${t.hex}30`, transition: 'opacity 0.15s' }}>
            {saving ? 'Saving…' : item ? 'Save Changes' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAnnouncementsPage() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/announcements');
      if (res.data.success) setItems(res.data.data.announcements || []);
    } catch { toast.error('Failed to load announcements'); }
    setLoading(false);
  };

  const handleSave = async (form) => {
    try {
      if (modal === 'create') {
        const res = await api.post('/api/announcements', form);
        if (res.data.success) { setItems(p => [res.data.data.announcement, ...p]); toast.success('Announcement published'); setModal(null); }
      } else {
        const res = await api.put(`/api/announcements/${modal.id}`, form);
        if (res.data.success) { setItems(p => p.map(a => a.id === modal.id ? res.data.data.announcement : a)); toast.success('Updated'); setModal(null); }
      }
    } catch { toast.error('Failed to save'); }
  };

  const togglePin = async (item) => {
    try {
      const res = await api.put(`/api/announcements/${item.id}`, { is_pinned: !item.is_pinned });
      if (res.data.success) { setItems(p => p.map(a => a.id === item.id ? res.data.data.announcement : a)); toast.success(item.is_pinned ? 'Unpinned' : 'Pinned to top'); }
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/announcements/${id}`);
      setItems(p => p.filter(a => a.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
    setDeleting(null);
  };

  const today         = new Date().toISOString().split('T')[0];
  const filtered      = filter === 'all' ? items : items.filter(a => a.type === filter);
  const pinnedCount   = items.filter(a => a.is_pinned).length;
  const activeCount   = items.filter(a => !a.expires_at || a.expires_at >= today).length;

  return (
    <AppLayout title="Announcements">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.28)' }}>
              <MegaphoneIcon color="#fff" size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>Announcements</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Broadcast company notices, policies and events to all employees</p>
            </div>
          </div>
          <button onClick={() => setModal('create')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.28)', transition: 'opacity 0.15s, transform 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Announcement
          </button>
        </div>

        {/* ── KPI Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Total Published', value: items.length,  color: 'var(--color-info)',    hex: '#2563eb', bg: 'var(--color-info-bg)',    icon: <MegaphoneIcon size={18} /> },
            { label: 'Pinned',          value: pinnedCount,    color: 'var(--color-warning)', hex: '#d97706', bg: 'var(--color-warning-bg)', icon: <PinIcon size={18} /> },
            { label: 'Active',          value: activeCount,    color: 'var(--color-success)', hex: '#16a34a', bg: 'var(--color-success-bg)', icon: <ActiveIcon /> },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${s.hex}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '-1px' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '0 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[{ key: 'all', label: 'All', icon: <AllIcon /> }, ...Object.entries(TYPES).map(([k, t]) => ({ key: k, label: t.label, icon: t.icon }))].map(tab => {
            const count  = tab.key === 'all' ? items.length : items.filter(a => a.type === tab.key).length;
            const active = filter === tab.key;
            const tHex   = tab.key !== 'all' ? TYPES[tab.key]?.hex : '#2563eb';
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '13px 16px',
                border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: 13, fontWeight: active ? 700 : 500, transition: 'all 0.15s',
                color: active ? tHex : 'var(--color-text-muted)',
                borderBottom: `2px solid ${active ? tHex : 'transparent'}`,
                marginBottom: -1,
              }}>
                <span style={{ color: active ? tHex : 'var(--color-text-light)' }}>{tab.icon}</span>
                {tab.label}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: active ? tHex + '18' : 'var(--color-bg-subtle)', color: active ? tHex : 'var(--color-text-muted)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Announcement Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[...Array(6)].map((_,i) => <div key={i} className="shimmer" style={{ height: 200, borderRadius: 14 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '72px 20px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MegaphoneIcon size={26} color="var(--color-text-light)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>No announcements</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
              {filter === 'all' ? 'Create your first announcement to notify the team.' : `No ${filter} announcements yet.`}
            </p>
            {filter === 'all' && (
              <button onClick={() => setModal('create')} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.28)' }}>
                Create Now
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {filtered.map(item => {
              const t         = TYPES[item.type] || TYPES.general;
              const isExpired = item.expires_at && item.expires_at < today;
              return (
                <div key={item.id} style={{
                  background: 'var(--color-card)', borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${item.is_pinned ? 'var(--color-warning-border)' : 'var(--color-border)'}`,
                  boxShadow: item.is_pinned ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.04)',
                  opacity: isExpired ? 0.6 : 1, display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.15s',
                }}>
                  {/* Type accent bar */}
                  <div style={{ height: 3, background: t.hex }} />

                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
                        {t.icon} {t.label}
                      </span>
                      {item.is_pinned && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}>
                          <PinIcon size={10} /> Pinned
                        </span>
                      )}
                      {isExpired && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--color-bg-subtle)', color: 'var(--color-text-light)', border: '1px solid var(--color-border)' }}>Expired</span>
                      )}
                    </div>

                    {/* Title */}
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.4 }}>{item.title}</p>

                    {/* Content preview */}
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                      {item.content}
                    </p>

                    {/* Footer */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={item.author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author?.full_name || 'A')}&background=64748b&color=fff&size=32&bold=true`}
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--color-border)' }}
                          onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=A&background=64748b&color=fff&size=32'; }}
                        />
                        <div>
                          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)' }}>{item.author?.full_name || 'Admin'}</p>
                          <p style={{ margin: 0, fontSize: 10.5, color: 'var(--color-text-light)' }}>
                            {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => togglePin(item)} title={item.is_pinned ? 'Unpin' : 'Pin to top'} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${item.is_pinned ? 'var(--color-warning-border)' : 'var(--color-border)'}`, background: item.is_pinned ? 'var(--color-warning-bg)' : 'var(--color-bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.is_pinned ? 'var(--color-warning)' : 'var(--color-text-muted)', transition: 'all 0.15s' }}>
                          <PinIcon size={12} />
                        </button>
                        <button onClick={() => setModal(item)} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-danger-border)', background: 'var(--color-danger-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-danger-bg)'; e.currentTarget.style.color = 'var(--color-danger)'; }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && <Modal item={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </AppLayout>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function MegaphoneIcon({ color = 'currentColor', size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>;
}
function PolicyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function HolidayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;
}
function EventIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function UrgentIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function PinIcon({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z"/></svg>;
}
function AllIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function ActiveIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
