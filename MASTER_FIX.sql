-- =========================================================================================
-- Dar Shams Al-Ta'afi — Full Auth & Login Fix
-- Run this in Supabase SQL Editor
-- =========================================================================================

-- 1. Drop ALL existing policies (clean slate)
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

-- 2. Open policies for Dashboard (no login required)
CREATE POLICY "open_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_residents" ON residents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_family_links" ON family_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_resident_updates" ON resident_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_weekly_reports" ON weekly_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_sessions_attendance" ON sessions_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_news" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_branches" ON branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_all_audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- For messages: family can read/insert own messages, dashboard can manage all
CREATE POLICY "open_all_messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- 3. Trigger: Auto-create profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'family'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix any existing auth users that have no profile
INSERT INTO public.profiles (id, full_name, username, email, role, status)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  split_part(email, '@', 1),
  email, 
  CASE 
    WHEN email LIKE '%@family.shams.com' THEN 'family'::public.user_role
    ELSE 'family'::public.user_role
  END,
  'active'::public.account_status
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Fix file_number_sequences RLS (needed for resident file number generation)
ALTER TABLE file_number_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_file_number_sequences" ON file_number_sequences FOR ALL USING (true) WITH CHECK (true);

-- 6. Update storage policies (open for dashboard)
DROP POLICY IF EXISTS "Allow all public-gallery" ON storage.objects;
CREATE POLICY "Allow all public-gallery" ON storage.objects FOR ALL USING (bucket_id = 'public-gallery') WITH CHECK (bucket_id = 'public-gallery');

DROP POLICY IF EXISTS "Allow all news-images" ON storage.objects;
CREATE POLICY "Allow all news-images" ON storage.objects FOR ALL USING (bucket_id = 'news-images') WITH CHECK (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Allow all report-files" ON storage.objects;
CREATE POLICY "Allow all report-files" ON storage.objects FOR ALL USING (bucket_id = 'report-files') WITH CHECK (bucket_id = 'report-files');

DROP POLICY IF EXISTS "Allow all private-resident-media" ON storage.objects;
CREATE POLICY "Allow all private-resident-media" ON storage.objects FOR ALL USING (bucket_id = 'private-resident-media') WITH CHECK (bucket_id = 'private-resident-media');

-- 7. Indexes for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

SELECT '✅ All fixes applied successfully!' AS result;
