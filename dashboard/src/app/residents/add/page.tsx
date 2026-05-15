'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Save, X, User, Clipboard, Activity, Stethoscope, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AddResidentPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    file_number: '',
    age: '',
    admission_date: new Date().toISOString().split('T')[0],
    current_stage: 'detox',
    current_status: 'stable',
    room_number: '',
    assigned_doctor: '',
    assigned_therapist: '',
    notes_internal: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['doctor', 'therapist', 'staff', 'super_admin']);
    if (data) setStaff(data);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'super_admin') setIsAdmin(true);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let insertData: any = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        admission_date: formData.admission_date,
        current_stage: formData.current_stage,
        current_status: formData.current_status,
        room_number: formData.room_number,
        assigned_doctor_id: formData.assigned_doctor || null,
        assigned_therapist_id: formData.assigned_therapist || null,
        notes_internal: formData.notes_internal,
      };

      if (isAdmin && formData.file_number.trim() !== '') {
        insertData.file_number = formData.file_number.trim();
      }

      const { data, error: saveError } = await supabase
        .from('residents')
        .insert([insertData])
        .select('file_number')
        .single();

      if (saveError) throw saveError;
      
      setSuccess(`تم إضافة المقيم بنجاح. رقم الملف: ${data.file_number}`);
      setTimeout(() => {
        router.push('/residents');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <form onSubmit={handleSave}>
          <header className="page-header">
            <div>
              <h1>إضافة مقيم جديد</h1>
              <p>إدخال البيانات الأساسية والطبية للمقيم الجديد</p>
            </div>
            <div className="page-header-actions">
              <button type="button" onClick={() => router.back()} className="btn btn-outline" style={{ borderColor: '#e2e8f0', color: '#4a5568' }}>
                <X size={18} />
                إلغاء
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save size={18} />
                {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </div>
          </header>

          {error && (
            <div style={{ backgroundColor: '#fff5f5', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', border: '1px solid #fed7d7' }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#f0fff4', color: 'var(--success)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', border: '1px solid #c6f6d5' }}>
              <Activity size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{success}</span>
            </div>
          )}

          <div className="add-resident-grid" style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Basic Info */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <User size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>البيانات الأساسية</h3>
                </div>
                <div className="two-col-grid" style={{ gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">الاسم الكامل</label>
                    <input required type="text" className="form-input" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="اسم المقيم ثلاثي" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">رقم الملف</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.file_number} 
                      onChange={e => setFormData({...formData, file_number: e.target.value})} 
                      placeholder={isAdmin ? "اكتب لتخصيص الرقم أو اتركه" : "SHAMS-YYYY-XXXX"} 
                      readOnly={!isAdmin}
                      style={{ 
                        backgroundColor: isAdmin ? 'white' : '#f8fafc',
                        cursor: isAdmin ? 'text' : 'not-allowed',
                        fontFamily: 'monospace'
                      }} 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">العمر</label>
                    <input type="number" className="form-input" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="25" min="1" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">تاريخ الدخول</label>
                    <input type="date" className="form-input" value={formData.admission_date} onChange={e => setFormData({...formData, admission_date: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Medical State */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <Activity size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>الحالة الطبية والعلاجية</h3>
                </div>
                <div className="two-col-grid" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">المرحلة الحالية</label>
                    <select className="form-input" value={formData.current_stage} onChange={e => setFormData({...formData, current_stage: e.target.value})}>
                      <option value="admission">الاستقبال والتقييم</option>
                      <option value="detox">الانسحاب (Detox)</option>
                      <option value="stabilization">الاستقرار</option>
                      <option value="rehabilitation">التأهيل النفسي</option>
                      <option value="social_reintegration">الدمج المجتمعي</option>
                      <option value="follow_up">المتابعة</option>
                      <option value="completed">مكتمل</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">الحالة العامة</label>
                    <select className="form-input" value={formData.current_status} onChange={e => setFormData({...formData, current_status: e.target.value})}>
                      <option value="stable">مستقرة</option>
                      <option value="needs_followup">تحتاج متابعة</option>
                      <option value="improving">في تحسن (Improving)</option>
                      <option value="critical">حالة حرجة (Critical)</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ملاحظات داخلية (لا تظهر للأهل)</label>
                  <textarea className="form-input" value={formData.notes_internal} onChange={e => setFormData({...formData, notes_internal: e.target.value})} rows={3} style={{ resize: 'vertical' }} placeholder="اكتب ملاحظات الفريق الطبي هنا..."></textarea>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Medical Team */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <Stethoscope size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>الفريق المتابع</h3>
                </div>
                <div className="form-group">
                  <label className="form-label">الطبيب المعالج</label>
                  <select className="form-input" value={formData.assigned_doctor} onChange={e => setFormData({...formData, assigned_doctor: e.target.value})}>
                    <option value="">اختر الطبيب...</option>
                    {staff.filter(s => s.role === 'doctor' || s.role === 'super_admin').map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">الأخصائي النفسي</label>
                  <select className="form-input" value={formData.assigned_therapist} onChange={e => setFormData({...formData, assigned_therapist: e.target.value})}>
                    <option value="">اختر الأخصائي...</option>
                    {staff.filter(s => s.role === 'therapist' || s.role === 'super_admin').map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Room */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <Clipboard size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>الإقامة</h3>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">رقم الغرفة</label>
                  <input type="text" className="form-input" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="مثلاً: 204-B" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      <style>{`
        .add-resident-grid { grid-template-columns: 2fr 1fr; }
        @media (max-width: 1024px) {
          .add-resident-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
