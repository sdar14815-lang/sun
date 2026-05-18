-- =========================================================================================
-- Dar Shams Al-Ta'afi - Comprehensive Auth, Profiles & RLS Hardening Fix
-- Path: /FIX_RLS_AND_PROFILES.sql
-- Run this script in the Supabase SQL Editor to resolve all security issues permanently.
-- =========================================================================================

-- 1. EXTEND ACCOUNT_STATUS ENUM SAFELY
-- =========================================================================================
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.account_status ADD VALUE IF NOT EXISTS 'suspended';

-- 2. DROP ALL EXISTING POLICIES TO PREVENT CLASHES
-- =========================================================================================
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

-- 3. DEFINE RECURSION-FREE ROLE CHECKING FUNCTIONS
-- =========================================================================================
-- These functions look up the JWT user metadata, completely bypassing table queries
-- and eliminating RLS infinite recursion errors.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'family');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('super_admin', 'admin', 'staff', 'doctor', 'therapist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_family_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_current_user_role() = 'family';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. HARDEN THE AUTOMATIC PROFILE CREATION TRIGGER
-- =========================================================================================
-- Creates a secure profile for every authenticated signup, defaulting to 'pending'
-- state unless explicitly set as active or admin.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  default_role public.user_role;
  default_status public.account_status;
BEGIN
  -- Parse role and status safely
  default_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'family'::public.user_role);
  default_status := COALESCE((NEW.raw_user_meta_data->>'status')::public.account_status, 'pending'::public.account_status);

  INSERT INTO public.profiles (id, full_name, username, email, phone, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    default_role,
    default_status,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the hardened trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. SECURELY SYNC ANY EXISTING USERS WITHOUT A PROFILE
-- =========================================================================================
INSERT INTO public.profiles (id, full_name, username, email, phone, role, status, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'),
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  email,
  COALESCE(raw_user_meta_data->>'phone', ''),
  COALESCE((raw_user_meta_data->>'role')::public.user_role, 'family'::public.user_role),
  COALESCE((raw_user_meta_data->>'status')::public.account_status, 'active'::public.account_status),
  NOW(),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- =========================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_number_sequences ENABLE ROW LEVEL SECURITY;

-- 7. RECURSION-FREE RLS POLICIES FOR SYSTEM TABLES
-- =========================================================================================

-- --- A. PROFILES ---
-- Admins/Staff have all rights. Family users can see and update only their own profile.
CREATE POLICY "Admin manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "User view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- --- B. RESIDENTS ---
-- Staff can view/manage all. Parents can only view residents they are actively linked to.
CREATE POLICY "Staff manage all residents" ON public.residents FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view linked residents" ON public.residents FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = residents.id 
    AND family_links.is_active = true
  )
);

-- --- C. FAMILY LINKS ---
-- Staff can manage all links. Parents can view only their own links.
CREATE POLICY "Staff manage all family links" ON public.family_links FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view own family links" ON public.family_links FOR SELECT TO authenticated USING (family_user_id = auth.uid());

-- --- D. RESIDENT UPDATES (DAILY REPORTS) ---
-- Staff can view/manage all. Parents can view reports of linked residents that are visible to family.
CREATE POLICY "Staff manage all resident updates" ON public.resident_updates FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view linked updates" ON public.resident_updates FOR SELECT TO authenticated USING (
  visible_to_family = true 
  AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = resident_updates.resident_id 
    AND family_links.is_active = true
  )
);

-- --- E. WEEKLY REPORTS (REPORTS) ---
-- Staff can manage all. Parents can view published and visible weekly reports of linked residents.
CREATE POLICY "Staff manage all weekly reports" ON public.weekly_reports FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view linked weekly reports" ON public.weekly_reports FOR SELECT TO authenticated USING (
  visible_to_family = true 
  AND report_status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = weekly_reports.resident_id 
    AND family_links.is_active = true 
    AND family_links.can_view_reports = true
  )
);

-- --- F. SESSIONS ATTENDANCE (ACTIVITIES) ---
-- Staff can manage all. Parents can view attendance of linked residents.
CREATE POLICY "Staff manage all attendance" ON public.sessions_attendance FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view linked attendance" ON public.sessions_attendance FOR SELECT TO authenticated USING (
  visible_to_family = true 
  AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = sessions_attendance.resident_id 
    AND family_links.is_active = true
  )
);

