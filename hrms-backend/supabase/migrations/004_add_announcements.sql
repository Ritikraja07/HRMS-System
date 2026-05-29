-- ============================================================
-- Announcements Table
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'policy', 'holiday', 'event', 'urgent')),
  is_pinned   BOOLEAN DEFAULT FALSE,
  expires_at  DATE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_type       ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned  ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read non-expired announcements
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
  );

-- Only admin / super_admin can create
CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );

-- Only admin / super_admin can update
CREATE POLICY "announcements_update" ON announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );

-- Only admin / super_admin can delete
CREATE POLICY "announcements_delete" ON announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = (SELECT auth.uid())
        AND role IN ('admin', 'super_admin')
    )
  );
