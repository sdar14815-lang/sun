'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Activity, MessageSquare, MessageCircle, Info, Clock, Sparkles, Zap, Award, X, Image as ImageIcon, Tv } from 'lucide-react';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  stable:               { label: 'مستقر',         color: '#059669', bg: '#f0fff4', border: '#c6f6d5' },
  needs_followup:       { label: 'يحتاج متابعة',  color: '#d97706', bg: '#fffaf0', border: '#feebc8' },
  significant_progress: { label: 'تقدم ملحوظ',    color: '#2563eb', bg: '#ebf8ff', border: '#bee3f8' },
  important_note:       { label: 'ملاحظة مهمة',   color: '#dc2626', bg: '#fff5f5', border: '#fed7d7' },
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  general: 'حالة عامة',
  specialist_note: 'ملاحظة أخصائي',
  doctor_note: 'ملاحظة طبيب',
  session_attendance: 'حضور جلسة',
  behavioral_progress: 'تطور سلوكي',
  family_alert: 'تنبيه للأسرة',
  badge: 'وسام تقديري 🎖️',
};

const BADGE_DESIGNS: Record<string, { icon: string; bg: string; border: string; text: string; shadow: string }> = {
  'وسام الالتزام الرياضي 🏋️‍♂️': {
    icon: '🏋️‍♂️',
    bg: 'linear-gradient(135deg, #FFE082 0%, #FFB300 100%)',
    border: '#FFB300',
    text: '#5D4037',
    shadow: 'rgba(255, 179, 0, 0.25)'
  },
  'أسبوع بدون انتكاسة 💪': {
    icon: '💪',
    bg: 'linear-gradient(135deg, #A7F3D0 0%, #059669 100%)',
    border: '#059669',
    text: '#ffffff',
    shadow: 'rgba(5, 150, 105, 0.25)'
  },
  'التفاعل الإيجابي في الجلسات 🗣️': {
    icon: '🗣️',
    bg: 'linear-gradient(135deg, #93C5FD 0%, #1D4ED8 100%)',
    border: '#1D4ED8',
    text: '#ffffff',
    shadow: 'rgba(29, 78, 216, 0.25)'
  },
  'وسام الالتزام الروحي والصلوات 🕋': {
    icon: '🕋',
    bg: 'linear-gradient(135deg, #C7D2FE 0%, #6366F1 100%)',
    border: '#6366F1',
    text: '#ffffff',
    shadow: 'rgba(99, 102, 241, 0.25)'
  },
  'وسام المبادرة الاجتماعية والتعاون 🤝': {
    icon: '🤝',
    bg: 'linear-gradient(135deg, #FBCFE8 0%, #DB2777 100%)',
    border: '#DB2777',
    text: '#ffffff',
    shadow: 'rgba(219, 39, 119, 0.25)'
  },
  'وسام شعاع الأمل والتعافي 🌅': {
    icon: '🌅',
    bg: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)',
    border: '#D97706',
    text: '#ffffff',
    shadow: 'rgba(217, 119, 6, 0.25)'
  }
};

const DEFAULT_BADGE_DESIGN = {
  icon: '🎖️',
  bg: 'linear-gradient(135deg, #E2E8F0 0%, #475569 100%)',
  border: '#475569',
  text: '#ffffff',
  shadow: 'rgba(71, 85, 105, 0.25)'
};


function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fp-progress-ring">
      <svg viewBox="0 0 56 56">
        <circle className="ring-bg" cx="28" cy="28" r={radius} />
        <circle 
          className="ring-fill" 
          cx="28" 
          cy="28" 
          r={radius} 
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-value" style={{ color }}>{percentage}%</div>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

