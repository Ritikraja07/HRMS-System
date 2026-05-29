'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/ui/AppLayout';
import { Modal } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { PROJECT_STATUSES } from '../../utils/constants';

// ── Config ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active:    { label: 'Active',    color: 'var(--color-success)', bg: 'var(--color-success-bg)', hex: '#22c55e', gradient: 'linear-gradient(145deg, var(--color-success-bg) 0%, var(--color-card) 65%)' },
  completed: { label: 'Completed', color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    hex: '#3b82f6', gradient: 'linear-gradient(145deg, var(--color-info-bg) 0%, var(--color-card) 65%)'    },
  on_hold:   { label: 'On Hold',   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', hex: '#f59e0b', gradient: 'linear-gradient(145deg, var(--color-warning-bg) 0%, var(--color-card) 65%)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  hex: '#ef4444', gradient: 'linear-gradient(145deg, var(--color-danger-bg) 0%, var(--color-card) 65%)'  },
};

const PROJECT_COLORS = [
  { bg: 'var(--color-info-bg)',           color: 'var(--color-info)'    },
  { bg: 'rgba(168,85,247,0.12)',          color: '#a855f7'               },
  { bg: 'rgba(249,115,22,0.12)',          color: '#f97316'               },
  { bg: 'rgba(236,72,153,0.12)',          color: '#ec4899'               },
  { bg: 'var(--color-success-bg)',        color: 'var(--color-success)'  },
  { bg: 'rgba(20,184,166,0.12)',          color: '#14b8a6'               },
];

