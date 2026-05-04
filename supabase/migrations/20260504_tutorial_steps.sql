-- Tutorial steps shown in the admin "🎓 Tutorial" tab.
-- Editable from the admin UI; displayed as a checklist with progress.

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order   int  NOT NULL DEFAULT 0,
  icon         text DEFAULT '📌',
  title        text NOT NULL,
  body         text NOT NULL DEFAULT '',
  is_warning   boolean DEFAULT false,
  highlight    boolean DEFAULT false,
  action_label text,
  action_view  text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tutorial_steps_sort_order_idx ON tutorial_steps (sort_order);

ALTER TABLE tutorial_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tutorial_steps_select_anon" ON tutorial_steps;
CREATE POLICY "tutorial_steps_select_anon"
  ON tutorial_steps FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tutorial_steps_write_authenticated" ON tutorial_steps;
CREATE POLICY "tutorial_steps_write_authenticated"
  ON tutorial_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed initial steps. Safe to re-run: skips if any rows already exist.
INSERT INTO tutorial_steps (sort_order, icon, title, body, is_warning, highlight, action_label, action_view)
SELECT * FROM (VALUES
  (10, '🔐', 'Log in to the admin panel',
       'You are already here! The admin portal is only accessible with your staff email and password. Never share your login credentials with anyone.',
       false, false, NULL, NULL),
  (20, '📊', 'Explore the dashboard',
       'The Dashboard shows total brochures, featured resources, categories, and share events at a glance. Check it each time you log in so you know what is available before reaching out to a victim.',
       false, false, 'Go to Dashboard', 'dashboard'),
  (30, '📄', 'Browse available brochures',
       'Click "Brochures" in the top nav. Browse all resources — housing, legal aid, counseling, safety planning and more. Knowing what is available helps you match the right resource to each victim''s situation.',
       false, false, 'Go to Brochures', 'brochures'),
  (40, '📤', 'Share a resource with a victim',
       'Find the right brochure and click Share. A modal will open with three options — Email, SMS, or Copy Link. For anonymous sending, use the Google Voice method below: copy the message, open voice.google.com, start a new message, paste and send. Your real number stays hidden.',
       false, true, NULL, NULL),
  (50, '📱', 'Send anonymously via Google Voice',
       'Go to voice.google.com (sign in with the shared advocate account). Click the message icon, enter the victim''s number, paste your copied message and hit send. They will only see the Google Voice number — never your personal number.',
       false, false, NULL, NULL),
  (60, '📈', 'Check the activity log',
       'Click "Activity" in the nav. Every share is logged with the brochure name, date, and method. Review this regularly to track your own outreach and see what your team has shared.',
       false, false, 'Go to Activity', 'activity'),
  (70, '🗂️', 'Understand categories',
       'Resources are organized into categories like Housing, Legal Aid, and Counseling. Admins can create new categories from the Categories tab. If you think a new category is needed, talk to your supervisor first.',
       false, false, 'Go to Categories', 'categories'),
  (80, '⚠️', 'Privacy rules — read carefully',
       'Never include a victim''s name, address, or phone number in any share log, brochure note, or message. Always use the anonymous Google Voice number when texting resources. If a victim responds, do not reply from your personal number. When in doubt, ask your supervisor before sharing.',
       true, false, NULL, NULL)
) AS seed(sort_order, icon, title, body, is_warning, highlight, action_label, action_view)
WHERE NOT EXISTS (SELECT 1 FROM tutorial_steps);
