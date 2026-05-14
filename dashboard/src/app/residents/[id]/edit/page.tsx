'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Save, X, User, Clipboard, Activity, Stethoscope, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EditResidentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    file_number: '',
    age: '',
    admission_date: '',
    current_stage: 'detox',
    current_status: 'stable',
    room_number: '',
    assigned_doctor: '',
    assigned_therapist: '',
    notes_internal: ''
  });

  useEffect(() => {
    fetchStaff();
    if (id) {
      fetchResident();
    }
  }, [id]);

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

  async function fetchResident() {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          file_number: data.file_number || '',
          age: data.age?.toString() || '',
          admission_date: data.admission_date || '',
          current_stage: data.current_stage || 'detox',
          current_status: data.current_status || 'stable',
          room_number: data.room_number || '',
          assigned_doctor: data.assigned_doctor_id || '',
          assigned_therapist: data.assigned_therapist_id || '',
          notes_internal: data.notes_internal || ''
        });
      }
    } catch (err: any) {
      setError('فشل في تحميل بيانات المقيم');
    } finally {
      setFetching(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let updateData: any = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        admission_date: formData.admission_date,
        current_stage: formData.current_stage,
        current_status: formData.current_status,
        room_number: formData.room_number,
        assigned_doctor_id: formData.assigned_doctor || null,
        assigned_therapist_id: formData.assigned_therapist || null,
        notes_internal: formData.notes_internal
      };

      if (isAdmin && formData.file_number.trim() !== '') {
        updateData.file_number = formData.file_number.trim();
      }

      const { error: saveError } = await supabase
        .from('residents')
        .update(updateData)
        .eq('id', id);

      if (saveError) throw saveError;
      
      setSuccess('تم حفظ التعديلات بنجاح');
      setTimeout(() => {
        router.push('/residents');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: '2rem', textAlign: 'center' }}>جاري تحميل بيانات المقيم...</div>;

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <form onSubmit={handleSave}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>تعديل بيانات المقيم</h1>
              <p style={{ color: 'var(--text-muted)' }}>تحديث البيانات الأساسية والطبية للمقيم</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-outline" style={{ borderColor: '#ccc', color: '#666' }}>
                <X size={20} />
                إلغاء
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </header>

          {error && (
            <div style={{ backgroundColor: '#fff5f5', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#f0fff4', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} />
              {success}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <User size={20} />
                  <h3 style={{ fontSize: '1.1rem' }}>البيانات الأساسية</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>الاسم الكامل</label>
                    <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="اسم المقيم ثلاثي" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>رقم الملف</label>
                    <input 
                      type="text" 
                      value={formData.file_number} 
                      onChange={e => setFormData({...formData, file_number: e.target.value})} 
                      readOnly={!isAdmin}
                      style={{ 
                        width: '100%', padding: '0.75rem', borderRadius: '8px', 
                        border: '1px solid var(--border)', 
                        backgroundColor: isAdmin ? 'white' : '#f8fafc',
                        cursor: isAdmin ? 'text' : 'not-allowed'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>العمر</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="25" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>تاريخ الدخول</label>
                    <input type="date" value={formData.admission_date} onChange={e => setFormData({...formData, admission_date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <Activity size={20} />
                  <h3 style={{ fontSize: '1.1rem' }}>الحالة الطبية والعلاجية</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>المرحلة الحالية</label>
                    <select value={formData.current_stage} onChange={e => setFormData({...formData, current_stage: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <option value="detox">الانسحاب (Detox)</option>
                      <option value="rehabilitation">التأهيل النفسي</option>
                      <option value="social_reintegration">الدمج المجتمعي</option>
                      <option value="follow_up">المتابعة</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>الحالة العامة</label>
                    <select value={formData.current_status} onChange={e => setFormData({...formData, current_status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <option value="stable">مستقرة</option>
                      <option value="needs_followup">تحتاج متابعة</option>
                      <option value="significant_progress">تقدم ملحوظ</option>
                      <option value="important_note">ملاحظة هامة</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>ملاحظات داخلية (لا تظهر للأهل)</label>
                  <textarea value={formData.notes_internal} onChange={e => setFormData({...formData, notes_internal: e.target.value})} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', resize: 'none' }} placeholder="اكتب ملاحظات الفريق الطبي هنا..."></textarea>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <Stethoscope size={20} />
                  <h3 style={{ fontSize: '1.1rem' }}>الفريق المتابع</h3>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>الطبيب المعالج</label>
                  <select value={formData.assigned_doctor} onChange={e => setFormData({...formData, assigned_doctor: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <option value="">اختر الطبيب...</option>
                    {staff.filter(s => s.role === 'doctor' || s.role === 'super_admin').map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>الأخصائي النفسي</label>
                  <select value={formData.assigned_therapist} onChange={e => setFormData({...formData, assigned_therapist: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <option value="">اختر الأخصائي...</option>
                    {staff.filter(s => s.role === 'therapist' || s.role === 'super_admin').map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <Clipboard size={20} />
                  <h3 style={{ fontSize: '1.1rem' }}>الإقامة</h3>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>رقم الغرفة</label>
                  <input type="text" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} placeholder="مثلاً: 204-B" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
