-- =========================================================================================
-- Dar Shams Al-Ta'afi - Complete Database Schema
-- Production-Ready SQL Script for Supabase
-- =========================================================================================

-- 1. EXTENSIONS
-- =========================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Useful for text search optimizations

-- 2. ENUMS
-- =========================================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'doctor', 'therapist', 'family');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'disabled', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE resident_status AS ENUM ('stable', 'needs_followup', 'improving', 'critical', 'inactive', 'discharged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE treatment_stage AS ENUM ('admission', 'detox', 'stabilization', 'rehabilitation', 'social_reintegration', 'follow_up', 'followup', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('open', 'answered', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE media_visibility AS ENUM ('public', 'private');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('general', 'resident_update', 'report', 'message', 'alert');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. BASE TABLES
-- =========================================================================================

-- PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'family',
  status account_status DEFAULT 'active',
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRANCHES
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  room_number TEXT NOT NULL,
  capacity INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESIDENTS
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INT,
  phone TEXT,
  admission_date DATE,
  discharge_date DATE,
  current_stage treatment_stage DEFAULT 'admission',
  current_status resident_status DEFAULT 'stable',
  progress_score INT CHECK (progress_score >= 0 AND progress_score <= 100),
  room_number TEXT, -- Optional relation to rooms table if strict binding is needed later
  assigned_doctor_id UUID REFERENCES profiles(id),
  assigned_therapist_id UUID REFERENCES profiles(id),
  notes_internal TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FILE NUMBER SEQUENCES (For auto-generating SHAMS-YYYY-XXXX)
CREATE TABLE IF NOT EXISTS file_number_sequences (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAMILY LINKS
CREATE TABLE IF NOT EXISTS family_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  relation TEXT,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_view_photos BOOLEAN DEFAULT TRUE,
  can_receive_notifications BOOLEAN DEFAULT TRUE,
  can_send_messages BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_user_id, resident_id)
);

-- RESIDENT UPDATES (Daily/Periodic updates)
CREATE TABLE IF NOT EXISTS resident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  status resident_status,
  progress_score INT CHECK (progress_score >= 0 AND progress_score <= 100),
  visible_to_family BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WEEKLY REPORTS
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  report_title TEXT NOT NULL,
  report_body TEXT NOT NULL,
  report_status report_status DEFAULT 'draft',
  progress_score INT CHECK (progress_score >= 0 AND progress_score <= 100),
  visible_to_family BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  family_read_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS ATTENDANCE
