-- ============================================================
-- MIGRATION: schema_v2_additions.sql
-- دار شمس التعافي — إضافات المرحلة الثانية (Control Center)
-- شغّل هذا الملف في Supabase SQL Editor
-- ============================================================

-- ============================
-- 1. جدول messages — إضافة أعمدة الرد
-- ============================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES profiles(id);

-- RLS: إضافة صلاحية التعديل للـ staff (للرد)
DROP POLICY IF EXISTS "Staff can update messages" ON messages;
CREATE POLICY "Staff can update messages" ON messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
  );

-- ============================
-- 2. جدول weekly_reports — إضافة status و report_type
-- ============================
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly', 'periodic'));

-- تحديث الـ RLS لإضافة شرط status = published
DROP POLICY IF EXISTS "Family can view reports" ON weekly_reports;
CREATE POLICY "Family can view reports" ON weekly_reports FOR SELECT USING (
  visible_to_family = TRUE AND
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM family_links
    WHERE family_user_id = auth.uid()
    AND resident_id = weekly_reports.resident_id
    AND is_active = true
    AND can_view_reports = true
  )
);

-- Staff: Full access
DROP POLICY IF EXISTS "Staff can manage reports" ON weekly_reports;
CREATE POLICY "Staff can manage reports" ON weekly_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- ============================
-- 3. جدول residents — إضافة أعمدة visibility وprogress
-- ============================
ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ADD COLUMN IF NOT EXISTS notes_visible_to_family TEXT;

-- ============================
-- 4. جدول family_links — إضافة صلاحيات الإشعارات والرسائل
-- ============================
ALTER TABLE family_links
  ADD COLUMN IF NOT EXISTS can_receive_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_send_messages BOOLEAN DEFAULT TRUE;

-- ============================
-- 5. جدول news — إضافة sort_order
-- ============================
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================
-- 6. جدول notifications — إضافة is_general
-- ============================
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT FALSE;

-- RLS: Staff can insert notifications
DROP POLICY IF EXISTS "Staff can insert notifications" ON notifications;
CREATE POLICY "Staff can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
  );

DROP POLICY IF EXISTS "Staff can manage notifications" ON notifications;
CREATE POLICY "Staff can manage notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- RLS: Users can update (mark read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================
-- 7. تفعيل RLS على messages (إذا لم يكن مفعلاً)
-- ============================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================
-- 8. إضافة صلاحيات INSERT/UPDATE/DELETE للـ staff على الجداول
-- ============================

-- profiles: Staff can manage all (for family account creation)
DROP POLICY IF EXISTS "Staff can manage profiles" ON profiles;
CREATE POLICY "Staff can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- news: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert news" ON news;
CREATE POLICY "Staff can insert news" ON news FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- gallery: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert gallery" ON gallery;
CREATE POLICY "Staff can insert gallery" ON gallery FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- resident_updates: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert updates" ON resident_updates;
CREATE POLICY "Staff can insert updates" ON resident_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- weekly_reports: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert reports" ON weekly_reports;
CREATE POLICY "Staff can insert reports" ON weekly_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- family_links: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert family links" ON family_links;
CREATE POLICY "Staff can insert family links" ON family_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- residents: Staff INSERT
DROP POLICY IF EXISTS "Staff can insert residents" ON residents;
CREATE POLICY "Staff can insert residents" ON residents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor'))
);

-- ============================
-- 9. تحديث sort_order للأخبار الموجودة
-- ============================
UPDATE news SET sort_order = 0 WHERE sort_order IS NULL;

-- ============================
-- 10. نقل التقارير الموجودة إلى status=published (backward compat)
-- ============================
UPDATE weekly_reports SET status = 'published' WHERE status IS NULL AND visible_to_family = TRUE;
UPDATE weekly_reports SET status = 'draft' WHERE status IS NULL;

-- ============================
-- 11. تحديث سياسة الـ Gallery للموظفين (تجاوز RLS)
-- ============================
-- Staff يرون كل الصور بغض النظر عن is_visible
DROP POLICY IF EXISTS "Staff can view all gallery" ON gallery;
CREATE POLICY "Staff can view all gallery" ON gallery FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- ============================
-- التحقق من نجاح العملية
-- ============================
SELECT 'Migration completed successfully! ✅' AS status;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'messages' AND column_name IN ('reply_text', 'replied_at', 'replied_by')
ORDER BY column_name;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'weekly_reports' AND column_name IN ('status', 'report_type')
ORDER BY column_name;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'residents' AND column_name IN ('progress_percentage', 'notes_visible_to_family')
ORDER BY column_name;
