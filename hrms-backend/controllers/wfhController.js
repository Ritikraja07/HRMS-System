const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');
const { validateWfhRequest } = require('../utils/validators');
const { sendPushNotification } = require('../utils/fcm');

const getWfhRequests = async (req, res) => {
  try {
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);
    const { status, user_id } = req.query;

    let query = supabaseAdmin
      .from('wfh_requests')
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

    return sendSuccess(res, { wfh_requests: data }, 'WFH requests fetched');
  } catch (err) {
    console.error('getWfhRequests error:', err);
    return sendError(res, 'Failed to fetch WFH requests', 500);
  }
};

const createWfhRequest = async (req, res) => {
  try {
    const { error: vErr, value } = validateWfhRequest(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    if (new Date(value.to_date) < new Date(value.from_date)) {
      return sendError(res, 'End date must be after start date', 400);
    }

    // Check for overlapping pending/approved WFH requests
    const { data: overlap } = await supabaseAdmin
      .from('wfh_requests')
      .select('id')
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'approved'])
      .lte('from_date', value.to_date)
      .gte('to_date', value.from_date);

    if (overlap && overlap.length > 0) {
      return sendError(res, 'You have an overlapping WFH request for these dates', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('wfh_requests')
      .insert({ ...value, user_id: req.user.id })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify managers
    const { data: managers } = await supabaseAdmin
      .from('users')
      .select('id, fcm_token')
      .in('role', ['manager', 'admin', 'super_admin']);

    const days = Math.max(1, Math.floor((new Date(value.to_date) - new Date(value.from_date)) / 86400000) + 1);

    for (const manager of managers || []) {
      await supabaseAdmin.from('notifications').insert({
        user_id: manager.id,
        title: 'New WFH Request',
        message: `${req.user.full_name} has submitted a Work From Home request for ${days} day(s).`,
        type: 'leave',
        reference_id: data.id,
        reference_type: 'wfh_request',
      });
      if (manager.fcm_token) {
        await sendPushNotification(manager.fcm_token, 'New WFH Request', `${req.user.full_name} submitted a WFH request.`);
      }
    }

    return sendSuccess(res, { wfh_request: data }, 'WFH request submitted', 201);
  } catch (err) {
    console.error('createWfhRequest error:', err);
    return sendError(res, 'Failed to submit WFH request', 500);
  }
};

const updateWfhStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, 'Status must be approved or rejected', 400);
    }

    const { data: existing } = await supabaseAdmin.from('wfh_requests').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'WFH request not found', 404);
    if (existing.status !== 'pending') return sendError(res, 'WFH request already processed', 400);

    const { data, error } = await supabaseAdmin
      .from('wfh_requests')
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
      title: `WFH Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your Work From Home request has been ${status} by ${req.user.full_name}.${comment ? ` Comment: ${comment}` : ''}`,
      type: 'leave',
      reference_id: id,
      reference_type: 'wfh_request',
    });

    const io = req.app.get('io');
    if (io) {
      io.emitToUser(existing.user_id, 'notification:new', {
        title: `WFH ${status}`,
        message: `Your WFH request has been ${status}.`,
      });
      io.emitToUser(existing.user_id, 'wfh:updated', { type: 'status_update', status, wfh_request: data });
    }

    return sendSuccess(res, { wfh_request: data }, `WFH request ${status}`);
  } catch (err) {
    console.error('updateWfhStatus error:', err);
    return sendError(res, 'Failed to update WFH request', 500);
  }
};

const cancelWfhRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabaseAdmin.from('wfh_requests').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'WFH request not found', 404);
    if (existing.user_id !== req.user.id) return sendError(res, 'Access denied', 403);
    if (existing.status !== 'pending') return sendError(res, 'Only pending requests can be cancelled', 400);

    const { error } = await supabaseAdmin
      .from('wfh_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) return sendError(res, error.message, 400);

    const io = req.app.get('io');
    if (io) {
      io.emitToUser(req.user.id, 'wfh:updated', { type: 'wfh_cancelled', wfh_id: id });
    }

    return sendSuccess(res, null, 'WFH request cancelled');
  } catch (err) {
    return sendError(res, 'Failed to cancel WFH request', 500);
  }
};

module.exports = { getWfhRequests, createWfhRequest, updateWfhStatus, cancelWfhRequest };
