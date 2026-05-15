'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Phone, MapPin, Save, CheckCircle2, Shield, Bell, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

export default function FamilyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setFullName(data?.full_name || '');
      setPhoneNumber(data?.phone_number || '');
      setAddress(data?.address || '');
    }
    setLoading(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          address: address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="fp-skeleton" style={{ height: '160px', borderRadius: '20px', marginBottom: '1rem' }} />
          <div className="fp-skeleton-card">
            {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton-line w-full" style={{ height: '40px', marginBottom: '1.5rem' }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <FamilyNavbar userName={fullName} />
      
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>
        
        {/* Profile Header with Cover */}
        <div className="fp-animate" style={{ position: 'relative', marginBottom: '4rem' }}>
          <div className="fp-profile-cover" />
          <div className="fp-profile-avatar-wrapper">
            <div className="fp-profile-avatar">
              {getInitials(fullName)}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1B4F72' }}>{fullName}</h1>
              <p style={{ color: '#64748B', fontWeight: '600', fontSize: '0.9rem' }}>ولي أمر • دار شمس التعافي</p>
            </div>
          </div>
        </div>

        <div className="two-col-grid" style={{ gridTemplateColumns: '1fr' }}>
          
          {/* Main Settings Form */}
          <form 
            onSubmit={handleUpdate} 
            className="fp-animate fp-animate-delay-1"
            style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '20px', boxShadow: 'var(--fp-shadow)', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: '#F0A50015', color: '#F0A500', borderRadius: '8px' }}>
                <User size={20} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1B4F72' }}>البيانات الشخصية</h2>
            </div>

            {success && (
              <div className="fp-success-check" style={{ marginBottom: '1.5rem', backgroundColor: '#ECFDF5', color: '#059669', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #D1FAE5' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontWeight: '700' }}>تم تحديث البيانات بنجاح</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>الاسم الكامل</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94A3B8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="fp-input"
                    style={{ width: '100%', padding: '0.875rem 2.8rem 0.875rem 1rem', borderRadius: '12px', border: '2px solid #F1F5F9', fontFamily: 'inherit', background: '#F8FAFC' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>رقم الهاتف (للطوارئ)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#94A3B8" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="01xxxxxxxxx"
                    className="fp-input"
                    style={{ width: '100%', padding: '0.875rem 2.8rem 0.875rem 1rem', borderRadius: '12px', border: '2px solid #F1F5F9', fontFamily: 'inherit', background: '#F8FAFC', textAlign: 'left', direction: 'ltr' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>العنوان الحالي</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#94A3B8" style={{ position: 'absolute', right: '1rem', top: '1.1rem' }} />
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="fp-input"
                  style={{ width: '100%', padding: '0.875rem 2.8rem 0.875rem 1rem', borderRadius: '12px', border: '2px solid #F1F5F9', fontFamily: 'inherit', background: '#F8FAFC', resize: 'none' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="fp-login-btn"
              style={{ 
                width: '100%', padding: '1rem', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'جاري الحفظ...' : <><Save size={20} /> حفظ التغييرات</>}
            </button>
          </form>

          {/* Account Info Cards */}
          <div className="fp-animate fp-animate-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
             <div style={{ backgroundColor: '#F0F9FF', padding: '1.25rem', borderRadius: '20px', border: '1px solid #BAE6FD' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Shield size={20} style={{ color: '#0284C7' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0369A1' }}>أمان الحساب</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#075985', lineHeight: 1.5 }}>بياناتك مشفرة ومحمية بالكامل. لا تشارك كلمة المرور الخاصة بك مع أي شخص لضمان خصوصية ذويك.</p>
             </div>

             <div style={{ backgroundColor: '#FDF2F8', padding: '1.25rem', borderRadius: '20px', border: '1px solid #FBCFE8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Bell size={20} style={{ color: '#DB2777' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#9D174D' }}>التنبيهات</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#BE185D', lineHeight: 1.5 }}>سيتم إرسال إشعارات فورية إلى هاتفك عند وجود أي تحديثات طارئة أو تقارير جديدة تخص ذويك.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
