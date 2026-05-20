'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { TrendingUp, Activity, Star, AlertCircle, CheckCircle, Clock, Award } from 'lucide-react';

const STAGE_MAP: Record<string, { label: string; color: string; order: number }> = {
  admission:            { label: 'الاستقبال والتقييم',   color: '#6366f1', order: 1 },
  detox:                { label: 'إزالة السموم (Detox)',  color: '#ef4444', order: 2 },
  stabilization:        { label: 'الاستقرار',            color: '#f97316', order: 3 },
  rehabilitation:       { label: 'إعادة التأهيل',        color: '#3b82f6', order: 4 },
  social_reintegration: { label: 'الاندماج الاجتماعي',  color: '#10b981', order: 5 },
  follow_up:            { label: 'المتابعة',              color: '#8b5cf6', order: 6 },
  completed:            { label: 'مكتمل ✓',              color: '#059669', order: 7 },
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  stable:          { label: 'مستقر',        color: '#10b981', icon: CheckCircle },
  needs_followup:  { label: 'يحتاج متابعة', color: '#f97316', icon: AlertCircle },
  improving:       { label: 'في تحسن',      color: '#3b82f6', icon: TrendingUp  },
  critical:        { label: 'حالة حرجة',    color: '#ef4444', icon: AlertCircle },
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ position: 'relative', height: '10px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginTop: '0.4rem' }}>
      <div style={{
        height: '100%',
        width: `${Math.max(score, 4)}%`,
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        borderRadius: '99px',
        transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  );
}

function StageRoadmap({ currentStage }: { currentStage: string }) {
  const stages = Object.entries(STAGE_MAP).sort((a, b) => a[1].order - b[1].order);
  const currentOrder = STAGE_MAP[currentStage]?.order ?? 1;

  return (
    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid var(--fp-border)', marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={16} style={{ color: 'var(--fp-accent)' }} /> خارطة مسار التعافي
      </h3>
      <div style={{ position: 'relative' }}>
        {/* Connector line */}
        <div style={{ position: 'absolute', top: '18px', right: '18px', left: '18px', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '18px', right: '18px', height: '2px', background: 'var(--fp-accent)', zIndex: 1, width: `${((currentOrder - 1) / (stages.length - 1)) * 100}%`, transition: 'width 1.5s ease' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          {stages.map(([key, meta]) => {
            const done   = meta.order < currentOrder;
            const active = key === currentStage;
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: done ? meta.color : active ? meta.color : '#e2e8f0',
                  border: active ? `3px solid ${meta.color}` : done ? 'none' : '2px solid #cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 0 6px ${meta.color}20` : 'none',
                  transition: 'all 0.5s ease',
                }}>
                  {done ? <CheckCircle size={16} color="white" /> : active ? <Star size={15} color="white" /> : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'block' }} />}
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: active ? '900' : done ? '700' : '500', color: active ? meta.color : done ? '#64748b' : '#94a3b8', textAlign: 'center', lineHeight: 1.3, maxWidth: '56px' }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FamilyProgressPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [reports, setReports]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, family_links(resident_id, is_active, residents(id, full_name, file_number, current_stage, current_status, progress_score, admission_date))')
        .eq('id', user.id)
        .single();

      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      if (prof.status !== 'active') { router.push('/family/dashboard'); return; }
      setProfile(prof);

      const activeLinks = prof.family_links?.filter((l: any) => l.is_active) || [];
      const linked = activeLinks.map((l: any) => l.residents).filter(Boolean);
      setResidents(linked);

      if (linked.length > 0) {
        setSelectedResident(linked[0].id);
        const ids = linked.map((r: any) => r.id);

        // Fetch weekly reports as progress checkpoints
        const { data: rData } = await supabase
          .from('weekly_reports')
          .select('id, report_title, progress_score, created_at, resident_id, report_status')
          .in('resident_id', ids)
          .eq('visible_to_family', true)
          .order('created_at', { ascending: true });

        setReports(rData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const activeResident = residents.find(r => r.id === selectedResident);
  const residentReports = reports.filter(r => r.resident_id === selectedResident);
  const statusInfo = STATUS_MAP[activeResident?.current_status] || STATUS_MAP.stable;
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--fp-border)', borderTopColor: 'var(--fp-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700' }}>جاري تحميل بيانات التقدم...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>

        {/* Header */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-accent)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} style={{ color: 'var(--fp-accent)' }} /> مسار التقدم والتعافي
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>خط زمني تراكمي يعرض رحلة التعافي أسبوعاً بعد أسبوع</p>
          </div>
        </div>

        {/* Resident Selector (if multiple) */}
        {residents.length > 1 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {residents.map((r: any) => (
              <button key={r.id} onClick={() => setSelectedResident(r.id)} style={{
                padding: '0.6rem 1.25rem', borderRadius: '14px', fontWeight: '800', fontSize: '0.85rem',
                fontFamily: 'Cairo, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                background: selectedResident === r.id ? 'var(--fp-primary)' : 'white',
                color: selectedResident === r.id ? 'white' : 'var(--fp-primary)',
                border: `2px solid ${selectedResident === r.id ? 'var(--fp-primary)' : 'var(--fp-border)'}`,
              }}>
                {r.full_name}
              </button>
            ))}
          </div>
        )}

        {activeResident ? (
          <>
            {/* Resident Overview Card */}
            <div className="fp-glass-card fp-animate fp-animate-delay-2" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--fp-primary)' }}>{activeResident.full_name}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--fp-text-muted)', fontWeight: '600', fontFamily: 'monospace', marginTop: '0.2rem' }}>{activeResident.file_number}</p>
                  {activeResident.admission_date && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--fp-text-muted)', fontWeight: '600', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> منذ: {new Date(activeResident.admission_date).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px', background: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}40` }}>
                  <StatusIcon size={16} style={{ color: statusInfo.color }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
              </div>

              {/* Progress Score */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--fp-primary)' }}>مؤشر التقدم الإجمالي</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--fp-success)' }}>{activeResident.progress_score ?? 0}%</span>
                </div>
                <ScoreBar score={activeResident.progress_score ?? 0} color="var(--fp-success)" />
              </div>

              {/* Stage Roadmap */}
              <StageRoadmap currentStage={activeResident.current_stage} />
            </div>

            {/* Weekly Timeline */}
            <div className="fp-glass-card fp-animate fp-animate-delay-3" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: 'var(--fp-accent)' }} />
                السجل التراكمي للتقدم الأسبوعي
                <span style={{ marginRight: 'auto', fontSize: '0.78rem', color: 'var(--fp-text-muted)', fontWeight: '600' }}>{residentReports.length} تقرير</span>
              </h3>

              {residentReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <TrendingUp size={48} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700' }}>لا توجد تقارير منشورة بعد</p>
                  <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.82rem', marginTop: '0.4rem', fontWeight: '600' }}>سيظهر هنا خط التقدم فور نشر الكادر الطبي لأول تقرير</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingRight: '2rem' }}>
                  {/* Vertical line */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, right: '10px', width: '2px', background: 'linear-gradient(to bottom, var(--fp-accent), var(--fp-border))' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {residentReports.map((report: any, idx: number) => {
                      const score = report.progress_score ?? 0;
                      const prevScore = idx > 0 ? (residentReports[idx - 1].progress_score ?? 0) : 0;
                      const delta = score - prevScore;
                      const isLast = idx === residentReports.length - 1;

                      return (
                        <div key={report.id} style={{ position: 'relative', animation: `fp-fadeIn 0.4s ease ${idx * 0.08}s both` }}>
                          {/* Timeline dot */}
                          <div style={{
                            position: 'absolute', right: '-2rem', top: '1rem',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: isLast ? 'var(--fp-accent)' : 'white',
                            border: `3px solid ${isLast ? 'var(--fp-accent)' : 'var(--fp-border)'}`,
                            boxShadow: isLast ? '0 0 0 4px rgba(240,165,0,0.2)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 2,
                          }}>
                            {isLast && <Star size={9} color="white" />}
                          </div>

                          <div style={{
                            background: isLast ? 'linear-gradient(135deg, rgba(240,165,0,0.05), rgba(13,40,71,0.03))' : 'white',
                            border: `1px solid ${isLast ? 'rgba(240,165,0,0.3)' : 'var(--fp-border)'}`,
                            borderRadius: '16px', padding: '1.25rem',
                            boxShadow: isLast ? '0 8px 24px rgba(240,165,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div>
                                <p style={{ fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.92rem' }}>{report.report_title}</p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '600', marginTop: '0.2rem' }}>
                                  {new Date(report.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: score >= 70 ? 'var(--fp-success)' : score >= 40 ? 'var(--fp-accent)' : 'var(--fp-primary)' }}>
                                  {score}%
                                </span>
                                {idx > 0 && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: delta >= 0 ? '#10b981' : '#ef4444' }}>
                                    {delta >= 0 ? `▲ +${delta}%` : `▼ ${delta}%`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ScoreBar score={score} color={score >= 70 ? '#10b981' : score >= 40 ? '#f97316' : '#3b82f6'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="fp-glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700' }}>لم يتم ربط حسابك بأي مقيم بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
