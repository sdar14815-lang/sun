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
      if (profile.status === 'disabled') {
        await supabase.auth.signOut();
        throw new Error('هذا الحساب موقوف. يرجى التواصل مع الإدارة.');
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a365d 0%, #2d4a8a 50%, #1a365d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: 'clamp(1.5rem, 7vw, 3rem)',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #1a365d, #D4AF37)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 6px 20px rgba(26,54,93,0.3)',
          }}>
            <Sun size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: '800', color: '#1a365d', marginBottom: '0.4rem' }}>
            دار شمس التعافي
          </h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>بوابة متابعة الأهالي</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            color: '#c53030',
            fontSize: '0.88rem',
            lineHeight: '1.5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Username */}
          <div>
            <label htmlFor="family-username" className="form-label">اسم المستخدم</label>
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
                className="form-input"
                style={{ paddingRight: '2.75rem' }}
                onFocus={(e) => (e.target.style.borderColor = '#1a365d')}
                onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
              />
              <User size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="family-password" className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                id="family-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingRight: '2.75rem', paddingLeft: '2.75rem' }}
                onFocus={(e) => (e.target.style.borderColor = '#1a365d')}
                onBlur={(e)  => (e.target.style.borderColor = '#e2e8f0')}
              />
              <Lock size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', pointerEvents: 'none' }} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: '0.25rem' }}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#a0aec0' : 'linear-gradient(135deg, #1a365d, #2d4a8a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              minHeight: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                جاري تسجيل الدخول...
              </>
            ) : 'تسجيل الدخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#a0aec0', lineHeight: 1.6 }}>
          هذه البوابة مخصصة لأهالي المقيمين فقط
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
