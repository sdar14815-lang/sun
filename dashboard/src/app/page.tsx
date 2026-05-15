'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Users, FileText, Newspaper, Image as ImageIcon, Plus } from 'lucide-react';
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
  });
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [{ count: resCount }, { count: repCount }, { count: newsCount }, { count: galCount }] =
        await Promise.all([
          supabase.from('residents').select('*', { count: 'exact', head: true }),
          supabase.from('weekly_reports').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }).eq('published', true),
          supabase.from('gallery').select('*', { count: 'exact', head: true }),
        ]);

      setStats({
        residentsCount: resCount || 0,
        reportsCount: repCount || 0,
        newsCount: newsCount || 0,
        galleryCount: galCount || 0,
      });

      const { data: recentRes } = await supabase
        .from('residents')
        .select('id, full_name, file_number, current_stage, current_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUpdates(recentRes || []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'إجمالي المقيمين',  value: stats.residentsCount, icon: Users,     color: '#4299e1', gradient: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' },
    { label: 'إجمالي التقارير',  value: stats.reportsCount,   icon: FileText,  color: '#48bb78', gradient: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)' },
    { label: 'الأخبار المنشورة', value: stats.newsCount,      icon: Newspaper, color: '#ed8936', gradient: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)' },
    { label: 'صور المعرض',       value: stats.galleryCount,   icon: ImageIcon, color: '#9f7aea', gradient: 'linear-gradient(135deg, #b794f4 0%, #9f7aea 100%)' },
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

              {/* Alerts */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', fontSize: '1.1rem', fontWeight: '700' }}>
                  تنبيهات هامة
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  <p style={{ marginBottom: '0.75rem' }}>• تم ربط لوحة التحكم بقاعدة بيانات Supabase بنجاح.</p>
                  <p style={{ marginBottom: '0.75rem' }}>• النظام يعمل الآن بشكل حي ومباشر.</p>
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
