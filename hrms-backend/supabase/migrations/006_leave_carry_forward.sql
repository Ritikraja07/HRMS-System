-- ============================================================
-- Carry Forward Leave Columns - 006_leave_carry_forward.sql
-- ============================================================

ALTER TABLE leave_balances
  ADD COLUMN IF NOT EXISTS carry_forward_casual  NUMERIC(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carry_forward_sick    NUMERIC(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carry_forward_earned  NUMERIC(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carry_forward_set_at  TIMESTAMPTZ;

-- Carry forward caps (stored for reference, enforced in application layer):
--   casual:  max 10 days
--   sick:    0 days (does not carry forward)
--   earned:  max 15 days
