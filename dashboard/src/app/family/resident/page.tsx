'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Activity } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة'
};
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  stable: { label: 'مستقر', color: '#2f855a', bg: '#f0fff4' },
  needs_followup: { label: 'يحتاج متابعة', color: '#c05621', bg: '#fffaf0' },
  significant_progress: { label: 'تقدم ملحوظ', color: '#2b6cb0', bg: '#ebf8ff' },
  important_note: { label: 'ملاحظة مهمة', color: '#c53030', bg: '#fff5f5' },
};
const UPDATE_TYPE_LABELS: Record<string, string> = {
  general: 'حالة عامة', specialist_note: 'ملاحظة أخصائي',
  doctor_note: 'ملاحظة طبيب', session_attendance: 'حضور جلسة',
  behavioral_progress: 'تطور سلوكي', family_alert: 'تنبيه للأسرة',
};

export default function FamilyResidentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      const { data: links } = await supabase
        .from('family_links')
        .select('resident_id, relation, residents(*)')
        .eq('family_user_id', user.id)
        .eq('is_active', true);

      const linked: any[] = links?.map(l => ({ ...(l.residents as any ?? {}), relation: l.relation })) ?? [];
      setResidents(linked);

      if (linked.length > 0) {
        setSelectedResident(linked[0]);
        await loadUpdates(linked[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUpdates(residentId: string) {
    const { data } = await supabase
      .from('resident_updates')
      .select('*')
      .eq('resident_id', residentId)
      .eq('visible_to_family', true)
      .order('created_at', { ascending: false });
    setUpdates(data || []);
  }

  async function switchResident(r: any) {
    setSelectedResident(r);
    await loadUpdates(r.id);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#718096', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const s = selectedResident ? (STATUS_LABELS[selectedResident.current_status] || STATUS_LABELS['stable']) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: '800', color: '#1a365d', marginBottom: '0.25rem' }}>ملف المقيم</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>معلومات وتحديثات المقيم المرتبط بحسابك</p>
        </div>

        {residents.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <User size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ color: '#718096', fontSize: '0.95rem' }}>لا يوجد مقيم مرتبط بحسابك. يرجى التواصل مع الإدارة.</p>
          </div>
        ) : (
          <>
            {/* Resident Tabs */}
            {residents.length > 1 && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '1.5rem', 
                overflowX: 'auto', 
                paddingBottom: '0.5rem',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                {residents.map(r => (
                  <button key={r.id} onClick={() => switchResident(r)}
                    style={{
                      padding: '0.5rem 1rem', 
                      borderRadius: '20px', 
                      border: '2px solid',
                      borderColor: selectedResident?.id === r.id ? '#1a365d' : '#e2e8f0',
                      backgroundColor: selectedResident?.id === r.id ? '#1a365d' : 'white',
                      color: selectedResident?.id === r.id ? 'white' : '#4a5568',
                      cursor: 'pointer', 
                      fontFamily: 'inherit', 
                      fontWeight: '600', 
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      {r.full_name}
                  </button>
                ))}
              </div>
            )}

            {selectedResident && s && (
              <div className="resident-grid" style={{ display: 'grid', gap: '1.5rem', alignItems: 'start' }}>
                {/* Resident Info Card */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(1.25rem, 4vw, 1.75rem)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '64px', height: '64px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #1a365d, #4299e1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      margin: '0 auto 1rem auto', 
                      color: 'white', fontSize: '1.5rem', fontWeight: '800',
                      boxShadow: '0 4px 10px rgba(26,54,93,0.2)'
                    }}>
                      {selectedResident.full_name?.charAt(0)}
                    </div>
                    <h2 style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1a365d' }}>{selectedResident.full_name}</h2>
                    <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>{selectedResident.relation}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f7fafc' }}>
                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>رقم الملف</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a365d', fontFamily: 'monospace' }}>{selectedResident.file_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f7fafc' }}>
                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>المرحلة</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a365d' }}>{STAGE_LABELS[selectedResident.current_stage] || selectedResident.current_stage}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#718096' }}>الحالة</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', backgroundColor: s.bg, color: s.color, padding: '0.2rem 0.6rem', borderRadius: '12px', border: `1px solid ${s.bg}` }}>{s.label}</span>
                    </div>
                  </div>

                  {selectedResident.progress_score !== undefined && selectedResident.progress_score !== null && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#718096' }}>نسبة التقدم</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a365d' }}>{selectedResident.progress_score}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${selectedResident.progress_score}%`, height: '100%', background: 'linear-gradient(90deg, #1a365d, #4299e1)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  {selectedResident.notes_internal && (
                    <div style={{ marginTop: '1.25rem', backgroundColor: '#f7fafc', borderRadius: '8px', padding: '0.875rem', border: '1px solid #edf2f7' }}>
                      <p style={{ fontSize: '0.75rem', color: '#718096', fontWeight: '700', marginBottom: '0.25rem' }}>ملاحظة من الإدارة</p>
                      <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.6 }}>{selectedResident.notes_internal}</p>
                    </div>
                  )}
                </div>

                {/* Updates */}
                <div>
                  <h3 style={{ fontWeight: '700', color: '#1a365d', fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} /> التحديثات الأخيرة
                  </h3>
                  
                  {updates.length === 0 ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <Activity size={32} color="#cbd5e0" style={{ margin: '0 auto 0.5rem auto' }} />
                      <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>لا توجد تحديثات مرئية حالياً</p>
                    </div>
                  ) : updates.map(u => (
                    <div key={u.id} style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      padding: 'clamp(1rem, 3vw, 1.25rem)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                      marginBottom: '0.75rem', 
                      borderRight: '4px solid #4299e1' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700' }}>
                          {UPDATE_TYPE_LABELS[u.update_type] || u.update_type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {u.title && <p style={{ fontWeight: '700', color: '#1a365d', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{u.title}</p>}
                      <p style={{ color: '#4a5568', fontSize: '0.85rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{u.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .resident-grid { grid-template-columns: 1fr 2fr; }
        @media (max-width: 768px) {
          .resident-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
