'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Users, FileText, Newspaper, Image as ImageIcon, MessageSquare, Activity, TrendingUp, AlertCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [stageBreakdown, setStageBreakdown] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const results = await Promise.all([
        supabase.from('residents').select('*', { count: 'exact', head: true }),
        supabase.from('residents').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('weekly_reports').select('*', { count: 'exact', head: true }),
        supabase.from('weekly_reports').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('news').select('*', { count: 'exact', head: true }).eq('published', true),
        supabase.from('gallery').select('*', { count: 'exact', head: true }).eq('visible_to_family', true),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'family').eq('status', 'active'),
        supabase.from('resident_updates').select('*', { count: 'exact', head: true }),
        supabase.from('resident_updates').select('id, title, content, update_type, visible_to_family, created_at, residents(full_name)').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        residents: results[0].count,
        activeResidents: results[1].count,
        reports: results[2].count,
        publishedReports: results[3].count,
        news: results[4].count,
        gallery: results[5].count,
        messages: results[6].count,
        unreadMessages: results[7].count,
        families: results[8].count,
        updates: results[9].count,
      });
      setRecentActivity((results[10].data as any[]) || []);

      // Stage breakdown
      const { data: stages } = await supabase.from('residents').select('current_stage').eq('is_active', true);
      const stageCounts: Record<string, number> = {};
      stages?.forEach(r => { stageCounts[r.current_stage] = (stageCounts[r.current_stage] || 0) + 1; });
      setStageBreakdown(Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })));

      // Status breakdown
      const { data: statuses } = await supabase.from('residents').select('current_status').eq('is_active', true);
      const statusCounts: Record<string, number> = {};
      statuses?.forEach(r => { statusCounts[r.current_status] = (statusCounts[r.current_status] || 0) + 1; });
      setStatusBreakdown(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const STAGE_LABELS: Record<string, string> = {
    detox: 'إزالة السموم', rehabilitation: 'إعادة التأهيل',
    social_reintegration: 'الاندماج الاجتماعي', follow_up: 'المتابعة'
  };
  const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
    stable: { color: '#2f855a', bg: '#c6f6d5', label: 'مستقر' },
    needs_followup: { color: '#c05621', bg: '#fbd38d', label: 'يحتاج متابعة' },
    significant_progress: { color: '#2b6cb0', bg: '#bee3f8', label: 'تقدم ملحوظ' },
    important_note: { color: '#c53030', bg: '#fed7d7', label: 'ملاحظة مهمة' },
  };
  const STAGE_COLORS = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'];

  const mainStats = [
    { label: 'مقيمون نشطون', value: stats.activeResidents, total: stats.residents, icon: Users, color: '#4299e1' },
    { label: 'تقارير منشورة', value: stats.publishedReports, total: stats.reports, icon: FileText, color: '#48bb78' },
    { label: 'أخبار منشورة', value: stats.news, total: null, icon: Newspaper, color: '#ed8936' },
    { label: 'رسائل جديدة', value: stats.unreadMessages, total: stats.messages, icon: MessageSquare, color: '#e53e3e' },
    { label: 'حسابات أهالي', value: stats.families, total: null, icon: Users, color: '#9f7aea' },
    { label: 'إجمالي التحديثات', value: stats.updates, total: null, icon: Activity, color: '#38b2ac' },
  ];

  if (loading) return <div className="dashboard-container"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>جاري التحميل...</main></div>;

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>الإحصائيات والتحليلات</h1>
          <p style={{ color: 'var(--text-muted)' }}>نظرة شاملة على أداء المصحة وحالة المقيمين</p>
        </header>

        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {mainStats.map((stat, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.875rem', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{stat.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>{stat.value ?? '-'}</p>
                {stat.total !== null && stat.total !== undefined && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>من إجمالي {stat.total}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Stage Breakdown */}
          <div className="card">
            <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} /> توزيع المقيمين حسب المرحلة
            </h3>
            {stageBreakdown.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>لا توجد بيانات</p>
            ) : stageBreakdown.map(({ stage, count }, i) => {
              const pct = stats.activeResidents > 0 ? Math.round((count / stats.activeResidents) * 100) : 0;
              return (
                <div key={stage} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{STAGE_LABELS[stage] || stage}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: STAGE_COLORS[i % STAGE_COLORS.length] }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length], borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} /> توزيع المقيمين حسب الحالة
            </h3>
            {statusBreakdown.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>لا توجد بيانات</p>
            ) : statusBreakdown.map(({ status, count }) => {
              const info = STATUS_COLORS[status] || { color: '#718096', bg: '#e2e8f0', label: status };
              const pct = stats.activeResidents > 0 ? Math.round((count / stats.activeResidents) * 100) : 0;
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '8px', backgroundColor: info.bg + '40', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: info.color }}>{info.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: info.color }}>{count}</span>
                    <span style={{ fontSize: '0.8rem', color: info.color, opacity: 0.8 }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> آخر التحديثات في النظام
          </h3>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>لا توجد تحديثات حديثة</p>
          ) : recentActivity.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f7fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.visible_to_family ? '#48bb78' : '#a0aec0' }} />
                <div>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.residents?.full_name} — {u.title || u.content?.substring(0, 40)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.update_type}</p>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
