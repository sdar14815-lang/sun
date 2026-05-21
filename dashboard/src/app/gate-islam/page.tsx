'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, User, AlertCircle, Sun, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

const ADMIN_PIN = '01286384422';

export default function SecureLoginPage() {
  // PIN Gate state
  const [pin, setPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLocked, setPinLocked] = useState(false);

  // Login state
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const router = useRouter();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinLocked) return;

    if (pin === ADMIN_PIN) {
      setPinVerified(true);
      setPinError('');
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setPinError(`كود الدخول غير صحيح (${newAttempts}/5)`);
      setPin('');
      
      if (newAttempts >= 5) {
        setPinLocked(true);
        setPinError('تم قفل الصفحة بسبب محاولات خاطئة متعددة. أعد تحميل الصفحة.');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginEmail = email.includes('@') ? email.trim().toLowerCase() : `${email.trim().toLowerCase()}@shams.com`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password 
      });
      if (authError) throw authError;
      
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

  // ═══════════════════════════════════════════════════════
  // PIN GATE SCREEN
  // ═══════════════════════════════════════════════════════
  if (!pinVerified) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '1rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 6vw, 2.5rem)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Shield Icon */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              borderRadius: '20px',
              marginBottom: '1rem',
              boxShadow: '0 8px 25px rgba(220, 38, 38, 0.35)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}>
              <ShieldCheck size={36} color="white" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: '800', color: '#e2e8f0' }}>
              منطقة محمية
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              أدخل كود الوصول للمتابعة
            </p>
          </div>

          {pinError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  disabled={pinLocked}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="أدخل كود الوصول"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1rem 3rem 1rem 1rem',
                    borderRadius: '14px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    textAlign: 'center',
                    letterSpacing: '0.15em',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#dc2626';
                    e.target.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <KeyRound size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={pinLocked || !pin}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '0.95rem',
                fontWeight: '700',
                background: pinLocked ? '#374151' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                cursor: pinLocked ? 'not-allowed' : 'pointer',
                fontFamily: 'Cairo, sans-serif',
                transition: 'all 0.3s',
                boxShadow: pinLocked ? 'none' : '0 4px 15px rgba(220, 38, 38, 0.3)',
                opacity: (!pin || pinLocked) ? 0.6 : 1,
              }}
            >
              {pinLocked ? '🔒 مقفل' : 'تحقق'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#475569' }}>
            هذه المنطقة للمسؤولين فقط
          </p>
        </div>

        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 8px 25px rgba(220, 38, 38, 0.35); }
            50% { box-shadow: 0 8px 40px rgba(220, 38, 38, 0.55); }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ADMIN LOGIN FORM (after PIN verification)
  // ═══════════════════════════════════════════════════════
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
        {/* Verified Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginBottom: '1rem',
          padding: '0.4rem 1rem',
          background: 'linear-gradient(135deg, #059669, #047857)',
          borderRadius: '30px',
          width: 'fit-content',
          margin: '0 auto 1.25rem',
          boxShadow: '0 2px 10px rgba(5, 150, 105, 0.3)',
        }}>
          <ShieldCheck size={14} color="white" />
          <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>تم التحقق</span>
        </div>

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
