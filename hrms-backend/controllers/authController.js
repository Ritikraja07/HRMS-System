const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError || !authData.user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Get user profile from our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !userData) {
      // Try by email
      const { data: userByEmail, error: emailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (emailError || !userByEmail) {
        return sendError(res, 'User profile not found', 404);
      }

      // Update auth_id if not set
      if (!userByEmail.auth_id) {
        await supabaseAdmin
          .from('users')
          .update({ auth_id: authData.user.id })
          .eq('id', userByEmail.id);
        userByEmail.auth_id = authData.user.id;
      }

      return sendSuccess(res, {
        user: userByEmail,
        session: authData.session,
      }, 'Login successful');
    }

    if (!userData.is_active) {
      return sendError(res, 'Your account has been deactivated', 403);
    }

    return sendSuccess(res, {
      user: userData,
      session: authData.session,
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 'Login failed', 500);
  }
};

const logout = async (req, res) => {
  try {
    await supabaseAdmin.auth.signOut();
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    console.error('Logout error:', err);
    return sendError(res, 'Logout failed', 500);
  }
};

const refreshSession = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return sendError(res, 'Refresh token required', 400);
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) {
      return sendError(res, 'Session refresh failed', 401);
    }

    return sendSuccess(res, { session: data.session }, 'Session refreshed');
  } catch (err) {
    console.error('Refresh error:', err);
    return sendError(res, 'Failed to refresh session', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, { user }, 'User fetched');
  } catch (err) {
    console.error('getMe error:', err);
    return sendError(res, 'Failed to fetch user', 500);
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) {
      return sendError(res, 'FCM token required', 400);
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ fcm_token })
      .eq('id', req.user.id);

    if (error) {
      return sendError(res, 'Failed to update FCM token', 400);
    }

    return sendSuccess(res, null, 'FCM token updated');
  } catch (err) {
    console.error('updateFcmToken error:', err);
    return sendError(res, 'Failed to update FCM token', 500);
  }
};

module.exports = { login, logout, refreshSession, getMe, updateFcmToken };
