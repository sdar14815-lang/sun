-- Dar Shams Al-Ta'afi - Supabase Schema
-- Phase 2: Database Schema & Permissions

-- 1. Create custom types (Safely)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'staff', 'doctor', 'therapist', 'family');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resident_status') THEN
    CREATE TYPE resident_status AS ENUM ('stable', 'needs_followup', 'significant_progress', 'important_note');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'therapeutic_stage') THEN
    CREATE TYPE therapeutic_stage AS ENUM ('detox', 'rehabilitation', 'social_reintegration', 'follow_up');
  END IF;
END $$;

-- 2. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  username TEXT UNIQUE,
  role user_role DEFAULT 'family',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Residents table
CREATE TABLE IF NOT EXISTS residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  file_number TEXT UNIQUE NOT NULL,
  age INTEGER,
  admission_date DATE DEFAULT CURRENT_DATE,
  current_stage therapeutic_stage DEFAULT 'detox',
  current_status resident_status DEFAULT 'stable',
  room_number TEXT,
  assigned_doctor UUID REFERENCES profiles(id),
  assigned_therapist UUID REFERENCES profiles(id),
  notes_internal TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File Number Sequences
CREATE TABLE IF NOT EXISTS file_number_sequences (
  year INTEGER PRIMARY KEY,
  last_value INTEGER DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_file_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  next_val INTEGER;
  new_file_number TEXT;
BEGIN
  IF NEW.file_number IS NOT NULL AND NEW.file_number <> '' THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  INSERT INTO file_number_sequences (year, last_value)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_value = file_number_sequences.last_value + 1
  RETURNING last_value INTO next_val;

  new_file_number := 'SHAMS-' || current_year || '-' || LPAD(next_val::text, 4, '0');
  
  NEW.file_number := new_file_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_file_number
BEFORE INSERT ON residents
FOR EACH ROW
EXECUTE FUNCTION generate_file_number();

-- 4. Family Links (Connecting family users to residents)
CREATE TABLE IF NOT EXISTS family_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  relation TEXT, -- e.g., Father, Mother, etc.
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_view_photos BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_user_id, resident_id)
);

-- 5. Resident Updates (Daily notes)
CREATE TABLE IF NOT EXISTS resident_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  update_type TEXT, -- Daily, Session, etc.
  status resident_status,
  title TEXT,
  content TEXT NOT NULL,
  visible_to_family BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Weekly Reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  report_title TEXT NOT NULL,
  report_body TEXT NOT NULL,
  progress_score INTEGER CHECK (progress_score >= 0 AND progress_score <= 100),
  visible_to_family BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Sessions Attendance
CREATE TABLE IF NOT EXISTS sessions_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  attended BOOLEAN DEFAULT TRUE,
  notes TEXT,
  visible_to_family BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. News Table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  gallery_type TEXT DEFAULT 'general', -- general, facility, activity, resident
  resident_id UUID REFERENCES residents(id),
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Messages (Family to Admin)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_user_id UUID REFERENCES profiles(id),
  resident_id UUID REFERENCES residents(id),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, read, replied
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs (Enhanced)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Push Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT, -- report, update, general
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Medical Progress Tracking (Commercial Feature)
CREATE TABLE IF NOT EXISTS medical_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- physical, psychological, social
  score INTEGER CHECK (score >= 0 AND score <= 100),
  measured_at DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id)
);

-- TRIGGERS FOR AUDIT LOGS --
CREATE OR REPLACE FUNCTION log_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, payload)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), row_to_json(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatic Profile Creation for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'family');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER trg_log_residents AFTER INSERT OR UPDATE OR DELETE ON residents FOR EACH ROW EXECUTE FUNCTION log_action();
CREATE TRIGGER trg_log_updates AFTER INSERT OR UPDATE OR DELETE ON resident_updates FOR EACH ROW EXECUTE FUNCTION log_action();

-- RLS FOR NEW TABLES --
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Family can view linked medical progress" ON medical_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = medical_progress.resident_id)
);

