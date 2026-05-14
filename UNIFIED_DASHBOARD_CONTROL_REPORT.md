# UNIFIED DASHBOARD CONTROL REPORT
## دار شمس التعافي — لوحة التحكم المركزية الموحدة

---

## 1. نظرة عامة على المعمارية

```
┌─────────────────────────────────────────────┐
│         Admin Dashboard (Next.js)            │
│  /residents /updates /reports /news          │
│  /gallery /messages /notifications /families │
└──────────────────┬──────────────────────────┘
                   │ Write / Read All
                   ▼
┌─────────────────────────────────────────────┐
│      Supabase (Single Source of Truth)       │
│  RLS Policies enforced on every query        │
│  Tables: profiles, residents, family_links,  │
│  resident_updates, weekly_reports, news,     │
│  gallery, messages, notifications            │
└────────────┬─────────────────┬──────────────┘
             │ Read Only        │ Read Only
             ▼ (RLS filtered)   ▼ (RLS filtered)
┌────────────────────┐  ┌───────────────────────┐
│  Family Web Portal  │  │    Flutter Mobile App  │
│  /family/dashboard  │  │  HomeScreen            │
│  /family/resident   │  │  ResidentProfileScreen │
│  /family/reports    │  │  ReportsScreen         │
│  /family/news       │  │  GalleryScreen         │
│  /family/gallery    │  │  NotificationsScreen   │
│  /family/messages   │  │  ContactScreen         │
│  /family/notifs     │  │  MessagesScreen        │
└────────────────────┘  └───────────────────────┘
```

---

## 2. كيف تتحكم Dashboard في البيانات

| الإجراء في Dashboard | التأثير في Portal/App |
|---------------------|----------------------|
| إضافة خبر + نشره | يظهر فوراً في /family/news + Flutter |
| إخفاء خبر (is_published=false) | يختفي من Portal/App |
| إضافة تحديث مقيم (visible_to_family=true) | يظهر لأهل هذا المقيم فقط |
| إضافة تحديث (visible_to_family=false) | لا يظهر لأحد في Portal/App |
| نشر تقرير (status=published + visible=true) | يظهر للأهل المرتبطين |
| تقرير Draft أو visible=false | لا يظهر أبداً للأهالي |
| الرد على رسالة | يظهر الرد فوراً في /family/messages |
| إرسال إشعار | يظهر في /family/notifications + Flutter |
| رفع صورة عامة | تظهر في /family/gallery للجميع |
| رفع صورة مقيم (resident type) | تظهر لأهل هذا المقيم فقط |

---

## 3. الجداول ودورها

### profiles
- يحتوي على كل المستخدمين (أدمن + أهالي)
- role يحدد نوع الوصول
- status: active/inactive لإيقاف الحساب

### residents
- بيانات المقيمين الكاملة
- notes_internal: لا تُرى للأهالي أبداً
- notes_visible_to_family: تُرى للأهل في Portal

### family_links
- يربط أسرة بمقيم
- can_view_reports, can_view_photos: صلاحيات تفصيلية
- is_active: لتعطيل الرابط

### resident_updates
- visible_to_family: المفتاح الرئيسي للظهور في Portal/App
- update_type: general/specialist_note/doctor_note/session_attendance/behavioral_progress/family_alert

### weekly_reports
- status: draft/published
- visible_to_family: شرط إضافي
- كلاهما يجب أن يكون مفعّلاً للظهور للأهالي

### messages
- reply_text: نص رد الإدارة (يظهر في Portal/App)
- replied_at, replied_by: توثيق الرد

### notifications
- user_id: مستلم محدد
- is_general: للإعلانات العامة
- is_read: تُحدّث تلقائياً عند الفتح

---

## 4. صلاحيات الأدوار

| الدور | Dashboard | Family Portal | Flutter App |
|-------|-----------|---------------|-------------|
| super_admin | ✅ كامل | ❌ ممنوع | ❌ غير مخصص |
| staff | ✅ كامل | ❌ ممنوع | ❌ غير مخصص |
| doctor | ✅ (بدون إدارة أهالي) | ❌ ممنوع | ❌ غير مخصص |
| therapist | ✅ (بدون إدارة أهالي) | ❌ ممنوع | ❌ غير مخصص |
| family | ❌ ممنوع | ✅ قراءة فقط + رسائل | ✅ قراءة فقط + رسائل |

---

## 5. الصفحات المنجزة

### Dashboard (Control Center)
- `/` — الرئيسية مع إحصائيات حية
- `/residents` — قائمة المقيمين + حذف
- `/residents/add` — إضافة مقيم مع رقم ملف تلقائي
- `/residents/[id]` — عرض مقيم
- `/updates` — **جديد** إضافة تحديثات يومية + toggle visible_to_family
- `/reports` — قائمة التقارير + toggle publish/visibility
- `/reports/add` — إنشاء تقرير جديد مع نوع ودرجة تقدم
- `/news` — إدارة الأخبار
- `/news/add` — إضافة خبر
- `/gallery` — معرض الصور
- `/families` — إدارة حسابات الأهالي
- `/families/add` — إنشاء حساب أسرة
- `/messages` — **محدّث** Inbox كامل مع ردود
- `/notifications` — **جديد** إرسال إشعارات (فردية / جماعية)

### Family Portal (Read Only)
- `/family/login` — تسجيل دخول بالتحقق من الدور
- `/family/dashboard` — رئيسية الأهل مع ملخص
- `/family/resident` — ملف المقيم + التحديثات المرئية
- `/family/reports` — التقارير المنشورة
- `/family/news` — الأخبار المنشورة
- `/family/gallery` — صور المصحة + صور المقيم
- `/family/messages` — الرسائل + إرسال جديدة
- `/family/notifications` — الإشعارات الخاصة

---

## 6. أقسام كانت شكلية وتم تشغيلها

| الوظيفة | الحالة السابقة | الحالة الحالية |
|---------|----------------|----------------|
| زر الرد في الرسائل | شكلي | ✅ يحفظ ويظهر في Portal |
| تغيير حالة الرسالة | جزئي | ✅ sent/read/replied |
| نشر/إخفاء التقارير | غير موجود | ✅ toggle مباشر في الجدول |
| visible_to_family التقارير | غير موجود | ✅ toggle مباشر |
| إرسال إشعارات | غير موجود | ✅ صفحة كاملة |
| التحديثات اليومية | غير موجود | ✅ صفحة كاملة |
| Family Portal | غير موجود | ✅ 8 صفحات |
| Middleware routing | معطل | ✅ role-based routing |

---

## 7. مشاكل متبقية / ملاحظات

1. **Schema V2**: تأكد من تشغيل `schema_v2_additions.sql` في Supabase SQL Editor
2. **Flutter Messages Screen**: لم يُنشأ مكوّن messages في Flutter (يمكن إضافته مستقبلاً)
3. **تصدير PDF**: غير مطبّق حالياً (يحتاج مكتبة إضافية)
4. **البيئة الإنتاجية**: يجب تفعيل الـ Auth Logic في middleware.ts
