const Joi = require('joi');

const validateAttendance = (data) => {
  const schema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    punch_in: Joi.string().isoDate().optional(),
    punch_out: Joi.string().isoDate().optional(),
    break_minutes: Joi.number().min(0).max(480).optional(),
    status: Joi.string().valid('present', 'absent', 'half_day', 'on_leave', 'holiday').optional(),
    notes: Joi.string().max(500).optional(),
  });
  return schema.validate(data);
};

const validateTask = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(500).required(),
    description: Joi.string().max(2000).optional().allow(''),
    project_id: Joi.string().uuid().optional().allow(null),
    user_id: Joi.string().uuid().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'rejected').optional(),
    due_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null),
  });
  return schema.validate(data);
};

const validateProject = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled').optional(),
  });
  return schema.validate(data);
};

const validateLeaveRequest = (data) => {
  const schema = Joi.object({
    type: Joi.string().valid('casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid').required(),
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    days: Joi.number().min(0.5).max(365).required(),
    reason: Joi.string().min(10).max(1000).required(),
  });
  return schema.validate(data);
};

const validateDailyUpdate = (data) => {
  const schema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    work_done: Joi.string().min(10).max(3000).required(),
    work_planned: Joi.string().max(3000).optional().allow(''),
    blockers: Joi.string().max(1000).optional().allow(''),
    mood: Joi.string().valid('great', 'good', 'okay', 'bad').optional(),
  });
  return schema.validate(data);
};

const validateUser = (data) => {
  const schema = Joi.object({
    full_name:   Joi.string().min(2).max(255).optional(),
    phone:       Joi.string().max(20).optional().allow(''),
    department:  Joi.string().max(100).optional().allow(''),
    designation: Joi.string().max(150).optional().allow(''),
    avatar_url:  Joi.string().uri().optional().allow(''),
    fcm_token:   Joi.string().optional().allow(''),
    // privileged fields — presence is validated here, access is enforced in the controller
    role:        Joi.string().valid('admin', 'manager', 'employee', 'super_admin').optional(),
    is_active:   Joi.boolean().optional(),
  });
  return schema.validate(data);
};

const validateMessage = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(1).max(5000).optional(),
    file_url: Joi.string().uri().optional(),
    file_name: Joi.string().max(255).optional(),
    file_type: Joi.string().max(100).optional(),
    message_type: Joi.string().valid('text', 'file', 'announcement').optional(),
  });
  return schema.validate(data);
};

const validateWfhRequest = (data) => {
  const schema = Joi.object({
    from_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    to_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    reason: Joi.string().min(10).max(1000).required(),
  });
  return schema.validate(data);
};

module.exports = {
  validateAttendance,
  validateTask,
  validateProject,
  validateLeaveRequest,
  validateDailyUpdate,
  validateUser,
  validateMessage,
  validateWfhRequest,
};
