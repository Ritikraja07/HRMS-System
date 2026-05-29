const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [usersRes, attendanceRes, tasksRes, leavesRes, payrollRes] = await Promise.all([
      supabaseAdmin.from('users').select('id, role, department, is_active', { count: 'exact' }),
      supabaseAdmin.from('attendance').select('id, status', { count: 'exact' }).eq('date', today),
      supabaseAdmin.from('tasks').select('id, status', { count: 'exact' }),
      supabaseAdmin.from('leave_requests').select('id, status', { count: 'exact' }).eq('status', 'pending'),
      supabaseAdmin.from('payslips').select('net_salary').like('month', `${currentMonth}%`).eq('status', 'published'),
    ]);

    const users = usersRes.data || [];
    const attendance = attendanceRes.data || [];
    const tasks = tasksRes.data || [];

    // Department breakdown
    const deptBreakdown = users.reduce((acc, u) => {
      if (u.department) acc[u.department] = (acc[u.department] || 0) + 1;
      return acc;
    }, {});

    // Role breakdown
    const roleBreakdown = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const totalPayroll = (payrollRes.data || []).reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);

    return sendSuccess(res, {
      stats: {
        total_employees: usersRes.count || 0,
        active_employees: users.filter(u => u.is_active).length,
        present_today: attendance.filter(a => a.status === 'present').length,
        absent_today: attendance.filter(a => a.status === 'absent').length,
        total_tasks: tasksRes.count || 0,
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        pending_leaves: leavesRes.count || 0,
        total_payroll: totalPayroll,
      },
      department_breakdown: deptBreakdown,
      role_breakdown: roleBreakdown,
    }, 'Dashboard stats fetched');
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return sendError(res, 'Failed to fetch dashboard stats', 500);
  }
};

const createEmployee = async (req, res) => {
  try {
    const { email, password, full_name, phone, department, designation, role = 'employee' } = req.body;

    if (!email || !password || !full_name) {
      return sendError(res, 'email, password, and full_name are required', 400);
    }

    if (!['employee', 'manager', 'admin', 'super_admin'].includes(role)) {
      return sendError(res, 'Invalid role', 400);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    });

    if (authError) return sendError(res, authError.message, 400);

    // Create user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name,
        phone: phone || null,
        department: department || null,
        designation: designation || null,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return sendError(res, userError.message, 400);
    }

    // Create leave balance for new year
    const year = new Date().getFullYear();
    await supabaseAdmin.from('leave_balances').insert({
      user_id: user.id,
      year,
      casual_leave: 12,
      sick_leave: 10,
      earned_leave: 15,
    });

    return sendSuccess(res, { user }, 'Employee created successfully', 201);
  } catch (err) {
    console.error('createEmployee error:', err);
    return sendError(res, 'Failed to create employee', 500);
  }
};

const getReports = async (req, res) => {
  try {
    const { type, period = 'month' } = req.query;
    const now = new Date();
    let startDate = new Date();

    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth(), 1);
    else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else if (period === 'year') startDate.setMonth(0, 1);
    
    startDate.setHours(0, 0, 0, 0);
    const startStr = startDate.toISOString().split('T')[0];

    let stats = {};
    let breakdown = [];

    if (type === 'attendance') {
      const { data } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .gte('date', startStr)
        .order('date');

      const total = data?.length || 0;
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const avgMins = total > 0 ? data.reduce((sum, a) => sum + (a.work_minutes || 0), 0) / total : 0;

      stats = { total_records: total, present_count: present, absent_count: absent, avg_work_minutes: avgMins };
      
      // Daily breakdown
      const daily = (data || []).reduce((acc, a) => {
        acc[a.date] = (acc[a.date] || 0) + 1;
        return acc;
      }, {});
      breakdown = Object.entries(daily).map(([date, count]) => ({ label: date, value: count }));
    } 
    else if (type === 'payroll') {
      const { data } = await supabaseAdmin
        .from('payslips')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'published');

      const totalGross = (data || []).reduce((sum, p) => sum + parseFloat(p.gross_salary || 0), 0);
      const totalNet = (data || []).reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
      const totalDed = (data || []).reduce((sum, p) => sum + parseFloat(p.total_deductions || 0), 0);

      stats = { total_payslips: data?.length || 0, total_gross: totalGross, total_net: totalNet, total_deductions: totalDed };
      
      // Monthly breakdown
      const monthly = (data || []).reduce((acc, p) => {
        const m = p.month;
        acc[m] = (acc[m] || 0) + parseFloat(p.net_salary || 0);
        return acc;
      }, {});
      breakdown = Object.entries(monthly).map(([month, val]) => ({ label: month, value: val }));
    }
    else if (type === 'tasks') {
      const { data } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'completed').length || 0;
      const inProgress = data?.filter(t => t.status === 'in_progress').length || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      stats = { total_tasks: total, completed_tasks: completed, in_progress_tasks: inProgress, completion_rate: rate };
      
      // Status breakdown
      const byStatus = (data || []).reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      breakdown = Object.entries(byStatus).map(([status, count]) => ({ label: status, value: count }));
    }

    return sendSuccess(res, { stats, breakdown }, 'Report data fetched');
  } catch (err) {
    console.error('getReports error:', err);
    return sendError(res, 'Failed to fetch report', 500);
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return sendError(res, 'You cannot delete your own account', 400);
    }

    // Get the user to find their auth_id
    const { data: target, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, full_name, role')
      .eq('id', id)
      .single();

    if (fetchErr || !target) return sendError(res, 'User not found', 404);

    // Only super_admin can delete other admins/super_admins
    if (['admin', 'super_admin'].includes(target.role) && req.user.role !== 'super_admin') {
      return sendError(res, 'Only super admins can remove admin accounts', 403);
    }

    // Delete from users table first (cascades or cleans references)
    const { error: dbErr } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (dbErr) return sendError(res, dbErr.message, 400);

    // Delete from Supabase auth
    if (target.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(target.auth_id);
    }

    return sendSuccess(res, { id }, `User "${target.full_name}" removed successfully`);
  } catch (err) {
    console.error('deleteEmployee error:', err);
    return sendError(res, 'Failed to delete user', 500);
  }
};

module.exports = { getDashboardStats, createEmployee, getReports, deleteEmployee };
