'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '../../../components/ui/AppLayout';
import api from '../../../lib/axios';
import { formatTime, formatInitials, getAvatarUrl } from '../../../utils/formatters';

const getState = (att) => {
  if (!att?.punch_in) return 'absent';
  if (att.on_break_since && !att.punch_out) return 'on_break';
  if (!att.punch_out) return 'working';
  return 'done';
};

const STATE_META = {
  working:  { label: 'Working',  color: 'var(--color-success)', bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', dot: '#16a34a' },
  on_break: { label: 'On Break', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', dot: '#d97706' },
  done:     { label: 'Done',     color: 'var(--color-primary)', bg: 'var(--color-primary-light)', border: 'var(--color-primary-border)', dot: '#2563eb' },
  absent:   { label: 'Absent',   color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',  border: 'var(--color-danger-border)',  dot: '#dc2626' },
};

function fmtSecs(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function LiveTimer({ att, state }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!att?.punch_in) { setSecs(0); return; }
    const compute = () => {
      const pinMs = new Date(att.punch_in).getTime();
      const endMs = att.punch_out ? new Date(att.punch_out).getTime() : Date.now();
      const completedBreakMs = (att.break_minutes || 0) * 60000;
      const ongoingBreakMs = (att.on_break_since && !att.punch_out)
        ? Date.now() - new Date(att.on_break_since).getTime() : 0;
      setSecs(Math.max(0, Math.floor((endMs - pinMs - completedBreakMs - ongoingBreakMs) / 1000)));
    };
    compute();
    if (state === 'done') return;
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [att, state]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtSecs(secs)}</span>;
}

function BreakTimer({ onBreakSince }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!onBreakSince) { setSecs(0); return; }
    const compute = () => setSecs(Math.floor((Date.now() - new Date(onBreakSince).getTime()) / 1000));
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [onBreakSince]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtSecs(secs)}</span>;
}

function Avatar({ name, url, size = 36, dot }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {url
        ? <img src={url} alt={name} onError={e => { e.target.src = getAvatarUrl(null, name); }}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 700 }}>
            {formatInitials(name)}
          </div>
      }
      {dot && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: dot, border: '2px solid var(--color-card)' }} />}
    </div>
  );
}

