'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Tv } from 'lucide-react';

export default function FamilyNotificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/family/login'); return; }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
    setProfile(prof);

    const { data } = await supabase.from('notifications').select('*').eq('recipient_user_id', user.id).order('created_at', { ascending: false });
    setNotifications(data || []);
    // Mark all as read
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_user_id', user.id).eq('is_read', false);
    setLoading(false);
  }

  const typeConfig: Record<string, { color: string; bg: string; icon: any }> = {
    general: { color: 'var(--fp-primary)', bg: 'rgba(13, 40, 71, 0.05)', icon: Bell },
    report: { color: 'var(--fp-success)', bg: 'rgba(16, 185, 129, 0.05)', icon: FileText },
    update: { color: 'var(--fp-accent)', bg: 'rgba(240, 165, 0, 0.05)', icon: ShieldCheck },
    alert: { color: 'var(--fp-danger)', bg: 'rgba(239, 68, 68, 0.05)', icon: AlertTriangle },
    live: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)', icon: Tv },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل الإشعارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               مركز الإشعارات والتنبيهات
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>متابعة التنبيهات المباشرة حول الحالة الطبية، والتقارير الأسبوعية الجديدة</p>
          </div>
          <div className="fp-glow-icon">
            <Bell size={22} />
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="fp-glass-card fp-animate" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Bell size={48} color="#cbd5e0" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.95rem', fontWeight: '700' }}>سجل التنبيهات فارغ تماماً حالياً.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {notifications.map((n, idx) => {
              const config = typeConfig[n.type] || typeConfig['general'];
              const Icon = config.icon;
              return (
                <div key={n.id} className="fp-glass-card fp-animate fp-animate-delay-2" style={{
                  padding: '1.25rem 1.5rem',
                  borderRight: `5px solid ${config.color}`,
                  opacity: n.is_read ? 0.8 : 1,
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: config.bg, color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={14} />
                        </div>
                        <h3 style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--fp-primary)' }}>{n.title}</h3>
                      </div>
                      <p style={{ color: '#4a5568', fontSize: '0.85rem', lineHeight: '1.7', fontWeight: '600', paddingRight: '2rem' }}>{n.body}</p>
                    </div>
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', whiteSpace: 'nowrap', fontWeight: '700' }}>{new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                      {n.is_read ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--fp-success)', fontSize: '0.65rem', fontWeight: '800' }}>
                           <CheckCircle2 size={12} /> مقروء
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--fp-accent)', fontSize: '0.65rem', fontWeight: '800' }}>
                           <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--fp-accent)' }} /> غير مقروء
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
