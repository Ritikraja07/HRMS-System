import { normalizeRole, getDefaultDashboard, canAccessRoute } from './constants';

export { normalizeRole, getDefaultDashboard, canAccessRoute };

export const getDashboardRoute = getDefaultDashboard;

export const canAccess = (userRole, requiredRoles) => {
  if (!userRole || !requiredRoles) return false;
  const r = normalizeRole(userRole);
  if (r === 'super_admin') return true;
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.map(normalizeRole).includes(r);
};

export const isAdmin      = (role) => ['admin', 'super_admin'].includes(normalizeRole(role));
export const isManager    = (role) => normalizeRole(role) === 'manager';
export const isEmployee   = (role) => normalizeRole(role) === 'employee';
export const isSuperAdmin = (role) => normalizeRole(role) === 'super_admin';
export const isManagerOrAdmin = (role) => ['manager', 'admin', 'super_admin'].includes(normalizeRole(role));

/**
 * Build sidebar nav items based on role.
 * Super admin sees all sections.
 */
export const getNavItems = (role) => {
  const r = normalizeRole(role);

  const employeeItems = [
    { href: '/dashboard',       label: 'My Dashboard',    icon: 'home' },
    { href: '/punch',           label: 'Punch In / Out',  icon: 'clock' },
    { href: '/tasks',           label: 'My Tasks',        icon: 'check-square' },
    { href: '/projects',        label: 'My Projects',     icon: 'folder' },
    { href: '/communication',   label: 'Communication',   icon: 'message-circle' },
    { href: '/announcements',   label: 'Announcements',   icon: 'megaphone' },
    { href: '/attendance',      label: 'Attendance',      icon: 'calendar' },
    { href: '/leave',           label: 'Leave Requests',  icon: 'calendar-off' },
    { href: '/payslips',        label: 'Payslips',        icon: 'file-text' },
    { href: '/updates',         label: 'Daily Updates',   icon: 'edit' },
    { href: '/profile',         label: 'My Profile',      icon: 'user' },
  ];

  const managerItems = [
    { href: '/manager/dashboard', label: 'Manager View',  icon: 'bar-chart' },
    { href: '/manager/approvals', label: 'Leave Approvals', icon: 'check-circle' },
    { href: '/manager/team',      label: 'My Team',       icon: 'users' },
  ];

  const adminItems = [
    { href: '/admin/dashboard',       label: 'Admin Dashboard', icon: 'shield' },
    { href: '/admin/employees',       label: 'User Management', icon: 'users' },
    { href: '/admin/onboarding',      label: 'Onboarding',      icon: 'user-plus' },
    { href: '/admin/announcements',   label: 'Announcements',   icon: 'megaphone' },
    { href: '/admin/reports',         label: 'Reports',         icon: 'pie-chart' },
    { href: '/admin/shifts',          label: 'Shifts',          icon: 'clock' },
  ];

  if (r === 'super_admin') return [...adminItems, ...managerItems, ...employeeItems];
  if (r === 'admin')       return [...adminItems, ...managerItems, ...employeeItems];
  if (r === 'manager')     return [...managerItems, ...employeeItems];
  return employeeItems;
};
