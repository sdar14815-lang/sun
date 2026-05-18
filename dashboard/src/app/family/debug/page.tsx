'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, User, Link2, CheckCircle2, AlertTriangle, Key, Users, RefreshCw } from 'lucide-react';
import FamilyNavbar from '@/components/FamilyNavbar';

export default function AdminDebugPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const addLog = (message: string) => {
    setDiagnosticLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnosticLog([]);
    addLog('بدء تشغيل أداة تشخيص صلاحيات نظام شمس...');

    try {
      // 1. Check Supabase Auth Session
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        addLog(`❌ خطأ في قراءة الجلسة: ${sessionErr.message}`);
      } else if (session) {
        addLog('✅ تم العثور على جلسة نشطة.');
        setSessionInfo(session);
      } else {
        addLog('⚠️ لا توجد جلسة نشطة حالية.');
      }

      // 2. Check Auth User
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        addLog(`❌ خطأ في قراءة بيانات المستخدم من Auth: ${userErr.message}`);
      } else if (user) {
        addLog(`✅ مستخدم مسجل الدخول: ID = ${user.id}, البريد الإلكتروني = ${user.email}`);
        setCurrentUser(user);

        // 3. Check corresponding Profile
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profErr) {
          addLog(`❌ خطأ في استدعاء جدول Profiles: ${profErr.message} (كود: ${profErr.code})`);
          addLog('💡 تلميح: قد يكون بسبب RLS أو عدم وجود بروفايل مطابق.');
        } else if (prof) {
          addLog(`✅ تم العثور على بروفايل مطابق: الاسم = ${prof.full_name}, الدور = ${prof.role}, الحالة = ${prof.status}`);
          setProfile(prof);

          // 4. Fetch Linked Residents
          const { data: lData, error: lErr } = await supabase
            .from('family_links')
            .select(`
              *,
              residents (
                id,
                full_name,
                file_number,
                current_stage,
                current_status,
                progress_score
              )
            `)
            .eq('family_user_id', user.id);

          if (lErr) {
            addLog(`❌ خطأ في استدعاء روابط المقيمين family_links: ${lErr.message}`);
          } else if (lData) {
            addLog(`✅ تم العثور على ${lData.length} روابط مقيمين مرتبطة.`);
            setLinks(lData);
          }
        }
      }

      // 5. Fetch all profiles (Admins/Staff only will succeed due to RLS)
      addLog('محاولة فحص جميع الحسابات Profiles (تتطلب دور أدمن/موظف لتخطي RLS)...');
      const { data: allProfs, error: allProfsErr } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (allProfsErr) {
        addLog(`⚠️ لم نتمكن من جلب جميع الحسابات: ${allProfsErr.message} (RLS يعمل بشكل صحيح لمنع المستخدمين العاديين).`);
      } else if (allProfs) {
        addLog(`✅ نجح جلب ${allProfs.length} بروفايلات عشوائية (أنت تمتلك صلاحية أدمن/موظف!).`);
        setAllProfiles(allProfs);
      }

    } catch (err: any) {
      addLog(`❌ خطأ غير متوقع: ${err.message}`);
    } finally {
      setLoading(false);
      addLog('اكتمل الفحص التشخيصي.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface, #F8FAFC)', paddingBottom: '6rem', direction: 'rtl' }}>
      <FamilyNavbar userName={profile?.full_name || 'مسؤول النظام'} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
        
        {/* Title Block */}
        <div className="fp-glass-card fp-animate" style={{ marginBottom: '2rem', padding: '1.5rem', borderRight: '6px solid #10B981', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0D2847', display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'Cairo, sans-serif' }}>
                <Shield size={26} color="#10B981" /> لوحة التشخيص والدعم الفني (Admin Debug)
              </h1>
              <p style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.3rem' }}>
                فحص فوري للتحقق من تكامل الحسابات، سياسات الحماية RLS، حالة الجلسة، والروابط العائلية.
              </p>
            </div>
            <button 
              onClick={runDiagnostic} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> تحديث الفحص
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Section 1: Auth & Token Info */}
          <div className="fp-glass-card" style={{ padding: '1.5rem', background: 'white' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0D2847', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <Key size={18} color="#F0A500" /> 1. جلسة الدخول وتكامل التوكن (Auth)
            </h2>
            {currentUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>حالة الاتصال:</span>
                  <span style={{ color: '#10B981', fontWeight: '800', marginRight: '0.5rem' }}>✅ متصل بنجاح</span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>معرف المستخدم (UID):</span>
                  <p style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '0.35rem', borderRadius: '6px', marginTop: '0.2rem', wordBreak: 'break-all' }}>{currentUser.id}</p>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>البريد الإلكتروني:</span>
                  <span style={{ fontWeight: '800', color: '#0D2847', marginRight: '0.5rem' }}>{currentUser.email}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>حفظ التوكن (Token):</span>
                  <span style={{ color: '#10B981', fontWeight: '800', marginRight: '0.5rem' }}>✅ مخزن تلقائياً في الكوكيز لضمان عمل الـ Middleware</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B' }}>
                <AlertTriangle size={32} color="#D97706" style={{ margin: '0 auto 0.5rem' }} />
                <p>لا توجد جلسة نشطة حالياً. يرجى تسجيل الدخول.</p>
              </div>
            )}
          </div>

          {/* Section 2: Profile details */}
          <div className="fp-glass-card" style={{ padding: '1.5rem', background: 'white' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0D2847', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <User size={18} color="#2563EB" /> 2. بيانات البروفايل وصلاحية الحساب (Profiles)
            </h2>
            {profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>الاسم الكامل:</span>
                  <span style={{ fontWeight: '800', color: '#0D2847', marginRight: '0.5rem' }}>{profile.full_name}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>اسم المستخدم:</span>
                  <span style={{ fontWeight: '800', color: '#0D2847', marginRight: '0.5rem' }}>{profile.username}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>الدور في النظام (Role):</span>
                  <span style={{ 
                    backgroundColor: profile.role === 'family' ? '#EFF6FF' : '#F0FDF4', 
                    color: profile.role === 'family' ? '#2563EB' : '#10B981', 
                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800', marginRight: '0.5rem' 
                  }}>
                    {profile.role === 'family' ? 'ولي أمر (family)' : profile.role}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>حالة الحساب (Status):</span>
                  <span style={{ 
                    backgroundColor: profile.status === 'active' ? '#ECFDF5' : '#FEF2F2', 
                    color: profile.status === 'active' ? '#10B981' : '#EF4444', 
                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800', marginRight: '0.5rem' 
                  }}>
                    {profile.status}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '700', color: '#64748B' }}>رقم الهاتف:</span>
                  <span style={{ fontWeight: '800', color: '#0D2847', marginRight: '0.5rem' }}>{profile.phone || 'غير مسجل'}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#EF4444' }}>
                <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem' }} />
                <p>لم يتم العثور على ملف Profile مطابق في قاعدة البيانات لهذا الحساب!</p>
              </div>
            )}
          </div>

          {/* Section 3: Linked Residents */}
          <div className="fp-glass-card" style={{ padding: '1.5rem', background: 'white' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0D2847', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <Link2 size={18} color="#10B981" /> 3. المقيمون المرتبطون والصلة (Family Links)
            </h2>
            {links.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {links.map((link, idx) => (
                  <div key={link.id} style={{ border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '12px', background: '#FAFAFA' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0D2847' }}>{link.residents?.full_name}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748B', fontWeight: '600' }}>
                      <div>رقم الملف: <strong style={{ color: '#0D2847' }}>{link.residents?.file_number}</strong></div>
                      <div>الصلة: <strong style={{ color: '#0D2847' }}>{link.relation}</strong></div>
                      <div>رؤية التقارير: <strong style={{ color: link.can_view_reports ? '#10B981' : '#EF4444' }}>{link.can_view_reports ? 'نعم' : 'لا'}</strong></div>
                      <div>رؤية الصور: <strong style={{ color: link.can_view_photos ? '#10B981' : '#EF4444' }}>{link.can_view_photos ? 'نعم' : 'لا'}</strong></div>
                      <div>المراسلة: <strong style={{ color: link.can_send_messages ? '#10B981' : '#EF4444' }}>{link.can_send_messages ? 'نعم' : 'لا'}</strong></div>
                      <div>الحالة: <strong style={{ color: link.is_active ? '#10B981' : '#EF4444' }}>{link.is_active ? 'نشط' : 'ملغي'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#D97706' }}>
                <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem' }} />
                <p>لا يوجد مقيم مرتبط بهذا الحساب حالياً.</p>
              </div>
            )}
          </div>

        </div>

        {/* Section 4: Live Diagnostic Logs */}
        <div className="fp-glass-card" style={{ padding: '1.5rem', background: '#0D2137', color: '#A5C4D4', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             تفاصيل عملية التشخيص المباشرة (Console Live Logs)
          </h2>
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '1rem', 
            borderRadius: '12px', 
            fontFamily: 'monospace', 
            fontSize: '0.8rem', 
            maxHeight: '300px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            lineHeight: '1.5'
          }}>
            {diagnosticLog.map((log, i) => (
              <div key={i} style={{ color: log.includes('❌') ? '#EF4444' : log.includes('✅') ? '#10B981' : log.includes('⚠️') ? '#F59E0B' : '#E2E8F0' }}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Scenario Testing Dashboard */}
        <div className="fp-glass-card" style={{ padding: '1.5rem', background: 'white' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#0D2847', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#F0A500" /> فحص سيناريوهات الاستخدام المطلوبة (Scenarios Quick Guide)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '600' }}>
             لاختبار السيناريوهات الخمسة المطلوبة من قبل الإدارة، يرجى التبديل بين الحسابات التالية في شاشة تسجيل الدخول ومراقبة السلوك:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            
            <div style={{ border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', background: '#FAFAFA' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10B981', marginBottom: '0.5rem' }}>سيناريو 1: حساب الأدمن (Admin Dashboard)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5' }}>
                <strong>سلوك النظام:</strong> الأدمن يسجل دخوله من صفحة <span style={{ color: '#2563EB', fontWeight: '700' }}>/login</span> ويرى جميع المقيمين، الغرف، الإحصائيات، والتقارير الطبية دون قيود.
              </p>
            </div>

            <div style={{ border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', background: '#FAFAFA' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2563EB', marginBottom: '0.5rem' }}>سيناريو 2: ولي أمر نشط مربوط بمقيم</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5' }}>
                <strong>سلوك النظام:</strong> يدخل إلى <span style={{ color: '#2563EB', fontWeight: '700' }}>/family/dashboard</span> ويرى إحصائيات المقيم المربوط به فقط وتحديثاته اليومية وصوره ومراسلته الفورية بكل أمان بفضل سياسات RLS.
              </p>
            </div>

            <div style={{ border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', background: '#FAFAFA' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#D97706', marginBottom: '0.5rem' }}>سيناريو 3: ولي أمر غير مربوط بمقيم</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5' }}>
                <strong>سلوك النظام:</strong> تظهر له رسالة تنبيه تمنعه من تصفح البوابة:
                <br />
                <span style={{ color: '#D97706', fontWeight: '700' }}>"لم يتم ربط حسابك بملف مقيم بعد، برجاء التواصل مع الإدارة."</span>
              </p>
            </div>

            <div style={{ border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', background: '#FAFAFA' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#EF4444', marginBottom: '0.5rem' }}>سيناريو 5: حساب ولي أمر موقوف (Suspended)</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5' }}>
                <strong>سلوك النظام:</strong> عند دخوله للبوابة تظهر له شاشة الحظر الحمراء فورا مع تنبيه:
                <br />
                <span style={{ color: '#EF4444', fontWeight: '700' }}>"تم إيقاف الحساب مؤقتًا، برجاء التواصل مع الإدارة."</span>
              </p>
            </div>

          </div>
        </div>

      </div>

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}