function AttRow({ member, idx }) {
  const att = member.today_attendance;
  const state = getState(att);
  const meta = STATE_META[state];
  const evenBg = 'var(--color-card)';
  const oddBg  = 'var(--color-table-stripe)';

  return (
    <tr style={{ background: idx % 2 === 0 ? evenBg : oddBg, transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? evenBg : oddBg}>

      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={member.full_name} url={member.avatar_url} size={36} dot={meta.dot} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{member.full_name}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>{member.designation || member.department || '—'}</p>
            {member.designation && member.department && (
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-light)' }}>{member.department}</p>
            )}
          </div>
        </div>
      </td>

      <td style={{ padding: '13px 18px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, animation: state === 'working' ? 'pulse 2s infinite' : 'none' }} />
          {meta.label}
        </span>
      </td>

      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
        {att?.punch_in ? formatTime(att.punch_in) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
      </td>

      <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
        {att?.punch_out ? formatTime(att.punch_out) : <span style={{ color: 'var(--color-text-light)' }}>—</span>}
      </td>

      <td style={{ padding: '13px 18px' }}>
        {att?.punch_in ? (
          <span style={{ fontSize: 14, fontWeight: 700, color: state === 'working' ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            <LiveTimer att={att} state={state} />
          </span>
        ) : <span style={{ color: 'var(--color-text-light)', fontSize: 13 }}>—</span>}
      </td>

      <td style={{ padding: '13px 18px' }}>
        {state === 'on_break' ? (
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'monospace' }}>
              <BreakTimer onBreakSince={att.on_break_since} />
            </span>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-light)' }}>since {formatTime(att.on_break_since)}</p>
          </div>
        ) : att?.break_minutes > 0 ? (
          <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{att.break_minutes}m total</span>
        ) : (
          <span style={{ color: 'var(--color-text-light)', fontSize: 13 }}>—</span>
        )}
      </td>
    </tr>
  );
}

function TeamCard({ member }) {
  const att = member.today_attendance;
  const state = getState(att);
  const meta = STATE_META[state];

  return (
    <div style={{ background: 'var(--color-card)', borderRadius: 14, border: '1px solid var(--color-border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-card)', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={member.full_name} url={member.avatar_url} size={44} dot={meta.dot} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{member.full_name}</p>
          {member.designation && (
            <p style={{ margin: '1px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{member.designation}</p>
          )}
          <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--color-text-light)' }}>{member.department || 'No department'}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, whiteSpace: 'nowrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot }} />
          {meta.label}
        </span>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Punch In',  value: att?.punch_in  ? formatTime(att.punch_in)  : '—' },
          { label: 'Punch Out', value: att?.punch_out ? formatTime(att.punch_out) : '—' },
          { label: 'Work Time', value: att?.punch_in ? <LiveTimer att={att} state={state} /> : '—' },
          { label: 'Break',     value: att?.break_minutes > 0 ? `${att.break_minutes}m` : '—' },
          { label: 'Role',      value: member.role ? member.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
            <span style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>{r.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: r.label === 'Work Time' ? 'monospace' : 'inherit' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManagerTeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const fetchTeam = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/manager/team');
      if (res.data.success) { setTeam(res.data.data.team); setLastRefresh(new Date()); }
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchTeam();
    intervalRef.current = setInterval(() => fetchTeam(true), 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchTeam]);

  const filtered = team.filter(m =>
    !search ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    working:  team.filter(m => getState(m.today_attendance) === 'working').length,
    on_break: team.filter(m => getState(m.today_attendance) === 'on_break').length,
    done:     team.filter(m => getState(m.today_attendance) === 'done').length,
    absent:   team.filter(m => getState(m.today_attendance) === 'absent').length,
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px 8px 34px',
    border: '1px solid var(--color-border)', borderRadius: 8,
    fontSize: 13.5, color: 'var(--color-text)',
    background: 'var(--color-input-bg)', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <AppLayout title="My Team">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>My Team</h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              {team.length} members · {lastRefresh && <span>refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            </p>
          </div>
          <button onClick={() => fetchTeam()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-card)', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Status KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { key: 'working',  label: 'Working Now', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { key: 'on_break', label: 'On Break',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
            { key: 'done',     label: 'Done Today',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            { key: 'absent',   label: 'Absent',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
          ].map(s => {
            const m = STATE_META[s.key];
            return (
              <div key={s.key} style={{ padding: '16px 18px', borderRadius: 12, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-card)' }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: m.color, lineHeight: 1 }}>{counts[s.key]}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs + Search */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {[
                { key: 'live',   label: 'Live Attendance', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                { key: 'roster', label: 'Team Roster',     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: activeTab === t.key ? 700 : 500, color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)', borderBottom: `2px solid ${activeTab === t.key ? 'var(--color-primary)' : 'transparent'}`, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" style={inputStyle} />
            </div>
          </div>

          {/* Live Attendance Table */}
          {activeTab === 'live' && (
            loading ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary-border)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Loading attendance data…</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-subtle)' }}>
                      {['Employee', 'Status', 'Punch In', 'Punch Out', 'Work Time', 'Break'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: 13 }}>No team members found</td></tr>
                    ) : filtered.map((m, i) => <AttRow key={m.id} member={m} idx={i} />)}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Team Roster Grid */}
          {activeTab === 'roster' && (
            <div style={{ padding: 20 }}>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shimmer" style={{ height: 200, borderRadius: 14 }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-light)' }}>{search ? 'No members match your search' : 'No team members found'}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {filtered.map(m => <TeamCard key={m.id} member={m} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </AppLayout>
  );
}
