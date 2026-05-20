'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Phone, MapPin, Save, CheckCircle2, Shield, Bell, Lock, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

export default function FamilyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Personal Data State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setFullName(data?.full_name || '');
      setPhone(data?.phone || ''); // Fixed: Using phone instead of phone_number
      setAddress(data?.address || '');
    }
    setLoading(false);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('جلسة غير صالحة');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone, // Fixed: Using phone instead of phone_number
          address: address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setSuccess('تم حفظ وتحديث بيانات ملفك بنجاح.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تحديث البيانات. ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setSavingPassword(true);
    setSuccess('');
    setError('');

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      setSuccess('تم تغيير كلمة المرور بنجاح.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء تغيير كلمة المرور. ' + err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={fullName} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>
        
        {/* Profile Header with Premium Cover */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ position: 'relative', marginBottom: '2.5rem', padding: 0, overflow: 'hidden', borderRadius: '24px' }}>
          <div style={{ 
            height: '160px', 
            background: 'linear-gradient(135deg, #0D2137, #1B4F72)', 
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle, #fff 10%, transparent 11%)', backgroundSize: '16px 16px' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-75px', paddingBottom: '2.5rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #F0A500, #d97706)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: '900',
              boxShadow: '0 15px 35px rgba(240, 165, 0, 0.4)',
              border: '6px solid white',
              fontFamily: 'Cairo, sans-serif'
            }}>
              {getInitials(fullName)}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--fp-primary)' }}>{fullName}</h1>
              <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem', background: '#F1F5F9', padding: '0.25rem 0.75rem', borderRadius: '20px', display: 'inline-block' }}>
                بوابة الأهالي • دار شمس التعافي
              </p>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="fp-animate" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.9rem', fontWeight: '800' }}>
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="fp-animate" style={{ marginBottom: '1.5rem', backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FECACA', fontSize: '0.9rem', fontWeight: '800' }}>
            <Shield size={20} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Main Settings Form */}
          <form 
            onSubmit={handleUpdateProfile} 
            className="fp-glass-card fp-animate fp-animate-delay-2"
            style={{ padding: '2.5rem', position: 'relative', borderRadius: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '1.25rem' }}>
              <div className="fp-glow-icon" style={{ width: '40px', height: '40px' }}>
                <User size={20} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--fp-primary)' }}>المعلومات الشخصية والاتصال</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.9rem' }}>الاسم الكامل للأهل *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94A3B8" style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '1rem 3rem 1rem 1rem', borderRadius: '14px', border: '2px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', background: '#F8FAFC', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--fp-accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.9rem' }}>رقم الهاتف المعتمد (طوارئ) *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#94A3B8" style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="05xxxxxxxx"
                    style={{ width: '100%', padding: '1rem 3rem 1rem 1rem', borderRadius: '14px', border: '2px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', background: '#F8FAFC', fontWeight: '700', fontSize: '0.95rem', textAlign: 'left', direction: 'ltr', transition: 'all 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--fp-accent)'}
                    onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.9rem' }}>عنوان السكن / صلة القرابة</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#94A3B8" style={{ position: 'absolute', right: '1.25rem', top: '1.25rem' }} />
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="مثال: الرياض، حي الياسمين - صلة القرابة: والد المقيم"
                  style={{ width: '100%', padding: '1rem 3rem 1rem 1rem', borderRadius: '14px', border: '2px solid #E2E8F0', fontFamily: 'Cairo, sans-serif', background: '#F8FAFC', resize: 'none', fontWeight: '700', fontSize: '0.95rem', lineHeight: '1.7', transition: 'all 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--fp-accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                width: '100%', padding: '1.1rem', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-dark))',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: '0 10px 25px rgba(13, 33, 55, 0.25)',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { if (!saving) e.currentTarget.style.transform = 'none'; }}
            >
              {saving ? 'جاري التحديث...' : <><Save size={20} /> حفظ وتثبيت التغييرات</>}
            </button>
          </form>

          {/* Security Form */}
          <form 
            onSubmit={handleUpdatePassword} 
            className="fp-glass-card fp-animate fp-animate-delay-3"
            style={{ padding: '2.5rem', position: 'relative', borderRadius: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <KeyRound size={20} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#B91C1C' }}>الأمان وكلمة المرور</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.9rem' }}>كلمة المرور الجديدة</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '1rem 3rem 1rem 1rem', borderRadius: '14px', border: '2px solid #E2E8F0', fontFamily: 'inherit', background: '#F8FAFC', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s', direction: 'ltr' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.9rem' }}>تأكيد كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '1rem 3rem 1rem 1rem', borderRadius: '14px', border: '2px solid #E2E8F0', fontFamily: 'inherit', background: '#F8FAFC', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s', direction: 'ltr' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={savingPassword || (!newPassword && !confirmPassword)}
              style={{ 
                width: '100%', padding: '1.1rem', color: '#B91C1C', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '1rem', cursor: (!newPassword && !confirmPassword) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: '#FEE2E2',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.15)',
                opacity: (savingPassword || (!newPassword && !confirmPassword)) ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { if (!savingPassword && (newPassword || confirmPassword)) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { if (!savingPassword && (newPassword || confirmPassword)) e.currentTarget.style.transform = 'none'; }}
            >
              {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
            </button>
          </form>

          {/* Account Info Cards */}
          <div className="fp-animate fp-animate-delay-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
             <div className="fp-glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid #10B981', background: 'white', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Shield size={20} style={{ color: '#10B981' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--fp-primary)' }}>خصوصية وأمان البيانات</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--fp-text-muted)', lineHeight: 1.7, fontWeight: '600' }}>
                   كافة تفاصيل وبيانات ذويكم مشفرة وآمنة تماماً ولا يتم مشاركتها خارج نطاق الطاقم الطبي المتابع لرحلة التعافي.
                </p>
             </div>

             <div className="fp-glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid var(--fp-accent)', background: 'white', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Bell size={20} style={{ color: 'var(--fp-accent)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--fp-primary)' }}>التنبيهات العاجلة</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--fp-text-muted)', lineHeight: 1.7, fontWeight: '600' }}>
                   يرجى التأكد من بقاء رقم الهاتف أعلاه محدثاً باستمرار لتلقي الاتصالات والتنبيهات الطبية الهامة والزيارات الدورية.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
