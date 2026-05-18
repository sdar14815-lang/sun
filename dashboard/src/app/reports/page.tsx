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

  // Preview and PDF states
  const [previewingReport, setPreviewingReport] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

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

  async function handlePreviewReport(reportId: string) {
    setLoadingPreview(true);
    setShowPreviewModal(true);
    setPreviewingReport(null);
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*, residents(*), profiles!weekly_reports_created_by_fkey(full_name)')
        .eq('id', reportId)
        .single();
      
      if (error) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('weekly_reports')
          .select('*, residents(*)')
          .eq('id', reportId)
          .single();
        if (fallbackError) throw fallbackError;
        setPreviewingReport(fallback);
      } else {
        setPreviewingReport(data);
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء جلب تفاصيل التقرير: ' + e.message);
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  }

  function generatePDF(report: any) {
    if (!report) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('⚠️ الرجاء السماح بالنوافذ المنبثقة (Popups) لتصدير ملف الـ PDF.');
      return;
    }

    const date = new Date(report.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const stageTranslations: Record<string, string> = {
      admission: 'القبول والتقييم',
      detox: 'إلغاء السموم (Detox)',
      stabilization: 'التأهيل الأولي',
      rehabilitation: 'التأهيل النفسي والسلوكي',
      social_reintegration: 'الدمج الاجتماعي',
      follow_up: 'المتابعة المستمرة',
      followup: 'المتابعة المستمرة',
      completed: 'التعافي والحمد لله'
    };

    const formattedContent = report.report_body || 'لا يوجد تفاصيل للتقرير.';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${report.report_title} - دار شمس التعافي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            color: #2d3748;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #fff;
            direction: rtl;
          }
          .report-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            box-sizing: border-box;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #cbd5e0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-area {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-icon {
            font-size: 3rem;
          }
          .header-text h1 {
            font-size: 1.6rem;
            font-weight: 800;
            margin: 0;
            color: #1a365d;
          }
          .header-text p {
            font-size: 0.85rem;
            margin: 5px 0 0 0;
            color: #4a5568;
            font-weight: 600;
          }
          .meta-area {
            text-align: left;
            font-size: 0.85rem;
            color: #4a5568;
            line-height: 1.5;
          }
          .meta-area p { margin: 4px 0; }
          .patient-card {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-group { display: flex; gap: 10px; }
          .info-label { font-weight: bold; color: #4a5568; min-width: 100px; }
          .info-value { color: #2d3748; font-weight: 600; }
          .section-title {
            font-size: 1.15rem;
            font-weight: 800;
            color: #1a365d;
            border-right: 4px solid #3182ce;
            padding-right: 12px;
            margin-bottom: 20px;
            margin-top: 30px;
          }
          .report-body {
            font-family: 'Amiri', serif;
            font-size: 1.25rem;
            line-height: 1.8;
            text-align: justify;
            color: #2d3748;
            white-space: pre-wrap;
            background: #fafafa;
            border: 1px solid #edf2f7;
            padding: 20px;
            border-radius: 12px;
          }
          .progress-section {
            margin-bottom: 40px;
            background: #ebf8ff;
            border: 1px solid #bee3f8;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .progress-bar-container {
            flex: 1;
            height: 12px;
            background-color: #e2e8f0;
            border-radius: 6px;
            margin: 0 20px;
            overflow: hidden;
          }
          .progress-bar-fill {
            height: 100%;
            background-color: #3182ce;
            border-radius: 6px;
          }
          .progress-text {
            font-size: 1.3rem;
            font-weight: 800;
            color: #2b6cb0;
          }
          .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            text-align: center;
          }
          .sig-box {
            border-top: 1px dashed #cbd5e0;
            padding-top: 15px;
            font-size: 0.85rem;
            color: #4a5568;
          }
          .sig-title { font-weight: bold; color: #2d3748; margin-bottom: 5px; }
          .official-stamp {
            border: 2px dashed #cbd5e0;
            border-radius: 50%;
            width: 90px;
            height: 90px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            color: #a0aec0;
            font-weight: bold;
          }
          @media print {
            body { background-color: #fff; }
            .report-container { padding: 10px; }
            .report-body { background: transparent; border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <div class="logo-area">
              <span class="logo-icon">☀️</span>
              <div class="header-text">
                <h1>دار شمس التعافي</h1>
                <p>شمسٌ تشرق للأمل والتعافي</p>
              </div>
            </div>
            <div class="meta-area">
              <p><strong>تاريخ الإصدار:</strong> ${date}</p>
              <p><strong>الرقم المرجعي:</strong> WR-${report.id.substring(0,8).toUpperCase()}</p>
              <p><strong>المصدر:</strong> الكادر المعالج بالمركز</p>
            </div>
          </div>
          
          <div class="section-title">بيانات المقيم</div>
          <div class="patient-card">
            <div class="info-group">
              <span class="info-label">اسم المقيم:</span>
              <span class="info-value">${report.residents?.full_name || '—'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">رقم الملف:</span>
              <span class="info-value">${report.residents?.file_number || '—'}</span>
            </div>
            <div class="info-group">
              <span class="info-label">تاريخ التقرير:</span>
              <span class="info-value">${date}</span>
            </div>
            <div class="info-group">
              <span class="info-label">المرحلة الحالية:</span>
              <span class="info-value">${stageTranslations[report.residents?.current_stage] || report.residents?.current_stage || '—'}</span>
            </div>
          </div>
          
          <div class="section-title">${report.report_title}</div>
          <div class="report-section">
            <div class="report-body">${formattedContent}</div>
          </div>
          
          <div class="section-title">مؤشر التقدم والتعافي المشترك</div>
          <div class="progress-section">
            <div style="font-weight: bold; color: #2c5282; font-size: 0.9rem;">نسبة إنجاز خطة العلاج:</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${report.progress_score || 0}%"></div>
            </div>
            <div class="progress-text">${report.progress_score || 0}%</div>
          </div>
          
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-title">الأخصائي المعالج</div>
              <div style="margin-top: 10px; font-size: 0.8rem; color: #718096;">${report.profiles?.full_name || 'طاقم شمس المعالج'}</div>
              <div style="margin-top: 5px;">التوقيع: .....................</div>
            </div>
            <div class="sig-box" style="display: flex; align-items: center; justify-content: center; border: none; padding: 0;">
              <div class="official-stamp">ختم المركز الرسمي</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">المدير الطبي للمركز</div>
              <div style="margin-top: 25px;">التوقيع: .....................</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 600);
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
                  <th style={{ padding: '1rem', width: '220px' }}>الإجراءات</th>
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
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => handlePreviewReport(r.id)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              background: '#ebf8ff',
                              border: '1px solid #bee3f8',
                              cursor: 'pointer',
                              color: '#2b6cb0',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontFamily: 'Cairo, sans-serif'
                            }}
                          >
                            <FileText size={13} />
                            معاينة / PDF
                          </button>
                          
                          <button 
                            onClick={() => deleteReport(r.id)}
                            style={{ 
                              padding: '0.35rem 0.75rem', 
                              borderRadius: '8px', 
                              background: '#fff5f5', 
                              border: '1px solid #fed7d7', 
                              cursor: 'pointer', 
                              color: '#c53030', 
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              fontFamily: 'Cairo, sans-serif'
                            }}
                          >
                            حذف
                          </button>
                        </div>
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

        {/* Report Preview & PDF Generation Modal */}
        {showPreviewModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
            <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.75rem', borderRadius: '16px', background: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>معاينة وتصدير التقرير الدوري</h3>
                <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#718096' }}>✕</button>
              </div>

              {loadingPreview ? (
                <div style={{ padding: '3rem', textAlign: 'center', flex: 1 }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--text-muted)' }}>جاري جلب بيانات التقرير الطبي...</p>
                </div>
              ) : previewingReport ? (
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Patient and Report info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f7fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>اسم المقيم</p>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary)' }}>{previewingReport.residents?.full_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>رقم الملف</p>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', fontFamily: 'monospace' }}>{previewingReport.residents?.file_number}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تاريخ الإنشاء</p>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{new Date(previewingReport.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المحرر</p>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem', color: '#3182ce' }}>{previewingReport.profiles?.full_name || 'الكادر الطبي بالمركز'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>{previewingReport.report_title}</h4>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '1rem',
                      fontSize: '0.9rem',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      color: '#2d3748',
                      fontFamily: 'Cairo, sans-serif'
                    }}>
                      {previewingReport.report_body || 'لا توجد تفاصيل للتقرير.'}
                    </div>
                  </div>

                  {/* Progress score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>نسبة التقدم الحالية:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>{previewingReport.progress_score}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${previewingReport.progress_score}%`, height: '100%', backgroundColor: '#3182ce', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Warning check */}
                  {!previewingReport.visible_to_family && (
                    <div style={{ background: '#fffaf0', border: '1px solid #feebc8', color: '#c05621', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                      ⚠️ هذا التقرير بحالة "مسودة" أو "غير مرئي للأهل" حالياً. تصديره كـ PDF لن ينشره تلقائياً.
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>حدث خطأ ما في تحميل التقرير.</div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    background: '#e2e8f0',
                    color: 'var(--primary)',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif'
                  }}
                >
                  إغلاق
                </button>
                {previewingReport && (
                  <button
                    onClick={() => generatePDF(previewingReport)}
                    style={{
                      padding: '0.6rem 1.5rem',
                      borderRadius: '8px',
                      background: '#2b6cb0',
                      color: 'white',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 6px -1px rgba(43, 108, 176, 0.2)',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  >
                    <FileText size={16} />
                    تصدير كـ PDF 📄
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
