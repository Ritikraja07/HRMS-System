'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { Modal } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/formatters';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../utils/constants';

// ── Config ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:     { label: 'Pending',     color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  in_progress: { label: 'In Progress', color: 'var(--color-info)',    bg: 'var(--color-info-bg)'    },
  completed:   { label: 'Completed',   color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  rejected:    { label: 'Rejected',    color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)'  },
};

const PRIORITY_CFG = {
  low:    { label: 'Low',    color: 'var(--color-text-muted)', bg: 'var(--color-bg-subtle)', border: '#94a3b8' },
  medium: { label: 'Medium', color: 'var(--color-info)',       bg: 'var(--color-info-bg)',   border: '#3b82f6' },
  high:   { label: 'High',   color: '#f97316',                 bg: 'rgba(249,115,22,0.12)',  border: '#f97316' },
  urgent: { label: 'Urgent', color: 'var(--color-danger)',     bg: 'var(--color-danger-bg)', border: '#ef4444' },
};

const statusLabel = s => STATUS_CFG[s]?.label || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function isOverdue(due_date, status) {
  if (!due_date || status === 'completed' || status === 'rejected') return false;
  return due_date.split('T')[0] < new Date().toISOString().split('T')[0];
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user, isManagerOrAdmin } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch ALL tasks — filter client-side so counts are always correct
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/tasks?limit=200');
      if (res.data.success) setAllTasks(res.data.data);
    } catch { toast.error('Failed to fetch tasks'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Client-side filtering — counts always reflect unfiltered totals
  const tasks = useMemo(() => allTasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  }), [allTasks, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    const c = { '': allTasks.length };
    TASK_STATUSES.forEach(s => { c[s] = allTasks.filter(t => t.status === s).length; });
    return c;
  }, [allTasks]);


  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
    setShowModal(true);
  };

  const openEdit = task => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date ? task.due_date.split('T')[0] : '', status: task.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    setSaving(true);
    try {
      if (editTask) {
        await api.put(`/api/tasks/${editTask.id}`, form);
        setAllTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...form } : t));
        toast.success('Task updated');
      } else {
        await api.post('/api/tasks', form);
        fetchTasks();
        toast.success('Task created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
    setSaving(false);
  };

  const handleDelete = async id => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success('Task deleted');
      setAllTasks(prev => prev.filter(t => t.id !== id));
    } catch { toast.error('Failed to delete task'); }
  };

  const handleQuickStatus = async (task, newStatus) => {
    setUpdatingId(task.id);
    try {
      await api.put(`/api/tasks/${task.id}`, { ...task, status: newStatus });
      setAllTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success(`Marked as ${statusLabel(newStatus)}`);
    } catch { toast.error('Failed to update status'); }
    setUpdatingId(null);
  };

  const COLS = '3fr 1fr 1.2fr 110px 130px 96px';

  return (
    <AppLayout title="My Tasks">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>My Tasks</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Track and manage your work items</p>
          </div>
          <button onClick={openCreate} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0,
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '10px 20px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 7px 20px rgba(37,99,235,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
          >
            <PlusIcon /> New Task
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          {/* Status tab bar */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--color-bg-subtle)', padding: 4, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            {[{ key: '', label: 'All' }, ...TASK_STATUSES.map(s => ({ key: s, label: statusLabel(s) }))].map(({ key, label }) => {
              const active = statusFilter === key;
              const cfg = key ? STATUS_CFG[key] : null;
              return (
                <button key={key} onClick={() => setStatusFilter(key)} style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? 'var(--color-card)' : 'transparent',
                  color: active && cfg ? cfg.color : active ? 'var(--color-text)' : 'var(--color-text-muted)',
                  border: active ? '1px solid var(--color-border)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {label}
                  <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 100,
                    background: active && cfg ? cfg.bg : 'var(--color-border)',
                    color: active && cfg ? cfg.color : 'var(--color-text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}>
                    {counts[key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Priority pill filter */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Priority:</span>
            {[{ key: '', label: 'All' }, ...TASK_PRIORITIES.map(p => ({ key: p, label: PRIORITY_CFG[p]?.label || p }))].map(({ key, label }) => {
              const active = priorityFilter === key;
              const cfg = key ? PRIORITY_CFG[key] : null;
              return (
                <button key={key} onClick={() => setPriorityFilter(key)} style={{
                  padding: '5px 13px', borderRadius: 100, fontSize: 12.5, fontWeight: active ? 700 : 500,
                  background: active && cfg ? cfg.bg : active ? 'var(--color-primary-light)' : 'transparent',
                  color: active && cfg ? cfg.color : active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: `1.5px solid ${active && cfg ? cfg.border : active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Task Table ── */}
        <div style={{ background: 'var(--color-card)', borderRadius: 16, border: '1px solid var(--color-border)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

          {loading ? (
            <TaskSkeleton cols={COLS} />
          ) : tasks.length === 0 ? (
            <EmptyState
              hasFilters={!!statusFilter || !!priorityFilter}
              onAction={openCreate}
              onClear={() => { setStatusFilter(''); setPriorityFilter(''); }}
            />
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '10px 20px', borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg-hover)', borderLeft: '3px solid transparent' }}>
                {['Task', 'Project', 'Due Date', 'Priority', 'Status', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {tasks.map((task, i) => {
                const overdue = isOverdue(task.due_date, task.status);
                const pCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
                const sCfg = STATUS_CFG[task.status] || STATUS_CFG.pending;
                const busy = updatingId === task.id;
                return (
                  <div key={task.id}
                    style={{
                      display: 'grid', gridTemplateColumns: COLS,
                      alignItems: 'center',
                      padding: '13px 20px',
                      borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                      borderLeft: `3px solid ${pCfg.border}`,
                      background: busy ? 'var(--color-bg-hover)' : 'transparent',
                      transition: 'background 0.15s',
                      opacity: busy ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!busy) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={e => { if (!busy) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Title + description */}
                    <div style={{ paddingRight: 16, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontWeight: 600, fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.35,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        opacity: task.status === 'completed' ? 0.55 : 1,
                      }}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Project */}
                    <div>
                      {task.project?.name
                        ? <span style={{ fontSize: 12, background: 'var(--color-bg-subtle)', color: 'var(--color-text-muted)', padding: '3px 9px', borderRadius: 6, fontWeight: 500, display: 'inline-block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.project.name}</span>
                        : <span style={{ color: 'var(--color-text-light)', fontSize: 13 }}>—</span>
                      }
                    </div>

                    {/* Due date */}
                    <div>
                      {task.due_date ? (
                        <div>
                          <span style={{ fontSize: 13, fontWeight: overdue ? 700 : 500, color: overdue ? 'var(--color-danger)' : 'var(--color-text)', display: 'block' }}>
                            {formatDate(task.due_date)}
                          </span>
                          {overdue && (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '1px 7px', borderRadius: 100, display: 'inline-block', marginTop: 3 }}>
                              Overdue
                            </span>
                          )}
                        </div>
                      ) : <span style={{ color: 'var(--color-text-light)', fontSize: 13 }}>—</span>}
                    </div>

                    {/* Priority */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: pCfg.bg, color: pCfg.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: pCfg.color, flexShrink: 0 }} />
                        {pCfg.label}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: sCfg.bg, color: sCfg.color }}>
                        {sCfg.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {task.status !== 'completed' && task.status !== 'rejected' && (
                        <ActionBtn title="Mark Complete" onClick={() => handleQuickStatus(task, 'completed')} disabled={busy} color="var(--color-success)" hoverBg="var(--color-success-bg)" icon={<CheckIcon />} />
                      )}
                      <ActionBtn title="Edit" onClick={() => openEdit(task)} disabled={busy} color="var(--color-primary)" hoverBg="var(--color-primary-light)" icon={<EditIcon />} />
                      {(isManagerOrAdmin || task.assigned_by === user?.id) && (
                        <ActionBtn title="Delete" onClick={() => handleDelete(task.id)} disabled={busy} color="var(--color-danger)" hoverBg="var(--color-danger-bg)" icon={<TrashIcon />} />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTask ? 'Edit Task' : 'Create New Task'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="form-label">Task Title <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Review Q2 performance report" autoFocus />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what needs to be done..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {TASK_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p]?.label || p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {TASK_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ActionBtn({ title, onClick, disabled, color, hoverBg, icon }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = color; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-light)'; }}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 7, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: 'transparent', color: 'var(--color-text-light)',
        transition: 'background 0.15s, color 0.15s', opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon}
    </button>
  );
}

function TaskSkeleton({ cols }) {
  return (
    <div>
      <style>{`
        @keyframes tsk { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        .tsk{background:linear-gradient(90deg,var(--color-bg-subtle) 25%,var(--color-border) 50%,var(--color-bg-subtle) 75%);background-size:300% 100%;animation:tsk 1.4s infinite;border-radius:6px}
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '10px 20px', borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg-hover)', borderLeft: '3px solid transparent' }}>
        {['Task', 'Project', 'Due Date', 'Priority', 'Status', ''].map((h, i) => (
          <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
        ))}
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', padding: '14px 20px', borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none', borderLeft: '3px solid var(--color-border)', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingRight: 16 }}>
            <div className="tsk" style={{ height: 13, width: '65%' }} />
            <div className="tsk" style={{ height: 10, width: '42%' }} />
          </div>
          <div><div className="tsk" style={{ height: 22, width: 80, borderRadius: 7 }} /></div>
          <div><div className="tsk" style={{ height: 13, width: 72 }} /></div>
          <div><div className="tsk" style={{ height: 22, width: 72, borderRadius: 100 }} /></div>
          <div><div className="tsk" style={{ height: 22, width: 90, borderRadius: 100 }} /></div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            <div className="tsk" style={{ width: 30, height: 30, borderRadius: 7 }} />
            <div className="tsk" style={{ width: 30, height: 30, borderRadius: 7 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onAction, onClear }) {
  return (
    <div style={{ padding: '72px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M9 12l2 2 4-4" /><path d="M9 7h6M9 17h3" />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
          {hasFilters ? 'No matching tasks' : 'No tasks yet'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
          {hasFilters ? 'Try adjusting your filters to see more results.' : 'Create your first task to get started.'}
        </p>
      </div>
      {hasFilters
        ? <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClear}>Clear filters</button>
        : <button className="btn-primary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 }} onClick={onAction}><PlusIcon /> Create Task</button>
      }
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function PlusIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>; }
function EditIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
