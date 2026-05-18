'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Users, FileText, Newspaper, Image as ImageIcon, Plus, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Header from '@/components/Header';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    residentsCount: 0,
    reportsCount: 0,
    newsCount: 0,
    galleryCount: 0,
    unreadMessagesCount: 0,
  });
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [resCountRes, repCountRes, newsCountRes, galCountRes, msgCountRes] =
        await Promise.all([
          supabase.from('residents').select('*', { count: 'exact', head: true }),
          supabase.from('weekly_reports').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }).eq('published', true),
          supabase.from('gallery').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        ]);

      setStats({
        residentsCount: resCountRes.count || 0,
        reportsCount: repCountRes.count || 0,
        newsCount: newsCountRes.count || 0,
        galleryCount: galCountRes.count || 0,
        unreadMessagesCount: msgCountRes.count || 0,
      });

      const [recentRes, recentMsgsRes, profilesRes, residentsRes] = await Promise.all([
        supabase
          .from('residents')
          .select('id, full_name, file_number, current_stage, current_status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('residents').select('id, full_name')
      ]);

      const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      const residentsMap = new Map(residentsRes.data?.map(r => [r.id, r]) || []);

      const joinedMsgs = (recentMsgsRes.data || []).map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.family_user_id) || null,
        residents: residentsMap.get(msg.resident_id) || null
      }));

      setRecentUpdates(recentRes.data || []);
      setRecentMessages(joinedMsgs);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'إجمالي المقيمين',  value: stats.residentsCount, icon: Users,     color: '#4299e1', gradient: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' },
    { label: 'إجمالي التقارير',  value: stats.reportsCount,   icon: FileText,  color: '#48bb78', gradient: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)' },
    { label: 'صور المعرض',       value: stats.galleryCount,   icon: ImageIcon, color: '#9f7aea', gradient: 'linear-gradient(135deg, #b794f4 0%, #9f7aea 100%)' },
    { label: 'الرسائل الجديدة',   value: stats.unreadMessagesCount, icon: MessageSquare, color: '#e53e3e', gradient: 'linear-gradient(135deg, #feb2b2 0%, #e53e3e 100%)' },
  ];

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header
          title="لوحة التحكم"
          subtitle="نظرة عامة على أداء المصحة اليوم"
          actions={
            <Link
              href="/residents/add"
              className="btn btn-primary"
              style={{ boxShadow: '0 4px 14px 0 rgba(26, 54, 93, 0.35)' }}
            >
              <Plus size={18} />
              <span className="desktop-only">إضافة مقيم</span>
            </Link>
          }
        />

        {loading ? (
          /* ── Skeleton loader ── */
          <>
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 28, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ marginBottom: '1rem' }} />
              جاري تحميل البيانات...
            </div>
          </>
        ) : (
          <>
            {/* ── Stats Grid ── */}
            <section className="stats-grid" style={{ marginBottom: '2rem' }}>
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.25rem',
                      marginBottom: 0,
                    }}
                  >
                    <div style={{
                      padding: '0.875rem',
                      background: stat.gradient,
                      color: 'white',
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 8px 16px -4px ${stat.color}40`
                    }}>
                      <Icon size={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                        {stat.label}
                      </p>
                      <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>
                        {stat.value}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* ── Bottom Grid ── */}
            <section className="two-col-grid">
              {/* Recent Residents */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>أحدث المقيمين المضافين</h3>
                  <Link href="/residents" style={{ color: 'var(--primary-light)', fontSize: '0.88rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    عرض الكل
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {recentUpdates.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                      لا يوجد مقيمين حالياً.
                    </p>
                  ) : (
                    recentUpdates.map((res) => (
                      <div
                        key={res.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          gap: '0.75rem',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 44, height: 44,
                            borderRadius: 10,
                            backgroundColor: '#e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem',
                            flexShrink: 0,
                          }}>
                            {res.full_name ? res.full_name.charAt(0) : '؟'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {res.full_name}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              المرحلة: {res.current_stage}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left', flexShrink: 0 }}>
                          <span className={`badge ${res.current_status === 'stable' ? 'badge-success' : 'badge-danger'}`}>
                            {res.current_status === 'stable' ? 'مستقر' : res.current_status}
                          </span>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
                            {new Date(res.created_at).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Messages */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>أحدث رسائل الأهالي الواردة</h3>
                  <Link href="/messages" style={{ color: 'var(--primary-light)', fontSize: '0.88rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    صندوق الوارد
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {recentMessages.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                      لا توجد رسائل واردة حالياً.
                    </p>
                  ) : (
                    recentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          backgroundColor: msg.status === 'open' ? '#f0f9ff' : '#f8fafc',
                          borderRadius: '10px',
                          border: msg.status === 'open' ? '1px solid #bae6fd' : '1px solid var(--border)',
                          gap: '0.75rem',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 40, height: 40,
                            borderRadius: 10,
                            backgroundColor: msg.status === 'open' ? '#e0f2fe' : '#e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: msg.status === 'open' ? '#0284c7' : 'var(--primary)',
                            fontWeight: 'bold', fontSize: '1rem',
                            flexShrink: 0,
                          }}>
                            {msg.profiles?.full_name ? msg.profiles.full_name.charAt(0) : 'أ'}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontWeight: '700', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.profiles?.full_name || 'أحد الأهالي'} 
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginRight: '0.5rem' }}>
                                (مقيم: {msg.residents?.full_name || '—'})
                              </span>
                            </p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                              {msg.message}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'left', flexShrink: 0 }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            backgroundColor: msg.status === 'open' ? '#e0f2fe' : msg.status === 'answered' ? '#f3e8ff' : '#f0fdf4',
                            color: msg.status === 'open' ? '#0369a1' : msg.status === 'answered' ? '#6b21a8' : '#166534'
                          }}>
                            {msg.status === 'open' ? 'جديدة' : msg.status === 'answered' ? 'تم الرد' : 'مغلقة'}
                          </span>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'left' }}>
                            {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── Floating Action Button ── */}
      <Link href="/reports/add" className="fab" title="تقرير جديد">
        <Plus size={28} />
      </Link>

      <style jsx>{`
        .desktop-only {
          display: inline;
        }
        @media (max-width: 640px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}
