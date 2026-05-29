'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../components/ui/AppLayout';
import api from '../../lib/axios';
import { formatTime, formatDuration } from '../../utils/formatters';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const LEAVE_LABELS = {
  casual: 'Casual',
  casual_leave: 'Casual',
  sick: 'Sick',
  sick_leave: 'Sick',
  earned: 'Earned',
  earned_leave: 'Earned',
  annual: 'Annual',
  maternity: 'Maternity',
  paternity: 'Paternity',
  unpaid: 'Unpaid',
};

// Resolve the display status for a single calendar day
function resolveDayStatus(dateStr, dayOfWeek, today, attMap, leaves) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun=0, Sat=6
  if (isWeekend) return { type: 'weekend' };

  const att = attMap[dateStr];
  if (att) return { type: att.status, att };

  const isFuture = dateStr > today;
  if (isFuture) return { type: 'future' };

  // Past weekday with no attendance record — check leaves
  const leave = leaves.find(l => dateStr >= l.from_date && dateStr <= l.to_date);
  if (leave) {
    return { type: leave.status === 'approved' ? 'leave' : 'leave_pending', leave };
  }

  if (dateStr === today) return { type: 'today_no_punch' };

  return { type: 'absent' };
}

const STATUS_STYLE = {
  weekend:       { bg: 'var(--color-bg-subtle)',  color: 'var(--color-text-light)', border: 'var(--color-border)',    dot: 'var(--color-text-light)' },
  future:        { bg: 'transparent',              color: 'var(--color-text-light)', border: 'transparent',           dot: 'transparent' },
  present:       { bg: 'var(--color-success-bg)',  color: 'var(--color-success)',    border: 'var(--color-success-border)', dot: 'var(--color-success)' },
  absent:        { bg: 'var(--color-danger-bg)',   color: 'var(--color-danger)',     border: 'var(--color-danger-border)',  dot: 'var(--color-danger)' },
  half_day:      { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning)',    border: 'var(--color-warning-border)', dot: 'var(--color-warning)' },
  leave:         { bg: 'var(--color-purple-bg)',   color: 'var(--color-purple)',     border: 'var(--color-purple-border)',  dot: 'var(--color-purple)' },
  leave_pending: { bg: 'var(--color-orange-bg)',   color: 'var(--color-orange)',     border: 'var(--color-orange-border)',  dot: 'var(--color-orange)' },
  today_no_punch:{ bg: 'var(--color-primary)',     color: '#fff',                    border: 'var(--color-primary)',  dot: '#fff' },
};

