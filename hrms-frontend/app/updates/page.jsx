'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

// ── Config ──────────────────────────────────────────────────────────────────

const MOOD_CFG = {
  great: { emoji: '😄', label: 'Great',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', hex: '#22c55e' },
  good:  { emoji: '🙂', label: 'Good',   color: 'var(--color-info)',    bg: 'var(--color-info-bg)',    hex: '#3b82f6' },
  okay:  { emoji: '😐', label: 'Okay',   color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', hex: '#f59e0b' },
  bad:   { emoji: '😔', label: 'Tough',  color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  hex: '#ef4444' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

function computeStreak(myUpdates) {
  const dateset = new Set(myUpdates.map(u => u.date));
  const d = new Date();
  if (!dateset.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (dateset.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function thisWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function UpdatesPage() {
  const { user, isManagerOrAdmin } = useAuth();
  const [updates, setUpdates]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayUpdate, setTodayUpdate] = useState(null);
  const [teamFilter, setTeamFilter] = useState('today');
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ work_done: '', work_planned: '', blockers: '', mood: 'good' });
  const [noBlockers, setNoBlockers] = useState(false);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/updates');
      if (res.data.success) {
        const all = res.data.data.updates;
        setUpdates(all);
        const today = todayStr();
        const mine = all.find(u => u.date === today && u.user_id === user?.id);
        if (mine) {
          setTodayUpdate(mine);
          setForm({ work_done: mine.work_done, work_planned: mine.work_planned || '', blockers: mine.blockers || '', mood: mine.mood || 'good' });
          setNoBlockers(!mine.blockers);
        }
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const handleSubmit = async () => {
    if (!form.work_done.trim() || form.work_done.length < 10) {
      toast.error('Work done must be at least 10 characters');
      return;
    }
    setSubmitting(true);
    const payload = { ...form, blockers: noBlockers ? '' : form.blockers };
    try {
      if (todayUpdate) {
        await api.put(`/api/updates/${todayUpdate.id}`, payload);
        toast.success('Standup updated!');
      } else {
        await api.post('/api/updates', payload);
        toast.success('Standup submitted!');
      }
      fetchUpdates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit update');
    }
    setSubmitting(false);
  };

  // Derived
  const today = todayStr();
  const myUpdates     = useMemo(() => updates.filter(u => u.user_id === user?.id), [updates, user]);
  const teamUpdates   = useMemo(() => updates.filter(u => u.user_id !== user?.id), [updates, user]);
  const streak        = useMemo(() => computeStreak(myUpdates), [myUpdates]);
  const weekStart     = useMemo(() => thisWeekStart(), []);
  const thisWeekCount = useMemo(() => myUpdates.filter(u => new Date(u.date) >= weekStart).length, [myUpdates, weekStart]);
  const thisMonthCount = useMemo(() => myUpdates.filter(u => u.date?.startsWith(new Date().toISOString().slice(0, 7))).length, [myUpdates]);

  const filteredTeam = useMemo(() => {
    if (teamFilter === 'today') return teamUpdates.filter(u => u.date === today);
    if (teamFilter === 'week')  return teamUpdates.filter(u => new Date(u.date) >= weekStart);
    return teamUpdates;
  }, [teamUpdates, teamFilter, today, weekStart]);

  const todayTeamCount = teamUpdates.filter(u => u.date === today).length;
  const mood = MOOD_CFG[form.mood] || MOOD_CFG.good;

  return (
    <AppLayout title="Daily Standup">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Daily Standup</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Share your progress, plans, and blockers with your team
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-bg-subtle)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── Form ── */}
          <div style={{ background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

            {/* Submitted banner */}
            {todayUpdate && (
              <div style={{ padding: '12px 24px', background: 'var(--color-success-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-success)' }}>Standup submitted for today</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>You can edit it any time before end of day.</p>
                </div>
              </div>
            )}

            <div style={{ padding: '28px 28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  {todayUpdate ? 'Edit Today\'s Standup' : 'Submit Standup'}
                </h2>
                {todayUpdate && (
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                    Last updated {formatRelativeTime(todayUpdate.updated_at || todayUpdate.created_at)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Mood picker */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
                    How are you feeling today?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {Object.entries(MOOD_CFG).map(([val, cfg]) => {
                      const active = form.mood === val;
                      return (
                        <button key={val} onClick={() => setForm(f => ({ ...f, mood: val }))} style={{
                          padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          border: `2px solid ${active ? cfg.hex : 'var(--color-border)'}`,
                          background: active ? cfg.bg : 'var(--color-bg-subtle)',
                          transition: 'all 0.15s',
                        }}>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{cfg.emoji}</div>
                          <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? cfg.color : 'var(--color-text-muted)' }}>{cfg.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Work done */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleIcon /> What did you accomplish today?
                      <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11.5, color: form.work_done.length < 10 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                      {form.work_done.length} chars {form.work_done.length < 10 ? `(${10 - form.work_done.length} more needed)` : '✓'}
                    </span>
                  </div>
                  <textarea className="form-input" value={form.work_done}
                    onChange={e => setForm(f => ({ ...f, work_done: e.target.value }))}
                    rows={4} placeholder="• Completed the authentication module&#10;• Reviewed 3 PRs from the team&#10;• Fixed the login timeout bug" style={{ resize: 'vertical', lineHeight: 1.7 }} />
                </div>

                {/* Work planned */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                    <CalendarIcon /> What will you work on tomorrow?
                  </label>
                  <textarea className="form-input" value={form.work_planned}
                    onChange={e => setForm(f => ({ ...f, work_planned: e.target.value }))}
                    rows={3} placeholder="• Start the dashboard analytics feature&#10;• Write unit tests for the new endpoints" style={{ resize: 'vertical', lineHeight: 1.7 }} />
                </div>

                {/* Blockers */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                      <BlockerIcon /> Any blockers?
                    </label>
                    <button onClick={() => { setNoBlockers(v => !v); if (!noBlockers) setForm(f => ({ ...f, blockers: '' })); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, border: `1.5px solid ${noBlockers ? 'var(--color-success)' : 'var(--color-border)'}`,
                        background: noBlockers ? 'var(--color-success-bg)' : 'transparent',
                        color: noBlockers ? 'var(--color-success)' : 'var(--color-text-muted)',
                        transition: 'all 0.15s',
                      }}>
                      {noBlockers ? '✓ No blockers' : 'No blockers today'}
                    </button>
                  </div>
                  {!noBlockers && (
                    <textarea className="form-input" value={form.blockers}
                      onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
                      rows={2} placeholder="Describe any issues blocking your progress..." style={{ resize: 'vertical', lineHeight: 1.7 }} />
                  )}
                  {noBlockers && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--color-success-bg)', border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-success)', fontWeight: 500 }}>
                      Great — no blockers today! 🎉
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting || form.work_done.length < 10} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: form.work_done.length < 10 ? 'var(--color-bg-subtle)' : `linear-gradient(135deg, ${mood.hex}, ${mood.hex}cc)`,
                  color: form.work_done.length < 10 ? 'var(--color-text-muted)' : '#fff',
                  border: 'none', borderRadius: 12, padding: '14px 24px',
                  fontSize: 15, fontWeight: 700, cursor: form.work_done.length < 10 || submitting ? 'not-allowed' : 'pointer',
                  boxShadow: form.work_done.length >= 10 ? `0 4px 16px ${mood.hex}40` : 'none',
                  transition: 'all 0.2s', opacity: submitting ? 0.7 : 1,
                }}>
                  {submitting ? 'Submitting…' : (
                    <>
                      <span style={{ fontSize: 18 }}>{mood.emoji}</span>
                      {todayUpdate ? 'Save Changes' : 'Submit Standup'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status card */}
            <div style={{
              background: todayUpdate
                ? 'linear-gradient(145deg, var(--color-success-bg) 0%, var(--color-card) 70%)'
                : 'linear-gradient(145deg, var(--color-warning-bg) 0%, var(--color-card) 70%)',
              borderRadius: 14, border: '1px solid var(--color-border)',
              borderLeft: `4px solid ${todayUpdate ? MOOD_CFG.great.hex : MOOD_CFG.okay.hex}`,
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }}>{todayUpdate ? '✅' : '📝'}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: todayUpdate ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {todayUpdate ? 'Submitted Today' : 'Not Yet Submitted'}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {todayUpdate ? `${MOOD_CFG[todayUpdate.mood]?.emoji || '🙂'} Feeling ${MOOD_CFG[todayUpdate.mood]?.label || 'good'}` : 'Fill in the form to submit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Streak + Stats */}
            <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              {/* Streak */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: streak > 0 ? 'rgba(249,115,22,0.12)' : 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  🔥
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: streak > 0 ? '#f97316' : 'var(--color-text-muted)', lineHeight: 1 }}>{streak}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Day streak</p>
                </div>
              </div>

              {/* Stats */}
              {[
                { label: "Today's Team",  value: todayTeamCount + (todayUpdate ? 1 : 0), suffix: 'updates' },
                { label: 'My This Week',  value: thisWeekCount,  suffix: 'days' },
                { label: 'My This Month', value: thisMonthCount, suffix: 'days' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{s.value} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-light)' }}>{s.suffix}</span></span>
                </div>
              ))}
            </div>

            {/* My recent updates */}
            {myUpdates.length > 1 && (
              <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>My Recent Standups</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {myUpdates.slice(0, 5).map((u, i) => {
                    if (u.date === today) return null;
                    const m = MOOD_CFG[u.mood] || MOOD_CFG.good;
                    return (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{m.emoji}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{formatDate(u.date)}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.work_done}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Team Standups (manager/admin) ── */}
        {isManagerOrAdmin && (
          <div style={{ background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Section header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Team Standups</p>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                  {filteredTeam.length} update{filteredTeam.length !== 1 ? 's' : ''} • {teamFilter === 'today' ? 'Today' : teamFilter === 'week' ? 'This Week' : 'All Time'}
                </p>
              </div>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 3, background: 'var(--color-bg-subtle)', padding: 4, borderRadius: 9, border: '1px solid var(--color-border)' }}>
                {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'all', label: 'All' }].map(({ key, label }) => (
                  <button key={key} onClick={() => setTeamFilter(key)} style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: teamFilter === key ? 700 : 500,
                    background: teamFilter === key ? 'var(--color-card)' : 'transparent',
                    color: teamFilter === key ? 'var(--color-text)' : 'var(--color-text-muted)',
                    border: teamFilter === key ? '1px solid var(--color-border)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: teamFilter === key ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              <TeamSkeleton />
            ) : filteredTeam.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 10px' }}>📭</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>No standups {teamFilter === 'today' ? 'today' : teamFilter === 'week' ? 'this week' : 'yet'}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Team members haven't submitted their updates yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, padding: 24 }}>
                {filteredTeam.map(u => {
                  const m = MOOD_CFG[u.mood] || MOOD_CFG.good;
                  const expanded = expandedId === u.id;
                  return (
                    <div key={u.id} style={{
                      background: 'var(--color-bg-subtle)', borderRadius: 14,
                      border: '1px solid var(--color-border)', borderLeft: `4px solid ${m.hex}`,
                      overflow: 'hidden', transition: 'box-shadow 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Card header */}
                      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={u.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.user?.full_name || 'U')}&background=3b82f6&color=fff&size=32`}
                          alt={u.user?.full_name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.user?.full_name}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)' }}>{formatDate(u.date)} · {formatRelativeTime(u.created_at)}</p>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: m.bg, color: m.color, flexShrink: 0 }}>
                          {m.emoji} {m.label}
                        </span>
                      </div>

                      {/* Work done */}
                      <div style={{ padding: '0 16px 12px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accomplished</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden' }}>
                          {u.work_done}
                        </p>
                      </div>

                      {/* Expanded details */}
                      {expanded && (
                        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {u.work_planned && (
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tomorrow's Plan</p>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>{u.work_planned}</p>
                            </div>
                          )}
                          {u.blockers && (
                            <div style={{ padding: '10px 12px', background: 'var(--color-danger-bg)', borderRadius: 8, border: '1px solid var(--color-danger-bg)' }}>
                              <p style={{ margin: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Blockers</p>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>{u.blockers}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Toggle */}
                      <button onClick={() => setExpandedId(expanded ? null : u.id)} style={{
                        width: '100%', padding: '9px 16px', background: 'var(--color-bg-hover)',
                        border: 'none', borderTop: '1px solid var(--color-border)',
                        fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'background 0.15s', textAlign: 'center',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                      >
                        {expanded ? '▲ Show less' : '▼ Show more'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, padding: 24 }}>
      <style>{`@keyframes usk{0%{background-position:200% 0}100%{background-position:-200% 0}}.usk{background:linear-gradient(90deg,var(--color-bg-subtle) 25%,var(--color-border) 50%,var(--color-bg-subtle) 75%);background-size:300% 100%;animation:usk 1.4s infinite;border-radius:6px}`}</style>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ background: 'var(--color-bg-subtle)', borderRadius: 14, border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-border)', padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div className="usk" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div className="usk" style={{ height: 13, width: '60%' }} />
              <div className="usk" style={{ height: 10, width: '40%' }} />
            </div>
            <div className="usk" style={{ height: 22, width: 64, borderRadius: 100 }} />
          </div>
          <div className="usk" style={{ height: 10, width: '30%', marginBottom: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="usk" style={{ height: 12, width: '100%' }} />
            <div className="usk" style={{ height: 12, width: '85%' }} />
            <div className="usk" style={{ height: 12, width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function CheckCircleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function CalendarIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function BlockerIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
