'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { ArrowRight, User, Activity, Stethoscope, Clipboard, FileText, Plus, Eye, EyeOff, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة',
};
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  stable: { label: 'مستقر', color: '#2f855a', bg: '#f0fff4' },
  needs_followup: { label: 'يحتاج متابعة', color: '#c05621', bg: '#fffaf0' },
  significant_progress: { label: 'تقدم ملحوظ', color: '#2b6cb0', bg: '#ebf8ff' },
  important_note: { label: 'ملاحظة مهمة', color: '#c53030', bg: '#fff5f5' },
};
const UPDATE_TYPE_LABELS: Record<string, string> = {
  general: 'حالة عامة', specialist_note: 'ملاحظة أخصائي',
  doctor_note: 'ملاحظة طبيب', session_attendance: 'حضور جلسة',
  behavioral_progress: 'تطور سلوكي', family_alert: 'تنبيه للأسرة',
};

export default function ResidentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resident, setResident] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [familyLinks, setFamilyLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'updates' | 'reports' | 'family'>('info');

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ update_type: 'general', title: '', content: '', visible_to_family: true });
  const [savingUpdate, setSavingUpdate] = useState(false);

  useEffect(() => { if (id) fetchAll(); }, [id]);

  async function fetchAll() {
    try {
      const [resRes, updRes, repRes, linkRes] = await Promise.all([
        supabase.from('residents').select('*, assigned_doctor:profiles!residents_assigned_doctor_fkey(full_name), assigned_therapist:profiles!residents_assigned_therapist_fkey(full_name)').eq('id', id).single(),
        supabase.from('resident_updates').select('*, profiles!resident_updates_created_by_fkey(full_name)').eq('resident_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('weekly_reports').select('*').eq('resident_id', id).order('created_at', { ascending: false }),
        supabase.from('family_links').select('*, profiles!family_links_family_user_id_fkey(full_name, phone)').eq('resident_id', id),
      ]);
      if (resRes.error) throw resRes.error;
      setResident(resRes.data);
      setUpdates(updRes.data || []);
      setReports(repRes.data || []);
      setFamilyLinks(linkRes.data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSavingUpdate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('resident_updates').insert({ ...updateForm, resident_id: id, created_by: user?.id });
      if (error) throw error;
      setShowUpdateForm(false);
      setUpdateForm({ update_type: 'general', title: '', content: '', visible_to_family: true });
      fetchAll();
    } catch (e: any) { alert('خطأ: ' + e.message); }
    finally { setSavingUpdate(false); }
  }

  async function toggleUpdateVisibility(updateId: string, current: boolean) {
    const { error } = await supabase.from('resident_updates').update({ visible_to_family: !current }).eq('id', updateId);
    if (!error) fetchAll();
  }

  async function toggleReportPublish(reportId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('weekly_reports').update({ status: newStatus }).eq('id', reportId);
    if (!error) fetchAll();
  }

  async function toggleFamilyLinkStatus(linkId: string, current: boolean) {
    const { error } = await supabase.from('family_links').update({ is_active: !current }).eq('id', linkId);
    if (!error) fetchAll();
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
        </main>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="dashboard-container">
        <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          لم يتم العثور على المقيم.
        </main>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[resident.current_status] || STATUS_LABELS['stable'];

  const tabs = [
    { id: 'info', label: 'البيانات الأساسية' },
    { id: 'updates', label: `التحديثات (${updates.length})` },
    { id: 'reports', label: `التقارير (${reports.length})` },
    { id: 'family', label: `الأهالي (${familyLinks.length})` },
  ];

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* ── Header ── */}
        <header className="page-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', marginTop: '0.25rem' }}>
              <ArrowRight size={22} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', color: 'var(--primary)', fontWeight: '800', lineHeight: 1.2, marginBottom: '0.25rem' }}>
                {resident.full_name}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'monospace' }}>رقم الملف: {resident.file_number}</p>
            </div>
          </div>
          <div className="page-header-actions">
            <span className={`badge ${resident.current_status === 'stable' ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'center' }}>
              {statusInfo.label}
            </span>
            <Link href={`/residents/${id}/edit`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              تعديل البيانات
            </Link>
          </div>
        </header>

        {/* ── Progress Bar ── */}
        {resident.progress_score !== undefined && (
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>نسبة التقدم العلاجي</span>
              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>{resident.progress_score}%</span>
            </div>
            <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${resident.progress_score}%`, height: '100%', background: 'linear-gradient(90deg, #1a365d, #4299e1)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ 
          display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', 
          marginBottom: '1.5rem', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' 
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px', fontSize: '0.9rem', fontFamily: 'inherit',
                whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === 'info' && (
          <div className="two-col-grid">
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>
                <User size={18} /> البيانات الأساسية
              </h3>
              {[
                { label: 'الاسم الكامل', value: resident.full_name },
                { label: 'العمر', value: resident.age ? `${resident.age} سنة` : '-' },
                { label: 'تاريخ الدخول', value: resident.admission_date ? new Date(resident.admission_date).toLocaleDateString('ar-EG') : '-' },
                { label: 'رقم الغرفة', value: resident.room_number || '-' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.value}</span>
                </div>
              ))}
            </div>
            
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontWeight: '700' }}>
                <Activity size={18} /> الحالة العلاجية
              </h3>
              {[
                { label: 'المرحلة الحالية', value: STAGE_LABELS[resident.current_stage] || resident.current_stage },
                { label: 'الحالة العامة', value: statusInfo.label },
                { label: 'الطبيب المعالج', value: resident.assigned_doctor?.full_name || 'غير محدد' },
                { label: 'الأخصائي النفسي', value: resident.assigned_therapist?.full_name || 'غير محدد' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.label}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {resident.notes_internal && (
              <div className="card" style={{ gridColumn: '1 / -1', border: '1px dashed #e53e3e', backgroundColor: '#fff5f5' }}>
                <h3 style={{ color: '#c53030', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', fontSize: '1rem' }}>
                  <FileText size={18} /> ملاحظات داخلية (لا تُرى للأهالي)
                </h3>
                <p style={{ whiteSpace: 'pre-wrap', color: '#742a2a', lineHeight: '1.8', fontSize: '0.95rem' }}>{resident.notes_internal}</p>
              </div>
            )}
            
            {resident.notes_visible_to_family && (
              <div className="card" style={{ gridColumn: '1 / -1', border: '1px solid #c6f6d5', backgroundColor: '#f0fff4' }}>
                <h3 style={{ color: '#2f855a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', fontSize: '1rem' }}>
                  <Eye size={18} /> ملاحظة مرئية للأهل
                </h3>
                <p style={{ whiteSpace: 'pre-wrap', color: '#276749', lineHeight: '1.8', fontSize: '0.95rem' }}>{resident.notes_visible_to_family}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Updates ── */}
        {activeTab === 'updates' && (
          <div>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>التحديثات اليومية الخاصة بهذا المقيم</p>
              <button onClick={() => setShowUpdateForm(!showUpdateForm)} className="btn btn-primary btn-sm">
                <Plus size={16} /> إضافة تحديث
              </button>
            </div>

            {showUpdateForm && (
              <div className="card" style={{ border: '2px solid var(--primary)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '1.25rem', color: 'var(--primary)' }}>تحديث جديد</h3>
                <form onSubmit={handleAddUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="two-col-grid" style={{ gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">نوع التحديث</label>
                      <select className="form-input" value={updateForm.update_type} onChange={e => setUpdateForm({ ...updateForm, update_type: e.target.value })}>
                        {Object.entries(UPDATE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">العنوان</label>
                      <input type="text" className="form-input" value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })} placeholder="عنوان مختصر" />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">المحتوى *</label>
                    <textarea required className="form-input" value={updateForm.content} onChange={e => setUpdateForm({ ...updateForm, content: e.target.value })} rows={3} placeholder="تفاصيل التحديث..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={updateForm.visible_to_family} onChange={e => setUpdateForm({ ...updateForm, visible_to_family: e.target.checked })} style={{ width: 18, height: 18 }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>مرئي للأهالي</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
                      <button type="button" onClick={() => setShowUpdateForm(false)} className="btn btn-outline" style={{ borderColor: 'transparent', color: 'var(--text-muted)' }}>إلغاء</button>
                      <button type="submit" className="btn btn-primary" disabled={savingUpdate}>{savingUpdate ? 'حفظ...' : 'حفظ التحديث'}</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {updates.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>لا توجد تحديثات لهذا المقيم بعد</div>
              ) : updates.map(u => (
                <div key={u.id} className="card" style={{ padding: '1.25rem', marginBottom: 0, borderRight: `4px solid ${u.visible_to_family ? '#4299e1' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '12px', backgroundColor: '#e2e8f0', color: 'var(--primary)', fontWeight: '600' }}>
                          {UPDATE_TYPE_LABELS[u.update_type] || u.update_type}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {u.title && <p style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1.05rem', color: 'var(--text-main)' }}>{u.title}</p>}
                      <p style={{ color: '#4a5568', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{u.content}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>بواسطة: {u.profiles?.full_name || '-'}</p>
                    </div>
                    <button onClick={() => toggleUpdateVisibility(u.id, u.visible_to_family)}
                      title={u.visible_to_family ? 'إخفاء من الأهالي' : 'إظهار للأهالي'}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: u.visible_to_family ? '#f0fff4' : '#fff5f5', cursor: 'pointer', flexShrink: 0 }}>
                      {u.visible_to_family ? <Eye size={18} color="#2f855a" /> : <EyeOff size={18} color="#c53030" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Reports ── */}
        {activeTab === 'reports' && (
          <div>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>التقارير الدورية لهذا المقيم</p>
              <Link href={`/reports/add?resident=${id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                <Plus size={16} /> إنشاء تقرير
              </Link>
            </div>
            {reports.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>لا توجد تقارير لهذا المقيم بعد</div>
            ) : reports.map(r => (
              <div key={r.id} className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.report_title}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => toggleReportPublish(r.id, r.status)}
                      style={{ padding: '0.4rem 0.875rem', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit', backgroundColor: r.status === 'published' ? '#c6f6d5' : '#fed7d7', color: r.status === 'published' ? '#22543d' : '#822727' }}>
                      {r.status === 'published' ? '✓ منشور' : '● مسودة'}
                    </button>
                    <span style={{ fontSize: '0.8rem', color: r.visible_to_family ? '#2f855a' : '#c53030', fontWeight: '600', backgroundColor: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                      {r.visible_to_family ? '👁 مرئي' : '🙈 مخفي'}
                    </span>
                    {r.progress_score !== null && (
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>{r.progress_score}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Family ── */}
        {activeTab === 'family' && (
          <div>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>الأهالي المرتبطون بهذا المقيم</p>
              <Link href="/families" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                <Link2 size={16} /> إضافة أهل
              </Link>
            </div>
            {familyLinks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                لا يوجد أهالي مرتبطون بهذا المقيم — اذهب إلى إدارة الأهالي لربطهم
              </div>
            ) : familyLinks.map(link => (
              <div key={link.id} className="card" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{link.profiles?.full_name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                    {link.relation || 'علاقة غير محددة'} · {link.profiles?.phone || 'لا يوجد هاتف'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '10px', backgroundColor: link.can_view_reports ? '#f0fff4' : '#f7fafc', color: link.can_view_reports ? '#2f855a' : '#a0aec0', fontWeight: '600' }}>
                      {link.can_view_reports ? '✓' : '✗'} تقارير
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '10px', backgroundColor: link.can_view_photos ? '#f0fff4' : '#f7fafc', color: link.can_view_photos ? '#2f855a' : '#a0aec0', fontWeight: '600' }}>
                      {link.can_view_photos ? '✓' : '✗'} صور
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleFamilyLinkStatus(link.id, link.is_active)}
                  className="btn btn-sm"
                  style={{ borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', backgroundColor: link.is_active ? '#fff5f5' : '#f0fff4', color: link.is_active ? '#c53030' : '#2f855a' }}>
                  {link.is_active ? 'إيقاف الوصول' : 'تفعيل الوصول'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 480px) {
          .page-header-actions { width: 100%; display: flex; justify-content: space-between; align-items: center; }
          .page-header-actions .btn { width: auto; flex: 1; margin-right: 0.5rem; text-align: center; }
        }
      `}</style>
    </div>
  );
}