CREATE TABLE IF NOT EXISTS sessions_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  session_type TEXT,
  session_date DATE,
  attended BOOLEAN DEFAULT FALSE,
  notes TEXT,
  visible_to_family BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEWS
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  show_in_family_portal BOOLEAN DEFAULT TRUE,
  show_in_mobile_app BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GALLERY
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  visibility media_visibility DEFAULT 'public',
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  category TEXT,
  visible_to_family BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  status message_status DEFAULT 'open',
  parent_message_id UUID REFERENCES messages(id),
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES profiles(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
  type notification_type,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY SCHEDULES
CREATE TABLE IF NOT EXISTS daily_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0: Sunday, 1: Monday, ..., 6: Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity_name TEXT NOT NULL,
  activity_type TEXT DEFAULT 'other', -- session, meal, exercise, rest, other
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_daily_schedules_updated_at BEFORE UPDATE ON daily_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- 4. AUTO FILE NUMBER GENERATION (SHAMS-YYYY-XXXX)
-- =========================================================================================
CREATE OR REPLACE FUNCTION generate_file_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year INT;
  next_val INT;
  new_file_number TEXT;
BEGIN
  -- If file_number is explicitly provided, skip generation
  IF NEW.file_number IS NOT NULL AND NEW.file_number <> '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Upsert safely with locking to prevent duplicates
  INSERT INTO file_number_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE 
  SET last_number = file_number_sequences.last_number + 1, updated_at = NOW()
  RETURNING last_number INTO next_val;

  -- Format: SHAMS-2026-0001
  new_file_number := 'SHAMS-' || current_year || '-' || LPAD(next_val::text, 4, '0');
  
  NEW.file_number := new_file_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_file_number ON residents;
CREATE TRIGGER trg_generate_file_number
BEFORE INSERT ON residents
FOR EACH ROW
EXECUTE FUNCTION generate_file_number();


-- 5. UPDATED_AT TRIGGERS
-- =========================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_residents_updated_at ON residents;
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_reports_updated_at ON weekly_reports;
CREATE TRIGGER update_weekly_reports_updated_at BEFORE UPDATE ON weekly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 6. AUDIT LOGS TRIGGER
-- =========================================================================================
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
  actor_id UUID;
BEGIN
  -- Get user id if authenticated
  actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_user_id, action, table_name, record_id, new_data)
    VALUES (actor_id, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (actor_user_id, action, table_name, record_id, old_data, new_data)
    VALUES (actor_id, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_user_id, action, table_name, record_id, old_data)
    VALUES (actor_id, TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_residents ON residents;
CREATE TRIGGER trg_audit_residents AFTER INSERT OR UPDATE OR DELETE ON residents FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trg_audit_family_links ON family_links;
CREATE TRIGGER trg_audit_family_links AFTER INSERT OR UPDATE OR DELETE ON family_links FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trg_audit_resident_updates ON resident_updates;
CREATE TRIGGER trg_audit_resident_updates AFTER INSERT OR UPDATE OR DELETE ON resident_updates FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trg_audit_weekly_reports ON weekly_reports;
CREATE TRIGGER trg_audit_weekly_reports AFTER INSERT OR UPDATE OR DELETE ON weekly_reports FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trg_audit_gallery ON gallery;
CREATE TRIGGER trg_audit_gallery AFTER INSERT OR UPDATE OR DELETE ON gallery FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trg_audit_messages ON messages;
CREATE TRIGGER trg_audit_messages AFTER INSERT OR UPDATE OR DELETE ON messages FOR EACH ROW EXECUTE FUNCTION log_audit_action();


-- 7. INDEXES
-- =========================================================================================
CREATE INDEX IF NOT EXISTS idx_residents_file_number ON residents(file_number);
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON residents(full_name);
CREATE INDEX IF NOT EXISTS idx_family_links_family_user_id ON family_links(family_user_id);
CREATE INDEX IF NOT EXISTS idx_family_links_resident_id ON family_links(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_updates_resident_id_created_at ON resident_updates(resident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_resident_id_created_at ON weekly_reports(resident_id, created_at);
CREATE INDEX IF NOT EXISTS idx_news_published_created_at ON news(published, created_at);
CREATE INDEX IF NOT EXISTS idx_gallery_resident_id ON gallery(resident_id);
CREATE INDEX IF NOT EXISTS idx_messages_family_user_id_created_at ON messages(family_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id_is_read ON notifications(recipient_user_id, is_read);


-- 8. ROW LEVEL SECURITY (RLS)
-- =========================================================================================
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

-- Helper Function to check role
CREATE OR REPLACE FUNCTION auth_user_has_role(roles text[]) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role::text = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can manage all profiles." ON profiles FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff']));

-- Branches & Rooms Policies
CREATE POLICY "Branches viewable by everyone" ON branches FOR SELECT USING (true);
CREATE POLICY "Rooms viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Admin manage branches" ON branches FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin']));
CREATE POLICY "Admin manage rooms" ON rooms FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin']));

-- Residents Policies
CREATE POLICY "Staff view residents" ON residents FOR SELECT USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view linked residents" ON residents FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = residents.id AND is_active = true)
);
CREATE POLICY "Staff manage residents" ON residents FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor']));

-- Family Links Policies
CREATE POLICY "Staff view family links" ON family_links FOR SELECT USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view own links" ON family_links FOR SELECT USING (family_user_id = auth.uid());
CREATE POLICY "Admin/Staff manage family links" ON family_links FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff']));

-- Resident Updates Policies
CREATE POLICY "Staff view/manage updates" ON resident_updates FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view linked resident updates" ON resident_updates FOR SELECT USING (
  visible_to_family = TRUE AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = resident_updates.resident_id AND is_active = true)
);

-- Weekly Reports Policies
CREATE POLICY "Staff view/manage reports" ON weekly_reports FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view reports" ON weekly_reports FOR SELECT USING (
  visible_to_family = TRUE AND report_status = 'published' AND
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = weekly_reports.resident_id AND is_active = true AND can_view_reports = true)
);

-- Sessions Attendance Policies
CREATE POLICY "Staff view/manage attendance" ON sessions_attendance FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view attendance" ON sessions_attendance FOR SELECT USING (
  visible_to_family = TRUE AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = sessions_attendance.resident_id AND is_active = true)
);

