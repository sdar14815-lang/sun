'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Tv, Clock, User, AlertCircle, RefreshCw, Shield } from 'lucide-react';

export default function FamilyLivePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/family/login');
        return;
      }

      // Check family profile status and authorization
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profError || !prof || prof.role !== 'family') {
        router.push('/family/login');
        return;
      }

      if (prof.status !== 'active') {
        router.push('/family/dashboard');
        return;
      }

      setProfile(prof);

      // Fetch active live stream configuration
      const { data: streamData, error: streamError } = await supabase
        .from('live_streams')
        .select('*')
        .limit(1);

      if (streamError) {
        console.error("Live Stream Fetch Error:", streamError.message);
      }

      if (streamData && streamData.length > 0) {
        setLiveStream(streamData[0]);
      }
    } catch (err) {
      console.error("Live Stream unexpected load error:", err);
      setStatusError('حدث خطأ غير متوقع أثناء تحميل البث المباشر.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Parse YouTube video ID from various URL formats
  function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)', fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '800px', padding: '1.5rem' }}>
          <div className="fp-skeleton" style={{ height: '400px', borderRadius: '24px', marginBottom: '2rem' }} />
          <div className="fp-skeleton" style={{ height: '30px', width: '50%', borderRadius: '8px', marginBottom: '1rem' }} />
          <div className="fp-skeleton" style={{ height: '80px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(160deg, #0D2137 0%, #1B4F72 100%)', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        <div className="fp-glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '24px', border: '1.5px solid rgba(255,255,255,0.1)' }}>
          <AlertCircle size={48} style={{ color: '#EF4444', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.75rem' }}>خطأ في تحميل البث</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{statusError}</p>
          <button onClick={() => loadData(true)} className="btn" style={{ background: 'var(--fp-accent)', color: 'white', fontWeight: '800', width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  const isLive = liveStream?.is_live && liveStream?.youtube_url;
  const youtubeId = getYouTubeId(liveStream?.youtube_url);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <FamilyNavbar userName={profile?.full_name} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>

        {/* Header Block */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: '900', color: 'var(--fp-primary)', margin: 0 }}>
                بث الاطمئنان اليومي
              </h1>
              {isLive && (
                <span className="live-pulse-badge" style={{
                  fontSize: '0.65rem',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontWeight: '800',
                  animation: 'fp-pulse 1.5s infinite'
                }}>
                  مباشر الآن 🔴
                </span>
              )}
            </div>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem', margin: '0.2rem 0 0 0' }}>
              بث مباشر يومي مخصص لأهالي المقيمين للاطمئنان على أبنائهم ومتابعة أنشطتهم اليومية بالمركز
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(13,40,71,0.06)',
              border: '1px solid rgba(13,40,71,0.1)',
              borderRadius: '12px',
              padding: '0.5rem 0.75rem',
              color: 'var(--fp-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'Cairo, sans-serif',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(13,40,71,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(13,40,71,0.06)'}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-anim' : ''} />
            تحديث الحالة
          </button>
        </div>

        {/* Video Player Box */}
        <div className="fp-glass-card fp-animate fp-animate-delay-2" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', boxShadow: 'var(--fp-shadow-hover)', marginBottom: '1.5rem', border: isLive ? '1.5px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--fp-border)' }}>
          {isLive && youtubeId ? (
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&rel=0&showinfo=0`}
                title={liveStream.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                loading="lazy"
              />
            </div>
          ) : (
            /* Broadcast Offline State */
            <div style={{
              padding: 'clamp(2.5rem, 8vw, 5rem) 1.5rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #0D2137 0%, #153E5C 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                border: '1.5px solid rgba(255,255,255,0.15)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}>
                <Tv size={36} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                لا يوجد بث مباشر حالياً 📡
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: '1.6', fontWeight: '600' }}>
                ترقبوا بث الاطمئنان اليومي القادم لمتابعة ورؤية أبنائكم بالمركز. سيتم إشعاركم فور بدء البث المباشر المخصص للأهالي.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => loadData(true)}
                  className="btn"
                  style={{
                    background: 'var(--fp-accent)',
                    color: 'white',
                    fontWeight: '800',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    boxShadow: '0 6px 15px rgba(240, 165, 0, 0.25)',
                    transition: 'all 0.2s',
                    fontFamily: 'Cairo, sans-serif'
                  }}
                >
                  فحص حالة البث الآن
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stream / Lecture Information Metadata Card */}
        {liveStream && (
          <div className="fp-glass-card fp-animate fp-animate-delay-3" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--fp-border)', paddingBottom: '0.5rem' }}>
              معلومات بث الاطمئنان الحالي
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(13,40,71,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-primary)' }}>
                  <User size={16} />
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--fp-text-muted)', fontWeight: '600', margin: 0 }}>الأخصائي المشرف</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--fp-primary)', margin: 0 }}>{liveStream.instructor_name || 'غير محدد'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid #EDF2F7' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(240, 165, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-accent)' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--fp-text-muted)', fontWeight: '600', margin: 0 }}>حالة الجلسة</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: '800', color: isLive ? '#DC2626' : '#64748B', margin: 0 }}>
                    {isLive ? 'بث مباشر نشط 🔴' : 'بث متوقف حالياً'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '0.35rem' }}>
                {liveStream.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.7', fontWeight: '600', margin: 0 }}>
                {liveStream.description || 'لا يوجد وصف مضاف لهذه الجلسة.'}
              </p>
            </div>

            {/* Premium security notice */}
            <div style={{
              marginTop: '1.5rem',
              background: 'rgba(13, 40, 71, 0.03)',
              border: '1px solid rgba(13, 40, 71, 0.06)',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Shield size={16} style={{ color: 'var(--fp-primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--fp-primary)', fontWeight: '700', margin: 0, lineHeight: 1.4 }}>
                ⚠️ هذا البث مغلق وآمن وخاص بأهالي المقيمين المسجلين بدار شمس التعافي فقط. يمنع منعاً باتاً تسجيل البث أو إعادة نشر الرابط خارج المنصة حفاظاً على خصوصية وسلامة المقيمين بالمركز.
              </p>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fp-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
