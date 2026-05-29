const { sendError } = require('../utils/response');

/**
 * Normalize role string to lowercase_underscore format.
 * Handles: "Super Admin", "SUPER_ADMIN", "super_admin", "ADMIN", "admin" etc.
 */
const normalizeRole = (role) => {
  if (!role) return '';
  return role.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Check if a normalized role is super_admin.
 */
const isSuperAdmin = (role) => normalizeRole(role) === 'super_admin';

/**
 * requireRole(...allowedRoles) — middleware factory.
 * Super Admin always passes. Other roles must be in allowedRoles list.
 * allowedRoles should be normalized (e.g. 'admin', 'manager', 'employee').
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized — no session', 401);
    }

    const userRole = normalizeRole(req.user.role);

    // Super admin bypasses all role checks
    if (isSuperAdmin(userRole)) return next();

    const allowed = allowedRoles.map(r => normalizeRole(r));
    if (!allowed.includes(userRole)) {
      return sendError(
        res,
        `Access denied. Required: ${allowed.join(' or ')}. Your role: ${userRole}`,
        403
      );
    }

    next();
  };
};

// Convenience middleware aliases
const isAdmin        = requireRole('admin');
const isManagerOrAdmin = requireRole('manager', 'admin');
const isAnyRole      = requireRole('employee', 'manager', 'admin');

// Deprecated alias — kept for backward compatibility
const checkRole = (...roles) => requireRole(...roles);

module.exports = { checkRole, requireRole, isAdmin, isManagerOrAdmin, isAnyRole, normalizeRole, isSuperAdmin };
