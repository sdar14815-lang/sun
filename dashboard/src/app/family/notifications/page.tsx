'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Bell, CheckCircle } from 'lucide-react';

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

  const typeColors: Record<string, string> = {
    general: '#4299e1',
    report: '#48bb78',
    update: '#ed8936',
    alert: '#e53e3e',
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>جاري التحميل...</div>;

  return (
    <div>
      <FamilyNavbar userName={profile?.full_name} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1a365d', marginBottom: '0.5rem' }}>الإشعارات</h1>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>إشعاراتك وتنبيهاتك من دار شمس التعافي</p>

        {notifications.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Bell size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: '#718096' }}>لا توجد إشعارات</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                backgroundColor: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderRight: `4px solid ${typeColors[n.type] || '#a0aec0'}`,
                opacity: n.is_read ? 0.75 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Bell size={14} color={typeColors[n.type] || '#a0aec0'} />
                      <h3 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1a365d' }}>{n.title}</h3>
                    </div>
                    <p style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.6' }}>{n.body}</p>
                  </div>
                  <div style={{ textAlign: 'left', marginRight: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#a0aec0', whiteSpace: 'nowrap' }}>{new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                    {n.is_read && <CheckCircle size={14} color="#48bb78" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