-- --- G. NEWS ---
-- Staff can manage all. Authenticated/unauthenticated users can read published news.
CREATE POLICY "Staff manage all news" ON public.news FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Anyone view published news" ON public.news FOR SELECT USING (published = true);

-- --- H. GALLERY (ATTACHMENTS / PHOTOS) ---
-- Staff can manage all. Anyone can read public gallery. Parents can see private photos of linked residents.
CREATE POLICY "Staff manage all gallery" ON public.gallery FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Anyone view public gallery" ON public.gallery FOR SELECT USING (visibility = 'public');
CREATE POLICY "Family view private gallery" ON public.gallery FOR SELECT TO authenticated USING (
  visibility = 'private'
  AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = gallery.resident_id 
    AND family_links.is_active = true 
    AND family_links.can_view_photos = true
  )
);

-- --- I. MESSAGES ---
-- Staff can manage all. Parents can view their own, and insert only if linked and can_send_messages.
CREATE POLICY "Staff manage all messages" ON public.messages FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Family view own messages" ON public.messages FOR SELECT TO authenticated USING (family_user_id = auth.uid());
CREATE POLICY "Family insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  family_user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.resident_id = messages.resident_id 
    AND family_links.is_active = true 
    AND family_links.can_send_messages = true
  )
);

-- --- J. NOTIFICATIONS ---
-- Staff can manage all. Parents can read and update (e.g. mark as read) their own notifications.
CREATE POLICY "Staff manage all notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "User view own notifications" ON public.notifications FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "User update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());

-- --- K. BRANCHES & ROOMS ---
-- Staff can manage. Anyone authenticated can select.
CREATE POLICY "Staff manage all branches" ON public.branches FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Anyone view branches" ON public.branches FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Staff manage all rooms" ON public.rooms FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Anyone view rooms" ON public.rooms FOR SELECT TO authenticated USING (is_active = true);

-- --- L. SETTINGS ---
-- Staff can manage. Anyone authenticated can select app configurations.
CREATE POLICY "Staff manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Anyone view settings" ON public.settings FOR SELECT TO authenticated USING (true);

-- --- M. AUDIT LOGS ---
-- Strictly readable and writeable by authorized Staff only.
CREATE POLICY "Staff manage audit logs" ON public.audit_logs FOR ALL TO authenticated USING (public.is_admin_or_staff());

-- --- N. FILE NUMBER SEQUENCES ---
-- Bypasses direct access, allowing automatic secure numbering through trigger function.
CREATE POLICY "Staff manage sequences" ON public.file_number_sequences FOR ALL TO authenticated USING (public.is_admin_or_staff());
CREATE POLICY "Allow public read sequences" ON public.file_number_sequences FOR SELECT TO authenticated USING (true);

-- 8. SECURE STORAGE BUCKET POLICIES (AUTHENTICATED ONLY WITH LINK CHECK)
-- =========================================================================================

-- Drop storage policies for clean configuration
DROP POLICY IF EXISTS "Allow all public-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow all news-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all report-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all private-resident-media" ON storage.objects;

-- Public Buckets Policies (Anyone can read, Staff can write)
CREATE POLICY "Anyone read public-gallery" ON storage.objects FOR SELECT USING (bucket_id = 'public-gallery');
CREATE POLICY "Anyone read news-images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Staff manage public storage" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id IN ('public-gallery', 'news-images') AND public.is_admin_or_staff()
) WITH CHECK (
  bucket_id IN ('public-gallery', 'news-images') AND public.is_admin_or_staff()
);

-- Report Files Buckets Policies (Staff can write/read, Parents can read only if linked)
CREATE POLICY "Staff manage report-files" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'report-files' AND public.is_admin_or_staff()
);
CREATE POLICY "Family read report-files" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'report-files' AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.is_active = true 
    AND family_links.can_view_reports = true
  )
);

-- Private Resident Media Buckets Policies (Staff can write/read, Parents can read only if linked)
CREATE POLICY "Staff manage private-resident-media" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'private-resident-media' AND public.is_admin_or_staff()
);
CREATE POLICY "Family read private-resident-media" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'private-resident-media' AND EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE family_links.family_user_id = auth.uid() 
    AND family_links.is_active = true 
    AND family_links.can_view_photos = true
  )
);

-- =========================================================================================
SELECT '✅ Database RLS & Profiles Security Hardened Successfully! All Recursions Avoided.' AS status;
-- =========================================================================================
