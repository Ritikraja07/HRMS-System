const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const getMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is a member
    const isManagerOrAdmin = ['manager', 'admin'].includes(req.user.role);
    if (!isManagerOrAdmin) {
      const { data: membership } = await supabaseAdmin
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (!membership) return sendError(res, 'Access denied', 403);
    }

    const { data, error, count } = await supabaseAdmin
      .from('messages')
      .select(`*, sender:users!sender_id(id, full_name, avatar_url, role)`, { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, {
      messages: data.reverse(),
      total: count,
      page: parseInt(page),
    }, 'Messages fetched');
  } catch (err) {
    console.error('getMessages error:', err);
    return sendError(res, 'Failed to fetch messages', 500);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, file_url, file_name, file_type, message_type = 'text' } = req.body;

    if (!content && !file_url) {
      return sendError(res, 'Message content or file required', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: req.user.id,
        content,
        file_url,
        file_name,
        file_type,
        message_type,
      })
      .select(`*, sender:users!sender_id(id, full_name, avatar_url, role)`)
      .single();

    if (error) return sendError(res, error.message, 400);

    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      io.emitToProject(projectId, 'message:new', data);
    }

    return sendSuccess(res, { message: data }, 'Message sent', 201);
  } catch (err) {
    console.error('sendMessage error:', err);
    return sendError(res, 'Failed to send message', 500);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { data: msg } = await supabaseAdmin.from('messages').select('*').eq('id', messageId).single();
    if (!msg) return sendError(res, 'Message not found', 404);

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && msg.sender_id !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    const { error } = await supabaseAdmin.from('messages').delete().eq('id', messageId);
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, null, 'Message deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete message', 500);
  }
};

const uploadFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { file_base64, file_name, file_type } = req.body;

    if (!file_base64 || !file_name) return sendError(res, 'File data required', 400);

    const buffer = Buffer.from(file_base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const safeName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `messages/${projectId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('hrms-files')
      .upload(filePath, buffer, { contentType: file_type, upsert: false });

    if (uploadError) return sendError(res, 'Upload failed', 400);

    const { data: signedUrlData } = await supabaseAdmin.storage
      .from('hrms-files')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

    return sendSuccess(res, { file_url: signedUrlData?.signedUrl, file_name }, 'File uploaded');
  } catch (err) {
    console.error('uploadFile error:', err);
    return sendError(res, 'Failed to upload file', 500);
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, uploadFile };
