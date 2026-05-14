# FAMILY PORTAL INTEGRATION REPORT
## تقرير تكامل بوابة الأهالي

---

## 1. نظرة عامة

البوابة موجودة داخل مشروع Next.js الحالي تحت `/family/*`
**لا يوجد مشروع منفصل** — نفس الـ Supabase، نفس الكود، نفس قاعدة البيانات.

---

## 2. الصفحات والمسارات

| المسار | الملف | الوظيفة |
|--------|-------|----------|
| `/family/login` | `family/login/page.tsx` | تسجيل الدخول + التحقق من الدور |
| `/family/dashboard` | `family/dashboard/page.tsx` | الرئيسية مع ملخص |
| `/family/resident` | `family/resident/page.tsx` | ملف المقيم + التحديثات |
| `/family/reports` | `family/reports/page.tsx` | التقارير المنشورة |
| `/family/news` | `family/news/page.tsx` | الأخبار العامة |
| `/family/gallery` | `family/gallery/page.tsx` | معرض الصور + Lightbox |
| `/family/messages` | `family/messages/page.tsx` | الرسائل + إرسال جديدة |
| `/family/notifications` | `family/notifications/page.tsx` | الإشعارات |

---

## 3. المكونات المشتركة

### FamilyNavbar.tsx
- يظهر في كل صفحات `/family/*`
- يحتوي على header وtabs navigation
- زر الخروج يوجه إلى `/family/login`

### مكتبة Supabase
- نفس `src/lib/supabase.ts`
- نفس الـ anon key — RLS تحمي البيانات

---

## 4. التحقق من الهوية في كل صفحة

```typescript
// كل صفحة portal تتحقق من:
1. هل المستخدم مسجل دخول؟
2. هل role === 'family'؟
3. هل status === 'active'؟
// إذا فشل أي شرط → redirect إلى /family/login
```

---

## 5. البيانات المعروضة في كل صفحة

### /family/dashboard
```sql
SELECT * FROM family_links WHERE family_user_id = auth.uid() AND is_active = true
SELECT * FROM residents WHERE id IN (linked resident IDs) -- RLS enforced
SELECT * FROM resident_updates WHERE visible_to_family = true -- RLS enforced
SELECT count(*) FROM notifications WHERE user_id = auth.uid() AND is_read = false
```

### /family/resident
```sql
SELECT * FROM residents -- RLS: only linked residents
SELECT * FROM resident_updates WHERE visible_to_family = true -- RLS enforced
-- notes_internal is NEVER queried in portal
-- notes_visible_to_family IS shown
```

### /family/reports
```sql
SELECT * FROM weekly_reports
-- RLS Policy applies:
-- visible_to_family = true AND status = 'published'
-- AND EXISTS (family_links where linked and can_view_reports = true)
```

### /family/news
```sql
SELECT * FROM news WHERE is_published = true ORDER BY sort_order, created_at DESC
```

### /family/gallery
```sql
SELECT * FROM gallery WHERE is_visible = true
-- RLS: general type OR resident type where linked and can_view_photos = true
```

### /family/messages
```sql
-- Read: SELECT * FROM messages WHERE family_user_id = auth.uid()
-- Write: INSERT INTO messages (family_user_id, resident_id, message)
-- Shows reply_text from admin in the same thread
```

### /family/notifications
```sql
SELECT * FROM notifications WHERE user_id = auth.uid() ORDER BY created_at DESC
-- Auto mark as read on page visit
UPDATE notifications SET is_read = true WHERE user_id = auth.uid() AND is_read = false
```

---

## 6. ما لا تستطيع الأسرة رؤيته (مضمون بـ RLS)

- ❌ بيانات مقيمين آخرين
- ❌ notes_internal لأي مقيم
- ❌ تقارير Draft أو visible_to_family=false
- ❌ تحديثات visible_to_family=false
- ❌ صور Private لمقيمين آخرين
- ❌ رسائل أسر أخرى
- ❌ إشعارات أسر أخرى
- ❌ أي صفحة /dashboard/*

---

## 7. Design System

- تصميم موحد مع الـ Dashboard (نفس globals.css)
- الألوان: أزرق داكن #1A365D + ذهبي #D4AF37
- خط Cairo من Google Fonts
- RTL بالكامل
- تصميم متجاوب
