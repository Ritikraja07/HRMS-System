-- ============================================================
-- HRMS RLS Policies - 002_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function to get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('admin', 'manager'));
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
-- Employees can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth_id = auth.uid());

-- Managers and admins can view all users
CREATE POLICY "users_select_all_managers" ON users
  FOR SELECT USING (is_manager_or_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Only admins can insert new users
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (is_admin());

-- Only admins can delete users
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE USING (is_admin());

-- ============================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================
-- Employees see their own attendance
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT USING (user_id = get_my_user_id());

-- Managers/admins see all attendance
CREATE POLICY "attendance_select_managers" ON attendance
  FOR SELECT USING (is_manager_or_admin());

-- Employees can insert/update their own attendance
CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT WITH CHECK (user_id = get_my_user_id());

CREATE POLICY "attendance_update_own" ON attendance
  FOR UPDATE USING (user_id = get_my_user_id())
  WITH CHECK (user_id = get_my_user_id());

-- Admins can update any attendance
CREATE POLICY "attendance_update_admin" ON attendance
  FOR UPDATE USING (is_admin());

-- ============================================================
-- PROJECTS TABLE POLICIES
-- ============================================================
-- Project members can view their projects
CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (
    is_manager_or_admin() OR
    EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = get_my_user_id())
  );

-- Managers/admins can create projects
CREATE POLICY "projects_insert_managers" ON projects
  FOR INSERT WITH CHECK (is_manager_or_admin());

-- Project creator or admin can update
CREATE POLICY "projects_update_creator" ON projects
  FOR UPDATE USING (created_by = get_my_user_id() OR is_admin());

-- Only admins can delete projects
CREATE POLICY "projects_delete_admin" ON projects
  FOR DELETE USING (is_admin());

-- ============================================================
-- PROJECT MEMBERS TABLE POLICIES
-- ============================================================
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (
    is_manager_or_admin() OR
    user_id = get_my_user_id() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = get_my_user_id())
  );

CREATE POLICY "project_members_insert_managers" ON project_members
  FOR INSERT WITH CHECK (is_manager_or_admin());

CREATE POLICY "project_members_delete_managers" ON project_members
  FOR DELETE USING (is_manager_or_admin());

-- ============================================================
-- TASKS TABLE POLICIES
-- ============================================================
-- Users see tasks assigned to them
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT USING (user_id = get_my_user_id() OR assigned_by = get_my_user_id());

-- Managers/admins see all tasks
CREATE POLICY "tasks_select_managers" ON tasks
  FOR SELECT USING (is_manager_or_admin());

-- Anyone can create tasks (assigned to self or others by managers)
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (
    user_id = get_my_user_id() OR is_manager_or_admin()
  );

-- Users can update their own tasks, managers can update all
CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE USING (user_id = get_my_user_id() OR is_manager_or_admin());

-- Managers/admins can delete tasks
CREATE POLICY "tasks_delete_managers" ON tasks
  FOR DELETE USING (assigned_by = get_my_user_id() OR is_admin());

-- ============================================================
-- MESSAGES TABLE POLICIES
-- ============================================================
-- Project members can see messages
CREATE POLICY "messages_select_members" ON messages
  FOR SELECT USING (
    is_manager_or_admin() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = get_my_user_id())
  );

-- Project members can send messages
CREATE POLICY "messages_insert_members" ON messages
  FOR INSERT WITH CHECK (
    sender_id = get_my_user_id() AND (
      is_manager_or_admin() OR
      project_id IN (SELECT project_id FROM project_members WHERE user_id = get_my_user_id())
    )
  );

-- Users can delete their own messages, admins can delete any
CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE USING (sender_id = get_my_user_id() OR is_admin());

-- ============================================================
-- LEAVE REQUESTS TABLE POLICIES
-- ============================================================
CREATE POLICY "leave_select_own" ON leave_requests
  FOR SELECT USING (user_id = get_my_user_id());

CREATE POLICY "leave_select_managers" ON leave_requests
  FOR SELECT USING (is_manager_or_admin());

CREATE POLICY "leave_insert_own" ON leave_requests
  FOR INSERT WITH CHECK (user_id = get_my_user_id());

CREATE POLICY "leave_update_own" ON leave_requests
  FOR UPDATE USING (user_id = get_my_user_id() AND status = 'pending');

-- Managers can approve/reject leaves
CREATE POLICY "leave_update_managers" ON leave_requests
  FOR UPDATE USING (is_manager_or_admin());

CREATE POLICY "leave_delete_own_pending" ON leave_requests
  FOR DELETE USING (user_id = get_my_user_id() AND status = 'pending');

-- ============================================================
-- PAYSLIPS TABLE POLICIES
-- ============================================================
CREATE POLICY "payslips_select_own" ON payslips
  FOR SELECT USING (user_id = get_my_user_id() AND status = 'published');

CREATE POLICY "payslips_select_admin" ON payslips
  FOR SELECT USING (is_admin());

CREATE POLICY "payslips_insert_admin" ON payslips
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "payslips_update_admin" ON payslips
  FOR UPDATE USING (is_admin());

CREATE POLICY "payslips_delete_admin" ON payslips
  FOR DELETE USING (is_admin());

-- ============================================================
-- DAILY UPDATES TABLE POLICIES
-- ============================================================
CREATE POLICY "daily_updates_select_own" ON daily_updates
  FOR SELECT USING (user_id = get_my_user_id());

CREATE POLICY "daily_updates_select_managers" ON daily_updates
  FOR SELECT USING (is_manager_or_admin());

CREATE POLICY "daily_updates_insert_own" ON daily_updates
  FOR INSERT WITH CHECK (user_id = get_my_user_id());

CREATE POLICY "daily_updates_update_own" ON daily_updates
  FOR UPDATE USING (user_id = get_my_user_id());

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = get_my_user_id());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (is_manager_or_admin() OR user_id = get_my_user_id());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = get_my_user_id());

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = get_my_user_id());

-- ============================================================
-- SHIFTS TABLE POLICIES
-- ============================================================
CREATE POLICY "shifts_select_own" ON shifts
  FOR SELECT USING (user_id = get_my_user_id());

CREATE POLICY "shifts_select_managers" ON shifts
  FOR SELECT USING (is_manager_or_admin());

CREATE POLICY "shifts_insert_admin" ON shifts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "shifts_update_admin" ON shifts
  FOR UPDATE USING (is_admin());

CREATE POLICY "shifts_delete_admin" ON shifts
  FOR DELETE USING (is_admin());

-- ============================================================
-- LEAVE BALANCES TABLE POLICIES
-- ============================================================
CREATE POLICY "leave_balances_select_own" ON leave_balances
  FOR SELECT USING (user_id = get_my_user_id());

CREATE POLICY "leave_balances_select_managers" ON leave_balances
  FOR SELECT USING (is_manager_or_admin());

CREATE POLICY "leave_balances_insert_admin" ON leave_balances
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "leave_balances_update_admin" ON leave_balances
  FOR UPDATE USING (is_admin());
