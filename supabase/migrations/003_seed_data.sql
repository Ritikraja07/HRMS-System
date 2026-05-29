-- ============================================================
-- HRMS Seed Data - 003_seed_data.sql
-- NOTE: Run AFTER creating auth users in Supabase Auth dashboard
-- or use the Supabase admin API. The auth_id values below are
-- placeholders — replace with real auth.users UUIDs after creation.
-- Default password for all users: HrmsPass@2025
-- ============================================================

-- ============================================================
-- SEED USERS
-- ============================================================
INSERT INTO users (id, auth_id, full_name, email, phone, department, role, avatar_url, is_active) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  NULL, -- Replace with actual auth.uid() after creating in Supabase Auth
  'Super Admin',
  'admin@hrms.com',
  '+1-555-000-0001',
  'Administration',
  'admin',
  NULL,
  TRUE
),
(
  '22222222-2222-2222-2222-222222222222',
  NULL,
  'Sarah Johnson',
  'manager1@hrms.com',
  '+1-555-000-0002',
  'Engineering',
  'manager',
  NULL,
  TRUE
),
(
  '33333333-3333-3333-3333-333333333333',
  NULL,
  'Michael Chen',
  'manager2@hrms.com',
  '+1-555-000-0003',
  'Product',
  'manager',
  NULL,
  TRUE
),
(
  '44444444-4444-4444-4444-444444444444',
  NULL,
  'John Doe',
  'employee1@hrms.com',
  '+1-555-000-0004',
  'Engineering',
  'employee',
  NULL,
  TRUE
),
(
  '55555555-5555-5555-5555-555555555555',
  NULL,
  'Jane Smith',
  'employee2@hrms.com',
  '+1-555-000-0005',
  'Engineering',
  'employee',
  NULL,
  TRUE
),
(
  '66666666-6666-6666-6666-666666666666',
  NULL,
  'Bob Williams',
  'employee3@hrms.com',
  '+1-555-000-0006',
  'Design',
  'employee',
  NULL,
  TRUE
),
(
  '77777777-7777-7777-7777-777777777777',
  NULL,
  'Alice Brown',
  'employee4@hrms.com',
  '+1-555-000-0007',
  'Product',
  'employee',
  NULL,
  TRUE
),
(
  '88888888-8888-8888-8888-888888888888',
  NULL,
  'Charlie Davis',
  'employee5@hrms.com',
  '+1-555-000-0008',
  'Marketing',
  'employee',
  NULL,
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED LEAVE BALANCES
-- ============================================================
INSERT INTO leave_balances (user_id, year, casual_leave, sick_leave, earned_leave) VALUES
('11111111-1111-1111-1111-111111111111', 2025, 12, 10, 15),
('22222222-2222-2222-2222-222222222222', 2025, 12, 10, 15),
('33333333-3333-3333-3333-333333333333', 2025, 12, 10, 15),
('44444444-4444-4444-4444-444444444444', 2025, 10, 8, 12),
('55555555-5555-5555-5555-555555555555', 2025, 10, 8, 12),
('66666666-6666-6666-6666-666666666666', 2025, 10, 8, 12),
('77777777-7777-7777-7777-777777777777', 2025, 10, 8, 12),
('88888888-8888-8888-8888-888888888888', 2025, 10, 8, 12)
ON CONFLICT (user_id, year) DO NOTHING;

-- ============================================================
-- SEED PROJECTS
-- ============================================================
INSERT INTO projects (id, name, description, status, created_by) VALUES
(
  'aaaa0001-0000-0000-0000-000000000000',
  'Website Redesign',
  'Complete overhaul of the corporate website with modern design and improved UX.',
  'active',
  '22222222-2222-2222-2222-222222222222'
),
(
  'aaaa0002-0000-0000-0000-000000000000',
  'Mobile App Development',
  'Build the company mobile application for iOS and Android platforms.',
  'active',
  '22222222-2222-2222-2222-222222222222'
),
(
  'aaaa0003-0000-0000-0000-000000000000',
  'Internal Tool',
  'Employee productivity and management internal tool development.',
  'on_hold',
  '33333333-3333-3333-3333-333333333333'
),
(
  'aaaa0004-0000-0000-0000-000000000000',
  'Marketing Campaign',
  'Q1 Marketing activities and digital campaign management.',
  'completed',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED PROJECT MEMBERS
-- ============================================================
INSERT INTO project_members (project_id, user_id, role) VALUES
('aaaa0001-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'lead'),
('aaaa0001-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'member'),
('aaaa0001-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'member'),
('aaaa0001-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'member'),
('aaaa0001-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'member'),
('aaaa0002-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'lead'),
('aaaa0002-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'member'),
('aaaa0002-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'member'),
('aaaa0002-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'member'),
('aaaa0002-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'member'),
('aaaa0002-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'member'),
('aaaa0003-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'lead'),
('aaaa0003-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'member'),
('aaaa0003-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'member'),
('aaaa0003-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'member'),
('aaaa0004-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'lead'),
('aaaa0004-0000-0000-0000-000000000000', '77777777-7777-7777-7777-777777777777', 'member'),
('aaaa0004-0000-0000-0000-000000000000', '88888888-8888-8888-8888-888888888888', 'member')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED TASKS
-- ============================================================
INSERT INTO tasks (id, user_id, project_id, title, description, priority, status, due_date, assigned_by) VALUES
(
  'bbbb0001-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'aaaa0001-0000-0000-0000-000000000000',
  'Home Page Design',
  'Design and implement the new homepage layout with hero section.',
  'high',
  'in_progress',
  '2025-12-31',
  '22222222-2222-2222-2222-222222222222'
),
(
  'bbbb0002-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'aaaa0002-0000-0000-0000-000000000000',
  'API Integration',
  'Integrate third-party payment gateway APIs.',
  'medium',
  'pending',
  '2026-01-02',
  '22222222-2222-2222-2222-222222222222'
),
(
  'bbbb0003-0000-0000-0000-000000000000',
  '44444444-4444-4444-4444-444444444444',
  'aaaa0003-0000-0000-0000-000000000000',
  'Database Optimization',
  'Optimize slow queries and add proper indexes.',
  'high',
  'pending',
  '2026-01-03',
  '22222222-2222-2222-2222-222222222222'
),
(
  'bbbb0004-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'aaaa0001-0000-0000-0000-000000000000',
  'Website Redesign QA',
  'Test and validate all redesigned pages across browsers.',
  'medium',
  'pending',
  '2025-12-30',
  '22222222-2222-2222-2222-222222222222'
),
(
  'bbbb0005-0000-0000-0000-000000000000',
  '66666666-6666-6666-6666-666666666666',
  'aaaa0001-0000-0000-0000-000000000000',
  'Bug Fixing',
  'Fix reported UI bugs from the design review session.',
  'low',
  'completed',
  '2025-12-30',
  '22222222-2222-2222-2222-222222222222'
),
(
  'bbbb0006-0000-0000-0000-000000000000',
  '77777777-7777-7777-7777-777777777777',
  'aaaa0004-0000-0000-0000-000000000000',
  'Campaign Analytics Report',
  'Compile Q1 campaign results and prepare executive report.',
  'high',
  'completed',
  '2025-12-15',
  '33333333-3333-3333-3333-333333333333'
),
(
  'bbbb0007-0000-0000-0000-000000000000',
  '88888888-8888-8888-8888-888888888888',
  'aaaa0004-0000-0000-0000-000000000000',
  'Social Media Content',
  'Create social media content calendar for Q1.',
  'medium',
  'completed',
  '2025-12-10',
  '33333333-3333-3333-3333-333333333333'
),
(
  'bbbb0008-0000-0000-0000-000000000000',
  '55555555-5555-5555-5555-555555555555',
  'aaaa0002-0000-0000-0000-000000000000',
  'Mobile App Testing',
  'End-to-end testing of the mobile app on both platforms.',
  'urgent',
  'in_progress',
  '2026-01-10',
  '22222222-2222-2222-2222-222222222222'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED ATTENDANCE (last 30 days)
-- ============================================================
DO $$
DECLARE
  user_rec RECORD;
  day_offset INTEGER;
  work_date DATE;
  punch_in_time TIMESTAMPTZ;
  punch_out_time TIMESTAMPTZ;
  att_status VARCHAR(50);
BEGIN
  FOR user_rec IN SELECT id FROM users WHERE role = 'employee' LOOP
    FOR day_offset IN 0..29 LOOP
      work_date := CURRENT_DATE - day_offset;
      -- Skip Sundays (dow = 0)
      IF EXTRACT(DOW FROM work_date) = 0 THEN
        CONTINUE;
      END IF;
      -- Random attendance: 90% present
      IF random() < 0.9 THEN
        att_status := 'present';
        punch_in_time := work_date + TIME '09:00:00' + (random() * INTERVAL '30 minutes');
        punch_out_time := work_date + TIME '17:30:00' + (random() * INTERVAL '90 minutes');
      ELSE
        att_status := 'absent';
        punch_in_time := NULL;
        punch_out_time := NULL;
      END IF;
      INSERT INTO attendance (user_id, date, punch_in, punch_out, break_minutes, status)
      VALUES (user_rec.id, work_date, punch_in_time, punch_out_time, 30, att_status)
      ON CONFLICT (user_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- SEED LEAVE REQUESTS
-- ============================================================
INSERT INTO leave_requests (user_id, type, from_date, to_date, days, reason, status, approved_by) VALUES
(
  '44444444-4444-4444-4444-444444444444',
  'casual',
  '2026-01-05',
  '2026-01-05',
  1,
  'Personal work',
  'pending',
  NULL
),
(
  '55555555-5555-5555-5555-555555555555',
  'sick',
  '2025-12-28',
  '2025-12-29',
  2,
  'Fever and cold',
  'approved',
  '22222222-2222-2222-2222-222222222222'
),
(
  '66666666-6666-6666-6666-666666666666',
  'earned',
  '2025-12-15',
  '2025-12-16',
  2,
  'Family function',
  'approved',
  '22222222-2222-2222-2222-222222222222'
),
(
  '77777777-7777-7777-7777-777777777777',
  'casual',
  '2025-12-20',
  '2025-12-20',
  1,
  'Personal appointment',
  'rejected',
  '33333333-3333-3333-3333-333333333333'
),
(
  '88888888-8888-8888-8888-888888888888',
  'casual',
  '2026-01-08',
  '2026-01-10',
  3,
  'Vacation',
  'pending',
  NULL
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED PAYSLIPS
-- ============================================================
INSERT INTO payslips (user_id, month, basic_salary, hra, transport_allowance, pf_deduction, tax_deduction, status) VALUES
('44444444-4444-4444-4444-444444444444', '2025-10', 3000, 600, 200, 200, 100, 'published'),
('44444444-4444-4444-4444-444444444444', '2025-11', 3000, 600, 200, 200, 100, 'published'),
('44444444-4444-4444-4444-444444444444', '2025-12', 3000, 600, 200, 200, 100, 'published'),
('55555555-5555-5555-5555-555555555555', '2025-10', 2800, 550, 200, 180, 90, 'published'),
('55555555-5555-5555-5555-555555555555', '2025-11', 2800, 550, 200, 180, 90, 'published'),
('55555555-5555-5555-5555-555555555555', '2025-12', 2800, 550, 200, 180, 90, 'published'),
('66666666-6666-6666-6666-666666666666', '2025-11', 2600, 500, 200, 160, 80, 'published'),
('66666666-6666-6666-6666-666666666666', '2025-12', 2600, 500, 200, 160, 80, 'published'),
('77777777-7777-7777-7777-777777777777', '2025-11', 2500, 480, 200, 150, 75, 'published'),
('77777777-7777-7777-7777-777777777777', '2025-12', 2500, 480, 200, 150, 75, 'published'),
('88888888-8888-8888-8888-888888888888', '2025-11', 2400, 460, 200, 140, 70, 'published'),
('88888888-8888-8888-8888-888888888888', '2025-12', 2400, 460, 200, 140, 70, 'published')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DAILY UPDATES
-- ============================================================
INSERT INTO daily_updates (user_id, date, work_done, work_planned, blockers, mood) VALUES
('44444444-4444-4444-4444-444444444444', CURRENT_DATE - 1, 'Completed the homepage hero section design and started on navigation component.', 'Work on the footer and mobile responsive layout.', NULL, 'good'),
('44444444-4444-4444-4444-444444444444', CURRENT_DATE - 2, 'Fixed cross-browser compatibility issues and reviewed PR from teammate.', 'Start API integration for contact form.', 'Waiting for design assets from design team.', 'okay'),
('55555555-5555-5555-5555-555555555555', CURRENT_DATE - 1, 'Completed unit tests for authentication module. 95% coverage achieved.', 'Write integration tests for payment flow.', NULL, 'great'),
('66666666-6666-6666-6666-666666666666', CURRENT_DATE - 1, 'Finalized all UI components for mobile app. Sent designs for review.', 'Work on the admin panel mockups.', 'Feedback pending from manager.', 'good'),
('77777777-7777-7777-7777-777777777777', CURRENT_DATE - 1, 'Compiled Q1 campaign analytics report and sent to stakeholders.', 'Start Q2 campaign planning.', NULL, 'great'),
('88888888-8888-8888-8888-888888888888', CURRENT_DATE - 1, 'Created social media content calendar for January. Drafted 20 posts.', 'Schedule posts and coordinate with design team for graphics.', NULL, 'good')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, title, message, is_read, type) VALUES
('44444444-4444-4444-4444-444444444444', 'Task Due Soon', 'Task "API Integration" is due tomorrow.', FALSE, 'task'),
('44444444-4444-4444-4444-444444444444', 'Leave Approved', 'Your leave request has been approved.', FALSE, 'leave'),
('44444444-4444-4444-4444-444444444444', 'Project Update', 'Project "Website Redesign" was updated.', TRUE, 'project'),
('44444444-4444-4444-4444-444444444444', 'Daily Reminder', 'Don''t forget to submit your daily update.', TRUE, 'update'),
('44444444-4444-4444-4444-444444444444', 'New Task Assigned', 'A new task has been assigned to you.', TRUE, 'task'),
('55555555-5555-5555-5555-555555555555', 'Leave Approved', 'Your sick leave request has been approved.', FALSE, 'leave'),
('55555555-5555-5555-5555-555555555555', 'Payslip Available', 'Your December 2025 payslip is now available.', FALSE, 'payslip'),
('22222222-2222-2222-2222-222222222222', 'Leave Request Pending', 'John Doe has submitted a leave request for approval.', FALSE, 'leave'),
('22222222-2222-2222-2222-222222222222', 'Daily Update Submitted', 'Jane Smith submitted their daily update.', TRUE, 'update')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED SHIFTS
-- ============================================================
INSERT INTO shifts (user_id, shift_name, start_time, end_time, assigned_date, assigned_by) VALUES
('44444444-4444-4444-4444-444444444444', 'Morning Shift', '09:00', '18:00', CURRENT_DATE, '11111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444444', 'Morning Shift', '09:00', '18:00', CURRENT_DATE + 1, '11111111-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'Morning Shift', '09:00', '18:00', CURRENT_DATE, '11111111-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'Afternoon Shift', '12:00', '21:00', CURRENT_DATE + 1, '11111111-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'Morning Shift', '09:00', '18:00', CURRENT_DATE, '11111111-1111-1111-1111-111111111111'),
('77777777-7777-7777-7777-777777777777', 'General Shift', '10:00', '19:00', CURRENT_DATE, '11111111-1111-1111-1111-111111111111'),
('88888888-8888-8888-8888-888888888888', 'General Shift', '10:00', '19:00', CURRENT_DATE, '11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id, assigned_date) DO NOTHING;

-- ============================================================
-- SEED MESSAGES
-- ============================================================
INSERT INTO messages (project_id, sender_id, content, message_type) VALUES
('aaaa0001-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Please check the latest design mockups I shared.', 'text'),
('aaaa0001-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'Updated the API documentation.', 'text'),
('aaaa0001-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'Deployment scheduled for Friday. Please finalize your tasks.', 'text'),
('aaaa0002-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'Mobile app sprint review is tomorrow at 2 PM.', 'announcement'),
('aaaa0002-0000-0000-0000-000000000000', '66666666-6666-6666-6666-666666666666', 'UI assets for the mobile app are ready for development.', 'text')
ON CONFLICT DO NOTHING;

COMMIT;
