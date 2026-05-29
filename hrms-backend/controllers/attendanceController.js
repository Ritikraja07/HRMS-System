const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getTodayStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { attendance: data }, 'Today status fetched');
  } catch (err) {
    console.error('getTodayStatus error:', err);
    return sendError(res, 'Failed to fetch today status', 500);
  }
};

const punchIn = async (req, res) => {
  try {
    const todayDow = new Date().getDay();
    if (todayDow === 0 || todayDow === 6) {
      return sendError(res, 'Punch-in is not allowed on weekends', 400);
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already punched in today
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing?.punch_in && !existing?.punch_out) {
      return sendError(res, 'Already punched in today', 400);
    }

    let attendance;
    if (existing) {
      let updateData = { status: 'present' };
      
      if (existing.punch_out) {
        // They are returning after punching out early. 
        // Calculate time away and add to break_minutes.
        const timeAwayMs = new Date(now).getTime() - new Date(existing.punch_out).getTime();
        const additionalBreakMinutes = Math.floor(timeAwayMs / 60000);
        updateData.break_minutes = (existing.break_minutes || 0) + additionalBreakMinutes;
        updateData.punch_out = null;
      } else {
        updateData.punch_in = now;
      }

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return sendError(res, error.message, 400);
      attendance = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .insert({ user_id: req.user.id, date: today, punch_in: now, status: 'present' })
        .select()
        .single();
      if (error) return sendError(res, error.message, 400);
      attendance = data;
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emitToUser(req.user.id, 'attendance:punched_in', { attendance });
    }

    return sendSuccess(res, { attendance }, 'Punched in successfully');
  } catch (err) {
    console.error('punchIn error:', err);
    return sendError(res, 'Failed to punch in', 500);
  }
};

const punchOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const { isEarlyLeave } = req.body || {};

    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (!existing?.punch_in) {
      return sendError(res, 'Please punch in first', 400);
    }
    if (existing?.punch_out && !isEarlyLeave) {
      return sendError(res, 'Already punched out today', 400);
    }

    let updateData = {};
    // Auto-end any active break before punching out
    if (existing.on_break_since) {
      const breakMs = new Date(now).getTime() - new Date(existing.on_break_since).getTime();
      updateData.break_minutes = (existing.break_minutes || 0) + Math.max(1, Math.floor(breakMs / 60000));
      updateData.on_break_since = null;
    }
    if (!existing.punch_out) {
      updateData.punch_out = now;
      const totalMs = new Date(now).getTime() - new Date(existing.punch_in).getTime();
      const totalMinutes = Math.floor(totalMs / 60000);
      const breakMinutes = updateData.break_minutes !== undefined ? updateData.break_minutes : (existing.break_minutes || 0);
      updateData.work_minutes = Math.max(0, totalMinutes - breakMinutes);
    }
    if (isEarlyLeave) {
      updateData.status = 'half_day';
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    const io = req.app.get('io');
    if (io) {
      io.emitToUser(req.user.id, 'attendance:punched_out', { attendance: data });
    }

    return sendSuccess(res, { attendance: data }, 'Punched out successfully');
  } catch (err) {
    console.error('punchOut error:', err);
    return sendError(res, 'Failed to punch out', 500);
  }
};

const startBreak = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (!existing?.punch_in) return sendError(res, 'Please punch in first', 400);
    if (existing?.punch_out) return sendError(res, 'Already punched out', 400);
    if (existing?.on_break_since) return sendError(res, 'Already on a break', 400);

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ on_break_since: now })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { attendance: data }, 'Break started');
  } catch (err) {
    return sendError(res, 'Failed to start break', 500);
  }
};

const endBreak = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (!existing) return sendError(res, 'No attendance record found', 404);
    if (!existing.on_break_since) return sendError(res, 'Not on a break', 400);

    const breakMs = new Date(now).getTime() - new Date(existing.on_break_since).getTime();
    const addedMinutes = Math.max(1, Math.floor(breakMs / 60000));
    const totalBreak = (existing.break_minutes || 0) + addedMinutes;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ break_minutes: totalBreak, on_break_since: null })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { attendance: data }, 'Break ended');
  } catch (err) {
    return sendError(res, 'Failed to end break', 500);
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    let startDate, endDate;
    if (month && year) {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    }

    // Build attendance query
    let attQuery = supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false });
    if (startDate && endDate) attQuery = attQuery.gte('date', startDate).lte('date', endDate);

    // Build leave query — fetch approved + pending leaves that overlap this period
    let leaveQuery = supabaseAdmin
      .from('leave_requests')
      .select('id, type, from_date, to_date, status, days, reason')
      .eq('user_id', req.user.id)
      .in('status', ['approved', 'pending']);
    if (startDate && endDate) leaveQuery = leaveQuery.lte('from_date', endDate).gte('to_date', startDate);

    const [{ data, error }, { data: leaveData }] = await Promise.all([attQuery, leaveQuery]);
    if (error) return sendError(res, error.message, 400);

    // Calculate summary
    const present = data.filter(a => a.status === 'present').length;
    const absent = data.filter(a => a.status === 'absent').length;
    const halfDay = data.filter(a => a.status === 'half_day').length;
    const totalWorkMinutes = data.reduce((sum, a) => sum + (a.work_minutes || 0), 0);

    return sendSuccess(res, {
      attendance: data,
      leaves: leaveData || [],
      summary: { present, absent, half_day: halfDay, total: data.length, total_work_minutes: totalWorkMinutes },
    }, 'Attendance fetched');
  } catch (err) {
    console.error('getMyAttendance error:', err);
    return sendError(res, 'Failed to fetch attendance', 500);
  }
};

const getAttendance = async (req, res) => {
  try {
    const { user_id, date, month, year, department } = req.query;
    let query = supabaseAdmin
      .from('attendance')
      .select(`*, user:users!user_id(id, full_name, email, department, role)`)
      .order('date', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (date) query = query.eq('date', date);
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      query = query.gte('date', startDate).lte('date', endDate);
    }
    if (department) {
      const { data: deptUsers } = await supabaseAdmin.from('users').select('id').eq('department', department);
      const deptUserIds = (deptUsers || []).map(u => u.id);
      if (deptUserIds.length === 0) return sendSuccess(res, { attendance: [] }, 'Attendance fetched');
      query = query.in('user_id', deptUserIds);
    }

    const { data, error } = await query.limit(500);
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { attendance: data }, 'Attendance fetched');
  } catch (err) {
    console.error('getAttendance error:', err);
    return sendError(res, 'Failed to fetch attendance', 500);
  }
};

module.exports = { punchIn, punchOut, startBreak, endBreak, getAttendance, getMyAttendance, getTodayStatus };
