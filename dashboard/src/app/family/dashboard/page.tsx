'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, FileText, Bell, MessageSquare, Activity, Phone, MessageCircle, ChevronLeft, Calendar, Image as ImageIcon, Heart, Info, Clock, CheckCircle2, Sun } from 'lucide-react';
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
  const [recentPhotos, setRecentPhotos]           = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages]       = useState(0);
  const [loading, setLoading]                     = useState(true);
  const [welcomeMessage, setWelcomeMessage]       = useState('');

  useEffect(() => { 
    loadAll(); 
    setWelcomeMessage(getSmartWelcome());
  }, []);

  function getSmartWelcome() {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير، نتمنى لك يوماً مليئاً بالأمل';
    if (hour < 18) return 'طاب يومك، نحن هنا لدعمك ودعم ذويك';
    return 'مساء الخير، نسأل الله الراحة والطمأنينة لكم ولذويكم';
  }

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .eq('id', user.id)
        .single();

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
        const [updatesRes, photosRes, historyRes] = await Promise.all([
          supabase
            .from('resident_updates')
            .select('id, title, content, update_type, created_at, resident_id, residents!resident_updates_resident_id_fkey(full_name)')
            .in('resident_id', residentIds)
            .eq('visible_to_family', true)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('gallery')
            .select('id, image_url, title')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('weekly_reports')
            .select('resident_id, progress_score, created_at')
            .in('resident_id', residentIds)
            .order('created_at', { ascending: true })
        ]);

        setRecentUpdates(updatesRes.data || []);
        setRecentPhotos(photosRes.data || []);

        const historyMap = historyRes.data?.reduce((acc: any, curr: any) => {
          if (!acc[curr.resident_id]) acc[curr.resident_id] = [];
          acc[curr.resident_id].push(curr.progress_score);
          return acc;
        }, {}) || {};

        setResidents(linked.map((r: any) => ({ ...r, history: historyMap[r.id] || [] })));
      }

      const [{ count: notifCount }, { count: msgCount }] = await Promise.all([
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_user_id', user.id).eq('is_read', false),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('family_user_id', user.id).eq('status', 'open'),
      ]);
      setUnreadNotifications(notifCount || 0);
      setUnreadMessages(msgCount || 0);
    } catch (e) {
      console.error('Family dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="fp-skeleton fp-skeleton-banner" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton" style={{ height: '80px', borderRadius: '14px' }} />)}
          </div>
          <div className="two-col-grid">
            <div className="fp-skeleton-card">
              <div className="fp-skeleton-line w-40" />
              {[1, 2].map(i => <div key={i} className="fp-skeleton" style={{ height: '100px', marginBottom: '1rem' }} />)}
            </div>
            <div className="fp-skeleton-card">
              <div className="fp-skeleton-line w-40" />
              {[1, 2, 3].map(i => <div key={i} className="fp-skeleton-line w-full" style={{ height: '60px' }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quickStats = [
    { icon: User,          label: 'المقيمون المرتبطون', value: residents.length,         color: '#1B4F72', href: '/family/resident' },
    { icon: Calendar,      label: 'الجدول اليومي',      value: 'اليوم',           color: '#F0A500', href: '/family/schedule' },
    { icon: Bell,          label: 'إشعارات جديدة',      value: unreadNotifications,      color: '#059669', href: '/family/notifications', badge: unreadNotifications > 0 },
    { icon: MessageSquare, label: 'رسائل مفتوحة',       value: unreadMessages,           color: '#2E86C1', href: '/family/messages' },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <FamilyNavbar userName={profile?.full_name} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>

        {/* ── Welcome Banner ── */}
        <div className="fp-animate" style={{
          background: 'linear-gradient(135deg, #F0A500 0%, #1B4F72 60%, #0D2137 100%)',
          borderRadius: 'clamp(12px, 4vw, 20px)',
          padding: 'clamp(1.25rem, 5vw, 2.5rem)',
          color: 'white',
          marginBottom: '1.5rem',
          boxShadow: '0 12px 32px rgba(27,79,114,0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Sun */}
          <Sun size={120} style={{ position: 'absolute', left: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ opacity: 0.9, fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', background: '#F0A500', borderRadius: '50%' }} />
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', fontWeight: '800', marginBottom: '0.5rem' }}>
              مرحباً، {profile?.full_name}
            </h1>
            <p style={{ opacity: 0.95, fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', lineHeight: 1.6, fontWeight: '500', maxWidth: '600px' }}>
              {welcomeMessage}
            </p>
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {quickStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={i} href={s.href} className={`fp-stat-card fp-animate fp-animate-delay-${i+1}`} style={{ borderTopColor: s.color }}>
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  backgroundColor: `${s.color}15`, 
                  color: s.color, 
                  flexShrink: 0,
                  position: 'relative'
                }}>
                  <Icon size={24} />
                  {s.badge && <span className="fp-notif-pulse" />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.1rem', fontWeight: '600' }}>{s.label}</p>
                  <p className="fp-stat-value" style={{ fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: '800', color: '#1B4F72', lineHeight: 1 }}>{s.value}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Two-col section ── */}
        <div className="two-col-grid">
          {/* Residents */}
          <div className="fp-animate fp-animate-delay-3" style={{ backgroundColor: 'white', borderRadius: '20px', padding: 'clamp(1.25rem, 4vw, 1.5rem)', boxShadow: 'var(--fp-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1B4F72', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={20} style={{ color: '#F0A500' }} /> المقيمون المرتبطون
              </h2>
              <Link href="/family/resident" style={{ fontSize: '0.8rem', color: '#2E86C1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                عرض الكل <ChevronLeft size={14} />
              </Link>
            </div>

            {residents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                <div style={{ width: '64px', height: '64px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <User size={32} style={{ opacity: 0.3 }} />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#64748B' }}>لا يوجد مقيمون مرتبطون</p>
              </div>
            ) : residents.map((r, idx) => {
              const s = STATUS_LABELS[r.current_status] || STATUS_LABELS['stable'];
              return (
                <div key={r.id} className="fp-resident-card" style={{ borderRight: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div className="fp-avatar" style={{ backgroundColor: idx % 2 === 0 ? '#1B4F72' : '#2E86C1' }}>
                      {getInitials(r.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <p className="truncate" style={{ fontWeight: '800', color: '#1B4F72', fontSize: '1rem' }}>{r.full_name}</p>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                          backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
                          display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          {s.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>
                        {r.relation && `${r.relation} • `}{STAGE_LABELS[r.current_stage] || r.current_stage}
                      </p>
                    </div>
                  </div>

                  {r.progress_score !== null && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '12px' }}>
                      <CircularProgress percentage={r.progress_score} color={s.color} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1B4F72', marginBottom: '0.3rem' }}>مستوى التقدم الحالي</p>
                        <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${r.progress_score}%`, height: '100%', background: s.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Updates */}
          <div className="fp-animate fp-animate-delay-4" style={{ backgroundColor: 'white', borderRadius: '20px', padding: 'clamp(1.25rem, 4vw, 1.5rem)', boxShadow: 'var(--fp-shadow)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1B4F72', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={20} style={{ color: '#F0A500' }} /> الجدول الزمني للتحديثات
            </h2>
            {recentUpdates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                <Activity size={32} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                <p>لا توجد تحديثات متاحة حالياً</p>
              </div>
            ) : (
              <div style={{ paddingRight: '0.5rem' }}>
                {recentUpdates.map((u, i) => (
                  <div key={u.id} className="fp-timeline-item">
                    <div className="fp-timeline-dot" style={{ background: i === 0 ? '#F0A500' : '#2E86C1' }} />
                    <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1B4F72' }}>{u.title || u.update_type || 'تحديث دوري'}</p>
                    <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.6 }}>
                      {u.content?.substring(0, 80)}{u.content?.length > 80 ? '...' : ''}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Clock size={12} style={{ color: '#94A3B8' }} />
                      <p style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600' }}>
                        {new Date(u.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="fp-animate fp-animate-delay-5" style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          border: '2px solid #FDE68A',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 4px 15px rgba(245,158,11,0.05)'
        }}>
          <div style={{ width: '56px', height: '56px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Phone size={28} />
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#92400E', marginBottom: '0.25rem' }}>مركز المساعدة والطوارئ</h3>
            <p style={{ fontSize: '0.9rem', color: '#B45309', fontWeight: '500' }}>فريقنا متاح دائماً للرد على استفساراتكم في أي وقت.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="tel:+201115540077" className="btn" style={{ background: '#059669', color: 'white', borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
              <Phone size={18} /> اتصال مباشر
            </a>
            <a href="https://wa.me/201115540077" target="_blank" rel="noopener" className="btn" style={{ background: '#25D366', color: 'white', borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
              <MessageCircle size={18} /> واتساب
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
