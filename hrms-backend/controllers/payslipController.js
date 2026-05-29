const { supabaseAdmin } = require('../utils/supabaseAdmin');
const { sendSuccess, sendError } = require('../utils/response');

const normalizeRole = (r) => (r || '').toLowerCase().replace(/\s+/g, '_');
const isPrivileged = (role) => ['admin', 'super_admin', 'manager'].includes(normalizeRole(role));
const toNum = (v, def = 0) => { const n = parseFloat(v); return isNaN(n) ? def : n; };

const getPayslips = async (req, res) => {
  try {
    const privileged = isPrivileged(req.user.role);
    const { user_id, year, month } = req.query;

    let query = supabaseAdmin
      .from('payslips')
      .select(`*, user:users!user_id(id, full_name, email, department, avatar_url)`)
      .order('month', { ascending: false });

    if (!privileged) {
      query = query.eq('user_id', req.user.id).eq('status', 'published');
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (month) {
      query = query.eq('month', month);
    } else if (year) {
      query = query.like('month', `${year}%`);
    }

    const { data, error } = await query;
    if (error) return sendError(res, error.message, 400);

    return sendSuccess(res, { payslips: data }, 'Payslips fetched');
  } catch (err) {
    console.error('getPayslips error:', err);
    return sendError(res, 'Failed to fetch payslips', 500);
  }
};

const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('payslips')
      .select(`*, user:users!user_id(id, full_name, email, department)`)
      .eq('id', id)
      .single();

    if (error || !data) return sendError(res, 'Payslip not found', 404);

    if (!isPrivileged(req.user.role) && data.user_id !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    let signedUrl = data.file_url;
    if (data.file_url && !data.file_url.startsWith('http')) {
      const { data: signed } = await supabaseAdmin.storage
        .from('hrms-files')
        .createSignedUrl(data.file_url, 3600);
      signedUrl = signed?.signedUrl;
    }

    return sendSuccess(res, { payslip: { ...data, signed_url: signedUrl } }, 'Payslip fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch payslip', 500);
  }
};

const createPayslip = async (req, res) => {
  try {
    const {
      user_id, month,
      basic_salary, hra = 0, transport_allowance = 0, other_allowances = 0,
      pf_deduction = 0, tax_deduction = 0, other_deductions = 0,
      publish = false,
    } = req.body;

    if (!user_id || !month || !basic_salary) {
      return sendError(res, 'user_id, month, and basic_salary are required', 400);
    }

    const status = publish ? 'published' : 'draft';

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .insert({
        user_id, month, status,
        basic_salary:        toNum(basic_salary),
        hra:                 toNum(hra),
        transport_allowance: toNum(transport_allowance),
        other_allowances:    toNum(other_allowances),
        pf_deduction:        toNum(pf_deduction),
        tax_deduction:       toNum(tax_deduction),
        other_deductions:    toNum(other_deductions),
      })
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    if (status === 'published') {
      await supabaseAdmin.from('notifications').insert({
        user_id,
        title: 'Payslip Available',
        message: `Your payslip for ${month} is now available.`,
        type: 'payslip',
        reference_id: data.id,
        reference_type: 'payslip',
      });
    }

    return sendSuccess(res, { payslip: data }, 'Payslip created', 201);
  } catch (err) {
    return sendError(res, 'Failed to create payslip', 500);
  }
};

const updatePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, basic_salary, hra, transport_allowance, other_allowances, pf_deduction, tax_deduction, other_deductions } = req.body;

    const updateData = {};
    if (status !== undefined)              updateData.status               = status;
    if (basic_salary !== undefined)        updateData.basic_salary         = toNum(basic_salary);
    if (hra !== undefined)                 updateData.hra                  = toNum(hra);
    if (transport_allowance !== undefined) updateData.transport_allowance  = toNum(transport_allowance);
    if (other_allowances !== undefined)    updateData.other_allowances     = toNum(other_allowances);
    if (pf_deduction !== undefined)        updateData.pf_deduction         = toNum(pf_deduction);
    if (tax_deduction !== undefined)       updateData.tax_deduction        = toNum(tax_deduction);
    if (other_deductions !== undefined)    updateData.other_deductions     = toNum(other_deductions);

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return sendError(res, error.message, 400);

    if (status === 'published') {
      await supabaseAdmin.from('notifications').insert({
        user_id: data.user_id,
        title: 'Payslip Available',
        message: `Your payslip for ${data.month} is now available.`,
        type: 'payslip',
        reference_id: id,
        reference_type: 'payslip',
      });
    }

    return sendSuccess(res, { payslip: data }, 'Payslip updated');
  } catch (err) {
    return sendError(res, 'Failed to update payslip', 500);
  }
};

const bulkPublishPayslips = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return sendError(res, 'month is required', 400);

    const { data: drafts, error: fetchErr } = await supabaseAdmin
      .from('payslips')
      .select('id, user_id, month')
      .eq('month', month)
      .eq('status', 'draft');

    if (fetchErr) return sendError(res, fetchErr.message, 400);
    if (!drafts || drafts.length === 0) {
      return sendSuccess(res, { published: 0 }, 'No draft payslips to publish');
    }

    const ids = drafts.map(d => d.id);
    const { error: updateErr } = await supabaseAdmin
      .from('payslips')
      .update({ status: 'published' })
      .in('id', ids);

    if (updateErr) return sendError(res, updateErr.message, 400);

    const notifications = drafts.map(d => ({
      user_id: d.user_id,
      title: 'Payslip Available',
      message: `Your payslip for ${d.month} is now available.`,
      type: 'payslip',
      reference_id: d.id,
      reference_type: 'payslip',
    }));
    await supabaseAdmin.from('notifications').insert(notifications);

    return sendSuccess(res, { published: ids.length }, `${ids.length} payslips published`);
  } catch (err) {
    return sendError(res, 'Failed to bulk publish payslips', 500);
  }
};

module.exports = { getPayslips, getPayslip, createPayslip, updatePayslip, bulkPublishPayslips };
