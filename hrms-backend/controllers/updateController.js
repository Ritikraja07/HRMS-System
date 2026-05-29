// updateController.js
const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');
const { validateDailyUpdate } = require('../utils/validators');

const getUpdates = async (req, res) => {
  try {
    const isManagerOrAdmin = ['manager', 'admin'].includes(req.user.role);
    const { user_id, date } = req.query;

    let query = supabaseAdmin
      .from('daily_updates')
      .select(`*, user:users!user_id(id, full_name, avatar_url, department)`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!isManagerOrAdmin) {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (date) query = query.eq('date', date);
    else query = query.limit(50);

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { updates: data }, 'Updates fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch updates', 500);
  }
};

const createUpdate = async (req, res) => {
  try {
    const { error: vErr, value } = validateDailyUpdate(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    const today = value.date || new Date().toISOString().split('T')[0];

    // Check if already submitted today
    const { data: existing } = await supabaseAdmin
      .from('daily_updates')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('daily_updates')
        .update({ ...value, date: today })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return sendError(res, error.message, 400);
      return sendSuccess(res, { update: data }, 'Daily update saved');
    }

    const { data, error } = await supabaseAdmin
      .from('daily_updates')
      .insert({ ...value, user_id: req.user.id, date: today })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { update: data }, 'Daily update submitted', 201);
  } catch (err) {
    return sendError(res, 'Failed to submit update', 500);
  }
};

const updateUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { error: vErr, value } = validateDailyUpdate(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    const { data: existing } = await supabaseAdmin.from('daily_updates').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'Update not found', 404);
    if (existing.user_id !== req.user.id) return sendError(res, 'Access denied', 403);

    const { data, error } = await supabaseAdmin
      .from('daily_updates').update(value).eq('id', id).select().single();
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { update: data }, 'Update modified');
  } catch (err) {
    return sendError(res, 'Failed to update', 500);
  }
};

module.exports = { getUpdates, createUpdate, updateUpdate };
