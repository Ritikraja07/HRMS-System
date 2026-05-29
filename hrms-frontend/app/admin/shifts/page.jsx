'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import { Modal } from '../../../components/ui/Badge';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { SHIFT_NAMES } from '../../../utils/constants';

const calcDuration = (start, end) => {
  if (!start || !end) return '—';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const ICON_COLORS = [
  { bg: '#eff6ff', color: '#2563eb' },
  { bg: '#faf5ff', color: '#7c3aed' },
  { bg: '#f0fdf4', color: '#16a34a' },
  { bg: '#fffbeb', color: '#d97706' },
  { bg: '#fef2f2', color: '#dc2626' },
];

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Morning Shift', start_time: '09:00', end_time: '18:00',
    grace_minutes: 15, description: '',
  });

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shifts');
      if (res.data.success) setShifts(res.data.data.shifts);
    } catch { toast.error('Failed to load shifts'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const openCreate = () => {
    setEditShift(null);
    setForm({ name: 'Morning Shift', start_time: '09:00', end_time: '18:00', grace_minutes: 15, description: '' });
    setShowModal(true);
  };

  const openEdit = (shift) => {
    setEditShift(shift);
    setForm({
      name: shift.name,
      start_time: shift.start_time?.slice(0, 5) || '09:00',
      end_time: shift.end_time?.slice(0, 5) || '18:00',
      grace_minutes: shift.grace_minutes || 15,
      description: shift.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.start_time || !form.end_time) {
      toast.error('Name, start time, and end time are required');
      return;
    }
    setSaving(true);
    try {
      if (editShift) {
        await api.put(`/api/shifts/${editShift.id}`, form);
        toast.success('Shift updated');
      } else {
        await api.post('/api/shifts', form);
        toast.success('Shift created');
      }
      setShowModal(false);
      fetchShifts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save shift');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try {
      await api.delete(`/api/shifts/${id}`);
      toast.success('Shift deleted');
      fetchShifts();
    } catch { toast.error('Failed to delete shift'); }
  };

  return (
    <AppLayout title="Shift Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {shifts.length} shift{shifts.length !== 1 ? 's' : ''} configured
          </p>
          <button className="btn-primary" onClick={openCreate}>
            + New Shift
          </button>
        </div>

        {/* Shifts grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="shimmer" style={{ height: 180 }} />)}
          </div>
        ) : shifts.length === 0 ? (
          <div className="card-padded" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 36, marginBottom: 10 }}>🕐</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12 }}>No shifts configured yet</p>
            <button className="btn-primary" onClick={openCreate}>Create First Shift</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {shifts.map((shift, idx) => {
              const c = ICON_COLORS[idx % ICON_COLORS.length];
              const dur = calcDuration(shift.start_time?.slice(0, 5), shift.end_time?.slice(0, 5));
              return (
                <div key={shift.id} className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        🕐
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{shift.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>Grace: {shift.grace_minutes || 15} min</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => openEdit(shift)}
                        style={{ padding: '5px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer', display: 'flex', color: 'var(--color-text-muted)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        style={{ padding: '5px', borderRadius: 6, border: '1px solid var(--color-danger-border)', background: 'var(--color-danger-bg)', cursor: 'pointer', display: 'flex', color: 'var(--color-danger)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Time info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                    <div className="stat-row">
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Start Time</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{shift.start_time?.slice(0, 5) || '—'}</span>
                    </div>
                    <div className="stat-row">
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>End Time</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>{shift.end_time?.slice(0, 5) || '—'}</span>
                    </div>
                    <div className="stat-row">
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Duration</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{dur}</span>
                    </div>
                  </div>

                  {shift.description && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-light)', margin: 0, fontStyle: 'italic' }}>{shift.description}</p>
                  )}

                  {shift.user_shifts?.length > 0 && (
                    <div style={{ padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      👤 {shift.user_shifts.length} employee{shift.user_shifts.length !== 1 ? 's' : ''} assigned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editShift ? 'Edit Shift' : 'Create New Shift'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Shift Name <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input">
              {SHIFT_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Start Time <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="time" value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="form-input" />
            </div>
            <div>
              <label className="form-label">End Time <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="time" value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Grace Period (minutes)</label>
            <input type="number" min="0" max="60" value={form.grace_minutes}
              onChange={e => setForm(f => ({ ...f, grace_minutes: parseInt(e.target.value) || 0 }))}
              className="form-input" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Optional description…"
              className="form-input" style={{ resize: 'none' }} />
          </div>
          {form.start_time && form.end_time && (
            <div style={{ padding: '8px 12px', background: 'var(--color-primary-light)', borderRadius: 8, fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
              ⏱ Duration: {calcDuration(form.start_time, form.end_time)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editShift ? 'Update Shift' : 'Create Shift'}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
