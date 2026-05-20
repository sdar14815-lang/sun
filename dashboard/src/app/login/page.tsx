'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, User, AlertCircle, Sun, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Allow login with username by appending @shams.com if no @ is present
      const loginEmail = email.includes('@') ? email.trim().toLowerCase() : `${email.trim().toLowerCase()}@shams.com`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password 
      });
      if (authError) throw authError;

      // Note: Removed profile checks based on instructions to not depend on roles.
      // Profile and status logic is safely bypassed so user isn't logged out.
      
      router.replace('/');
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('بيانات الدخول غير صحيحة. تأكد من اسم المستخدم وكلمة المرور.');
      } else {
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #1a365d 100%)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '20px',
        padding: 'clamp(1.5rem, 6vw, 2.5rem)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            background: 'linear-gradient(135deg, #1a365d, #2c5282)',
            borderRadius: '18px',
            marginBottom: '1rem',
            boxShadow: '0 4px 15px rgba(26,54,93,0.35)',
          }}>
            <Sun size={32} color="#D4AF37" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', fontWeight: '800', color: 'var(--primary)' }}>
            لوحة تحكم شمس التعافي
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            برجاء تسجيل الدخول للمتابعة
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            color: 'var(--danger)',
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            border: '1px solid #fed7d7',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-email">البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-email"
                type="text"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shams.com"
                className="form-input"
                style={{ paddingRight: '2.75rem' }}
              />
              <User size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-password">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingRight: '2.75rem', paddingLeft: '2.75rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.25rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                جاري التحميل...
              </span>
            ) : 'دخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          هذه اللوحة مخصصة لموظفي المصحة فقط
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