const projectColor = name => PROJECT_COLORS[(name?.charCodeAt(0) || 0) % PROJECT_COLORS.length];

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { isManagerOrAdmin } = useAuth();
  const [projects, setProjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editProject, setEditProject]     = useState(null);
  const [managingProject, setManagingProject] = useState(null);
  const [form, setForm]                   = useState({ name: '', description: '', status: 'active' });
  const [saving, setSaving]               = useState(false);
  const [allUsers, setAllUsers]           = useState([]);
  const [memberSearch, setMemberSearch]   = useState('');
  const [addingMember, setAddingMember]   = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [createMemberSearch, setCreateMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds]   = useState([]);

  const fetchProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/projects');
      if (res.data.success) setProjects(res.data.data.projects);
    } catch { if (!silent) toast.error('Failed to fetch projects'); }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Real-time: poll every 30 s while tab is visible
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchProjects(true);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchProjects]);

  const filtered = useMemo(() =>
    statusFilter ? projects.filter(p => p.status === statusFilter) : projects,
    [projects, statusFilter]);

  const counts = useMemo(() => {
    const c = { '': projects.length };
    PROJECT_STATUSES.forEach(s => { c[s.value] = projects.filter(p => p.status === s.value).length; });
    return c;
  }, [projects]);

  // ── CRUD ──
  const openCreate = async () => {
    setEditProject(null);
    setForm({ name: '', description: '', status: 'active' });
    setSelectedMemberIds([]);
    setCreateMemberSearch('');
    setShowModal(true);
    try {
      const res = await api.get('/api/users?limit=200');
      if (res.data.success) setAllUsers(res.data.data || []);
    } catch {}
  };

  const openEdit = project => {
    setEditProject(project);
    setForm({ name: project.name, description: project.description || '', status: project.status });
    setShowModal(true);
  };

  const openManageMembers = async project => {
    setManagingProject(project);
    setMemberSearch('');
    setAllUsers([]);
    setShowMembersModal(true);
    try {
      const res = await api.get('/api/users?limit=200');
      if (res.data.success) setAllUsers(res.data.data || []);
    } catch { toast.error('Failed to fetch users'); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      if (editProject) {
        await api.put(`/api/projects/${editProject.id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/api/projects', { ...form, member_ids: selectedMemberIds });
        toast.success('Project created!');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save project'); }
    setSaving(false);
  };

  const toggleCreateMember = userId =>
    setSelectedMemberIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);

  const handleAddMember = async userId => {
    setAddingMember(userId);
    try {
      await api.post(`/api/projects/${managingProject.id}/members`, { user_id: userId, role: 'member' });
      toast.success('Member added!');
      const res = await api.get('/api/projects');
      if (res.data.success) {
        setProjects(res.data.data.projects);
        const updated = res.data.data.projects.find(p => p.id === managingProject.id);
        if (updated) setManagingProject(updated);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
    setAddingMember(null);
  };

  const handleRemoveMember = async userId => {
    setRemovingMember(userId);
    try {
      await api.delete(`/api/projects/${managingProject.id}/members/${userId}`);
      toast.success('Member removed');
      const res = await api.get('/api/projects');
      if (res.data.success) {
        setProjects(res.data.data.projects);
        const updated = res.data.data.projects.find(p => p.id === managingProject.id);
        if (updated) setManagingProject(updated);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove member'); }
    setRemovingMember(null);
  };

  const memberIds = new Set(managingProject?.project_members?.map(m => m.user_id) || []);
  const filteredUsers = allUsers.filter(u =>
    (u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(memberSearch.toLowerCase())) &&
    !memberIds.has(u.id)
  );

  return (
    <AppLayout title="Projects">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Projects</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Track and collaborate on your team's work</p>
          </div>
          {isManagerOrAdmin && (
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
              <PlusIcon /> New Project
            </button>
          )}
        </div>

        {/* ── Status filter tabs ── */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--color-bg-subtle)', padding: 4, borderRadius: 10, border: '1px solid var(--color-border)', width: 'fit-content' }}>
          {[{ key: '', label: 'All Projects' }, ...PROJECT_STATUSES.map(s => ({ key: s.value, label: s.label }))].map(({ key, label }) => {
            const active = statusFilter === key;
            const cfg = key ? STATUS_CFG[key] : null;
            return (
              <button key={key} onClick={() => setStatusFilter(key)} style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: active ? 700 : 500,
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

        {/* ── Project Grid ── */}
        {loading ? (
          <ProjectSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilter={!!statusFilter} onClear={() => setStatusFilter('')} onAction={isManagerOrAdmin ? openCreate : null} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p}
                onEdit={isManagerOrAdmin ? openEdit : null}
                onManageMembers={isManagerOrAdmin ? openManageMembers : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="form-label">Project Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Employee Portal Redesign" autoFocus />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="What is this project about?" style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {PROJECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {!editProject && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Assign Members</span>
                {selectedMemberIds.length > 0 && (
                  <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {selectedMemberIds.length} selected
                  </span>
                )}
              </label>
              <input className="form-input" placeholder="Search by name…" value={createMemberSearch} onChange={e => setCreateMemberSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 10, padding: 8, background: 'var(--color-bg-subtle)' }}>
                {allUsers
                  .filter(u => u.full_name?.toLowerCase().includes(createMemberSearch.toLowerCase()) || u.email?.toLowerCase().includes(createMemberSearch.toLowerCase()))
                  .map(u => {
                    const sel = selectedMemberIds.includes(u.id);
                    return (
                      <div key={u.id} onClick={() => toggleCreateMember(u.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 8, cursor: 'pointer',
                        background: sel ? 'var(--color-primary-light)' : 'var(--color-card)',
                        border: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=3b82f6&color=fff&size=32`}
                          alt={u.full_name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{u.full_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{u.department || u.role}</p>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: sel ? 'var(--color-primary)' : 'transparent', border: `2px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      </div>
                    );
                  })}
                {allUsers.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '12px 0', fontSize: 13 }}>Loading employees…</p>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving…' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Manage Members Modal ── */}
      <Modal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} title={`Members — ${managingProject?.name || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Members ({managingProject?.project_members?.length || 0})
            </p>
            {managingProject?.project_members?.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--color-text-light)', padding: '10px 0' }}>No members yet.</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {managingProject?.project_members?.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-bg-subtle)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                      <img src={m.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.full_name || 'U')}&background=3b82f6&color=fff&size=32`}
                        alt={m.user?.full_name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{m.user?.full_name}</p>
                        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{m.role}</p>
                      </div>
                      {m.role !== 'lead' && (
                        <button onClick={() => handleRemoveMember(m.user_id)} disabled={removingMember === m.user_id}
                          style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: removingMember === m.user_id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                          {removingMember === m.user_id ? '…' : 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Employee</p>
            <input className="form-input" placeholder="Search by name or email…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 220, overflowY: 'auto' }}>
              {filteredUsers.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--color-text-light)', textAlign: 'center', padding: '14px 0' }}>{memberSearch ? 'No employees found.' : 'All employees are already members.'}</p>
                : filteredUsers.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', background: 'var(--color-bg-subtle)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=3b82f6&color=fff&size=32`}
                      alt={u.full_name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{u.full_name}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{u.department || u.role}</p>
                    </div>
                    <button onClick={() => handleAddMember(u.id)} disabled={addingMember === u.id}
                      style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: addingMember === u.id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                      {addingMember === u.id ? '…' : '+ Add'}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>

          <button onClick={() => setShowMembersModal(false)} className="btn-secondary">Done</button>
        </div>
      </Modal>
    </AppLayout>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────

function ProjectCard({ project, onEdit, onManageMembers }) {
  const memberCount = project.project_members?.length || 0;
  const cfg   = STATUS_CFG[project.status] || STATUS_CFG.active;
  const pCol  = projectColor(project.name);

  return (
    <div style={{
      background: cfg.gradient, borderRadius: 18,
      border: '1px solid var(--color-border)', borderTop: `4px solid ${cfg.hex}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24,
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${cfg.hex}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: pCol.bg, color: pCol.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
            {project.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text)', lineHeight: 1.2 }}>{project.name}</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
              {cfg.label}
            </span>
          </div>
        </div>
        {(onEdit || onManageMembers) && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {onManageMembers && <CardBtn title="Manage Members" onClick={() => onManageMembers(project)} icon={<UsersIcon />} />}
            {onEdit && <CardBtn title="Edit Project" onClick={() => onEdit(project)} icon={<EditIcon />} />}
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px', lineHeight: 1.65, minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {project.description || 'No description provided.'}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex' }}>
            {project.project_members?.slice(0, 5).map((m, i) => (
              <img key={m.id}
                src={m.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.full_name || 'U')}&background=3b82f6&color=fff&size=32`}
                alt={m.user?.full_name} title={m.user?.full_name}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--color-card)', marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i, objectFit: 'cover' }}
              />
            ))}
            {memberCount > 5 && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--color-card)', marginLeft: -8, zIndex: 0, background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                +{memberCount - 5}
              </div>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <Link href={`/communication?project=${project.id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12.5, fontWeight: 700, color: cfg.color,
          background: cfg.bg, padding: '5px 12px', borderRadius: 8,
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <ChatIcon /> Chat
        </Link>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function CardBtn({ title, onClick, icon }) {
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-subtle)'; e.currentTarget.style.color = 'var(--color-text)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-light)'; }}
      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-light)', transition: 'background 0.15s, color 0.15s' }}>
      {icon}
    </button>
  );
}

function ProjectSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      <style>{`@keyframes psk{0%{background-position:200% 0}100%{background-position:-200% 0}}.psk{background:linear-gradient(90deg,var(--color-bg-subtle) 25%,var(--color-border) 50%,var(--color-bg-subtle) 75%);background-size:300% 100%;animation:psk 1.4s infinite;border-radius:8px}`}</style>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)', borderTop: '4px solid var(--color-border)', padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="psk" style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="psk" style={{ height: 14, width: '70%' }} />
              <div className="psk" style={{ height: 22, width: 80, borderRadius: 100 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            <div className="psk" style={{ height: 11, width: '92%' }} />
            <div className="psk" style={{ height: 11, width: '65%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex' }}>
              {[0, 1, 2].map(j => <div key={j} className="psk" style={{ width: 28, height: 28, borderRadius: '50%', marginLeft: j ? -8 : 0 }} />)}
            </div>
            <div className="psk" style={{ height: 28, width: 64, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter, onClear, onAction }) {
  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 20, border: '1px solid var(--color-border)', padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FolderIcon size={28} muted />
      </div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
          {hasFilter ? 'No projects match this filter' : 'No projects yet'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
          {hasFilter ? 'Try a different status filter.' : 'Create your first project to get started.'}
        </p>
      </div>
      {hasFilter
        ? <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClear}>Clear filter</button>
        : onAction && <button className="btn-primary" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7 }} onClick={onAction}><PlusIcon /> New Project</button>
      }
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function PlusIcon()              { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>; }
function EditIcon()              { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function UsersIcon()             { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function ChatIcon()              { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function FolderIcon({ size = 18, muted = false }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={muted ? 'var(--color-text-light)' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
