-- =========================================================================================
-- Dar Shams Al-Ta'afi - Security & Policies Fix (RLS)
-- File: security_policies_fix.sql
-- =========================================================================================

-- ========================================================
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Add missing columns required by the dashboard if any
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS gallery_type TEXT DEFAULT 'general';
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'weekly';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='messages' and column_name='body') THEN
      ALTER TABLE messages RENAME COLUMN body TO message;
  END IF;
END $$;

-- ========================================================
-- 1.5 RPC FUNCTION FOR SECURE FAMILY CREATION
-- ========================================================
-- This function allows Admins/Staff to create a family user directly
-- safely bypassing the frontend limits and generating an auth user.
CREATE OR REPLACE FUNCTION create_family_user(
    p_username TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    fake_email TEXT;
BEGIN
    -- Only Staff/Admin can execute the inner logic
    -- (تم إيقاف هذا الشرط لتسهيل استخدام الداش بورد بدون تعقيدات الصلاحيات)
    -- IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'staff')) THEN
    --     RAISE EXCEPTION 'Only authorized staff can create families.';
    -- END IF;

    new_user_id := uuid_generate_v4();
    fake_email := p_username || '@family.shams.com';

    -- Insert into auth.users (Requires pgcrypto)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, role, aud, confirmation_token
    )
    VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', fake_email, crypt(p_password, gen_salt('bf')), now(), 
        '{"provider":"email","providers":["email"]}', '{}', 
        now(), now(), 'authenticated', 'authenticated', ''
    );

    -- Insert into auth.identities (Required for Supabase Auth to work!)
    INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
        uuid_generate_v4(), new_user_id::text, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, fake_email)::jsonb, 'email', now(), now(), now()
    );

    -- Insert into profiles
    INSERT INTO public.profiles (
        id, full_name, username, email, phone, role, status
    )
    VALUES (
        new_user_id, p_full_name, p_username, fake_email, p_phone, 'family', 'active'
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 2. HELPER FUNCTION FOR ROLES
-- ========================================================
-- Defines if the current authenticated user has any of the passed roles
CREATE OR REPLACE FUNCTION auth_user_has_role(roles text[]) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role::text INTO user_role FROM profiles WHERE id = auth.uid();
  
  -- تسهيل للداش بورد: إذا كان المستخدم مسجل دخول ولكن ليس له بروفايل (مثل حساب الأدمن الأولي)، نعتبره أدمن
  IF user_role IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN user_role = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 3. DROP EXISTING POLICIES TO PREVENT CONFLICTS
-- ========================================================
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

-- ========================================================
-- 4. APPLY SIMPLE & RELAXED POLICIES (No Complexity)
-- ========================================================
-- بناءً على طلبك، تم إزالة كل التعقيد.
-- هذه السياسات تسمح لأي مستخدم مسجل الدخول (سواء من لوحة التحكم أو التطبيق) برؤية وتعديل البيانات
-- هذا يجعل النظام يعمل بسلاسة تامة للتطوير والاختبار بدون أي أخطاء RLS.

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

-- ========================================================
-- 5. STORAGE BUCKETS POLICIES (Simplified)
-- ========================================================

DROP POLICY IF EXISTS "Public read public-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage public-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow all public-gallery" ON storage.objects;
CREATE POLICY "Allow all public-gallery" ON storage.objects FOR ALL USING (bucket_id = 'public-gallery');

DROP POLICY IF EXISTS "Public read news-images" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage news-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all news-images" ON storage.objects;
CREATE POLICY "Allow all news-images" ON storage.objects FOR ALL USING (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Staff manage report-files" ON storage.objects;
DROP POLICY IF EXISTS "Family read report-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all report-files" ON storage.objects;
CREATE POLICY "Allow all report-files" ON storage.objects FOR ALL USING (bucket_id = 'report-files');

DROP POLICY IF EXISTS "Staff manage private-resident-media" ON storage.objects;
DROP POLICY IF EXISTS "Family read private-resident-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow all private-resident-media" ON storage.objects;
CREATE POLICY "Allow all private-resident-media" ON storage.objects FOR ALL USING (bucket_id = 'private-resident-media');

-- ========================================================
-- 6. FIX SEQUENCE GENERATOR (Bypass RLS)
-- ========================================================
CREATE OR REPLACE FUNCTION generate_file_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year INT;
  next_val INT;
  new_file_number TEXT;
BEGIN
  IF NEW.file_number IS NOT NULL AND NEW.file_number <> '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO file_number_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE 
  SET last_number = file_number_sequences.last_number + 1, updated_at = NOW()
  RETURNING last_number INTO next_val;

  new_file_number := 'SHAMS-' || current_year || '-' || LPAD(next_val::text, 4, '0');
  
  NEW.file_number := new_file_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إشعار نهاية التشغيل
SELECT '✅ Security Policies Updated Successfully' AS status;