-- RLS POLICIES (Security) --

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can insert messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = family_user_id AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = messages.resident_id AND is_active = true)
);
CREATE POLICY "Family can view own messages" ON messages FOR SELECT USING (
  auth.uid() = family_user_id
);
CREATE POLICY "Staff can view and manage all messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- Profiles: Users can read their own profile. Admins/Staff can read all.
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- Family Links: Users can see their own links
CREATE POLICY "Family can view own links" ON family_links FOR SELECT USING (
  family_user_id = auth.uid()
);
CREATE POLICY "Staff can manage family links" ON family_links FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- Residents: Family can only see residents they are linked to.
CREATE POLICY "Family can view linked residents" ON residents FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = residents.id AND is_active = true)
);
CREATE POLICY "Staff can manage all residents" ON residents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- Updates: Family can see updates marked as visible.
CREATE POLICY "Family can view linked resident updates" ON resident_updates FOR SELECT USING (
  visible_to_family = TRUE AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = resident_updates.resident_id AND is_active = true)
);
CREATE POLICY "Staff can manage updates" ON resident_updates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff', 'doctor', 'therapist'))
);

-- Repeat similar logic for Reports and Attendance...
CREATE POLICY "Family can view reports" ON weekly_reports FOR SELECT USING (
  visible_to_family = TRUE AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = weekly_reports.resident_id AND is_active = true AND can_view_reports = true)
);
CREATE POLICY "Family can view attendance" ON sessions_attendance FOR SELECT USING (
  visible_to_family = TRUE AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = sessions_attendance.resident_id AND is_active = true)
);

-- Public content
CREATE POLICY "Anyone can view published news" ON news FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Anyone can view visible general gallery" ON gallery FOR SELECT USING (is_visible = TRUE AND gallery_type != 'resident');

-- Resident Specific Photos
CREATE POLICY "Family can view resident photos" ON gallery FOR SELECT USING (
  gallery_type = 'resident' AND 
  EXISTS (SELECT 1 FROM family_links WHERE family_user_id = auth.uid() AND resident_id = gallery.resident_id AND is_active = true AND can_view_photos = true)
);

-- Staff can manage public content
CREATE POLICY "Staff can manage news" ON news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);
-- Staff can manage gallery
CREATE POLICY "Staff can manage gallery" ON gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- STORAGE SETUP --
-- Note: Buckets are usually created via Dashboard, but policies are SQL based.

-- Gallery Bucket (Public)
-- Policy: Anyone can read, only staff can write.
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Access to Gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Staff Manage Gallery" ON storage.objects FOR ALL USING (
  bucket_id = 'gallery' AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
);

-- Resident Photos Bucket (Private)
-- Policy: Only linked family and staff can read.
INSERT INTO storage.buckets (id, name, public) VALUES ('residents', 'residents', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Family Access to Resident Photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'residents' AND 
  (
    EXISTS (
      SELECT 1 FROM family_links 
      WHERE family_user_id = auth.uid() 
      AND (storage.objects.name LIKE resident_id::text || '/%')
    )
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'staff'))
  )
);

-- SAMPLE DATA (SEED) --
INSERT INTO news (title, body, is_published) VALUES 
('افتتاح قسم الدمج المجتمعي الجديد', 'تم افتتاح قسم الدمج المجتمعي الجديد لتوفير بيئة أفضل للتعافي.', true),
('ندوة الجمعة للأهالي', 'ندعو الأهالي لحضور ندوة الدعم النفسي الأسبوعية يوم الجمعة القادم.', true);

INSERT INTO gallery (image_url, title, gallery_type) VALUES 
('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d', 'مبنى الإقامة الرئيسي', 'facility'),
('https://images.unsplash.com/photo-1576091160550-2173dba999ef', 'قاعة الجلسات الجماعية', 'facility');

-- Admin User Seed (djharga@gmail.com)
INSERT INTO public.profiles (id, full_name, role)
VALUES ('8779c29d-a5db-46cd-b3ff-d911b10331cd', 'المدير العام', 'super_admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
