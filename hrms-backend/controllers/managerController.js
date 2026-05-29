const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [usersRes, attendanceRes, leaveRes, tasksRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('is_active', true),
      supabaseAdmin.from('attendance')
        .select('id, status, punch_in, punch_out, on_break_since, user:users!user_id(id, full_name, avatar_url, department)')
        .eq('date', today),
      supabaseAdmin.from('leave_requests')
        .select('id, type, days, from_date, to_date, user:users!user_id(id, full_name, avatar_url, department)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabaseAdmin.from('tasks').select('id, status', { count: 'exact' }),
    ]);

    const attendance = attendanceRes.data || [];
    const tasks = tasksRes.data || [];

    const stats = {
      team_size:       usersRes.count || 0,
      present_today:   attendance.filter(a => a.status === 'present').length,
      absent_today:    attendance.filter(a => a.status === 'absent').length,
      on_break:        attendance.filter(a => a.on_break_since && !a.punch_out).length,
      pending_leaves:  (leaveRes.data || []).length,
      active_tasks:    tasks.filter(t => t.status === 'in_progress').length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      total_tasks:     tasksRes.count || 0,
    };

    return sendSuccess(res, {
      stats,
      pending_approvals: leaveRes.data || [],
      team_attendance_today: attendance,
    }, 'Manager dashboard fetched');
  } catch (err) {
    console.error('getDashboard error:', err);
    return sendError(res, 'Failed to fetch dashboard', 500);
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('leave_requests')
      .select(`*, user:users!user_id(id, full_name, email, department, avatar_url)`)
      .order('created_at', { ascending: true });

    if (status) query = query.eq('status', status);

    const { data: leaves, error } = await query;
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { approvals: leaves }, 'Approvals fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch approvals', 500);
  }
};

const getTeam = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, department, designation, role, avatar_url, is_active, phone')
      .in('role', ['employee', 'manager', 'admin', 'super_admin'])
      .eq('is_active', true)
      .order('full_name');

    if (error) return sendError(res, error.message, 400);

    const { data: todayAtt } = await supabaseAdmin
      .from('attendance')
      .select('user_id, status, punch_in, punch_out, on_break_since, break_minutes, work_minutes')
      .eq('date', today);

    const attMap = (todayAtt || []).reduce((acc, a) => { acc[a.user_id] = a; return acc; }, {});

    const team = (users || []).map(u => ({
      ...u,
      today_attendance: attMap[u.id] || null,
    }));

    return sendSuccess(res, { team }, 'Team fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch team', 500);
  }
};

module.exports = { getDashboard, getPendingApprovals, getTeam };
