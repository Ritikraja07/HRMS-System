const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { validateUser } = require('../utils/validators');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, role, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone, department, designation, role, avatar_url, is_active, created_at', { count: 'exact' });

    if (department) query = query.eq('department', department);
    if (role) query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    query = query.order('full_name', { ascending: true }).range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendPaginated(res, data, count, page, limit, 'Users fetched');
  } catch (err) {
    console.error('getUsers error:', err);
    return sendError(res, 'Failed to fetch users', 500);
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to fetch themselves or managers/admins to fetch any user
    if (req.user.id !== id && req.user.role === 'employee') {
      return sendError(res, 'Access denied', 403);
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone, department, designation, role, avatar_url, is_active, created_at')
      .eq('id', id)
      .single();

    if (error || !user) return sendError(res, 'User not found', 404);

    return sendSuccess(res, { user }, 'User fetched');
  } catch (err) {
    console.error('getUser error:', err);
    return sendError(res, 'Failed to fetch user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to update themselves or admins/super_admins to update any
    if (req.user.id !== id && !['admin', 'super_admin'].includes(req.user.role)) {
      return sendError(res, 'Access denied', 403);
    }

    const { error: validationError, value } = validateUser(req.body);
    if (validationError) return sendError(res, validationError.details[0].message, 422);

    // Admins and super_admins can update role, department, and active status
    const isPrivileged = ['admin', 'super_admin'].includes((req.user.role || '').toLowerCase());
    if (isPrivileged) {
      if (req.body.role) value.role = req.body.role;
      if (req.body.department !== undefined) value.department = req.body.department || null;
      if (typeof req.body.is_active === 'boolean') value.is_active = req.body.is_active;
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(value)
      .eq('id', id)
      .select('id, full_name, email, phone, department, designation, role, avatar_url, is_active')
      .single();

    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { user }, 'User updated successfully');
  } catch (err) {
    console.error('updateUser error:', err);
    return sendError(res, 'Failed to update user', 500);
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar_base64, file_type } = req.body;

    if (req.user.id !== id && !['admin', 'super_admin'].includes(req.user.role)) {
      return sendError(res, 'Access denied', 403);
    }

    if (!avatar_base64) return sendError(res, 'Avatar data required', 400);

    const buffer = Buffer.from(avatar_base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const ext = (file_type || 'image/jpeg').split('/')[1];
    const fileName = `avatars/${id}/avatar.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('hrms-files')
      .upload(fileName, buffer, {
        contentType: file_type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) return sendError(res, 'Failed to upload avatar', 400);

    const { data: urlData } = supabaseAdmin.storage
      .from('hrms-files')
      .getPublicUrl(fileName);

    const avatar_url = urlData.publicUrl;

    await supabaseAdmin.from('users').update({ avatar_url }).eq('id', id);

    return sendSuccess(res, { avatar_url }, 'Avatar uploaded successfully');
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return sendError(res, 'Failed to upload avatar', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    // Deactivate instead of hard delete
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, null, 'User deactivated successfully');
  } catch (err) {
    console.error('deleteUser error:', err);
    return sendError(res, 'Failed to delete user', 500);
  }
};

module.exports = { getUsers, getUser, updateUser, uploadAvatar, deleteUser };
