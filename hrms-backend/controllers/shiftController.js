const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getShifts = async (req, res) => {
  try {
    const isManagerOrAdmin = ['manager', 'admin'].includes(req.user.role);
    const { user_id, date_from, date_to } = req.query;

    let query = supabaseAdmin
      .from('shifts')
      .select(`*, user:users!user_id(id, full_name, department, avatar_url), assigner:users!assigned_by(id, full_name)`)
      .order('assigned_date', { ascending: true });

    if (!isManagerOrAdmin) {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (date_from) query = query.gte('assigned_date', date_from);
    if (date_to) query = query.lte('assigned_date', date_to);

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { shifts: data }, 'Shifts fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch shifts', 500);
  }
};

const createShift = async (req, res) => {
  try {
    const { user_id, shift_name, start_time, end_time, assigned_date } = req.body;

    if (!user_id || !shift_name || !start_time || !end_time || !assigned_date) {
      return sendError(res, 'All fields are required', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('shifts')
      .insert({ user_id, shift_name, start_time, end_time, assigned_date, assigned_by: req.user.id })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify user
    await supabaseAdmin.from('notifications').insert({
      user_id,
      title: 'Shift Assigned',
      message: `You have been assigned ${shift_name} on ${assigned_date} (${start_time} - ${end_time}).`,
      type: 'general',
    });

    return sendSuccess(res, { shift: data }, 'Shift created', 201);
  } catch (err) {
    return sendError(res, 'Failed to create shift', 500);
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_name, start_time, end_time, assigned_date } = req.body;

    const { data, error } = await supabaseAdmin
      .from('shifts')
      .update({ shift_name, start_time, end_time, assigned_date })
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { shift: data }, 'Shift updated');
  } catch (err) {
    return sendError(res, 'Failed to update shift', 500);
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('shifts').delete().eq('id', id);
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Shift deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete shift', 500);
  }
};

module.exports = { getShifts, createShift, updateShift, deleteShift };