-- News Policies
CREATE POLICY "Anyone view published news" ON news FOR SELECT USING (published = TRUE);
CREATE POLICY "Staff manage news" ON news FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff']));

-- Gallery Policies
CREATE POLICY "Public view general gallery" ON gallery FOR SELECT USING (visibility = 'public');
CREATE POLICY "Staff view/manage all gallery" ON gallery FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff']));
CREATE POLICY "Family view private gallery" ON gallery FOR SELECT USING (
  visibility = 'private' AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = gallery.resident_id AND is_active = true AND can_view_photos = true)
);

-- Messages Policies
CREATE POLICY "Staff view/manage all messages" ON messages FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));
CREATE POLICY "Family view own messages" ON messages FOR SELECT USING (family_user_id = auth.uid());
CREATE POLICY "Family insert messages" ON messages FOR INSERT WITH CHECK (
  family_user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = messages.resident_id AND is_active = true AND can_send_messages = true)
);

-- Notifications Policies
CREATE POLICY "Staff view/manage notifications" ON notifications FOR ALL USING (auth_user_has_role(ARRAY['super_admin', 'admin', 'staff']));
CREATE POLICY "Family view own notifications" ON notifications FOR SELECT USING (recipient_user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (recipient_user_id = auth.uid());


-- 9. STORAGE BUCKETS AND POLICIES
-- =========================================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('public-gallery', 'public-gallery', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('private-resident-media', 'private-resident-media', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('report-files', 'report-files', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT DO NOTHING;

-- Public Gallery & News (Anyone can read, Staff can manage)
CREATE POLICY "Public read public-gallery" ON storage.objects FOR SELECT USING (bucket_id = 'public-gallery');
CREATE POLICY "Public read news-images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Staff manage public buckets" ON storage.objects FOR ALL USING (
  bucket_id IN ('public-gallery', 'news-images') AND auth_user_has_role(ARRAY['super_admin', 'admin', 'staff'])
);

-- Private Resident Media
CREATE POLICY "Staff read private-resident-media" ON storage.objects FOR SELECT USING (
  bucket_id = 'private-resident-media' AND auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist'])
);
CREATE POLICY "Family read private-resident-media" ON storage.objects FOR SELECT USING (
  bucket_id = 'private-resident-media' AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND is_active = true AND can_view_photos = true)
);
CREATE POLICY "Staff manage private-resident-media" ON storage.objects FOR ALL USING (
  bucket_id = 'private-resident-media' AND auth_user_has_role(ARRAY['super_admin', 'admin', 'staff'])
);

-- Report Files
CREATE POLICY "Staff manage report-files" ON storage.objects FOR ALL USING (
  bucket_id = 'report-files' AND auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist'])
);
CREATE POLICY "Family read report-files" ON storage.objects FOR SELECT USING (
  bucket_id = 'report-files' AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND is_active = true AND can_view_reports = true)
);


-- 10. VIEWS
-- =========================================================================================

-- Family Resident Summary View
CREATE OR REPLACE VIEW family_resident_summary AS
SELECT 
  fl.family_user_id,
  r.id as resident_id,
  r.file_number,
  r.full_name,
  r.current_stage,
  r.current_status,
  r.progress_score,
  r.admission_date
FROM family_links fl
JOIN residents r ON fl.resident_id = r.id
WHERE fl.is_active = true AND r.is_active = true;

-- Dashboard Stats View
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  (SELECT count(*) FROM residents WHERE is_active = true) as total_active_residents,
  (SELECT count(*) FROM profiles WHERE role = 'family' AND status = 'active') as total_families,
  (SELECT count(*) FROM messages WHERE status = 'open') as unread_messages,
  (SELECT count(*) FROM weekly_reports WHERE report_status = 'published') as published_reports;


-- 11. SEED DATA
-- =========================================================================================
-- Initial Branch
INSERT INTO branches (name, address, is_active) 
VALUES ('دار شمس التعافي', 'الفرع الرئيسي', true) 
ON CONFLICT DO NOTHING;

-- Basic Settings
INSERT INTO settings (key, value) 
VALUES ('app_config', '{"contact_email": "info@shamstaafi.com", "contact_phone": "+201000000000"}'::jsonb) 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Sample News
INSERT INTO news (title, body, published, show_in_family_portal, show_in_mobile_app)
VALUES ('افتتاح النظام الجديد', 'نرحب بكم في النظام الموحد لدار شمس التعافي. سيتمكن الأهالي من متابعة ذويهم بسهولة.', true, true, true);
