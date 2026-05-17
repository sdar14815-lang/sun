'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { FileText, CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function FamilyReportsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      // 1. Get linked resident IDs for this family member
      const { data: links } = await supabase
        .from('family_links')
        .select('resident_id')
        .eq('family_user_id', user.id)
        .eq('is_active', true);

      const residentIds = links?.map(l => l.resident_id).filter(Boolean) || [];

      if (residentIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      // 2. Fetch reports only for these residents
      const { data } = await supabase
        .from('weekly_reports')
        .select('*, residents(full_name, file_number)')
        .in('resident_id', residentIds)
        .eq('visible_to_family', true)
        .order('created_at', { ascending: false });
      
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        
        {/* Header Block */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               التقارير الطبية والأسبوعية
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>التقارير الدورية الصادرة والمعتمدة من الكادر الطبي المختص</p>
          </div>
          <div className="fp-glow-icon">
            <FileText size={22} />
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="fp-glass-card" style={{ padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center' }}>
            <FileText size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.95rem', fontWeight: '700' }}>لا توجد تقارير منشورة حالياً لذويك.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reports.map(r => (
              <div key={r.id} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
                borderRight: '5px solid var(--fp-success)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div className="fp-glow-icon fp-glow-icon-success">
                      <FileText size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontWeight: '900', color: 'var(--fp-primary)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.report_title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--fp-text-muted)', fontWeight: '700', marginTop: '0.15rem' }}>
                        {r.residents?.full_name} · <span style={{ fontFamily: 'monospace' }}>{r.residents?.file_number}</span>
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', backgroundColor: 'white', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid var(--fp-border)', fontWeight: '800', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {r.progress_score !== null && r.progress_score !== undefined && (
                  <div style={{ marginBottom: '1.25rem', backgroundColor: 'white', padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--fp-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--fp-primary)', fontWeight: '800' }}>مؤشر الالتزام والتقدم</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--fp-success)' }}>{r.progress_score}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.progress_score}%`, height: '100%', background: 'linear-gradient(90deg, var(--fp-success), var(--fp-accent))', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--fp-border)' }}>
                  <p style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontWeight: '600' }}>
                    {r.report_body}
                  </p>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      btn.disabled = true;
                      btn.innerText = 'تم الاطلاع ✓';
                      btn.style.backgroundColor = '#ECFDF5';
                      btn.style.color = '#10B981';
                      btn.style.borderColor = '#A7F3D0';
                      
                      try {
                        await supabase.from('weekly_reports').update({ family_read_at: new Date().toISOString() }).eq('id', r.id);
                      } catch (err) {
                        console.log('Acknowledgment saved locally only');
                      }
                    }}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--fp-border)',
                      background: 'white',
                      color: 'var(--fp-primary)',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      fontFamily: 'Cairo, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--fp-shadow-double)',
                    }}
                    onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'none'; }}
                  >
                    تأكيد الاطلاع والاستلام
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
