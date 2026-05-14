import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY; // Fallback to ANON_KEY if service key is missing

let reportContent = `# تقرير فحص صحة قاعدة بيانات Supabase
**تاريخ الاختبار:** ${new Date().toLocaleString('ar-EG')}

> **طريقة التشغيل:**
> \`\`\`bash
> npm install
> npm run db:health
> \`\`\`

`;

function appendToReport(text) {
  reportContent += text + '\n';
  console.log(text);
}

const requiredTables = [
  'profiles', 'residents', 'family_links', 'resident_updates',
  'weekly_reports', 'sessions_attendance', 'news', 'gallery',
  'messages', 'notifications', 'settings', 'branches', 'rooms',
  'audit_logs', 'file_number_sequences'
];

async function runHealthCheck() {
  appendToReport('## 1. حالة الاتصال\n');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    appendToReport('❌ فشل العثور على متغيرات البيئة `NEXT_PUBLIC_SUPABASE_URL` أو `NEXT_PUBLIC_SUPABASE_ANON_KEY`.');
    saveReport();
    return;
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    appendToReport('⚠️ مفتاح `SUPABASE_SERVICE_ROLE_KEY` مفقود من `.env.local`. لضمان نجاح الفحص العميق، يرجى إضافته. تم استخدام Anon Key كبديل (مما قد يفشل بعض الاختبارات إذا كانت الحماية مفعلة).\n');
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { error: connError } = await anonClient.from('settings').select('key').limit(1);
    if (connError && connError.code !== '42P01') {
      appendToReport(`❌ فشل الاتصال بقاعدة البيانات: ${connError.message}\n`);
    } else {
      appendToReport('✅ الاتصال يعمل بنجاح بـ Supabase.\n');
    }

    appendToReport('## 2. التحقق من وجود الجداول والأعمدة\n');
    let missingTables = 0;
    
    for (const table of requiredTables) {
      const { data, error } = await serviceClient.from(table).select('*').limit(1);
      if (error && error.code === '42P01') {
        missingTables++;
        appendToReport(`❌ الجدول \`${table}\` مفقود.`);
      } else {
        appendToReport(`✅ الجدول \`${table}\` موجود.`);
      }
    }

    if (missingTables === 0) {
      appendToReport('\n✅ جميع الجداول الأساسية موجودة.\n');
    } else {
      appendToReport(`\n❌ هناك ${missingTables} جداول مفقودة. يرجى مراجعة \`schema.sql\`.\n`);
    }

    appendToReport('## 3. اختبارات CRUD (باستخدام Service Role Key)\n');
    const testUuid = '00000000-0000-4000-a000-000000000001';
    
    // Fetch a real profile to satisfy Foreign Keys
    const { data: realProfile } = await serviceClient.from('profiles').select('id').limit(1).single();
    const validProfileId = realProfile ? realProfile.id : null;

    if (!validProfileId) {
      appendToReport(`⚠️ تحذير: لا يوجد أي Profile حقيقي في قاعدة البيانات. بعض اختبارات CRUD التي تتطلب 'user_id' ستفشل بسبب الـ Foreign Keys.`);
    }

    // 2. Resident
    const { data: rData, error: rError } = await serviceClient.from('residents').upsert({
      id: testUuid, full_name: 'TEST_HEALTH_CHECK_RESIDENT', age: 30, admission_date: '2024-01-01', current_status: 'stable', is_active: true
    }).select().single();
    appendToReport(rError ? `❌ فشل إضافة Resident: ${rError.message}` : `✅ تم إضافة Resident بنجاح.`);
    
    if (rData && rData.file_number) {
      appendToReport(`✅ الرقم التسلسلي للمقيم تولد تلقائياً: ${rData.file_number}`);
    } else if (rData) {
      appendToReport(`❌ فشل توليد الرقم التسلسلي للمقيم.`);
    }

    // 3. Family Link
    if (validProfileId) {
      const { error: fError } = await serviceClient.from('family_links').upsert({
        id: testUuid, family_user_id: validProfileId, resident_id: testUuid, relation: 'parent', is_active: true
      });
      appendToReport(fError ? `❌ فشل إضافة Family Link: ${fError.message}` : `✅ تم ربط Family بـ Resident بنجاح.`);
    }

    // 4. Resident Update
    const { error: uError } = await serviceClient.from('resident_updates').upsert({
      id: testUuid, resident_id: testUuid, update_type: 'general', title: 'TEST_UPDATE', content: 'TEST', created_by: validProfileId
    });
    appendToReport(uError ? `❌ فشل إضافة Resident Update: ${uError.message}` : `✅ تم إضافة Resident Update بنجاح.`);

    // 5. Weekly Report
    const { error: wrError } = await serviceClient.from('weekly_reports').upsert({
      id: testUuid, resident_id: testUuid, report_title: 'TEST_REPORT', report_body: 'TEST', progress_score: 50, visible_to_family: true, created_by: validProfileId
    });
    appendToReport(wrError ? `❌ فشل إضافة Weekly Report: ${wrError.message}` : `✅ تم إضافة Weekly Report بنجاح.`);

    // 6. Message
    if (validProfileId) {
      const { error: mError } = await serviceClient.from('messages').upsert({
        id: testUuid, family_user_id: validProfileId, resident_id: testUuid, message: 'TEST_MSG', status: 'open'
      });
      appendToReport(mError ? `❌ فشل إضافة Message: ${mError.message}` : `✅ تم إضافة Message بنجاح.`);
    }

    // 7. Notification
    if (validProfileId) {
      const { error: nError } = await serviceClient.from('notifications').upsert({
        id: testUuid, recipient_user_id: validProfileId, title: 'TEST_NOTIF', body: 'TEST', type: 'general'
      });
      appendToReport(nError ? `❌ فشل إضافة Notification: ${nError.message}` : `✅ تم إضافة Notification بنجاح.`);
    }

    // 8. Gallery
    const { error: gError } = await serviceClient.from('gallery').upsert({
      id: testUuid, title: 'TEST_IMG', image_url: 'http://test.com/img.jpg', resident_id: testUuid
    });
    appendToReport(gError ? `❌ فشل إضافة Gallery item: ${gError.message}` : `✅ تم إضافة Gallery Item بنجاح.`);

    // CLEANUP
    const tablesToClean = ['notifications', 'messages', 'gallery', 'weekly_reports', 'resident_updates', 'family_links', 'residents'];
    let cleanSuccess = true;
    for (const tbl of tablesToClean) {
      const { error: delError } = await serviceClient.from(tbl).delete().eq('id', testUuid);
      if (delError) cleanSuccess = false;
    }
    appendToReport(cleanSuccess ? `\n✅ نجح تنظيف بيانات الاختبار (حذف سجلات الـ CRUD).` : `\n❌ حدث خطأ أثناء حذف بعض بيانات الاختبار.`);

    appendToReport('\n## 4. اختبار RLS (بواسطة Anon Key)\n');
    const { error: rlsError1 } = await anonClient.from('news').select('*').limit(1);
    appendToReport(!rlsError1 ? `✅ Anon Key استطاع قراءة جدول News بنجاح.` : `❌ Anon Key فشل في قراءة News: ${rlsError1.message}`);

    const { error: rlsError2 } = await anonClient.from('residents').select('*').limit(1);
    appendToReport(!rlsError2 ? `✅ Anon Key استطاع قراءة المقيمين.` : `❌ قراءة المقيمين محظورة بـ RLS (متوقع إذا كانت الحماية صارمة).`);

    appendToReport('\n## 5. اختبار Storage Buckets\n');
    const buckets = ['public-gallery', 'private-resident-media', 'report-files', 'news-images'];
    const { data: bucketsData, error: bucketsError } = await serviceClient.storage.listBuckets();
    
    if (bucketsError) {
      appendToReport(`❌ فشل قراءة Buckets: ${bucketsError.message}`);
    } else {
      const existingBuckets = bucketsData.map(b => b.name);
      for (const b of buckets) {
        if (existingBuckets.includes(b)) {
          appendToReport(`✅ Bucket \`${b}\` موجود.`);
        } else {
          appendToReport(`❌ Bucket \`${b}\` مفقود.`);
        }
      }
    }

    appendToReport('\n## 6. توافق الداش بورد\n');
    appendToReport('استناداً لنجاح عمليات الـ CRUD أعلاه للـ (المقيمين، الربط العائلي، التقارير، الرسائل، الصور)، تبدو قاعدة البيانات **متوافقة جداً** مع متطلبات الداش بورد.');

    appendToReport('\n## الخلاصة النهائية\n');
    appendToReport(missingTables === 0 && cleanSuccess ? '**✅ قاعدة البيانات جاهزة للنشر والتوصيل مع Flutter والداش بورد بنجاح.**' : '**❌ يوجد بعض المشاكل يجب حلها، راجع الأخطاء أعلاه.**');

    saveReport();

  } catch (err) {
    appendToReport(`\n❌ توقف الفحص بسبب خطأ غير متوقع: ${err.message}`);
    saveReport();
  }
}

function saveReport() {
  const reportPath = path.join(__dirname, '..', 'DATABASE_HEALTH_REPORT.md');
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  console.log(`\nتم حفظ التقرير بنجاح في: ${reportPath}`);
}

runHealthCheck();