// ── Lightweight Particle Confetti Component ──
function CelebrationConfetti() {
  const colors = ['#10B981', '#F0A500', '#2563EB', '#EC4899', '#8B5CF6'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 45 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = 2.5 + Math.random() * 3.5;
        const size = 5 + Math.random() * 9;
        const color = colors[i % colors.length];
        return (
          <div 
            key={i} 
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.4}px`,
              backgroundColor: color,
              borderRadius: '2px',
              opacity: 0.85,
              transform: 'rotate(0deg)',
              animation: `fallConfetti ${duration}s linear infinite`,
              animationDelay: `${delay}s`
            }}
          />
        );
      })}
      <style jsx global>{`
        @keyframes fallConfetti {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(105vh) rotate(720deg); }
        }
        @keyframes fp-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

export default function FamilyDashboardPage() {
  const router = useRouter();
  const [profile, setProfile]                     = useState<any>(null);
  const [residents, setResidents]                 = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates]         = useState<any[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [statusError, setStatusError]             = useState<string | null>(null);
  const [bubbles, setBubbles]                     = useState<any[]>([]);
  const [showPushBanner, setShowPushBanner]       = useState(false);
  const [liveStream, setLiveStream]               = useState<any>(null);

  useEffect(() => { 
    loadAll(); 
    checkNotificationSubscription();
  }, []);

  const checkNotificationSubscription = () => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
          const permission = await OneSignal.Notifications.permission;
          
          if (!isOptedIn && permission !== 'denied') {
            setShowPushBanner(true);
          }
        } catch (e) {
          console.error("Error checking notification status:", e);
        }
      });
    }
  };

  const handleSubscribe = async () => {
    if (typeof window !== 'undefined') {
      // 1. Check if browser supports notifications
      if (!('Notification' in window)) {
        alert('⚠️ متصفحك الحالي أو التطبيق لا يدعم التنبيهات المباشرة. يرجى فتح الموقع باستخدام متصفح رسمي (مثل Chrome, Safari).');
        return;
      }

      // 2. Check if browser notification permission is already denied
      if (Notification.permission === 'denied') {
        alert('⚠️ تنبيهات المتصفح محظورة حالياً. يرجى الضغط على أيقونة الإعدادات/القفل بجانب شريط عنوان الموقع وتفعيل خيار الإشعارات (Allow) لتلقي التحديثات.');
        return;
      }

      const OneSignal = (window as any).OneSignal;
      
      if (OneSignal && OneSignal.Notifications) {
        try {
          // Call directly synchronously inside click event to preserve browser User Gesture security!
          await OneSignal.Notifications.requestPermission();
          
          const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
          if (isOptedIn) {
            setShowPushBanner(false);
            alert('🔔 ممتاز! تم تفعيل التنبيهات الصوتية والمباشرة بنجاح لمتابعة حالة ذويكم فوراً.');
          } else {
            const afterPermission = await OneSignal.Notifications.permission;
            if (afterPermission === 'denied') {
              alert('⚠️ لتلقي التنبيهات الصوتية، يرجى السماح بالإشعارات عندما يطلبها المتصفح.');
            }
          }
        } catch (e) {
          console.error("Error requesting permission directly:", e);
          alert('حدث خطأ أثناء تفعيل التنبيهات. يرجى المحاولة مرة أخرى.');
        }
      } else {
        // Script is loading or blocked by Ad-Blocker
        alert('⚠️ مكتبة التنبيهات لم تكتمل بعد (ربما بسبب برنامج مانع الإعلانات Ad-Blocker أو بطء في اتصال الشبكة). يرجى إيقاف مانع الإعلانات في متصفحك وتحديث الصفحة ثم المحاولة مجدداً.');
      }
    }
  };

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("--- FAMILY PORTAL DEBUG ---");
      console.log("Session Exists:", user ? "YES" : "NO");
      console.log("Current User ID:", user?.id || "None");
      console.log("Requested Table: profiles (with family_links relation)");

      if (!user) { 
        setStatusError('جلسة الدخول انتهت، برجاء تسجيل الدخول مرة أخرى');
        setLoading(false);
        return; 
      }

      // Combined Query: Fetch profile details, active family links, and resident records in a single request
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select(`
          *,
          family_links(
            resident_id,
            relation,
            is_active,
            residents(
              id,
              full_name,
              file_number,
              current_stage,
              current_status,
              progress_score
            )
          )
        `)
        .eq('id', user.id)
        .single();

      if (profError) {
        console.error("Supabase Error Code:", profError.code);
        console.error("Supabase Error Message:", profError.message);
        console.log("---------------------------");

        if (profError.code === '42501' || profError.message?.toLowerCase().includes('permission') || profError.message?.toLowerCase().includes('policy')) {
          setStatusError('ليس لديك صلاحية لعرض هذه الصفحة');
        } else {
          setStatusError('جلسة الدخول انتهت، برجاء تسجيل الدخول مرة أخرى');
        }
        setLoading(false);
        return;
      }

      console.log("User Profile Loaded:", prof ? "YES" : "NO");
      console.log("Current User Role:", prof?.role || "None");
      console.log("Current User Status:", prof?.status || "None");
      console.log("---------------------------");

      if (!prof) {
        setStatusError('لا توجد بيانات مرتبطة بهذا الحساب حالياً');
        setLoading(false);
        return;
      }

      if (prof.role !== 'family') {
        setStatusError('ليس لديك صلاحية لعرض هذه الصفحة');
        setLoading(false);
        return;
      }

      // Verify account status
      if (prof.status === 'suspended' || prof.status === 'disabled') {
        setStatusError('تم إيقاف الحساب مؤقتًا، برجاء التواصل مع الإدارة.');
        setLoading(false);
        return;
      }

      if (prof.status === 'pending') {
        setStatusError('الحساب غير مفعل بعد، برجاء التواصل مع الإدارة.');
        setLoading(false);
        return;
      }

      setProfile(prof);

      const activeLinks = prof.family_links?.filter((l: any) => l.is_active) || [];
      const linked = activeLinks.map((l: any) => ({ ...l.residents, relation: l.relation })).filter(Boolean) || [];
      setResidents(linked);

      if (linked.length === 0) {
        setStatusError('لم يتم ربط حسابك بملف مقيم بعد، برجاء التواصل مع الإدارة.');
        setLoading(false);
        return;
      }

      const residentIds = activeLinks.map((l: any) => l.resident_id).filter(Boolean) || [];

      if (residentIds.length > 0) {
        const { data: updatesData, error: updatesError } = await supabase
          .from('resident_updates')
          .select('id, title, content, update_type, created_at, resident_id, residents(full_name)')
          .in('resident_id', residentIds)
          .eq('visible_to_family', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (updatesError) {
          console.error("Updates Fetch Error:", updatesError.message);
        }

        setRecentUpdates(updatesData || []);
        
        if (updatesData && updatesData.length > 0) {
          const nonBadges = (updatesData || []).filter(u => u.update_type !== 'badge');
          if (nonBadges.length > 0) {
            setBubbles(nonBadges.slice(0, 2).map(u => ({ id: u.id, text: `تحديث جديد: ${u.title || 'تقرير حالة'}` })));
          } else {
            setBubbles(updatesData.slice(0, 2).map(u => ({ id: u.id, text: `وسام جديد: ${u.title || 'وسام تقديري'}` })));
          }
        }
      }

      // Fetch live stream status
      try {
        const { data: liveData } = await supabase
          .from('live_streams')
          .select('*')
          .limit(1);
        if (liveData && liveData.length > 0) {
          setLiveStream(liveData[0]);
        }
      } catch (err) {
        console.error("Error loading live stream status:", err);
      }

    } catch (e: any) {
      console.error("Unexpected Dashboard Error:", e);
      setStatusError('حدث خطأ غير متوقع أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="fp-skeleton" style={{ height: '60px', borderRadius: '30px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton" style={{ height: '100px', borderRadius: '14px' }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(160deg, #0D2137 0%, #1B4F72 100%)', direction: 'rtl' }}>
        <div className="fp-glass-card fp-animate" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '24px', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(240, 165, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid #F0A500', boxShadow: '0 8px 24px rgba(240,165,0,0.2)' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white', marginBottom: '1rem', fontFamily: 'Cairo, sans-serif' }}>
            تنبيه بوابة الأهالي
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.98rem', fontWeight: '700', lineHeight: '1.7', marginBottom: '2rem', fontFamily: 'Cairo, sans-serif' }}>
            {statusError}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace('/family/login');
              }}
              style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #F0A500, #d97706)', color: '#0D2847', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', boxShadow: '0 8px 20px rgba(240, 165, 0, 0.3)', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              الرجوع لصفحة تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  const STAGE_CLASSES: Record<string, string> = {
    detox: 'fp-stage-detox',
    rehabilitation: 'fp-stage-rehab',
    social_reintegration: 'fp-stage-social',
    follow_up: 'fp-stage-followup',
  };

  const hasHighlyCommittedResident = residents.some(r => r.progress_score >= 80);
  const badges = recentUpdates.filter(u => u.update_type === 'badge');
  const regularUpdates = recentUpdates.filter(u => u.update_type !== 'badge');

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem', background: 'var(--fp-surface)' }}>
      <FamilyNavbar userName={profile?.full_name} />

      {/* Premium Notification Permission Prompt Banner */}
      {showPushBanner && (
        <div style={{ maxWidth: '1100px', margin: '1rem auto 0 auto', padding: '0 clamp(0.875rem, 4vw, 2rem)', animation: 'fadeInDown 0.5s ease-out' }}>
          <div className="fp-glass-card" style={{ 
            background: 'linear-gradient(135deg, rgba(13, 40, 71, 0.95), rgba(46, 134, 193, 0.9))',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            padding: '1.25rem 1.5rem',
            borderRadius: '24px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: '0 20px 40px rgba(13, 40, 71, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}>
                <Zap size={22} style={{ color: 'var(--fp-accent)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   تفعيل التنبيهات الصوتية المباشرة 🔔
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.2rem', lineHeight: '1.4', fontWeight: '500' }}>
                   احصل على تحديثات حالة ابنك، والصور الجديدة، والتقارير الأسبوعية بصوت تنبيه فوري فور صدورها حتى والموقع مغلق!
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={handleSubscribe} className="btn" style={{ 
                background: 'var(--fp-accent)', 
                color: 'var(--fp-primary)', 
                fontWeight: '800', 
                padding: '0.6rem 1.25rem', 
                borderRadius: '14px', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.8rem',
                boxShadow: '0 8px 20px rgba(240, 165, 0, 0.3)',
                transition: 'transform 0.2s'
              }}>
                تفعيل الآن
              </button>
              <button onClick={() => setShowPushBanner(false)} style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255,255,255,0.5)', 
                cursor: 'pointer', 
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Explosion for Outstanding Commitment! */}
      {hasHighlyCommittedResident && <CelebrationConfetti />}

      {/* Floating Notification Bubbles */}
      <div className="fp-bubble-container" style={{ pointerEvents: 'none' }}>
        {bubbles.map((b, i) => (
          <div key={b.id} className="fp-bubble fp-glass-card" style={{ animationDelay: `${i * 0.5}s`, pointerEvents: 'auto' }}>
             <div className="fp-glow-icon" style={{ padding: '0.4rem', borderRadius: '10px' }}>
                <Zap size={14} />
             </div>
             <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--fp-primary)', flex: 1 }}>{b.text}</div>
             <button onClick={() => setBubbles(prev => prev.filter(x => x.id !== b.id))} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={14} />
             </button>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>

        {/* ── Smart Welcome Header (Personalized & Contextual) ── */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '2rem', padding: '1.75rem 2rem', borderRight: '6px solid var(--fp-accent)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-20px', top: '-20px', opacity: 0.04, color: 'var(--fp-accent)' }}>
            <Sparkles size={120} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             صباح الأمل والتعافي، {profile?.full_name || 'أهلاً بك'} ☀️
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--fp-text-muted)', lineHeight: '1.7', fontWeight: '600' }}>
             {residents.length > 0 ? (
               <>
                 نود طمأنتكم أن {residents.map((r, idx) => (
                    <span key={r.id}>
                      {idx > 0 && ' و '}
                      المقيم <strong style={{ color: 'var(--fp-primary)' }}>[ {r.full_name} ]</strong> حالياً في مرحلة <span className={`fp-stage-badge ${STAGE_CLASSES[r.current_stage] || 'fp-stage-rehab'}`} style={{ transform: 'scale(0.9)', margin: '0 0.25rem' }}>{STAGE_LABELS[r.current_stage] || r.current_stage}</span> ومؤشر تعافيه يسجل <strong style={{ color: 'var(--fp-success)' }}>{r.progress_score || 0}%</strong>
                    </span>
                  ))}. نحن هنا معكم خطوة بخطوة في رحلة العودة والنهوض مجدداً.
               </>
             ) : (
               'مرحباً بك في بوابة أهالي دار شمس التعافي. نحن هنا لخدمتكم وطمأنتكم وتسهيل متابعة حالة ذويكم على مدار الساعة.'
             )}
          </p>
        </div>

        {/* ── Active Live Stream / Lecture Widget (Highly Premium & Pulsing) ── */}
        {liveStream && (
          <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ 
            marginBottom: '2rem', 
            background: liveStream.is_live 
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(13, 40, 71, 0.95) 100%)' 
              : 'linear-gradient(135deg, rgba(13, 40, 71, 0.95) 0%, rgba(27, 79, 114, 0.9) 100%)',
            border: liveStream.is_live ? '1.5px solid rgba(220, 38, 38, 0.4)' : '1.5px solid rgba(255, 255, 255, 0.1)',
            padding: '1.25rem 1.5rem',
            borderRadius: '24px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: liveStream.is_live ? '0 15px 35px rgba(220, 38, 38, 0.15)' : '0 15px 35px rgba(13, 40, 71, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: liveStream.is_live ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                border: liveStream.is_live ? '2px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                <Tv size={22} style={{ color: liveStream.is_live ? '#EF4444' : 'var(--fp-accent)' }} />
                {liveStream.is_live && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: '#EF4444', 
                    border: '2px solid white',
                    animation: 'fp-pulse 1.5s infinite'
                  }} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: '900', color: 'white', margin: 0 }}>
                    {liveStream.is_live ? 'بث الاطمئنان اليومي (يبث الآن) 🔴' : 'بث الاطمئنان اليومي'}
                  </h3>
                  {liveStream.is_live && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      backgroundColor: '#EF4444', 
                      color: 'white', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '8px', 
                      fontWeight: '800',
                      animation: 'fp-pulse 2s infinite'
                    }}>
                      LIVE
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>
                  {liveStream.title}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.1rem', fontWeight: '600', margin: '0.1rem 0 0 0' }}>
                  الأخصائي المناوب: {liveStream.instructor_name || 'طاقم المركز العلاجي'}
                </p>
              </div>
            </div>
            <Link href="/family/live" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ 
                background: liveStream.is_live ? '#DC2626' : 'var(--fp-accent)', 
                color: 'white', 
                fontWeight: '900', 
                padding: '0.65rem 1.5rem', 
                borderRadius: '14px', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '0.85rem',
                boxShadow: liveStream.is_live ? '0 8px 20px rgba(220, 38, 38, 0.3)' : '0 8px 20px rgba(240, 165, 0, 0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'Cairo, sans-serif'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              >
                {liveStream.is_live ? 'دخول البث المباشر 📺' : 'استعراض البث 📺'}
              </button>
            </Link>
          </div>
        )}

        {/* ── Badge Showcase / Milestones (Extremely Premium Glassmorphic Rack) ── */}
        <div className="fp-glass-card fp-animate fp-animate-delay-2" style={{ marginBottom: '2.5rem', padding: '1.75rem 2rem', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Award size={22} style={{ color: 'var(--fp-accent)' }} /> معرض الأوسمة والشارات التقديرية (Milestones & Badges)
          </h2>
          {badges.length === 0 ? (
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px dashed rgba(13, 40, 71, 0.15)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '700', lineHeight: '1.6' }}>
                🎖️ الأوسمة والشارات التقديرية تمنحها إدارة المركز تقديراً للالتزام السلوكي والرياضي والمبادرات الإيجابية بالبرنامج العلاجي.
                <br />
                <span style={{ color: 'var(--fp-primary)', display: 'block', marginTop: '0.5rem', fontSize: '0.9rem' }}>بانتظار تحقيق الأهداف السلوكية القادمة بمساعدة الكادر المعالج والداعمين 💪</span>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', padding: '0.5rem 0.25rem 1rem 0.25rem', scrollbarWidth: 'thin' }}>
              {badges.map((b) => {
                const design = BADGE_DESIGNS[b.title] || DEFAULT_BADGE_DESIGN;
                return (
                  <div key={b.id} className="badge-card-container" style={{ flexShrink: 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', transition: 'all 0.3s ease', cursor: 'pointer' }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = `0 15px 30px ${design.shadow}`;
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)';
                    }}>
                    <div style={{ 
                      width: '70px', 
                      height: '70px', 
                      borderRadius: '50%', 
                      background: design.bg, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '2.2rem',
                      boxShadow: `0 8px 20px ${design.shadow}`,
                      marginBottom: '1rem',
                      border: `3px solid ${design.border || '#fff'}`
                    }}>
                      {design.icon}
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--fp-primary)', textAlign: 'center', marginBottom: '0.5rem', height: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.title}
                    </h3>
                    <div style={{ width: '100%', height: '1px', backgroundColor: '#EDF2F7', marginBottom: '0.75rem' }} />
                    <p style={{ fontSize: '0.75rem', color: '#4A5568', lineHeight: '1.5', textAlign: 'center', height: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                      {b.content}
                    </p>
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--fp-text-muted)', marginTop: '0.75rem', fontWeight: '600' }}>
                      📅 {new Date(b.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Milestone Achievement Card (Confetti Trigger Component) ── */}
        {hasHighlyCommittedResident && (
          <div className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
            marginBottom: '2rem', 
            background: 'linear-gradient(135deg, rgba(240, 165, 0, 0.12), rgba(16, 185, 129, 0.08))',
            border: '1.5px solid rgba(240, 165, 0, 0.3)',
            boxShadow: '0 15px 35px rgba(240, 165, 0, 0.1)',
            padding: '1.5rem',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--fp-accent), #f39c12)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(240, 165, 0, 0.3)',
              flexShrink: 0,
              animation: 'fp-pulse 2s infinite'
            }}>
               <Award size={28} />
            </div>
            <div style={{ flex: 1 }}>
               <h3 style={{ fontSize: '1.02rem', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--fp-accent)' }} /> وسام التميز والتعافي السلوكي المتكامل!
               </h3>
               <p style={{ fontSize: '0.8rem', color: 'var(--fp-text-muted)', fontWeight: '700', marginTop: '0.25rem', lineHeight: '1.6' }}>
                  نهنئكم على هذا الإنجاز البارز! يسجل المقيم استجابة متميزة والتزاماً علاجياً يفوق 80% في مسار استرداد التعافي بالمركز. شراكتكم ودعمكم المعنوي هو الوقود الفعلي لهذا النجاح.
               </p>
            </div>
          </div>
        )}

        {/* ── Stats Grid (Premium Glassmorphism & Glow Icons) ── */}
        <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: User, label: 'المقيمون', value: residents.length, color: '#0D2847', isSuccess: false },
            { icon: Award, label: 'النجاح', value: '98%', color: '#10B981', isSuccess: true },
            { icon: Sparkles, label: 'الخدمة', value: 'ذهبي', color: '#F0A500', isSuccess: false },
            { icon: MessageSquare, label: 'الدعم', value: '24/7', color: '#2E86C1', isSuccess: false },
          ].map((s, i) => (
            <div key={i} className={`fp-glass-card fp-animate fp-animate-delay-${i+1}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div className={s.isSuccess ? 'fp-glow-icon fp-glow-icon-success' : 'fp-glow-icon'} style={{ color: s.color }}>
                <s.icon size={22} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--fp-text-muted)', fontWeight: '700' }}>{s.label}</p>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--fp-primary)', marginTop: '0.1rem' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Dashboard Content ── */}
        <div className="two-col-grid">
           {/* Direct Updates Widget */}
           <div className="fp-glass-card fp-animate fp-animate-delay-3" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <Activity size={22} style={{ color: 'var(--fp-accent)' }} /> المتابعة والتقدم المباشر
              </h2>
              {residents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                   <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.9rem' }}>لا توجد بيانات مقيمين حالياً</p>
                </div>
              ) : residents.map((r) => {
                 const s = STATUS_LABELS[r.current_status] || STATUS_LABELS['stable'];
                 const stageClass = STAGE_CLASSES[r.current_stage] || 'fp-stage-rehab';
                 return (
                   <div key={r.id} className="fp-shimmer-border" style={{ marginBottom: '1.25rem' }}>
                     <div className="fp-resident-card" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255, 255, 255, 0.5)', padding: '1.25rem', borderRadius: 'var(--fp-radius)' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <div className="fp-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem', background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))' }}>
                              {getInitials(r.full_name)}
                           </div>
                           <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <p style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--fp-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</p>
                                  <span style={{ backgroundColor: s.bg, color: s.color, padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '800', border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                                     {s.label}
                                  </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '600' }}>المرحلة الحالية:</span>
                                  <span className={`fp-stage-badge ${stageClass}`}>{STAGE_LABELS[r.current_stage] || r.current_stage}</span>
                              </div>
                           </div>
                        </div>

                        {/* Progress Indicator */}
                        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                           <CircularProgress percentage={r.progress_score || 0} color={s.color} />
                           <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '0.4rem' }}>مؤشر التعافي والالتزام</p>
                              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${r.progress_score}%`, height: '100%', background: `linear-gradient(90deg, ${s.color}, var(--fp-accent))` }} />
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                 );
              })}
           </div>

           {/* Quick Shortcuts & Activities Widget */}
           <div className="fp-animate fp-animate-delay-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Premium shortcuts block */}
              <div style={{ background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-dark))', borderRadius: '24px', padding: '1.5rem', color: 'white', boxShadow: '0 10px 25px rgba(13, 40, 71, 0.15)', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', left: '-10px', bottom: '-10px', opacity: 0.1, color: 'white' }}>
                    <Sparkles size={80} />
                  </div>
                  <h2 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--fp-accent)' }}>
                     <Info size={18} /> اختصارات سريعة ومباشرة
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                     <Link href="/family/gallery" style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '16px', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                        <ImageIcon size={22} color="var(--fp-accent)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>معرض الصور</span>
                     </Link>
                     <Link href="/family/messages" style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '16px', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                        <MessageCircle size={22} color="var(--fp-accent)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>المراسلة الفورية</span>
                     </Link>
                  </div>
              </div>

              {/* Recent activities block */}
              <div className="fp-glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Clock size={16} style={{ color: 'var(--fp-accent)' }} /> النشاطات والتحديثات الأخيرة
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {regularUpdates.length === 0 ? (
                       <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--fp-text-muted)', fontSize: '0.85rem' }}>
                          لا توجد تحديثات علاجية مسجلة حالياً.
                       </div>
                    ) : (
                       regularUpdates.slice(0, 3).map((u, i) => (
                          <div key={u.id} style={{ 
                            paddingRight: '1rem', 
                            borderRight: '3px solid var(--fp-accent)', 
                            position: 'relative', 
                            background: 'rgba(255, 255, 255, 0.25)', 
                            padding: '1rem', 
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
                          }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--fp-primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                                   {UPDATE_TYPE_LABELS[u.update_type] || u.update_type}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--fp-text-muted)', fontWeight: '600' }}>
                                   {new Date(u.created_at).toLocaleDateString('ar-EG')}
                                </span>
                             </div>
                             
                             {/* Resident Name */}
                             {u.residents?.full_name && (
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--fp-text-muted)', marginBottom: '0.35rem' }}>
                                   المقيم: <span style={{ color: 'var(--fp-primary)', fontWeight: '900' }}>{u.residents.full_name}</span>
                                </p>
                             )}

                             {u.title && (
                                <p style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '0.35rem' }}>
                                   {u.title}
                                </p>
                             )}
                             <p style={{ fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontWeight: '600' }}>
                                {u.content}
                             </p>
                          </div>
                       ))
                    )}
                  </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--fp-border)' }}>
           <p style={{ fontSize: '0.75rem', color: 'var(--fp-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontWeight: '600' }}>
              تم التطوير بحب ورعاية بواسطة فريق شمس البرمجي المحترف <Sparkles size={12} color="var(--fp-accent)" />
           </p>
        </footer>

      </div>
    </div>
  );
}
