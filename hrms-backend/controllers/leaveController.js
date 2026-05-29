const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');
const { validateLeaveRequest } = require('../utils/validators');
const { sendPushNotification } = require('../utils/fcm');

const getLeaveBalance = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const { data, error } = await supabaseAdmin
      .from('leave_balances')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('year', year)
      .maybeSingle();

    // Calculate used leave
    const { data: used } = await supabaseAdmin
      .from('leave_requests')
      .select('type, days')
      .eq('user_id', req.user.id)
      .eq('status', 'approved')
      .gte('from_date', `${year}-01-01`);

    const usedByType = (used || []).reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + parseFloat(l.days);
      return acc;
    }, {});

    return sendSuccess(res, {
      balance: data || { casual_leave: 12, sick_leave: 10, earned_leave: 15 },
      used: usedByType,
    }, 'Leave balance fetched');
  } catch (err) {
    console.error('getLeaveBalance error:', err);
    return sendError(res, 'Failed to fetch leave balance', 500);
  }
};

const getLeaveRequests = async (req, res) => {
  try {
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);
    const { status, user_id } = req.query;

    let query = supabaseAdmin
      .from('leave_requests')
      .select(`*, user:users!user_id(id, full_name, email, department, avatar_url), approver:users!approved_by(id, full_name)`)
      .order('created_at', { ascending: false });

    if (!isManagerOrAdmin) {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { leave_requests: data }, 'Leave requests fetched');
  } catch (err) {
    console.error('getLeaveRequests error:', err);
    return sendError(res, 'Failed to fetch leave requests', 500);
  }
};

const createLeaveRequest = async (req, res) => {
  try {
    const { error: vErr, value } = validateLeaveRequest(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    // Check for overlapping leaves
    const { data: overlap } = await supabaseAdmin
      .from('leave_requests')
      .select('id')
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'approved'])
      .lte('from_date', value.to_date)
      .gte('to_date', value.from_date);

    if (overlap && overlap.length > 0) {
      return sendError(res, 'You have an overlapping leave request', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert({ ...value, user_id: req.user.id })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify managers
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id, fcm_token')
      .in('role', ['manager', 'admin', 'super_admin']);

    for (const manager of managers || []) {
      await supabaseAdmin.from('notifications').insert({
        user_id: manager.id,
        title: 'New Leave Request',
        message: `${req.user.full_name} has submitted a ${value.type} leave request for ${value.days} day(s).`,
        type: 'leave',
        reference_id: data.id,
        reference_type: 'leave_request',
      });
      if (manager.fcm_token) {
        await sendPushNotification(manager.fcm_token, 'New Leave Request', `${req.user.full_name} submitted a leave request.`);
      }
    }

    return sendSuccess(res, { leave_request: data }, 'Leave request submitted', 201);
  } catch (err) {
    console.error('createLeaveRequest error:', err);
    return sendError(res, 'Failed to submit leave request', 500);
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, 'Status must be approved or rejected', 400);
    }

    const { data: existing } = await supabaseAdmin.from('leave_requests').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'Leave request not found', 404);
    if (existing.status !== 'pending') return sendError(res, 'Leave request already processed', 400);

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status,
        approved_by: req.user.id,
        approval_comment: comment || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify employee
    await supabaseAdmin.from('notifications').insert({
      user_id: existing.user_id,
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${existing.type} leave request has been ${status} by ${req.user.full_name}.${comment ? ` Comment: ${comment}` : ''}`,
      type: 'leave',
      reference_id: id,
      reference_type: 'leave_request',
    });

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.emitToUser(existing.user_id, 'notification:new', {
        title: `Leave ${status}`,
        message: `Your leave request has been ${status}.`,
      });
      // Emit leave update for real-time balance update
      io.emitToUser(existing.user_id, 'leave:updated', {
        type: 'balance_update',
        status,
        leave_request: data,
      });
    }

    return sendSuccess(res, { leave_request: data }, `Leave request ${status}`);
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    return sendError(res, 'Failed to update leave request', 500);
  }
};

const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabaseAdmin.from('leave_requests').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'Leave request not found', 404);
    if (existing.user_id !== req.user.id) return sendError(res, 'Access denied', 403);
    if (existing.status !== 'pending') return sendError(res, 'Only pending requests can be cancelled', 400);

    const { error } = await supabaseAdmin
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) return sendError(res, error.message, 400);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emitToUser(req.user.id, 'leave:updated', {
        type: 'leave_cancelled',
        leave_id: id,
      });
    }

    return sendSuccess(res, null, 'Leave request cancelled');
  } catch (err) {
    return sendError(res, 'Failed to cancel leave request', 500);
  }
};

module.exports = { getLeaveRequests, getLeaveBalance, createLeaveRequest, updateLeaveStatus, cancelLeaveRequest };
