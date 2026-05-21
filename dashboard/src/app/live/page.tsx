'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Tv, Play, Square, Save, AlertCircle, CheckCircle2, ShieldAlert, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLivePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Stream state
  const [streamId, setStreamId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [isLive, setIsLive] = useState(false);
  
  // UI feedback states
  const [updating, setUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/gate-islam');
        return;
      }

      // Check if user is admin or staff
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profError || !prof || (prof.role !== 'admin' && prof.role !== 'staff')) {
        setAuthError('عذراً، لا تمتلك الصلاحيات الكافية للتحكم بالبث المباشر.');
        setLoading(false);
        return;
      }

      // Fetch live stream settings
      const { data: streamData, error: streamError } = await supabase
        .from('live_streams')
        .select('*')
        .limit(1);

      if (streamError) {
        console.error("Error fetching stream data:", streamError);
      }

      if (streamData && streamData.length > 0) {
        const stream = streamData[0];
        setStreamId(stream.id);
        setTitle(stream.title || '');
        setDescription(stream.description || '');
        setYoutubeUrl(stream.youtube_url || '');
        setInstructorName(stream.instructor_name || '');
        setIsLive(stream.is_live || false);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('حدث خطأ في جلب تفاصيل البث.');
    } finally {
      setLoading(false);
    }
  }

  // Parse YouTube video ID from various URL formats
  function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  async function handleUpdateStream(shouldToggleLive?: boolean, targetLiveState?: boolean) {
    setUpdating(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    const isNewLiveState = shouldToggleLive ? targetLiveState : isLive;

    // Validation: Warn administrator if trying to go live with an empty or invalid URL
    if (isNewLiveState && !youtubeUrl.trim()) {
      setErrorMsg('⚠️ تنبيه: لا يمكن تشغيل البث المباشر بدون إدخال رابط YouTube Live صالح.');
      setUpdating(false);
      return;
    }

    if (youtubeUrl.trim() && !getYouTubeId(youtubeUrl)) {
      setErrorMsg('⚠️ تنبيه: يرجى التحقق من الرابط المدخل. يجب أن يكون رابط فيديو أو بث مباشر صالح من YouTube.');
      setUpdating(false);
      return;
    }

    try {
      const updatePayload = {
        title,
        description,
        youtube_url: youtubeUrl.trim(),
        instructor_name: instructorName,
        is_live: isNewLiveState,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('live_streams')
        .update(updatePayload)
        .eq('id', streamId);

      if (error) {
        throw error;
      }

      if (shouldToggleLive) {
        setIsLive(targetLiveState ?? false);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error("Update Stream Error:", e);
      setErrorMsg('حدث خطأ أثناء حفظ التحديثات: ' + e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #cbd5e0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#4a5568', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>جاري تحميل لوحة التحكم...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff5f5', direction: 'rtl', fontFamily: 'Cairo, sans-serif', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '460px', width: '100%', textAlign: 'center', padding: '2.5rem', borderRadius: '16px', border: '1px solid #fed7d7', background: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
          <ShieldAlert size={48} style={{ color: '#e53e3e', margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: '#e53e3e', fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.75rem' }}>صلاحيات غير كافية</h2>
          <p style={{ color: '#718096', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{authError}</p>
          <button onClick={() => router.push('/')} style={{ background: '#3182ce', color: 'white', fontWeight: '700', padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'Cairo' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const youtubeId = getYouTubeId(youtubeUrl);

  return (
    <div className="dashboard-container" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tv size={26} style={{ color: isLive ? '#e53e3e' : '#718096' }} /> إدارة بث الاطمئنان اليومي 🔴
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600', marginTop: '0.2rem' }}>
              التحكم في البث اليومي المخصص للأهالي للاطمئنان على المقيمين ومتابعة أحوالهم بالمركز
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.8rem', 
              fontWeight: '800', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '20px',
              backgroundColor: isLive ? '#fed7d7' : '#e2e8f0',
              color: isLive ? '#9b2c2c' : '#4a5568',
              border: isLive ? '1px solid #feb2b2' : '1px solid #cbd5e0'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isLive ? '#e53e3e' : '#718096',
                animation: isLive ? 'pulse-live 1.5s infinite' : 'none'
              }} />
              {isLive ? 'حالة البث: مباشر الآن 🔴' : 'حالة البث: متوقف حالياً'}
            </span>
          </div>
        </header>

        {/* Feedback Alert Banners */}
        {errorMsg && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', color: '#22543d', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>تم حفظ إعدادات البث وتحديثها بنجاح في البوابة!</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '1.5rem', alignItems: 'start' }} className="live-panel-grid">
          
          {/* Settings Form */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '1.25rem', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
              إعدادات البث اليومي للاطمئنان
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#4a5568', marginBottom: '0.4rem' }}>
                  عنوان فترة البث (مثال: الفترة المسائية / الأنشطة الرياضية) <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="مثال: بث الاطمئنان اليومي - الفترة الرياضية المسائية"
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-subgrid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#4a5568', marginBottom: '0.4rem' }}>
                    الأخصائي المناوب المشرف <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={instructorName} 
                    onChange={e => setInstructorName(e.target.value)} 
                    placeholder="مثال: الأخصائي عبد الرحمن شمس"
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '0.88rem', fontFamily: 'inherit', fontWeight: '600' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#4a5568', marginBottom: '0.4rem' }}>
                    رابط البث من YouTube Live <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={youtubeUrl} 
                    onChange={e => setYoutubeUrl(e.target.value)} 
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '0.88rem', fontFamily: 'monospace', direction: 'ltr', fontWeight: '600' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#4a5568', marginBottom: '0.4rem' }}>
                  وصف مختصر لتفاصيل فترة البث
                </label>
                <textarea 
                  rows={4}
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="اكتب وصفاً موجزاً للأنشطة التي سيتابعها الأهالي خلال هذا البث..."
                  style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e0', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: '1.6', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => handleUpdateStream(false)}
                  disabled={updating}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    fontWeight: '700',
                    padding: '0.7rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'Cairo, sans-serif',
                    transition: 'opacity 0.2s'
                  }}
                >
                  <Save size={16} />
                  {updating ? 'جاري الحفظ...' : 'حفظ الإعدادات فقط'}
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast Status & Controls Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Live Controller Dashboard */}
            <div className="card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 100%)', color: 'white', border: 'none' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#E2E8F0', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                أزرار التحكم الفوري بالبث
              </h2>

              <p style={{ fontSize: '0.82rem', color: '#A0AEC0', marginBottom: '1.5rem', lineHeight: '1.6', fontWeight: '600' }}>
                تنويه: عند تشغيل البث المباشر، سيظهر بنر بث الاطمئنان اليومي فوراً وبشكل بارز لجميع الأهالي في حساباتهم مع علامة متوهجة Live. يرجى إغلاق البث بعد انتهاء فترة ساعة الاطمئنان.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => handleUpdateStream(true, true)}
                  disabled={updating || isLive}
                  style={{
                    background: isLive ? '#4a5568' : '#e53e3e',
                    color: 'white',
                    fontWeight: '800',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: isLive ? 'not-allowed' : 'pointer',
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: isLive ? 'none' : '0 8px 20px rgba(229, 62, 62, 0.3)',
                    fontFamily: 'Cairo, sans-serif',
                    transition: 'all 0.2s',
                    opacity: isLive ? 0.75 : 1
                  }}
                  onMouseOver={e => { if (!isLive) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { if (!isLive) e.currentTarget.style.transform = 'none'; }}
                >
                  <Play size={18} />
                  <span>بدء وتشغيل البث المباشر للأهالي 🔴</span>
                </button>

                <button
                  onClick={() => handleUpdateStream(true, false)}
                  disabled={updating || !isLive}
                  style={{
                    background: '#2d3748',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: '#e2e8f0',
                    fontWeight: '800',
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: !isLive ? 'not-allowed' : 'pointer',
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Cairo, sans-serif',
                    transition: 'all 0.2s',
                    opacity: !isLive ? 0.45 : 1
                  }}
                  onMouseOver={e => { if (isLive) e.currentTarget.style.backgroundColor = '#1a202c'; }}
                  onMouseOut={e => { if (isLive) e.currentTarget.style.backgroundColor = '#2d3748'; }}
                >
                  <Square size={16} />
                  <span>إيقاف وتعطيل البث المباشر ⏹️</span>
                </button>
              </div>
            </div>

            {/* Embed Preview Box */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>معاينة البث (YouTube)</span>
                {youtubeId && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#3182ce', display: 'flex', alignItems: 'center', gap: '0.15rem', textDecoration: 'none', fontWeight: '700' }}>
                    فتح بالمتصفح <ExternalLink size={11} />
                  </a>
                )}
              </h3>
              
              {youtubeId ? (
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="Live Preview"
                    frameBorder="0"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              ) : (
                <div style={{ padding: '2.5rem 1rem', border: '2.5px dashed #edf2f7', borderRadius: '12px', textAlign: 'center', color: '#a0aec0' }}>
                  <Tv size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.78rem', fontWeight: '700', margin: 0 }}>يرجى إدخال رابط YouTube Live صحيح لعرض المعاينة المباشرة.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        @media (max-width: 1024px) {
          .live-panel-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .form-subgrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
