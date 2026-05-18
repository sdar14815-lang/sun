'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Sun, Eye, EyeOff, User, Lock } from 'lucide-react';

export default function FamilyLoginPage() {
  const router = useRouter();
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loginEmail = username.trim().toLowerCase() + '@family.shams.com';

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل تسجيل الدخول - لم يتم إرجاع بيانات المستخدم');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('خطأ في قراءة بيانات الحساب: ' + profileError.message);
      }
      if (!profile) { router.replace('/auth/profile-error'); return; }
      if (profile.status === 'disabled' || profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('تم إيقاف الحساب مؤقتًا، برجاء التواصل مع الإدارة.');
      }
      if (profile.status === 'pending') {
        await supabase.auth.signOut();
        throw new Error('الحساب غير مفعل بعد، برجاء التواصل مع الإدارة.');
      }
      if (profile.role !== 'family') {
        await supabase.auth.signOut();
        throw new Error('هذه البوابة مخصصة لأهالي المقيمين فقط.');
      }

      router.replace('/family/dashboard');
    } catch (e: any) {
      if (e.message?.includes('Email not confirmed')) {
        setError('البريد الإلكتروني غير مؤكد. يرجى التواصل مع الإدارة.');
      } else if (e.message?.includes('Invalid login credentials')) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      } else {
        setError(e.message || 'خطأ غير معروف في تسجيل الدخول');
      }
      setLoading(false);
    }
  }

  return (
    <div
      className="fp-login-bg"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0D2137 0%, #1B4F72 40%, #2E86C1 70%, #1B4F72 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Decorative Sun SVG */}
      <svg style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', opacity: 0.04 }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="40" fill="#F0A500" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(angle => (
          <line key={angle} x1="100" y1="100" x2={100 + 80 * Math.cos(angle * Math.PI / 180)} y2={100 + 80 * Math.sin(angle * Math.PI / 180)} stroke="#F0A500" strokeWidth="4" strokeLinecap="round" />
        ))}
      </svg>

      <div
        className="fp-login-card fp-animate"
        style={{
          padding: 'clamp(1.5rem, 7vw, 3rem)',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '76px', height: '76px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #1B4F72, #F0A500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(240,165,0,0.3)',
            animation: 'fp-scaleIn 0.6s ease forwards',
          }}>
            <Sun size={38} color="white" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: '800', color: '#1B4F72', marginBottom: '0.4rem' }}>
            دار شمس التعافي
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.3rem' }}>بوابة متابعة الأهالي</p>
          <p style={{ color: '#F0A500', fontSize: '0.82rem', fontWeight: '600' }}>نحن هنا لنطمئنك على ذويك 💛</p>
        </div>

        {error && (
          <div className="fp-animate" style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            color: '#DC2626',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Username */}
          <div className="fp-animate fp-animate-delay-1">
            <label htmlFor="family-username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#1E293B' }}>اسم المستخدم</label>
            <div style={{ position: 'relative' }}>
              <input
                id="family-username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="fp-input"
                style={{
                  width: '100%', padding: '0.875rem 2.75rem 0.875rem 1rem',
                  borderRadius: '12px', border: '2px solid #E2E8F0',
                  fontFamily: 'inherit', fontSize: '16px', background: '#FAFBFC',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  minHeight: '48px',
                }}
              />
              <User size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Password */}
          <div className="fp-animate fp-animate-delay-2">
            <label htmlFor="family-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#1E293B' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                id="family-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="fp-input"
                style={{
                  width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                  borderRadius: '12px', border: '2px solid #E2E8F0',
                  fontFamily: 'inherit', fontSize: '16px', background: '#FAFBFC',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  minHeight: '48px',
                }}
              />
              <Lock size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.25rem' }}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="fp-animate fp-animate-delay-3">
            <button
              type="submit"
              disabled={loading}
              className="fp-login-btn"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Cairo, sans-serif',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  جاري تسجيل الدخول...
                </>
              ) : 'تسجيل الدخول'}
            </button>
          </div>
        </form>

        <p className="fp-animate fp-animate-delay-4" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.6 }}>
          هذه البوابة مخصصة لأهالي المقيمين فقط
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
