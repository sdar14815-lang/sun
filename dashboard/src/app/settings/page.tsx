'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Save, Settings, Phone, MapPin, Globe, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    centerName: 'دار شمس التعافي',
    phonePrimary: '01012345678',
    phoneSecondary: '01112345678',
    address: 'القاهرة، مدينة نصر',
    website: 'https://sunrecovery.net',
    allowFamilyRegistration: true,
    requireAdminApproval: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('تم حفظ الإعدادات بنجاح!');
    }, 800);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <form onSubmit={handleSave}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إعدادات النظام</h1>
              <p style={{ color: 'var(--text-muted)' }}>إدارة الإعدادات العامة للمركز والتطبيق</p>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={20} />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <Settings size={20} />
                <h3 style={{ fontSize: '1.1rem' }}>معلومات المركز الأساسية</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>اسم المركز</label>
                  <input type="text" value={formData.centerName} onChange={e => setFormData({...formData, centerName: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}><Phone size={14} /> هاتف أساسي</label>
                    <input type="text" value={formData.phonePrimary} onChange={e => setFormData({...formData, phonePrimary: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}><Phone size={14} /> هاتف بديل</label>
                    <input type="text" value={formData.phoneSecondary} onChange={e => setFormData({...formData, phoneSecondary: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}><MapPin size={14} /> العنوان</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}><Globe size={14} /> الموقع الإلكتروني</label>
                  <input type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <Shield size={20} />
                <h3 style={{ fontSize: '1.1rem' }}>إعدادات الحماية والأمان</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>السماح للأهالي بالتسجيل</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>السماح للأهالي بإنشاء حسابات من التطبيق</span>
                  </div>
                  <input type="checkbox" checked={formData.allowFamilyRegistration} onChange={e => setFormData({...formData, allowFamilyRegistration: e.target.checked})} style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>موافقة الإدارة على الحسابات</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تتطلب الحسابات الجديدة موافقة قبل التفعيل</span>
                  </div>
                  <input type="checkbox" checked={formData.requireAdminApproval} onChange={e => setFormData({...formData, requireAdminApproval: e.target.checked})} style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
