# FAMILY ACCESS SECURITY TEST
## اختبارات أمان وصول الأهالي

---

## الاختبارات المطلوبة (12 سيناريو)

### ✅ 1. أدمن يضيف خبر → يظهر في Portal/App

**الطريقة:**
- Admin: `/news/add` → is_published = true → حفظ
- Family: `/family/news`

**الشرط:** `SELECT * FROM news WHERE is_published = true`
**RLS Policy:** `"Anyone can view published news" ON news FOR SELECT USING (is_published = TRUE)`
**النتيجة المتوقعة:** الخبر يظهر ✅

---

### ✅ 2. أدمن يخفي خبر → يختفي من Portal/App

**الطريقة:**
- Admin: في جدول news → تغيير is_published = false
- Family: تحديث /family/news

**النتيجة المتوقعة:** الخبر يختفي ✅

---

### ✅ 3. تحديث visible_to_family=true → يظهر لأهل المقيم فقط

**الطريقة:**
- Admin: `/updates` → إضافة تحديث لمقيم A → visible=true
- Family A: `/family/resident`

**RLS Policy:**
```sql
CREATE POLICY "Family can view linked resident updates" ON resident_updates
FOR SELECT USING (
  visible_to_family = TRUE AND
  EXISTS (SELECT 1 FROM family_links 
          WHERE family_user_id = auth.uid() 
          AND resident_id = resident_updates.resident_id 
          AND is_active = true)
);
```
**النتيجة المتوقعة:** يظهر لأهل A فقط ✅

---

### ✅ 4. تحديث visible_to_family=false → لا يظهر

**الطريقة:**
- Admin: إضافة تحديث لمقيم A → visible=false
- Family A: `/family/resident`

**النتيجة المتوقعة:** التحديث مخفي ✅

---

### ✅ 5. أهل A لا يرون مقيم B

**الآلية:**
- family_links جدول يحدد العلاقة
- RLS على residents تسمح فقط للمقيمين المرتبطين

**RLS Policy:**
```sql
CREATE POLICY "Family can view linked residents" ON residents
FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_links 
          WHERE family_user_id = auth.uid() 
          AND resident_id = residents.id 
          AND is_active = true)
);
```
**النتيجة المتوقعة:** أهل A يرون A فقط ✅

---

### ✅ 6. أهل B لا يرون مقيم A

**نفس الآلية** — كل أسرة ترى مقيميها المرتبطين فقط
**النتيجة المتوقعة:** ✅

---

### ✅ 7. تقرير Draft لا يظهر للأهل

**الشرط:** `status = 'published'` مطلوب في RLS
**RLS Policy:**
```sql
CREATE POLICY "Family can view reports" ON weekly_reports
FOR SELECT USING (
  visible_to_family = TRUE AND
  status = 'published' AND
  EXISTS (SELECT 1 FROM family_links WHERE ...)
);
```
**النتيجة المتوقعة:** Draft لا يظهر أبداً ✅

---

### ✅ 8. نشر التقرير + visible=true → يظهر للأهل

**الطريقة:**
- Admin: في /reports → click "● مسودة" يتحول إلى "✓ منشور"
- Admin: click "🙈 مخفي" يتحول إلى "👁 مرئي"
- Family: `/family/reports`

**النتيجة المتوقعة:** التقرير يظهر ✅

---

### ✅ 9. أسرة ترسل رسالة من Portal → تظهر في Dashboard

**الطريقة:**
- Family: `/family/messages` → "رسالة جديدة" → إرسال
- Admin: `/messages` Inbox

**RLS INSERT Policy:**
```sql
CREATE POLICY "Family can insert messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = family_user_id AND
  EXISTS (SELECT 1 FROM family_links WHERE ...)
);
```
**النتيجة المتوقعة:** الرسالة تظهر في Inbox ✅

---

### ✅ 10. إدارة ترد من Dashboard → يظهر في Portal/App

**الطريقة:**
- Admin: `/messages` → click Reply → اكتب الرد → إرسال
- UPDATE messages SET reply_text='...' WHERE id=X
- Family: `/family/messages` → reply_text يظهر تحت الرسالة

**النتيجة المتوقعة:** الرد يظهر ✅

---

### ✅ 11. Family user يحاول /dashboard → يُمنع

**الآلية:** middleware.ts
```typescript
// Family user trying to access non-family routes
if (!isFamilyRoute && FAMILY_ROLES.includes(userRole)) {
  return NextResponse.redirect(new URL('/family/dashboard', req.url));
}
```
**النتيجة المتوقعة:** redirect إلى /family/dashboard ✅

---

### ✅ 12. Staff يحاول /family → يُمنع

**الآلية:** middleware.ts
```typescript
// Staff trying to access family portal
if (isFamilyRoute && STAFF_ROLES.includes(userRole)) {
  return NextResponse.redirect(new URL('/', req.url));
}
```
**النتيجة المتوقعة:** redirect إلى / (Dashboard) ✅

---

## ملاحظات مهمة

### قبل الاختبار الفعلي، تأكد من:
1. تشغيل `schema_v2_additions.sql` في Supabase
2. وجود مستخدم بدور `family` في جدول profiles
3. وجود `family_links` يربطه بمقيم
4. تفعيل Auth Logic في middleware.ts (حالياً معلق للتطوير)

### لاختبار RLS بشكل مستقل:
```sql
-- في Supabase SQL Editor
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "FAMILY_USER_UUID"}';

-- اختبار: هل يرى تحديثات مقيم آخر؟
SELECT * FROM resident_updates WHERE resident_id = 'OTHER_RESIDENT_UUID';
-- النتيجة المتوقعة: 0 rows
```

### طبقات الأمان:
1. **Middleware** — Route-level blocking
2. **Page-level auth check** — كل صفحة تتحقق من الدور
3. **RLS** — Database-level, لا يمكن تجاوزه من Frontend
4. **anon key فقط** — لا service key في أي Frontend code
