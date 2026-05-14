# دليل تجهيز ونشر مشروع "دار شمس التعافي" (Project Setup & Deployment Guide)

هذا الدليل يحتوي على التعليمات الكاملة لربط وتشغيل المشروع من الصفر للوصول إلى مرحلة الإنتاج.

---

## أولاً: تجهيز Supabase (قاعدة البيانات والسيرفر)

1. **إنشاء المشروع**:
   - قم بإنشاء حساب على [Supabase](https://supabase.com).
   - أنشئ مشروعاً جديداً باسم `Dar Shams Recovery`.
   - انسخ `Project URL` و `Anon Key` لاستخدامهما لاحقاً.

2. **رفع المخطط (Schema)**:
   - اذهب إلى `SQL Editor` في لوحة تحكم Supabase.
   - افتح ملف `supabase/schema.sql` من المشروع.
   - انسخ الكود بالكامل والصقه في Editor ثم اضغط `Run`.
   - سيقوم هذا بإنشاء الجداول، أنواع البيانات، وقواعد الأمان (RLS) تلقائياً.

3. **إعداد التخزين (Storage Buckets)**:
   - اذهب إلى قسم `Storage`.
   - تأكد من وجود Bucket باسم `gallery` (عام/Public) للصور العامة للمصحة.
   - تأكد من وجود Bucket باسم `residents` (خاص/Private) لصور المقيمين الحساسة.
   - السياسات (Policies) تم تفعيلها بالفعل عبر ملف `schema.sql`.

4. **إنشاء أول Super Admin**:
   - اذهب إلى `Authentication > Users`.
   - أضف مستخدماً جديداً (البريد الإلكتروني الخاص بك).
   - بعد التأكيد، اذهب إلى `SQL Editor` وقم بتحديث دور المستخدم في جدول `profiles`:
     ```sql
     UPDATE profiles SET role = 'super_admin' WHERE id = 'user_uuid_here';
     ```

5. **ربط الأهالي بالمقيمين**:
   - لربط حساب أسرة بمقيم، قم بإضافة سجل في جدول `family_links` يربط بين `family_user_id` و `resident_id`.

---

## ثانياً: ربط لوحة التحكم (Web Dashboard)

1. **إعداد البيئة**:
   - أنشئ ملف `.env.local` في مجلد `dashboard`.
   - أضف القيم التالية:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

2. **التشغيل**:
   - نفذ الأوامر التالية بالترتيب:
     ```bash
     npm install
     npm run dev   # للتطوير المحلي
     npm run build # لبناء نسخة الإنتاج
     npm start     # لتشغيل نسخة الإنتاج
     ```

3. **النشر (Deployment)**:
   - أفضل وسيلة هي **Vercel**: اربط مستودع GitHub الخاص بك وسيتم النشر تلقائياً مع إضافة Environment Variables في إعدادات Vercel.

---

## ثالثاً: ربط تطبيق الموبايل (Flutter App)

1. **تحديث الإعدادات**:
   - افتح ملف `mobile_app/lib/main.dart`.
   - قم بتحديث قيم `url` و `anonKey` في وظيفة `Supabase.initialize`.

2. **تجهيز الموبايل**:
   - تأكد من تثبيت Flutter SDK.
   - نفذ الأوامر:
     ```bash
     flutter pub get
     flutter run
     ```

3. **تغيير الهوية**:
   - **الاسم**: عدله في `AndroidManifest.xml` للاندرويد و `Info.plist` للـ iOS.
   - **الأيقونة**: استخدم مكتبة `flutter_launcher_icons`.
   - **Package Name**: استخدم `flutter_rename_app` أو قم بتغييره يدوياً في ملفات Gradle و Xcode.

4. **البناء (Build)**:
   - أندرويد: `flutter build apk` أو `flutter build appbundle`.
   - آيفون: `flutter build ios`.

---

## رابعاً: قائمة اختبار الصلاحيات (Test Checklist)

تأكد من فحص النقاط التالية قبل التسليم:
- [ ] **الخصوصية**: هل يستطيع حساب "أسرة أ" رؤية بيانات "مقيم ب"؟ (يجب أن يفشل).
- [ ] **الأمان**: هل يمكن الوصول لصفحة `/residents` بدون تسجيل دخول؟ (يجب أن يتم التحويل لـ Login).
- [ ] **الصور**: هل الصور في Bucket `residents` تفتح برابط مباشر بدون Session؟ (يجب أن تمنع).
- [ ] **التقارير**: هل التقارير التي قيمتها `visible_to_family = false` تظهر في تطبيق الموبايل؟ (يجب ألا تظهر).
- [ ] **الربط**: عند إضافة خبر في الـ Dashboard، هل يظهر فوراً في الموبايل؟ (يجب أن يظهر).

---

## خامساً: معالجة الأخطاء (Troubleshooting)

- **خطأ 403 (Forbidden)**: راجع الـ RLS Policies في Supabase، تأكد أن المستخدم لديه Role صحيح في جدول `profiles`.
- **خطأ Session**: تأكد من أن الـ Middleware في Next.js يعمل بشكل صحيح (Cookie based auth).
- **مشاكل RTL**: تم استخدام `direction: rtl` في CSS و `Locale('ar')` في Flutter لضمان الاتساق.
