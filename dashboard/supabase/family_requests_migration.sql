-- =====================================================
-- جدول طلبات الأهالي — نسخة آمنة بدون أي DROP
-- شغّل هذا في Supabase → SQL Editor
-- =====================================================

-- 1. إنشاء الجدول (لا يؤثر إذا كان موجوداً مسبقاً)
CREATE TABLE IF NOT EXISTS public.family_requests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_name  TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'inquiry',
  type_label   TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'reviewed', 'replied', 'rejected')),
  admin_reply  TEXT,
  replied_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes للأداء (لا تؤثر إذا كانت موجودة)
CREATE INDEX IF NOT EXISTS idx_family_requests_profile_id ON public.family_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_family_requests_status     ON public.family_requests(status);
CREATE INDEX IF NOT EXISTS idx_family_requests_created_at ON public.family_requests(created_at DESC);

-- 3. تفعيل RLS
ALTER TABLE public.family_requests ENABLE ROW LEVEL SECURITY;

-- 4. السياسات (شغّل كل واحدة لوحدها إذا ظهر خطأ "already exists")

-- الأهل يشوفون طلباتهم فقط
CREATE POLICY "family_can_view_own_requests"
  ON public.family_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- الأهل يرسلون طلبات جديدة
CREATE POLICY "family_can_insert_requests"
  ON public.family_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- الموظفون والإدارة لهم وصول كامل
CREATE POLICY "staff_full_access_requests"
  ON public.family_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'staff', 'doctor', 'therapist')
    )
  );

