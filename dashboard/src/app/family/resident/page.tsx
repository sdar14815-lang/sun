'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Activity, Sparkles, Award } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة'
};

const STAGE_CLASSES: Record<string, string> = {
  detox: 'fp-stage-detox',
  rehabilitation: 'fp-stage-rehab',
  social_reintegration: 'fp-stage-social',
  follow_up: 'fp-stage-followup',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  stable: { label: 'مستقر', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  needs_followup: { label: 'يحتاج متابعة', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  significant_progress: { label: 'تقدم ملحوظ', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  important_note: { label: 'ملاحظة مهمة', color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' },
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
      
      // Combined Query: Fetch profile details, active family links, and resident records in a single request
      const { data: prof } = await supabase
        .from('profiles')
        .select('*, family_links(resident_id, relation, is_active, residents(*))')
        .eq('id', user.id)
        .single();
        
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      const activeLinks = prof.family_links?.filter((l: any) => l.is_active) || [];
      const linked: any[] = activeLinks.map((l: any) => ({ ...(l.residents ?? {}), relation: l.relation })) ?? [];
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل ملف المقيم...</p>
        </div>
      </div>
    );
  }

  const s = selectedResident ? (STATUS_LABELS[selectedResident.current_status] || STATUS_LABELS['stable']) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               ملف المقيم الموحد
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>متابعة فورية للحالة الصحية والتعليمية وتفاصيل التقدم</p>
          </div>
          <div className="fp-glow-icon">
            <User size={22} />
          </div>
        </div>

        {residents.length === 0 ? (
          <div className="fp-glass-card" style={{ padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center' }}>
            <User size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.95rem', fontWeight: '700' }}>لا يوجد مقيم مرتبط بحسابك. يرجى التواصل مع إدارة دار شمس التعافي.</p>
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
                {residents.map(r => {
                  const isSelected = selectedResident?.id === r.id;
                  return (
                    <button key={r.id} onClick={() => switchResident(r)}
                      style={{
                        padding: '0.6rem 1.25rem', 
                        borderRadius: '20px', 
                        border: isSelected ? '2px solid var(--fp-primary)' : '2px solid transparent',
                        backgroundColor: isSelected ? 'var(--fp-primary)' : 'var(--fp-glass)',
                        color: isSelected ? 'white' : 'var(--fp-text)',
                        boxShadow: 'var(--fp-shadow-double)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer', 
                        fontFamily: 'Cairo, sans-serif', 
                        fontWeight: '800', 
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}>
                        {r.full_name}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedResident && s && (
              <div className="resident-grid" style={{ display: 'grid', gap: '1.5rem', alignItems: 'start' }}>
                {/* Resident Info Card */}
                <div className="fp-glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      width: '64px', height: '64px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      margin: '0 auto 1rem auto', 
                      color: 'white', fontSize: '1.5rem', fontWeight: '800',
                      boxShadow: '0 4px 12px rgba(13,40,71,0.2)'
                    }}>
                      {selectedResident.full_name?.charAt(0)}
                    </div>
                    <h2 style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--fp-primary)' }}>{selectedResident.full_name}</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--fp-text-muted)', fontWeight: '700', marginTop: '0.2rem' }}>صلة القرابة: {selectedResident.relation}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--fp-border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--fp-text-muted)', fontWeight: '700' }}>رقم الملف</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--fp-primary)', fontFamily: 'monospace' }}>{selectedResident.file_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--fp-border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--fp-text-muted)', fontWeight: '700' }}>المرحلة العلاجية</span>
                      <span className={`fp-stage-badge ${STAGE_CLASSES[selectedResident.current_stage] || 'fp-stage-rehab'}`} style={{ fontSize: '0.65rem' }}>
                        {STAGE_LABELS[selectedResident.current_stage] || selectedResident.current_stage}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--fp-text-muted)', fontWeight: '700' }}>الوضع الحالي</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', backgroundColor: s.bg, color: s.color, padding: '0.25rem 0.6rem', borderRadius: '8px', border: `1px solid ${s.border}` }}>{s.label}</span>
                    </div>
                  </div>

                  {selectedResident.progress_score !== undefined && selectedResident.progress_score !== null && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'white', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--fp-primary)', fontWeight: '800' }}>مؤشر الالتزام</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: s.color }}>{selectedResident.progress_score}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${selectedResident.progress_score}%`, height: '100%', background: `linear-gradient(90deg, ${s.color}, var(--fp-accent))`, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )}

                  {selectedResident.notes_internal && (
                    <div style={{ marginTop: '1.25rem', backgroundColor: 'rgba(240,165,0,0.06)', borderRadius: '12px', padding: '0.875rem', border: '1px solid rgba(240,165,0,0.12)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--fp-accent)', fontWeight: '800', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Sparkles size={14} /> ملاحظة من مشرف الحالة</p>
                      <p style={{ fontSize: '0.82rem', color: '#4a5568', lineHeight: 1.6, fontWeight: '600' }}>{selectedResident.notes_internal}</p>
                    </div>
                  )}
                </div>

                {/* Updates */}
                <div>
                  <h3 style={{ fontWeight: '900', color: 'var(--fp-primary)', fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} style={{ color: 'var(--fp-accent)' }} /> تحديثات الخطة العلاجية واليومية
                  </h3>
                  
                  {updates.length === 0 ? (
                    <div className="fp-glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)', textAlign: 'center' }}>
                      <Activity size={32} color="#cbd5e0" style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                      <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.9rem', fontWeight: '700' }}>لم تصدر أي تحديثات مرئية لهذا المقيم اليوم.</p>
                    </div>
                  ) : updates.map(u => (
                    <div key={u.id} className="fp-glass-card" style={{ 
                      marginBottom: '0.75rem', 
                      borderRight: '5px solid var(--fp-accent)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(13,40,71,0.06)', color: 'var(--fp-primary)', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: '800', border: '1px solid rgba(13,40,71,0.1)' }}>
                          {UPDATE_TYPE_LABELS[u.update_type] || u.update_type}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '600' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {u.title && <p style={{ fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>{u.title}</p>}
                      <p style={{ color: '#4a5568', fontSize: '0.85rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontWeight: '600' }}>{u.content}</p>
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
