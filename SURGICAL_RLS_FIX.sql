-- =========================================================================================
-- Dar Shams Al-Ta'afi - Surgical RLS Recursion Fix Patch
-- Path: /SURGICAL_RLS_FIX.sql
-- 
-- هذا الملف يحتوي على "حقنة أمان جراحية" تقوم بحل المشكلة فوراً بدون تعديل أو هدم أي سياسات أخرى.
-- =========================================================================================

-- تعديل الدالة المشتركة لتقرأ من الـ JWT التابع لـ Supabase بدلاً من الاستعلام المتداخل لجدول profiles
-- هذا الإصلاح يمنع التكرار اللانهائي (Infinite Recursion) فوراً في جميع الجداول التي تعتمد على هذه الدالة.

CREATE OR REPLACE FUNCTION public.auth_user_has_role(roles text[]) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'family') = ANY(roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================================
SELECT '✅ Surgical recursion fix applied successfully without touching any tables or data!' AS status;
-- =========================================================================================
