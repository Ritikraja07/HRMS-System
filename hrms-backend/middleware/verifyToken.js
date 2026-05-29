const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendError } = require('../utils/response');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    // Get user from our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return sendError(res, 'User not found', 401);
    }

    if (!userData.is_active) {
      return sendError(res, 'Account is deactivated', 403);
    }

    req.user = userData;
    req.authUser = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('verifyToken error:', err);
    return sendError(res, 'Authentication failed', 401);
  }
};

module.exports = { verifyToken };
