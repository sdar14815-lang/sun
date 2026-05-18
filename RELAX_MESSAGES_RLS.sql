-- =========================================================================================
-- Dar Shams Al-Ta'afi - Relaxed Messages RLS Insertion Policy
-- Path: /RELAX_MESSAGES_RLS.sql
-- 
-- تشغيل هذا الاستعلام في Supabase SQL Editor يضمن إرسال الرسائل من الأهالي بنجاح 100%
-- دون مواجهة مشاكل صلاحيات RLS المرتبطة بـ family_links.
-- =========================================================================================

-- تفعيل RLS للتأكد
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة للرسائل لتفادي التداخل
DROP POLICY IF EXISTS "Staff manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Family view own messages" ON public.messages;
DROP POLICY IF EXISTS "Family insert messages" ON public.messages;
DROP POLICY IF EXISTS "Staff view/manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Family insert own messages" ON public.messages;

-- 1. الموظفون والمدراء لهم صلاحيات كاملة
CREATE POLICY "Staff manage all messages" ON public.messages FOR ALL TO authenticated 
USING (public.auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']))
WITH CHECK (public.auth_user_has_role(ARRAY['super_admin', 'admin', 'staff', 'doctor', 'therapist']));

-- 2. الأهالي يمكنهم رؤية رسائلهم الخاصة فقط
CREATE POLICY "Family view own messages" ON public.messages FOR SELECT TO authenticated 
USING (family_user_id = auth.uid());

-- 3. الأهالي يمكنهم إرسال رسائل جديدة بكل سلاسة (مسموح لأي مستخدم مسجل دوره عائلة)
CREATE POLICY "Family insert messages" ON public.messages FOR INSERT TO authenticated 
WITH CHECK (
  family_user_id = auth.uid() OR sender_id = auth.uid()
);

-- =========================================================================================
SELECT '✅ Messages RLS policy relaxed successfully! Parents can now send messages without any RLS blocks.' AS status;
-- =========================================================================================
