const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');
const { validateProject } = require('../utils/validators');

const getProjects = async (req, res) => {
  try {
    const isManagerOrAdmin = ['manager', 'admin', 'super_admin'].includes(req.user.role);
    let query = supabaseAdmin
      .from('projects')
      .select(`*, creator:users!created_by(id, full_name, avatar_url), project_members(id, user_id, role, user:users(id, full_name, avatar_url))`)
      .order('created_at', { ascending: false });

    if (!isManagerOrAdmin) {
      // Employee sees only their projects
      const { data: memberProjects } = await supabaseAdmin
        .from('project_members')
        .select('project_id')
        .eq('user_id', req.user.id);
      const projectIds = memberProjects?.map(p => p.project_id) || [];
      if (projectIds.length === 0) return sendSuccess(res, { projects: [] }, 'Projects fetched');
      query = query.in('id', projectIds);
    }

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { projects: data }, 'Projects fetched');
  } catch (err) {
    console.error('getProjects error:', err);
    return sendError(res, 'Failed to fetch projects', 500);
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`*, creator:users!created_by(id, full_name, avatar_url), project_members(id, user_id, role, user:users(id, full_name, avatar_url, department))`)
      .eq('id', id)
      .single();

    if (error || !data) return sendError(res, 'Project not found', 404);

    // Check access for employees
    if (req.user.role === 'employee') {
      const isMember = data.project_members.some(m => m.user_id === req.user.id);
      if (!isMember) return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { project: data }, 'Project fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch project', 500);
  }
};

const createProject = async (req, res) => {
  try {
    const { error: vErr, value } = validateProject(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({ ...value, created_by: req.user.id })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    // Add creator as lead member
    await supabaseAdmin.from('project_members').insert({
      project_id: data.id,
      user_id: req.user.id,
      role: 'lead',
    });

    // Add initial members if provided
    if (req.body.member_ids?.length > 0) {
      const members = req.body.member_ids
        .filter(uid => uid !== req.user.id)
        .map(uid => ({ project_id: data.id, user_id: uid, role: 'member' }));
      if (members.length > 0) {
        await supabaseAdmin.from('project_members').insert(members);
      }
    }

    return sendSuccess(res, { project: data }, 'Project created successfully', 201);
  } catch (err) {
    console.error('createProject error:', err);
    return sendError(res, 'Failed to create project', 500);
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { error: vErr, value } = validateProject(req.body);
    if (vErr) return sendError(res, vErr.details[0].message, 422);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(value)
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { project: data }, 'Project updated');
  } catch (err) {
    return sendError(res, 'Failed to update project', 500);
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Project deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete project', 500);
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;
    if (!user_id) return sendError(res, 'user_id required', 400);

    const { data, error } = await supabaseAdmin
      .from('project_members')
      .insert({ project_id: id, user_id, role })
      .select()
      .single();

    if (error) return sendError(res, 'Member already exists or invalid user', 400);

    // Notify added user
    const { data: project } = await supabaseAdmin.from('projects').select('name').eq('id', id).single();
    await supabaseAdmin.from('notifications').insert({
      user_id,
      title: 'Added to Project',
      message: `You have been added to project "${project?.name}".`,
      type: 'project',
      reference_id: id,
      reference_type: 'project',
    });

    return sendSuccess(res, { member: data }, 'Member added successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to add member', 500);
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { error } = await supabaseAdmin
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId);

    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, null, 'Member removed successfully');
  } catch (err) {
    return sendError(res, 'Failed to remove member', 500);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
