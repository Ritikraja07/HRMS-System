'use client';
import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import { Modal } from '../../../components/ui/Badge';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate, getAvatarUrl } from '../../../utils/formatters';

const LEAVE_TYPE_COLORS = {
  annual:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)'  },
  sick:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
  casual:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)'  },
  maternity:{ color: '#ec4899', bg: 'rgba(236,72,153,0.1)',border: 'rgba(236,72,153,0.2)'  },
  paternity:{ color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)'   },
  unpaid:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)'  },
};

const STATUS_META = {
  pending:  { color: '#d97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Pending'  },
  approved: { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.25)',   label: 'Approved' },
  rejected: { color: 'var(--color-danger)', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)',   label: 'Rejected' },
};

function LeaveTypeTag({ type }) {
  const t = LEAVE_TYPE_COLORS[type] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
      color: t.color, background: t.bg, border: `1px solid ${t.border}`,
    }}>
      {type} Leave
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'block' }} />
      {s.label}
    </span>
  );
}

export default function ManagerApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState('');
  const [saving, setSaving] = useState(false);
  const [allApprovals, setAllApprovals] = useState([]);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [filteredRes, allRes] = await Promise.all([
        api.get(`/api/manager/approvals${filter ? `?status=${filter}` : ''}`),
        api.get('/api/manager/approvals'),
      ]);
      if (filteredRes.data.success) setApprovals(filteredRes.data.data.approvals);
      if (allRes.data.success) setAllApprovals(allRes.data.data.approvals);
    } catch {
      toast.error('Failed to load approvals');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const openAction = (leave, actionType) => {
    setSelected(leave);
    setAction(actionType);
    setComment('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (action === 'reject' && !comment.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/leave/${selected.id}/status`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        approval_comment: comment,
      });
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowModal(false);
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
    setSaving(false);
  };

  const counts = { pending: 0, approved: 0, rejected: 0 };
  allApprovals.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });

  const TABS = [
    { key: 'pending',  label: 'Pending',  count: counts.pending  },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
    { key: '',         label: 'All',      count: allApprovals.length },
  ];

  const KPI_CARDS = [
    {
      label: 'Pending Review', value: counts.pending,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      color: '#d97706', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',
    },
    {
      label: 'Approved',       value: counts.approved,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
      color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.2)',
    },
    {
      label: 'Rejected',       value: counts.rejected,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
      color: 'var(--color-danger)', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.2)',
    },
    {
      label: 'Total Requests', value: allApprovals.length,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)',
    },
  ];

  return (
    <AppLayout title="Leave Approvals">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {KPI_CARDS.map(k => (
            <div key={k.label} style={{
              background: 'var(--color-card)', border: `1px solid ${k.border}`,
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: k.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: k.color, flexShrink: 0,
              }}>
                {k.icon}
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0', fontWeight: 500 }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: 2,
          background: 'var(--color-card)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: 4, alignSelf: 'flex-start',
        }}>
          {TABS.map(tab => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-border)',
                    color: active ? '#fff' : 'var(--color-text-muted)',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 12 }} />)}
          </div>
        ) : approvals.length === 0 ? (
          <div style={{
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            borderRadius: 14, padding: '64px 20px', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
              No {filter || ''} requests
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              {filter === 'pending' ? 'Great — all leave requests have been reviewed.' : 'No leave requests match this filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {approvals.map(leave => {
              const lc = LEAVE_TYPE_COLORS[leave.type] || { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
              return (
                <div key={leave.id} style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  transition: 'box-shadow 0.15s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Color accent bar */}
                  <div style={{ width: 4, background: lc.color, flexShrink: 0 }} />

                  {/* Content */}
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Avatar */}
                    <img
                      src={getAvatarUrl(leave.user?.avatar_url, leave.user?.full_name)}
                      alt={leave.user?.full_name}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    />

                    {/* Employee Info */}
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{leave.user?.full_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 6px' }}>{leave.user?.department || 'No department'}</p>
                      <LeaveTypeTag type={leave.type} />
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 48, background: 'var(--color-border)', flexShrink: 0 }} />

                    {/* Dates */}
                    <div style={{ minWidth: 140 }}>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Duration</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                        {formatDate(leave.from_date)} — {formatDate(leave.to_date)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                        {leave.days} day{leave.days !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 48, background: 'var(--color-border)', flexShrink: 0 }} />

                    {/* Reason */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {leave.reason ? (
                        <>
                          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Reason</p>
                          <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {leave.reason}
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--color-text-light)', fontStyle: 'italic', margin: 0 }}>No reason provided</p>
                      )}
                      {leave.approval_comment && (
                        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>
                          Note: "{leave.approval_comment}"
                        </p>
                      )}
                    </div>

                    {/* Status + Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <StatusBadge status={leave.status} />
                      {leave.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => openAction(leave, 'approve')}
                            style={{
                              padding: '6px 14px', borderRadius: 8,
                              border: '1px solid rgba(22,163,74,0.35)',
                              background: 'rgba(22,163,74,0.08)',
                              color: '#15803d', fontSize: 12.5, fontWeight: 700,
                              cursor: 'pointer', transition: 'all 0.15s ease',
                              display: 'flex', alignItems: 'center', gap: 5,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#16a34a'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; e.currentTarget.style.color = '#15803d'; e.currentTarget.style.borderColor = 'rgba(22,163,74,0.35)'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Approve
                          </button>
                          <button
                            onClick={() => openAction(leave, 'reject')}
                            style={{
                              padding: '6px 14px', borderRadius: 8,
                              border: '1px solid rgba(220,38,38,0.35)',
                              background: 'rgba(220,38,38,0.08)',
                              color: '#b91c1c', fontSize: 12.5, fontWeight: 700,
                              cursor: 'pointer', transition: 'all 0.15s ease',
                              display: 'flex', alignItems: 'center', gap: 5,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.35)'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {selected && (
            <div style={{
              background: action === 'approve' ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${action === 'approve' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <img
                src={getAvatarUrl(selected.user?.avatar_url, selected.user?.full_name)}
                alt={selected.user?.full_name}
                style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px' }}>{selected.user?.full_name}</p>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>
                  {selected.days} day{selected.days !== 1 ? 's' : ''} · {selected.type} leave · {formatDate(selected.from_date)} – {formatDate(selected.to_date)}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
              {action === 'approve' ? 'Approval Note' : 'Rejection Reason'}
              {action === 'reject' && <span style={{ color: 'var(--color-danger)', marginLeft: 4 }}>*</span>}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={action === 'approve' ? 'Optional note for the employee…' : 'Explain the reason for rejection…'}
              className="form-input"
              style={{ resize: 'vertical', width: '100%' }}
            />
            {action === 'reject' && !comment.trim() && (
              <p style={{ fontSize: 11.5, color: 'var(--color-danger)', margin: '4px 0 0' }}>A reason is required for rejection.</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || (action === 'reject' && !comment.trim())}
              style={{
                flex: 1, padding: '9px 18px', borderRadius: 9, border: 'none',
                background: action === 'approve' ? '#16a34a' : '#dc2626',
                color: '#fff', fontSize: 13.5, fontWeight: 700,
                cursor: saving || (action === 'reject' && !comment.trim()) ? 'not-allowed' : 'pointer',
                opacity: saving || (action === 'reject' && !comment.trim()) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {saving ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                  Processing…
                </>
              ) : action === 'approve' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Approve Leave
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reject Leave
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
