export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
};

// Normalize any role variant to a consistent lowercase_underscore format
export const normalizeRole = (role) => {
  if (!role) return 'employee';
  return role.toLowerCase().replace(/\s+/g, '_');
};

export const isSuperAdmin = (role) => normalizeRole(role) === 'super_admin';
export const isAdmin = (role) => ['admin', 'super_admin'].includes(normalizeRole(role));
export const isManager = (role) => normalizeRole(role) === 'manager';
export const isEmployee = (role) => normalizeRole(role) === 'employee';
export const isManagerOrAdmin = (role) => ['manager', 'admin', 'super_admin'].includes(normalizeRole(role));

// Get default dashboard route for a role
export const getDefaultDashboard = (role) => {
  const r = normalizeRole(role);
  if (r === 'super_admin' || r === 'admin') return '/admin/dashboard';
  if (r === 'manager') return '/manager/dashboard';
  return '/dashboard';
};

// Backward-compatible alias
export const getDashboardRoute = getDefaultDashboard;

// Route access map — which normalized roles can access which path prefixes
const ROUTE_ACCESS = {
  '/admin': ['admin', 'super_admin'],
  '/manager': ['manager', 'admin', 'super_admin'],
};

export const canAccessRoute = (role, pathname) => {
  const r = normalizeRole(role);
  if (r === 'super_admin') return true; // super admin can access everything
  for (const [prefix, allowed] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(prefix) && !allowed.includes(r)) return false;
  }
  return true;
};

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'rejected'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

export const PROJECT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'HR', 'Finance', 'Operations', 'Administration', 'Legal',
];

export const NOTIFICATION_TYPES = {
  TASK: 'task', LEAVE: 'leave', PAYSLIP: 'payslip',
  ATTENDANCE: 'attendance', PROJECT: 'project',
  MESSAGE: 'message', UPDATE: 'update', GENERAL: 'general',
};

export const MOOD_OPTIONS = [
  { value: 'great', label: '😄 Great' },
  { value: 'good', label: '🙂 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'bad', label: '😔 Bad' },
];

export const SHIFT_NAMES = [
  'Morning Shift', 'Afternoon Shift', 'Evening Shift',
  'Night Shift', 'General Shift', 'Flexible Shift',
];

// Light-theme badge maps
export const STATUS_BADGE = {
  pending:     'badge badge-yellow',
  in_progress: 'badge badge-blue',
  completed:   'badge badge-green',
  rejected:    'badge badge-red',
  approved:    'badge badge-green',
  cancelled:   'badge badge-gray',
  present:     'badge badge-green',
  absent:      'badge badge-red',
  half_day:    'badge badge-yellow',
  on_leave:    'badge badge-blue',
  active:      'badge badge-green',
  on_hold:     'badge badge-yellow',
  inactive:    'badge badge-gray',
};

export const PRIORITY_BADGE = {
  low:    'badge badge-gray',
  medium: 'badge badge-blue',
  high:   'badge badge-orange',
  urgent: 'badge badge-red',
};

export const ROLE_BADGE = {
  super_admin: 'badge badge-purple',
  admin:       'badge badge-red',
  manager:     'badge badge-blue',
  employee:    'badge badge-green',
};

// Keep dark-theme constants for any pages that haven't been migrated yet
export const STATUS_COLORS = {
  pending:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed:   'bg-green-500/20 text-green-400 border-green-500/30',
  rejected:    'bg-red-500/20 text-red-400 border-red-500/30',
  approved:    'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  present:     'bg-green-500/20 text-green-400',
  absent:      'bg-red-500/20 text-red-400',
  half_day:    'bg-yellow-500/20 text-yellow-400',
  on_leave:    'bg-blue-500/20 text-blue-400',
  active:      'bg-green-500/20 text-green-400 border-green-500/30',
  on_hold:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export const PRIORITY_COLORS = {
  low:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};
