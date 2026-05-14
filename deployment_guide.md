# دليل نشر وتجهيز تطبيق دار شمس التعافي

هذا الدليل يشرح الخطوات النهائية لنشر النظام للعمل بشكل حي (Production).

## 1. إعداد Supabase (الخادم)
1. **قاعدة البيانات**: ارفع ملف `supabase/schema.sql` إلى SQL Editor في Supabase وقم بتشغيله.
2. **التخزين (Storage)**: أنشئ Bucket باسم `gallery` واجعله Public، وآخر باسم `resident-photos` واجعله Private (مع RLS).
3. **المفاتيح**: احصل على `URL` و `Anon Key` من إعدادات API في Supabase.

## 2. نشر لوحة التحكم (Web Dashboard)
1. اذهب لمجلد `dashboard`.
2. أنشئ ملف `.env.local` وضع فيه:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. يمكنك النشر على **Vercel** أو **Netlify** بسهولة بربط مستودع GitHub.

## 3. نشر تطبيق الموبايل (Flutter)
### للأندرويد (Google Play):
1. قم بتغيير `package name` في `android/app/build.gradle`.
2. أنشئ `keystore` للتوقيع الرقمي.
3. قم بتشغيل الأمر: `flutter build appbundle`.
4. ارفع الملف الناتج في `build/app/outputs/bundle/release/app-release.aab` إلى Google Play Console.

### للآيفون (App Store):
1. افتح المشروع في Xcode.
2. اضبط `Bundle Identifier` و `Team`.
3. قم بتشغيل `flutter build ios`.
4. من Xcode، اختر `Product > Archive` ثم ارفع النسخة إلى App Store Connect.

## 4. إعدادات الأمان النهائية
- تأكد من تفعيل **Email Confirmation** في Supabase Auth لمنع الحسابات الوهمية.
- قم بتغيير كلمات المرور الافتراضية لأي حسابات تجريبية.
- راقب الـ **Audit Logs** في قاعدة البيانات للتأكد من سلامة العمليات.

## 5. الدعم الفني
لأي مشاكل في الربط أو النشر، يرجى التواصل مع فريق التطوير.
