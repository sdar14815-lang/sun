'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { FileText, Eye, EyeOff, Plus } from 'lucide-react';
import Link from 'next/link';

const REPORT_TYPES: Record<string, string> = {
  weekly: 'أسبوعي', monthly: 'شهري', periodic: 'دوري'
};

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    try {
      // Select only columns that exist in base schema
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('id, resident_id, report_title, progress_score, visible_to_family, created_at, report_status, residents!weekly_reports_resident_id_fkey(full_name, file_number)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback without status/report_type if columns don't exist yet
        const { data: fallback } = await supabase
          .from('weekly_reports')
          .select('id, resident_id, report_title, progress_score, visible_to_family, created_at, residents!weekly_reports_resident_id_fkey(full_name, file_number)')
          .order('created_at', { ascending: false });
        setReports((fallback || []).map(r => ({ ...r, report_status: r.visible_to_family ? 'published' : 'draft' })));
        return;
      }
      setReports(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'published' ? 'draft' : 'published';
    // Try update with status column
    const { error } = await supabase.from('weekly_reports').update({ report_status: newStatus }).eq('id', id);
    if (!error) {
      setReports(reports.map(r => r.id === id ? { ...r, report_status: newStatus } : r));
    } else {
      // Fallback: use visible_to_family as publish indicator
      const newVisible = current !== 'published';
      await supabase.from('weekly_reports').update({ visible_to_family: newVisible }).eq('id', id);
      setReports(reports.map(r => r.id === id ? { ...r, visible_to_family: newVisible, report_status: newVisible ? 'published' : 'draft' } : r));
    }
  }

  async function toggleVisibility(id: string, current: boolean) {
    const { error } = await supabase.from('weekly_reports').update({ visible_to_family: !current }).eq('id', id);
    if (!error) setReports(reports.map(r => r.id === id ? { ...r, visible_to_family: !current } : r));
  }

  async function deleteReport(id: string) {
    if (!confirm('حذف هذا التقرير؟')) return;
    await supabase.from('weekly_reports').delete().eq('id', id);
    setReports(reports.filter(r => r.id !== id));
  }

  const filtered = filterStatus === 'all' ? reports
    : reports.filter(r => (r.report_status || (r.visible_to_family ? 'published' : 'draft')) === filterStatus);

  const publishedCount = reports.filter(r => (r.report_status || (r.visible_to_family ? 'published' : 'draft')) === 'published').length;

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>التقارير الدورية</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              منشور: {publishedCount} / إجمالي: {reports.length} — التقارير المنشورة والمرئية تظهر للأهالي
            </p>
          </div>
          <Link href="/reports/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> إضافة تقرير
          </Link>
        </header>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['all', 'published', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600',
                borderColor: filterStatus === f ? 'var(--primary)' : 'var(--border)',
                backgroundColor: filterStatus === f ? 'var(--primary)' : 'white',
                color: filterStatus === f ? 'white' : 'var(--text-muted)' }}>
              {f === 'all' ? `الكل (${reports.length})` : f === 'published' ? `منشور (${publishedCount})` : `مسودة (${reports.length - publishedCount})`}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '1rem' }}>المقيم</th>
                  <th style={{ padding: '1rem' }}>عنوان التقرير</th>
                  <th style={{ padding: '1rem' }}>النوع</th>
                  <th style={{ padding: '1rem' }}>التقدم</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>النشر</th>
                  <th style={{ padding: '1rem' }}>الظهور للأهل</th>
                  <th style={{ padding: '1rem' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const effectiveStatus = r.report_status || (r.visible_to_family ? 'published' : 'draft');
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{r.residents?.full_name || '—'}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.residents?.file_number}</p>
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '200px' }}>
                        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>{r.report_title}</p>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '10px', backgroundColor: '#e2e8f0', color: 'var(--primary)', fontWeight: '600' }}>
                          {REPORT_TYPES[r.report_type] || 'أسبوعي'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {r.progress_score !== null && r.progress_score !== undefined ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${r.progress_score}%`, height: '100%', backgroundColor: '#4299e1', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)' }}>{r.progress_score}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => toggleStatus(r.id, effectiveStatus)}
                          style={{ padding: '0.3rem 0.75rem', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit',
                            backgroundColor: effectiveStatus === 'published' ? '#c6f6d5' : '#fed7d7',
                            color: effectiveStatus === 'published' ? '#22543d' : '#822727' }}>
                          {effectiveStatus === 'published' ? '✓ منشور' : '● مسودة'}
                        </button>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => toggleVisibility(r.id, r.visible_to_family)}
                          style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', background: 'none', color: r.visible_to_family ? '#2f855a' : '#c53030' }}>
                          {r.visible_to_family ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => deleteReport(r.id)}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: '#fff5f5', border: 'none', cursor: 'pointer', color: '#c53030', fontSize: '0.8rem' }}>
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? 'جاري التحميل...' : 'لا توجد تقارير'}
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
