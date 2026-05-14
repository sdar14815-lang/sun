-- =====================================================
-- فحص سريع: هل المستخدمون لديهم profiles؟
-- شغّل هذا في Supabase SQL Editor
-- =====================================================

-- 1. اعرض كل auth users وحالة الـ profile
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL AS email_confirmed,
  p.id AS profile_id,
  p.role,
  p.status,
  p.username,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.status = 'disabled' THEN '🔴 DISABLED'
    WHEN p.role = 'family' THEN '✅ FAMILY OK'
    ELSE '✅ ' || p.role
  END AS diagnosis
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- =====================================================
-- 2. أنشئ profiles لأي حساب ليس له profile (آمن)
-- =====================================================
INSERT INTO public.profiles (id, full_name, username, email, role, status)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'User') AS full_name,
  split_part(au.email, '@', 1) AS username,
  au.email,
  CASE 
    WHEN au.email LIKE '%@family.shams.com' THEN 'family'::public.user_role
    ELSE 'family'::public.user_role
  END AS role,
  'active'::public.account_status AS status
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. تأكد من النتيجة
-- =====================================================
SELECT 
  au.email,
  p.role,
  p.status,
  p.username,
  '✅ OK' AS status_check
FROM auth.users au
JOIN profiles p ON p.id = au.id
WHERE au.email LIKE '%@family.shams.com'
ORDER BY au.created_at DESC;

SELECT '✅ Done! All family users now have profiles.' AS result;
