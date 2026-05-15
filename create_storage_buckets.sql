-- =========================================================================================
-- Dar Shams Al-Ta'afi — Storage Buckets Creation
-- Run this in Supabase SQL Editor to fix "Bucket not found" errors
-- =========================================================================================

-- 1. Create Public Gallery Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-gallery', 'public-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create News Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Report Files Bucket (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-files', 'report-files', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Create Private Resident Media Bucket (Private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-resident-media', 'private-resident-media', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Ensure Policies exist (re-applying from MASTER_FIX for completeness)
DROP POLICY IF EXISTS "Allow all public-gallery" ON storage.objects;
CREATE POLICY "Allow all public-gallery" ON storage.objects FOR ALL USING (bucket_id = 'public-gallery') WITH CHECK (bucket_id = 'public-gallery');

DROP POLICY IF EXISTS "Allow all news-images" ON storage.objects;
CREATE POLICY "Allow all news-images" ON storage.objects FOR ALL USING (bucket_id = 'news-images') WITH CHECK (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Allow all report-files" ON storage.objects;
CREATE POLICY "Allow all report-files" ON storage.objects FOR ALL USING (bucket_id = 'report-files') WITH CHECK (bucket_id = 'report-files');

DROP POLICY IF EXISTS "Allow all private-resident-media" ON storage.objects;
CREATE POLICY "Allow all private-resident-media" ON storage.objects FOR ALL USING (bucket_id = 'private-resident-media') WITH CHECK (bucket_id = 'private-resident-media');

SELECT '✅ Storage Buckets created and policies applied!' AS result;
