-- =========================================================================================
-- Dar Shams Al-Ta'afi - Open Dashboard Access
-- File: open_dashboard_access.sql
-- =========================================================================================

-- 1. Drop the strict policies created previously
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Create open policies for all tables so the dashboard works without login
-- We use 'FOR ALL USING (true) WITH CHECK (true)' to allow anon and authenticated users full access.

CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on residents" ON residents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on family_links" ON family_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on resident_updates" ON resident_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weekly_reports" ON weekly_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessions_attendance" ON sessions_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on news" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on branches" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. Open Storage Buckets
DROP POLICY IF EXISTS "Allow all public-gallery" ON storage.objects;
CREATE POLICY "Allow all public-gallery" ON storage.objects FOR ALL USING (bucket_id = 'public-gallery');

DROP POLICY IF EXISTS "Allow all news-images" ON storage.objects;
CREATE POLICY "Allow all news-images" ON storage.objects FOR ALL USING (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Allow all report-files" ON storage.objects;
CREATE POLICY "Allow all report-files" ON storage.objects FOR ALL USING (bucket_id = 'report-files');

DROP POLICY IF EXISTS "Allow all private-resident-media" ON storage.objects;
CREATE POLICY "Allow all private-resident-media" ON storage.objects FOR ALL USING (bucket_id = 'private-resident-media');

SELECT '✅ Dashboard access has been completely opened successfully' AS status;
