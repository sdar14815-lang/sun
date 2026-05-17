'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Phone, MapPin, Save, CheckCircle2, Shield, Bell, Settings, Sparkles } from 'lucide-react';
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={fullName} />
      
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>
        
        {/* Profile Header with Cover */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ position: 'relative', marginBottom: '3rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ 
            height: '140px', 
            background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))', 
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle, #fff 10%, transparent 11%)', backgroundSize: '12px 12px' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-60px', paddingBottom: '2rem' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--fp-accent), #f39c12)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: '900',
              boxShadow: '0 10px 25px rgba(240, 165, 0, 0.4)',
              border: '4px solid white',
              fontFamily: 'Cairo, sans-serif'
            }}>
              {getInitials(fullName)}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--fp-primary)' }}>{fullName}</h1>
              <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700', fontSize: '0.8rem', marginTop: '0.2rem' }}>عضو عائلة معتمد • دار شمس التعافي</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {/* Main Settings Form */}
          <form 
            onSubmit={handleUpdate} 
            className="fp-glass-card fp-animate fp-animate-delay-2"
            style={{ padding: '2rem', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--fp-border)', paddingBottom: '1rem' }}>
              <div className="fp-glow-icon" style={{ width: '36px', height: '36px' }}>
                <User size={18} />
              </div>
              <h2 style={{ fontSize: '1.02rem', fontWeight: '900', color: 'var(--fp-primary)' }}>تعديل وتحديث البيانات الشخصية</h2>
            </div>

            {success && (
              <div className="fp-animate" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--fp-success)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.15)', fontSize: '0.85rem', fontWeight: '800' }}>
                <CheckCircle2 size={16} />
                <span>تم حفظ وتحديث بيانات ملفك بنجاح.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.85rem' }}>الاسم الكامل للأهل *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--fp-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.85rem 2.8rem 0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--fp-border)', fontFamily: 'Cairo, sans-serif', background: 'white', fontWeight: '600', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.85rem' }}>رقم الهاتف المعتمد (طوارئ) *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--fp-text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="05xxxxxxxx"
                    style={{ width: '100%', padding: '0.85rem 2.8rem 0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--fp-border)', fontFamily: 'Cairo, sans-serif', background: 'white', fontWeight: '600', fontSize: '0.9rem', textAlign: 'left', direction: 'ltr' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.85rem' }}>عنوان السكن والقرابة</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="var(--fp-text-muted)" style={{ position: 'absolute', right: '1rem', top: '1rem' }} />
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="مثال: الرياض، حي الياسمين - صلة القرابة: والد المقيم"
                  style={{ width: '100%', padding: '0.85rem 2.8rem 0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--fp-border)', fontFamily: 'Cairo, sans-serif', background: 'white', resize: 'none', fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.7' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                width: '100%', padding: '1rem', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))',
                fontFamily: 'Cairo, sans-serif',
                boxShadow: 'var(--fp-shadow-double)',
                opacity: saving ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { if (!saving) e.currentTarget.style.transform = 'none'; }}
            >
              {saving ? 'جاري التحديث...' : <><Save size={18} /> حفظ وتثبيت التغييرات</>}
            </button>
          </form>

          {/* Account Info Cards */}
          <div className="fp-animate fp-animate-delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
             <div className="fp-glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--fp-success)', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Shield size={16} style={{ color: 'var(--fp-success)' }} />
                  <h3 style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--fp-primary)' }}>خصوصية وأمان البيانات</h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--fp-text-muted)', lineHeight: 1.6, fontWeight: '600' }}>
                   كافة تفاصيل وبيانات ذويكم مشفرة وآمنة تماماً ولا يتم مشاركتها خارج نطاق الطاقم الطبي المتابع لرحلة التعافي.
                </p>
             </div>

             <div className="fp-glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--fp-accent)', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Bell size={16} style={{ color: 'var(--fp-accent)' }} />
                  <h3 style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--fp-primary)' }}>التنبيهات العاجلة</h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--fp-text-muted)', lineHeight: 1.6, fontWeight: '600' }}>
                   يرجى التأكد من بقاء رقم الهاتف أعلاه محدثاً باستمرار لتلقي الاتصالات والتنبيهات الطبية الهامة والزيارات الدورية.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
