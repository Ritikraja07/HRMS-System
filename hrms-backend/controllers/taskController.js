const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { validateTask } = require('../utils/validators');

const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, project_id, user_id } = req.query;
    const offset = (page - 1) * limit;
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:projects(id, name),
        assignee:users!user_id(id, full_name, avatar_url),
        assigner:users!assigned_by(id, full_name)
      `, { count: 'exact' });

    // Role-based filtering
    if (!isManagerOrAdmin) {
      query = query.eq('user_id', req.user.id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (project_id) query = query.eq('project_id', project_id);

    query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendPaginated(res, data, count, page, limit, 'Tasks fetched');
  } catch (err) {
    console.error('getTasks error:', err);
    return sendError(res, 'Failed to fetch tasks', 500);
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`*, project:projects(id, name), assignee:users!user_id(id, full_name, avatar_url)`)
      .eq('id', id)
      .single();

    if (error || !data) return sendError(res, 'Task not found', 404);

    // Check access
    if (req.user.role === 'employee' && data.user_id !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { task: data }, 'Task fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch task', 500);
  }
};

const createTask = async (req, res) => {
  try {
    const { error: vErr, value } = validateTask(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);

    const taskData = {
      ...value,
      user_id: isManagerOrAdmin && value.user_id ? value.user_id : req.user.id,
      assigned_by: req.user.id,
    };

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select(`*, project:projects(id, name), assignee:users!user_id(id, full_name, avatar_url)`)
      .single();

    if (error) return sendError(res, error.message, 400);

    // Notify the assignee if different from creator
    if (taskData.user_id !== req.user.id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: taskData.user_id,
        title: 'New Task Assigned',
        message: `Task "${value.title}" has been assigned to you by ${req.user.full_name}.`,
        type: 'task',
        reference_id: data.id,
        reference_type: 'task',
      });
    }

    return sendSuccess(res, { task: data }, 'Task created successfully', 201);
  } catch (err) {
    console.error('createTask error:', err);
    return sendError(res, 'Failed to create task', 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return sendError(res, 'Task not found', 404);

    // Access control
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);
    if (!isManagerOrAdmin && existing.user_id !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    const allowedFields = ['title', 'description', 'priority', 'status', 'due_date', 'project_id'];
    if (isManagerOrAdmin) allowedFields.push('user_id');

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`*, project:projects(id, name), assignee:users!user_id(id, full_name, avatar_url)`)
      .single();

    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { task: data }, 'Task updated successfully');
  } catch (err) {
    console.error('updateTask error:', err);
    return sendError(res, 'Failed to update task', 500);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
    if (!existing) return sendError(res, 'Task not found', 404);

    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);
    if (!isManagerOrAdmin && existing.assigned_by !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, null, 'Task deleted successfully');
  } catch (err) {
    return sendError(res, 'Failed to delete task', 500);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
