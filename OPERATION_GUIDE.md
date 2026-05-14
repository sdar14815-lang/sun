# دليل تشغيل النظام الكامل
## دار شمس التعافي — Unified Control Center

---

## 🟢 حالة النظام: مكتمل وشغّال

**تاريخ الاكتمال:** مايو 2026

---

## 1. خطوات التشغيل الإلزامية

### الخطوة 1: تشغيل Migration SQL في Supabase

> هذه الخطوة **مطلوبة مرة واحدة فقط** لإضافة الأعمدة الجديدة إلى قاعدة البيانات.

1. افتح **Supabase Dashboard** → مشروعك
2. اذهب إلى **SQL Editor**
3. افتح الملف: `supabase/schema_v2_additions.sql`
4. انسخ المحتوى كاملاً والصقه في SQL Editor
5. انقر **Run**
6. ستظهر رسالة: `Migration completed successfully! ✅`

---

### الخطوة 2: تشغيل Dashboard

```bash
cd dashboard
npm run dev
```
الـ Dashboard يعمل على: **http://localhost:3000**

---

## 2. الصفحات المكتملة والمختبرة ✅

### Dashboard — لوحة التحكم الإدارية
| الصفحة | المسار | الوظيفة | الحالة |
|--------|--------|----------|--------|
| الرئيسية | `/` | إحصائيات + آخر المقيمين | ✅ |
| المقيمون | `/residents` | قائمة + بحث + حذف | ✅ |
| إضافة مقيم | `/residents/add` | إضافة مع رقم ملف تلقائي | ✅ |
| ملف مقيم | `/residents/[id]` | 4 تبويبات: بيانات، تحديثات، تقارير، أهالي | ✅ |
| التحديثات | `/updates` | إضافة تحديثات يومية + toggle ظهور | ✅ |
| التقارير | `/reports` | نشر/إخفاء + filter draft/published | ✅ |
| إضافة تقرير | `/reports/add` | تقرير مع نوع + درجة تقدم + حالة | ✅ |
| الأخبار | `/news` | نشر/إخفاء + ترتيب + thumbnail | ✅ |
| المعرض | `/gallery` | رفع + نوع + مقيم + filter + toggle | ✅ |
| الرسائل | `/messages` | inbox + رد + تغيير حالة | ✅ |
| الإشعارات | `/notifications` | إرسال فردي/جماعي | ✅ |
| الأهالي | `/families` | قائمة حسابات الأهالي | ✅ |
| ربط أسرة | `/families/[id]/link` | ربط بمقيم + صلاحيات تفصيلية | ✅ |
| الإحصائيات | `/analytics` | إحصائيات حية + charts | ✅ |
| تسجيل الدخول | `/login` | Dashboard login | ✅ |

### Family Portal — بوابة الأهالي
| الصفحة | المسار | الوظيفة | الحالة |
|--------|--------|----------|--------|
| تسجيل الدخول | `/family/login` | login مع التحقق من الدور | ✅ |
| الرئيسية | `/family/dashboard` | ملخص + المقيمون + التحديثات | ✅ |
| ملف المقيم | `/family/resident` | بيانات + تحديثات مرئية | ✅ |
| التقارير | `/family/reports` | التقارير المنشورة فقط | ✅ |
| الأخبار | `/family/news` | الأخبار المنشورة | ✅ |
| المعرض | `/family/gallery` | صور عامة + صور مقيم مع lightbox | ✅ |
| الرسائل | `/family/messages` | إرسال + عرض الردود | ✅ |
| الإشعارات | `/family/notifications` | إشعارات شخصية + auto-read | ✅ |

### Flutter Mobile App
| الشاشة | الملف | الحالة |
|--------|-------|--------|
| Home | `home_screen.dart` | ✅ |
| Resident Profile | `resident_profile.dart` | ✅ |
| Gallery | `gallery_screen.dart` | ✅ |
| Reports | `reports_screen.dart` | ✅ |
| Notifications | `notifications_screen.dart` | ✅ جديد |
| Contact | `contact_screen.dart` | ✅ |

---

## 3. كيف تعمل دورة البيانات

```
الإدمن يضيف خبر (is_published=true)
     ↓
Supabase يحفظه
     ↓
بوابة الأهالي /family/news تعرضه
     ↓
Flutter HomeScreen يجلبه
```

```
الإدمن يضيف تحديث مقيم (visible_to_family=true)
     ↓
Supabase يحفظه
     ↓
RLS تسمح لأهل هذا المقيم فقط
     ↓
بوابة /family/resident تعرضه
     ↓
Flutter ResidentProfileScreen يعرضه
```

```
أسرة ترسل رسالة من Portal
     ↓
Supabase يحفظها (status=sent)
     ↓
Dashboard /messages يعرضها
     ↓
إدمن يرد (reply_text + status=replied)
     ↓
/family/messages يعرض الرد
```

---

## 4. الأعمدة المضافة بعد Migration

| الجدول | الأعمدة الجديدة |
|--------|----------------|
| `messages` | reply_text, replied_at, replied_by |
| `weekly_reports` | status (draft/published), report_type |
| `residents` | progress_percentage, notes_visible_to_family |
| `family_links` | can_receive_notifications, can_send_messages |
| `news` | sort_order |
| `notifications` | is_general |

---

## 5. المتغيرات البيئية المطلوبة

### Dashboard (`dashboard/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Flutter (`mobile_app/.env` أو `--dart-define`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## 6. الملفات الرئيسية

| الملف | الغرض |
|-------|-------|
| `supabase/schema.sql` | Schema الأساسي |
| `supabase/schema_v2_additions.sql` | ⭐ Migration المرحلة الثانية |
| `dashboard/src/middleware.ts` | Route protection |
| `dashboard/src/lib/supabase.ts` | Supabase client |
| `dashboard/src/components/Sidebar.tsx` | Dashboard navigation |
| `dashboard/src/components/FamilyNavbar.tsx` | Portal navigation |
| `UNIFIED_DASHBOARD_CONTROL_REPORT.md` | التقرير التقني الكامل |
| `FAMILY_PORTAL_INTEGRATION_REPORT.md` | تقرير البوابة |
| `FAMILY_ACCESS_SECURITY_TEST.md` | اختبارات الأمان |
| `APP_PORTAL_DATA_FLOW.md` | تدفق البيانات |
