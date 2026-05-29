const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const { is_read, type, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) return sendError(res, error.message, 400);

    const unreadCount = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    return sendSuccess(res, {
      notifications: data,
      total: count,
      unread_count: unreadCount.count || 0,
    }, 'Notifications fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch notifications', 500);
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (err) {
    return sendError(res, 'Failed to mark notification', 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    return sendError(res, 'Failed to mark notifications', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Notification deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete notification', 500);
  }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
