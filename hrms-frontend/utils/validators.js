// validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateDateRange = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 'Date range is required';
  if (new Date(fromDate) > new Date(toDate)) return 'From date cannot be after to date';
  return null;
};

export const validateLeaveForm = (data) => {
  const errors = {};
  if (!data.type) errors.type = 'Leave type is required';
  if (!data.from_date) errors.from_date = 'From date is required';
  if (!data.to_date) errors.to_date = 'To date is required';
  if (!data.reason || data.reason.trim().length < 10) errors.reason = 'Reason must be at least 10 characters';
  if (data.from_date && data.to_date && new Date(data.from_date) > new Date(data.to_date)) {
    errors.to_date = 'To date must be after from date';
  }
  return errors;
};

export const validateTaskForm = (data) => {
  const errors = {};
  if (!data.title || data.title.trim().length < 2) errors.title = 'Task title is required';
  return errors;
};

export const validateUpdateForm = (data) => {
  const errors = {};
  if (!data.work_done || data.work_done.trim().length < 10) {
    errors.work_done = 'Work done must be at least 10 characters';
  }
  return errors;
};
