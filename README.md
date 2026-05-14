# نظام إدارة دار شمس التعافي (Dar Shams Al-Ta'afi)

هذا المشروع هو نظام متكامل لإدارة مصحات الطب النفسي وعلاج الإدمان، يتكون من لوحة تحكم للموظفين وتطبيق موبايل للأهالي.

## هيكل المشروع

- `/supabase`: يحتوي على مخطط قاعدة البيانات وقواعد الأمان (RLS).
- `/dashboard`: لوحة التحكم (Next.js) للموظفين.
- `/mobile_app`: تطبيق الموبايل (Flutter) للأهالي.

## التقنيات المستخدمة

- **Frontend Dashboard**: Next.js, React, Vanilla CSS, Lucide Icons.
- **Mobile App**: Flutter, Supabase Flutter SDK, Google Fonts.
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS).

## تعليمات التشغيل

### 1. قاعدة البيانات (Supabase)
1. قم بإنشاء مشروع جديد على [Supabase](https://supabase.com).
2. انسخ محتويات `supabase/schema.sql` وقم بتشغيلها في الـ SQL Editor الخاص بـ Supabase.
3. تأكد من تفعيل Row Level Security (RLS) لضمان الخصوصية.

### 2. لوحة التحكم (Dashboard)
1. ادخل إلى مجلد `dashboard`.
2. قم بتثبيت الاعتمادات: `npm install`.
3. قم بتشغيل بيئة التطوير: `npm run dev`.
4. افتح `http://localhost:3000`.

### 3. تطبيق الموبايل (Flutter)
1. ادخل إلى مجلد `mobile_app`.
2. قم بتثبيت الاعتمادات: `flutter pub get`.
3. تأكد من إعداد بيانات Supabase في `lib/main.dart`.
4. قم بتشغيل التطبيق: `flutter run`.

## الأمان والخصوصية
تم تصميم النظام بحيث لا يمكن لأي حساب "أهل" الوصول إلى بيانات مقيم غير مرتبط به برمجياً من خلال قاعدة البيانات (RLS)، مما يضمن أقصى درجات الخصوصية الطبية.

## تواصل معنا
للمساعدة الفنية أو الاستفسارات: 01115540077