function pad(n) { return String(n).padStart(2, '0'); }

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    api.get(`/api/attendance/my?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`)
      .then(res => {
        if (res.data.success) {
          setAttendance(res.data.data.attendance || []);
          setLeaves(res.data.data.leaves || []);
          setSummary(res.data.data.summary || {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentDate]);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: JS getDay() is Sun=0..Sat=6 → convert to Mon=0..Sun=6
  const firstDayOffset = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const today = new Date().toISOString().split('T')[0];

  const attMap = useMemo(() => attendance.reduce((m, a) => { m[a.date] = a; return m; }, {}), [attendance]);

  // Precompute each day's resolved status
  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const jsDay = new Date(dateStr + 'T12:00:00').getDay(); // Sun=0, Sat=6 — noon avoids UTC midnight timezone shift
      const resolved = resolveDayStatus(dateStr, jsDay, today, attMap, leaves);
      return { day, dateStr, jsDay, resolved };
    });
  }, [daysInMonth, year, month, today, attMap, leaves]);

  // Enterprise summary metrics
  const metrics = useMemo(() => {
    // Working days elapsed so far this month (weekdays up to today)
    let workingDays = 0, leaveDaysInMonth = 0;
    calendarDays.forEach(({ dateStr, jsDay, resolved }) => {
      const isWeekday = jsDay !== 0 && jsDay !== 6;
      if (!isWeekday || dateStr > today) return;
      workingDays++;
      if (resolved.type === 'leave') leaveDaysInMonth += 1;
    });

    const present   = summary.present   || 0;
    const halfDay   = summary.half_day  || 0;

    // Compute total work minutes with fallback for records missing work_minutes (old data)
    const totalMins = attendance.reduce((sum, a) => {
      const wm = a.work_minutes || (a.punch_in && a.punch_out
        ? Math.max(0, Math.floor((new Date(a.punch_out).getTime() - new Date(a.punch_in).getTime()) / 60000) - (a.break_minutes || 0))
        : 0);
      return sum + wm;
    }, 0);

    const absentDays = Math.max(0, workingDays - present - halfDay - leaveDaysInMonth);
    const effectiveAttended = present + halfDay * 0.5;
    const attendanceRate = workingDays > 0 ? Math.round((effectiveAttended / workingDays) * 100) : 0;
    const avgMins = present > 0 ? Math.round(totalMins / present) : 0;

    return { workingDays, present, halfDay, leaveDaysInMonth, absentDays, attendanceRate, totalMins, avgMins };
  }, [calendarDays, summary, attendance, today]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <AppLayout title="My Attendance">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* ── Calendar ── */}
        <div className="card-padded">

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={prevMonth} className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>← Prev</button>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                {MONTHS[month]} {year}
              </h3>
              {isCurrentMonth && (
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Month</span>
              )}
            </div>
            <button onClick={nextMonth} className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>Next →</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
            {DAY_HEADERS.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: i >= 5 ? 'var(--color-text-light)' : 'var(--color-text-muted)',
                padding: '6px 0', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading attendance...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`gap-${i}`} />)}

              {calendarDays.map(({ day, dateStr, jsDay, resolved }) => {
                const { type, att, leave } = resolved;
                const st = STATUS_STYLE[type] || STATUS_STYLE.future;
                const isSelected = selectedDay?.dateStr === dateStr;
                const isToday = dateStr === today;
                const isWeekend = jsDay === 0 || jsDay === 6;
                const isSat = jsDay === 6;
                const isSun = jsDay === 0;

                // Sub-label
                let subLabel = '';
                if (type === 'weekend') subLabel = isSat ? 'Sat' : 'Sun';
                else if (type === 'present') {
                  const wm = att?.work_minutes || (att?.punch_in && att?.punch_out
                    ? Math.max(0, Math.floor((new Date(att.punch_out) - new Date(att.punch_in)) / 60000) - (att.break_minutes || 0))
                    : 0);
                  if (wm) subLabel = `${Math.floor(wm / 60)}h ${wm % 60}m`;
                }
                else if (type === 'half_day') subLabel = 'Half';
                else if (type === 'absent') subLabel = 'Absent';
                else if (type === 'leave') subLabel = LEAVE_LABELS[leave?.type] || 'Leave';
                else if (type === 'leave_pending') subLabel = 'Pending';
                else if (type === 'today_no_punch') subLabel = 'Today';

                // Tooltip
                let tooltip = '';
                if (att) tooltip = `${att.status} · In: ${formatTime(att.punch_in)}${att.punch_out ? ` · Out: ${formatTime(att.punch_out)}` : ''}`;
                else if (leave) tooltip = `${leave.status === 'approved' ? 'Approved' : 'Pending'} ${LEAVE_LABELS[leave.type] || ''} Leave`;
                else if (type === 'weekend') tooltip = 'Weekend – Off';

                return (
                  <div
                    key={dateStr}
                    title={tooltip}
                    onClick={() => !isWeekend && type !== 'future' && setSelectedDay(isSelected ? null : { dateStr, resolved })}
                    style={{
                      height: 68, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 3,
                      borderRadius: 10, cursor: (!isWeekend && type !== 'future') ? 'pointer' : 'default',
                      background: st.bg,
                      border: `1.5px solid ${isSelected ? 'var(--color-primary)' : st.border}`,
                      boxShadow: isSelected ? '0 0 0 2px var(--color-primary-light)' : 'none',
                      transition: 'border-color .15s, box-shadow .15s',
                      opacity: type === 'future' ? 0.35 : 1,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: type === 'today_no_punch' ? 800 : 600, color: st.color, lineHeight: 1 }}>
                      {day}
                    </span>
                    {subLabel && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
                        textTransform: 'uppercase', color: st.color, opacity: type === 'weekend' ? 0.7 : 1,
                      }}>
                        {subLabel}
                      </span>
                    )}
                    {/* Status dot for present/half_day */}
                    {(type === 'present' || type === 'half_day') && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            {[
              { dot: 'var(--color-success)', label: 'Present' },
              { dot: 'var(--color-danger)',  label: 'Absent' },
              { dot: 'var(--color-warning)', label: 'Half Day' },
              { dot: 'var(--color-purple)',  label: 'On Leave' },
              { dot: 'var(--color-orange)',  label: 'Leave Pending' },
              { dot: 'var(--color-text-light)', label: 'Weekend Off' },
              { dot: 'var(--color-primary)', label: 'Today', solid: true },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: l.solid ? 12 : 10, height: l.solid ? 12 : 10,
                  borderRadius: l.solid ? 3 : '50%', background: l.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Day Detail */}
          {selectedDay && (() => {
            const { type, att, leave } = selectedDay.resolved;
            const st = STATUS_STYLE[type] || STATUS_STYLE.future;
            const statusLabel = {
              present: 'Present', absent: 'Absent', half_day: 'Half Day',
              leave: 'On Leave', leave_pending: 'Leave Pending',
              today_no_punch: 'Not Punched In',
            }[type] || type;

            return (
              <div className="card-padded" style={{ border: `1.5px solid ${st.border}`, background: st.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{selectedDay.dateStr}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: st.dot, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{statusLabel}</span>
                </div>
                {att && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {att.punch_in && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Punch In</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{formatTime(att.punch_in)}</span>
                      </div>
                    )}
                    {att.punch_out && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Punch Out</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{formatTime(att.punch_out)}</span>
                      </div>
                    )}
                    {att.work_minutes > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Duration</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{formatDuration(att.work_minutes)}</span>
                      </div>
                    )}
                    {att.break_minutes > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Break</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{att.break_minutes}m</span>
                      </div>
                    )}
                  </div>
                )}
                {leave && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Type</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{LEAVE_LABELS[leave.type] || leave.type} Leave</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>Duration</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{leave.days} day{leave.days !== 1 ? 's' : ''}</span>
                    </div>
                    {leave.reason && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "{leave.reason}"
                      </p>
                    )}
                  </div>
                )}
                {type === 'today_no_punch' && (
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)' }}>You haven't punched in yet today.</p>
                )}
                {type === 'absent' && (
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)' }}>No punch record and no approved leave for this date.</p>
                )}
              </div>
            );
          })()}

          {/* Monthly Summary */}
          <div className="card-padded">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Monthly Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Working Days',  value: metrics.workingDays,      color: 'var(--color-text)',     bg: 'var(--color-bg-subtle)', suffix: 'days' },
                { label: 'Present',       value: metrics.present,           color: 'var(--color-success)', bg: 'var(--color-success-bg)',  suffix: 'days' },
                { label: 'Half Days',     value: metrics.halfDay,           color: 'var(--color-warning)', bg: 'var(--color-warning-bg)',  suffix: 'days' },
                { label: 'On Leave',      value: metrics.leaveDaysInMonth,  color: 'var(--color-purple)',  bg: 'var(--color-purple-bg)',   suffix: 'days' },
                { label: 'Absent',        value: metrics.absentDays,        color: 'var(--color-danger)',  bg: 'var(--color-danger-bg)',   suffix: 'days' },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px', borderRadius: 8, background: s.bg,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{s.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>
                    {s.value} <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>{s.suffix}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Attendance Rate */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Attendance Rate</span>
                <span style={{
                  fontSize: 16, fontWeight: 800,
                  color: metrics.attendanceRate >= 90 ? 'var(--color-success)' : metrics.attendanceRate >= 75 ? 'var(--color-warning)' : 'var(--color-danger)',
                }}>{metrics.attendanceRate}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 100, background: 'var(--color-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  width: `${metrics.attendanceRate}%`,
                  background: metrics.attendanceRate >= 90 ? 'var(--color-success)' : metrics.attendanceRate >= 75 ? 'var(--color-warning)' : 'var(--color-danger)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                {metrics.attendanceRate >= 90 ? 'Excellent attendance' : metrics.attendanceRate >= 75 ? 'Good — room to improve' : 'Needs attention'}
              </p>
            </div>
          </div>

          {/* Hours Summary */}
          <div className="card-padded">
            <h3 className="section-title" style={{ marginBottom: 14 }}>Hours Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Total Hours',    value: formatDuration(metrics.totalMins) },
                { label: 'Daily Average',  value: formatDuration(metrics.avgMins) },
                { label: 'Expected / Day', value: '8h 00m' },
              ].map(r => (
                <div key={r.label} className="stat-row">
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
