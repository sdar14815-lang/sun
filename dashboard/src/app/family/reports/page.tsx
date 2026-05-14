'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { FileText, CheckCircle, Clock } from 'lucide-react';

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

      // RLS handles filtering — only published + visible_to_family + linked residents
      const { data } = await supabase
        .from('weekly_reports')
        .select('*, residents(full_name, file_number)')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#718096', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: '800', color: '#1a365d', marginBottom: '0.25rem' }}>التقارير الدورية</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>التقارير المنشورة الخاصة بذويك</p>
        </div>

        {reports.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <FileText size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ color: '#718096', fontSize: '0.95rem' }}>لا توجد تقارير منشورة حالياً</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map(r => (
              <div key={r.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: 'clamp(1.25rem, 4vw, 1.75rem)', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #edf2f7'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ padding: '0.625rem', borderRadius: '10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontWeight: '700', color: '#1a365d', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.report_title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.15rem' }}>
                        {r.residents?.full_name} · <span style={{ fontFamily: 'monospace' }}>{r.residents?.file_number}</span>
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', backgroundColor: '#f7fafc', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {r.progress_score !== null && r.progress_score !== undefined && (
                  <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: '600' }}>نسبة التقدم</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1a365d' }}>{r.progress_score}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${r.progress_score}%`, height: '100%', background: 'linear-gradient(90deg, #1a365d, #4299e1)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )}

                <div style={{ backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                  <p style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {r.report_body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
