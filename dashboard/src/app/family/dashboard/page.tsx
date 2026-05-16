'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, Activity, MessageSquare, MessageCircle, Info, Clock, Sparkles, Zap, Award, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  stable:               { label: 'مستقر',         color: '#059669', bg: '#f0fff4', border: '#c6f6d5' },
  needs_followup:       { label: 'يحتاج متابعة',  color: '#d97706', bg: '#fffaf0', border: '#feebc8' },
  significant_progress: { label: 'تقدم ملحوظ',    color: '#2563eb', bg: '#ebf8ff', border: '#bee3f8' },
  important_note:       { label: 'ملاحظة مهمة',   color: '#dc2626', bg: '#fff5f5', border: '#fed7d7' },
};

function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fp-progress-ring">
      <svg viewBox="0 0 56 56">
        <circle className="ring-bg" cx="28" cy="28" r={radius} />
        <circle 
          className="ring-fill" 
          cx="28" 
          cy="28" 
          r={radius} 
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-value" style={{ color }}>{percentage}%</div>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}

export default function FamilyDashboardPage() {
  const router = useRouter();
  const [profile, setProfile]                     = useState<any>(null);
  const [residents, setResidents]                 = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates]         = useState<any[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [bubbles, setBubbles]                     = useState<any[]>([]);

  useEffect(() => { 
    loadAll(); 
  }, []);

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }

      const [{ data: prof }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      const { data: links } = await supabase
        .from('family_links')
        .select('resident_id, relation, residents(id, full_name, file_number, current_stage, current_status, progress_score)')
        .eq('family_user_id', user.id)
        .eq('is_active', true);

      const linked = links?.map((l: any) => ({ ...l.residents, relation: l.relation })).filter(Boolean) || [];
      setResidents(linked);

      const residentIds = links?.map((l: any) => l.resident_id).filter(Boolean) || [];

      if (residentIds.length > 0) {
        const [updatesRes] = await Promise.all([
          supabase
            .from('resident_updates')
            .select('id, title, content, update_type, created_at, resident_id')
            .in('resident_id', residentIds)
            .eq('visible_to_family', true)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setRecentUpdates(updatesRes.data || []);
        
        if (updatesRes.data && updatesRes.data.length > 0) {
            setBubbles(updatesRes.data.slice(0, 2).map(u => ({ id: u.id, text: `تحديث جديد: ${u.title || 'تقرير حالة'}` })));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="fp-skeleton" style={{ height: '60px', borderRadius: '30px', marginBottom: '2rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton" style={{ height: '100px', borderRadius: '14px' }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />

      {/* Floating Notification Bubbles */}
      <div className="fp-bubble-container">
        {bubbles.map((b, i) => (
          <div key={b.id} className="fp-bubble" style={{ animationDelay: `${i * 0.5}s` }}>
             <div style={{ background: '#F0A500', padding: '0.4rem', borderRadius: '10px', color: 'white' }}>
                <Zap size={14} />
             </div>
             <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1B4F72', flex: 1 }}>{b.text}</div>
             <button onClick={() => setBubbles(prev => prev.filter(x => x.id !== b.id))} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={14} />
             </button>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>

        {/* ── Stats Grid ── */}
        <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: User, label: 'المقيمون', value: residents.length, color: '#1B4F72' },
            { icon: Award, label: 'النجاح', value: '98%', color: '#059669' },
            { icon: Sparkles, label: 'الخدمة', value: 'ذهبي', color: '#F0A500' },
            { icon: MessageSquare, label: 'الدعم', value: '24/7', color: '#2E86C1' },
          ].map((s, i) => (
            <div key={i} className={`fp-stat-card fp-animate fp-animate-delay-${i+1}`} style={{ borderTop: `4px solid ${s.color}`, background: 'white' }}>
              <div style={{ padding: '0.6rem', background: `${s.color}10`, borderRadius: '12px', color: s.color }}>
                <s.icon size={20} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>{s.label}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1B4F72' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Dashboard Content ── */}
        <div className="two-col-grid">
           <div className="fp-animate fp-animate-delay-3" style={{ background: 'white', borderRadius: '24px', padding: 'clamp(1.25rem, 4vw, 2rem)', boxShadow: 'var(--fp-shadow)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1B4F72', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <Activity size={22} style={{ color: '#F0A500' }} /> المتابعة المباشرة
              </h2>
              {residents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                   <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>لا توجد بيانات حالياً</p>
                </div>
              ) : residents.map((r) => {
                 const s = STATUS_LABELS[r.current_status] || STATUS_LABELS['stable'];
                 return (
                   <div key={r.id} className="fp-shimmer-border" style={{ marginBottom: '1.25rem' }}>
                     <div className="fp-resident-card" style={{ background: '#F8FAFC', border: 'none', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <div className="fp-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem', background: 'linear-gradient(135deg, #1B4F72, #2E86C1)' }}>
                              {getInitials(r.full_name)}
                           </div>
                           <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                 <p style={{ fontWeight: '800', fontSize: '1rem', color: '#1B4F72', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</p>
                                 <span style={{ backgroundColor: s.bg, color: s.color, padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '800', border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                                    {s.label}
                                 </span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                 {STAGE_LABELS[r.current_stage] || r.current_stage}
                              </p>
                           </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'white', borderRadius: '12px' }}>
                           <CircularProgress percentage={r.progress_score || 0} color={s.color} />
                           <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1B4F72', marginBottom: '0.35rem' }}>مؤشر التعافي</p>
                              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                                 <div style={{ width: `${r.progress_score}%`, height: '100%', background: `linear-gradient(90deg, ${s.color}, #F0A500)` }} />
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>
                 );
              })}
           </div>

           <div className="fp-animate fp-animate-delay-4">
              <div style={{ background: 'linear-gradient(135deg, #1B4F72, #0D2137)', borderRadius: '24px', padding: '1.5rem', color: 'white', marginBottom: '1.25rem' }}>
                 <h2 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={18} color="#F0A500" /> اختصارات سريعة
                 </h2>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Link href="/family/gallery" style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '16px', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <ImageIcon size={20} color="#F0A500" />
                       <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>المعرض</span>
                    </Link>
                    <Link href="/family/messages" style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '16px', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <MessageCircle size={20} color="#F0A500" />
                       <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>المراسلة</span>
                    </Link>
                 </div>
              </div>

              <div style={{ background: 'white', borderRadius: '24px', padding: '1.25rem', boxShadow: 'var(--fp-shadow)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1B4F72', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Clock size={16} style={{ color: '#F0A500' }} /> النشاطات الأخيرة
                  </h3>
                  {recentUpdates.slice(0, 3).map((u, i) => (
                     <div key={i} style={{ paddingBottom: '1rem', borderRight: '2px solid #F1F5F9', paddingRight: '1rem', position: 'relative', marginBottom: '0.75rem' }}>
                        <div style={{ position: 'absolute', right: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#F0A500', border: '2px solid white' }} />
                        <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1B4F72' }}>{u.title || 'تحديث دوري'}</p>
                        <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</p>
                     </div>
                  ))}
              </div>
           </div>
        </div>

        <footer style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', borderTop: '1px solid #F1F5F9' }}>
           <p style={{ fontSize: '0.7rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              تم التطوير بواسطة فريق البرمجة المحترف <Sparkles size={10} color="#F0A500" />
           </p>
        </footer>

      </div>
    </div>
  );
}
