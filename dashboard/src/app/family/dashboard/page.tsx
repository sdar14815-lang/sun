'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { User, FileText, Bell, MessageSquare, Activity, Phone, MessageCircle, ChevronLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  stable:               { label: 'مستقر',         color: '#2f855a', bg: '#f0fff4', border: '#c6f6d5' },
  needs_followup:       { label: 'يحتاج متابعة',  color: '#c05621', bg: '#fffaf0', border: '#feebc8' },
  significant_progress: { label: 'تقدم ملحوظ',    color: '#2b6cb0', bg: '#ebf8ff', border: '#bee3f8' },
  important_note:       { label: 'ملاحظة مهمة',   color: '#c53030', bg: '#fff5f5', border: '#fed7d7' },
};

export default function FamilyDashboardPage() {
  const router = useRouter();
  const [profile, setProfile]                     = useState<any>(null);
  const [residents, setResidents]                 = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates]         = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages]       = useState(0);
  const [loading, setLoading]                     = useState(true);

  useEffect(() => { loadAll(); }, []);

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
        const { data: updates } = await supabase
          .from('resident_updates')
          .select('id, title, content, update_type, created_at, resident_id, residents!resident_updates_resident_id_fkey(full_name)')
          .in('resident_id', residentIds)
          .eq('visible_to_family', true)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentUpdates(updates || []);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#718096', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    { icon: User,          label: 'المقيمون المرتبطون', value: residents.length,         color: '#4299e1', href: '/family/resident' },
    { icon: Calendar,      label: 'الجدول اليومي',      value: 'اليوم',           color: '#ed8936', href: '/family/schedule' },
    { icon: Bell,          label: 'إشعارات جديدة',      value: unreadNotifications,      color: '#48bb78', href: '/family/notifications' },
    { icon: MessageSquare, label: 'رسائل مفتوحة',       value: unreadMessages,           color: '#9f7aea', href: '/family/messages' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '5rem' }}>
      <FamilyNavbar userName={profile?.full_name} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2d4a8a 100%)',
          borderRadius: 'clamp(12px, 4vw, 20px)',
          padding: 'clamp(1.25rem, 5vw, 2rem)',
          color: 'white',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px rgba(26,54,93,0.25)',
        }}>
          <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: '800', marginBottom: '0.4rem' }}>
            مرحباً، {profile?.full_name}
          </h1>
          <p style={{ opacity: 0.85, fontSize: 'clamp(0.82rem, 3vw, 0.95rem)', lineHeight: 1.6 }}>
            هنا يمكنك متابعة أحدث المعلومات عن ذويك في دار شمس التعافي
          </p>
        </div>

        {/* ── Quick Stats ── */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {quickStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  padding: 'clamp(0.875rem, 3vw, 1.25rem)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  height: '100%',
                }}>
                  <div style={{ padding: '0.625rem', borderRadius: '10px', backgroundColor: `${s.color}18`, color: s.color, flexShrink: 0 }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', color: '#718096', marginBottom: '0.2rem', lineHeight: 1.3 }}>{s.label}</p>
                    <p style={{ fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: '800', color: '#1a365d', lineHeight: 1 }}>{s.value}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Two-col section ── */}
        <div className="two-col-grid">
          {/* Residents */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(1rem, 4vw, 1.5rem)', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1a365d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> المقيمون
              </h2>
              <Link href="/family/resident" style={{ fontSize: '0.8rem', color: '#2b6cb0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                عرض الكل <ChevronLeft size={14} />
              </Link>
            </div>

            {residents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
                <User size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>لا يوجد مقيمون مرتبطون بحسابك</p>
                <p style={{ fontSize: '0.8rem' }}>يرجى التواصل مع الإدارة</p>
              </div>
            ) : residents.map(r => {
              const s = STATUS_LABELS[r.current_status] || STATUS_LABELS['stable'];
              return (
                <div key={r.id} style={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0.875rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: '#1a365d', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.full_name}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#718096', marginTop: '0.15rem' }}>
                        {r.relation && `${r.relation} · `}{STAGE_LABELS[r.current_stage] || r.current_stage}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {r.progress_score !== null && r.progress_score !== undefined && (
                    <div>
                      <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${r.progress_score}%`, height: '100%', background: 'linear-gradient(90deg, #1a365d, #4299e1)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#718096', marginTop: '0.25rem' }}>
                        نسبة التقدم: {r.progress_score}%
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Updates */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(1rem, 4vw, 1.5rem)', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#1a365d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} /> آخر التحديثات
            </h2>
            {recentUpdates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
                <Activity size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem' }}>لا توجد تحديثات حديثة</p>
              </div>
            ) : recentUpdates.map(u => (
              <div key={u.id} style={{ borderRight: '3px solid #4299e1', paddingRight: '0.875rem', marginBottom: '1rem' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1a365d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.title || u.update_type || 'تحديث'}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#4a5568', marginTop: '0.2rem', lineHeight: 1.6 }}>
                  {u.content?.substring(0, 100)}{u.content?.length > 100 ? '...' : ''}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#a0aec0', marginTop: '0.2rem' }}>
                  {u.residents?.full_name && `${u.residents.full_name} · `}
                  {new Date(u.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating Action Buttons (Mobile) ── */}
      <div className="family-floating-actions" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <a
          href="tel:+20000000000"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#276749', color: 'white',
            padding: '0.875rem 1.5rem', borderRadius: '50px',
            fontFamily: 'Cairo, sans-serif', fontWeight: '700', fontSize: '0.9rem',
            boxShadow: '0 4px 15px rgba(39,103,73,0.4)',
            textDecoration: 'none', minHeight: '52px',
          }}
        >
          <Phone size={18} /> اتصال بالمصحة
        </a>
        <a
          href="https://wa.me/20000000000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#25d366', color: 'white',
            padding: '0.875rem 1.5rem', borderRadius: '50px',
            fontFamily: 'Cairo, sans-serif', fontWeight: '700', fontSize: '0.9rem',
            boxShadow: '0 4px 15px rgba(37,211,102,0.4)',
            textDecoration: 'none', minHeight: '52px',
          }}
        >
          <MessageCircle size={18} /> واتساب
        </a>
      </div>
    </div>
  );
}
