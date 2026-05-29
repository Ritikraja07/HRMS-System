-- ============================================================
-- WFH Requests Table - 005_add_wfh_requests.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS wfh_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wfh_requests_user_id ON wfh_requests(user_id);
CREATE INDEX idx_wfh_requests_status ON wfh_requests(status);
CREATE INDEX idx_wfh_requests_from_date ON wfh_requests(from_date);

-- RLS policies (mirror leave_requests pattern)
ALTER TABLE wfh_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own WFH requests" ON wfh_requests
  FOR SELECT USING (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = wfh_requests.user_id
  ));

CREATE POLICY "Users can insert own WFH requests" ON wfh_requests
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = wfh_requests.user_id
  ));

CREATE POLICY "Users can update own pending WFH requests" ON wfh_requests
  FOR UPDATE USING (auth.uid() IN (
    SELECT auth_id FROM users WHERE id = wfh_requests.user_id
  ) AND status = 'pending');
