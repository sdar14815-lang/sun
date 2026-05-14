# دليل رفع المشروع إلى Cloudflare Pages 🚀

هذا الدليل يشرح الخطوات اللازمة لرفع مشروع "دار شمس التعافي" على منصة Cloudflare Pages لضمان عمله بأفضل أداء واستقرار.

---

## 1. التجهيزات الأولية (Prerequisites)
*   يجب أن يكون المشروع مرفوعاً على مستودع (Repository) في **GitHub** أو **GitLab**.
*   تأكد من وجود مفاتيح Supabase الخاصة بك جاهزة.

---

## 2. خطوات الرفع عبر لوحة تحكم Cloudflare

1.  قم بتسجيل الدخول إلى [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  انتقل إلى **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3.  اختر المستودع الخاص بالمشروع.
4.  في إعدادات البناء (**Build settings**)، قم بتعيين القيم التالية:
    *   **Framework preset**: اختر `Next.js`.
    *   **Build command**: `npm run pages:build` (أو `npm run build` في حال دعم Cloudflare لـ Next.js مباشرة).
    *   **Build output directory**: `.vercel/output` (هذا ما ينتجه محول Cloudflare).
    *   **Root directory**: `/` (أو `/dashboard` إذا كان المشروع داخل مجلد فرعي).

---

## 3. إعداد متغيرات البيئة (Environment Variables)

يجب إضافة المفاتيح التالية في قسم **Settings** > **Environment variables** داخل مشروع Pages:

| المفتاح | الوصف |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط Supabase URL الخاص بك |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح Anon Key العام |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح Service Role (مهم جداً لعمليات الإدارة) |

---

## 4. إعدادات التوافق (Compatibility Settings) - **هام جداً**

لأن المشروع يستخدم ميزات App Router و API Routes، يجب تفعيل توافق Node.js:
1.  داخل مشروعك في Cloudflare Pages، اذهب إلى **Settings** > **Functions**.
2.  في قسم **Compatibility flags**، ابحث عن **Production** و **Preview**.
3.  أضف الفلاج التالي: `nodejs_compat`.

---

## 5. الأوامر البرمجية المفيدة محلياً

إذا أردت تجربة البناء محلياً قبل الرفع للتأكد من عدم وجود أخطاء:

```bash
# بناء المشروع لـ Cloudflare
npm run pages:build

# تجربة التشغيل محلياً باستخدام wrangler
npx wrangler pages dev .vercel/output
```

---

## 6. ملاحظات هامة
*   **Edge Runtime**: المشروع مهيأ للعمل على "الحافة" (Edge) لضمان السرعة العالية في الاستجابة.
*   **Database Access**: تأكد أن قاعدة بيانات Supabase تسمح بالوصول من أي مكان (IP Restrictions) أو تأكد من إعداد RLS بشكل صحيح كما فعلنا سابقاً.

مبروك! بمجرد الضغط على **Save and Deploy**، سيقوم Cloudflare ببناء مشروعك وتوفير رابط خاص به (مثلاً: `dar-shams.pages.dev`).
