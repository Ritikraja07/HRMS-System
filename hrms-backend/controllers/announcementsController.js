const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getAnnouncements = async (req, res) => {
  try {
    const { type, pinned } = req.query;

    let query = supabaseAdmin
      .from('announcements')
      .select('*, author:users!created_by(id, full_name, avatar_url, designation)')
      .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString().split('T')[0])
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (pinned === 'true') query = query.eq('is_pinned', true);

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { announcements: data }, 'Announcements fetched');
  } catch (err) {
    console.error('getAnnouncements error:', err);
    return sendError(res, 'Failed to fetch announcements', 500);
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type = 'general', is_pinned = false, expires_at } = req.body;

    if (!title?.trim()) return sendError(res, 'Title is required', 400);
    if (!content?.trim()) return sendError(res, 'Content is required', 400);

    const validTypes = ['general', 'policy', 'holiday', 'event', 'urgent'];
    if (!validTypes.includes(type)) return sendError(res, 'Invalid announcement type', 400);

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        type,
        is_pinned,
        expires_at: expires_at || null,
        created_by: req.user.id,
      })
      .select('*, author:users!created_by(id, full_name, avatar_url, designation)')
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify all active users
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('is_active', true)
      .neq('id', req.user.id);

    if (users?.length) {
      const notifs = users.map(u => ({
        user_id: u.id,
        title: type === 'urgent' ? '🚨 Urgent Announcement' : '📢 New Announcement',
        message: title.trim(),
        type: 'general',
        reference_id: data.id,
        reference_type: 'announcement',
      }));
      await supabaseAdmin.from('notifications').insert(notifs);
    }

    return sendSuccess(res, { announcement: data }, 'Announcement created', 201);
  } catch (err) {
    console.error('createAnnouncement error:', err);
    return sendError(res, 'Failed to create announcement', 500);
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, is_pinned, expires_at } = req.body;

    const updates = {};
    if (title !== undefined)      updates.title      = title.trim();
    if (content !== undefined)    updates.content    = content.trim();
    if (type !== undefined)       updates.type       = type;
    if (is_pinned !== undefined)  updates.is_pinned  = is_pinned;
    if (expires_at !== undefined) updates.expires_at = expires_at || null;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select('*, author:users!created_by(id, full_name, avatar_url, designation)')
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { announcement: data }, 'Announcement updated');
  } catch (err) {
    console.error('updateAnnouncement error:', err);
    return sendError(res, 'Failed to update announcement', 500);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id);
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Announcement deleted');
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    return sendError(res, 'Failed to delete announcement', 500);
  }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
