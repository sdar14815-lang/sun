'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const UPDATE_TYPES: Record<string, string> = {
  general: 'حالة عامة',
  specialist_note: 'ملاحظة أخصائي',
  doctor_note: 'ملاحظة طبيب',
  session_attendance: 'حضور جلسة',
  behavioral_progress: 'تطور سلوكي',
  family_alert: 'تنبيه للأسرة',
  badge: 'وسام تقديري 🎖️',
};

const BADGE_PRESETS = [
  { value: 'وسام الالتزام الرياضي 🏋️‍♂️', label: 'وسام الالتزام الرياضي 🏋️‍♂️' },
  { value: 'أسبوع بدون انتكاسة 💪', label: 'أسبوع بدون انتكاسة 💪' },
  { value: 'التفاعل الإيجابي في الجلسات 🗣️', label: 'التفاعل الإيجابي في الجلسات 🗣️' },
  { value: 'وسام الالتزام الروحي والصلوات 🕋', label: 'وسام الالتزام الروحي والصلوات 🕋' },
  { value: 'وسام المبادرة الاجتماعية والتعاون 🤝', label: 'وسام المبادرة الاجتماعية والتعاون 🤝' },
  { value: 'وسام شعاع الأمل والتعافي 🌅', label: 'وسام شعاع الأمل والتعافي 🌅' }
];

export default function UpdatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ resident_id: '', update_type: 'general', title: '', content: '', visible_to_family: true });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // WhatsApp Sharing State
  const [sharingUpdate, setSharingUpdate] = useState<any>(null);
  const [familyOptions, setFamilyOptions] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  useEffect(() => { fetchResidents(); fetchUpdates(); }, []);

  async function fetchResidents() {
    const { data } = await supabase.from('residents').select('id, full_name, file_number').eq('is_active', true).order('full_name');
    setResidents(data || []);
  }

  async function fetchUpdates() {
    try {
      const { data, error } = await supabase
        .from('resident_updates')
        .select('*, residents(full_name, file_number), profiles!resident_updates_created_by_fkey(full_name)')
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setUpdates(data || []);
    } finally { setLoading(false); }
  }

  async function handleShareWhatsApp(update: any) {
    setSharingUpdate(update);
    setLoadingFamilies(true);
    setFamilyOptions([]);
    try {
      const { data, error } = await supabase
        .from('family_links')
        .select(`
          relation,
          profiles (
            id,
            full_name,
            phone
          )
        `)
        .eq('resident_id', update.resident_id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const options = data?.map((fl: any) => ({
        relation: fl.relation,
        name: fl.profiles?.full_name,
        phone: fl.profiles?.phone,
      })).filter(o => o.phone) || [];

      if (options.length === 0) {
        alert('⚠️ لا توجد أرقام هواتف مسجلة ومربوطة لعائلة هذا المقيم حالياً في النظام.');
        return;
      }

      if (options.length === 1) {
        // Redirect directly
        openWhatsAppRedirect(options[0], update);
      } else {
        // Show modal to choose
        setFamilyOptions(options);
        setShowShareModal(true);
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء جلب أرقام العائلة: ' + e.message);
    } finally {
      setLoadingFamilies(false);
    }
  }

  function openWhatsAppRedirect(familyMember: any, update: any) {
    const parentName = familyMember.name || 'ولي الأمر الكريم';
    const residentName = update.residents?.full_name || 'المقيم';
    const fileNumber = update.residents?.file_number || '';
    const title = update.title || 'تقرير حالة';
    const content = update.content;

    const message = `السلام عليكم ورحمة الله وبركاته،\nأهلاً بك يا ${parentName}،\nنود إفادتكم بتحديث جديد بخصوص المقيم ${residentName} (ملف رقم: ${fileNumber}):\n\n📌 *${title}*\n\n${content}\n\nدمتم بصحة وعافية،\nدار شمس التعافي ☀️`;
    
    // Normalize phone number to standard international format (especially Saudi Arabia)
    let cleanPhone = familyMember.phone.replace(/[\s\-\+\(\)]/g, '');
    
    if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
      cleanPhone = '966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '966' + cleanPhone;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowShareModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingId) {
        // Edit flow
        const { error } = await supabase
          .from('resident_updates')
          .update({
            resident_id: form.resident_id,
            update_type: form.update_type,
            title: form.title,
            content: form.content,
            visible_to_family: form.visible_to_family
          })
          .eq('id', editingId);
          
        if (error) throw error;
        alert('تم تعديل التحديث بنجاح');
      } else {
        // Add flow
        const { error } = await supabase.from('resident_updates').insert({ ...form, created_by: user?.id });
        if (error) throw error;

        // Send Push Notification if visible to family
        if (form.visible_to_family) {
          fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `تحديث حالة جديد: ${form.title || 'تقرير حالة مقيم'}`,
              body: form.content.length > 80 ? `${form.content.substring(0, 80)}...` : form.content,
              url: `${window.location.origin}/family/dashboard`
            }),
          }).catch(err => console.error("Failed to send notification:", err));
        }
        alert('تم إضافة التحديث بنجاح');
      }

      setShowModal(false);
      setForm({ resident_id: '', update_type: 'general', title: '', content: '', visible_to_family: true });
      setEditingId(null);
      fetchUpdates();
    } catch (e: any) { alert('حدث خطأ: ' + e.message); }
    finally { setSaving(false); }
  }

  function handleEditClick(u: any) {
    setEditingId(u.id);
    setForm({
      resident_id: u.resident_id || '',
      update_type: u.update_type || 'general',
      title: u.title || '',
      content: u.content || '',
      visible_to_family: u.visible_to_family !== false
    });
    setShowModal(true);
  }

  async function handleDeleteUpdate(id: string) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا التحديث نهائياً؟')) return;
    try {
      const { error } = await supabase.from('resident_updates').delete().eq('id', id);
      if (error) throw error;
      setUpdates(updates.filter(u => u.id !== id));
      alert('تم حذف التحديث بنجاح');
    } catch (e: any) {
      alert('خطأ أثناء الحذف: ' + e.message);
    }
  }

  const filtered = updates.filter(u => {
    const matchSearch = !searchTerm || u.residents?.full_name?.includes(searchTerm) || u.title?.includes(searchTerm);
    const matchResident = !filterResident || u.resident_id === filterResident;
    return matchSearch && matchResident;
  });

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>التحديثات اليومية</h1>
            <p style={{ color: 'var(--text-muted)' }}>تحكم في ما يظهر للأهالي عبر البوابة والتطبيق</p>
          </div>
          <button onClick={() => { setEditingId(null); setForm({ resident_id: '', update_type: 'general', title: '', content: '', visible_to_family: true }); setShowModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> إضافة تحديث
          </button>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
            <input type="text" placeholder="ابحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select value={filterResident} onChange={e => setFilterResident(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', minWidth: '200px', outline: 'none' }}>
            <option value="">كل المقيمين</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
          </select>
        </div>

        <div className="card" style={{ padding: '0' }}>
          {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '1rem' }}>المقيم</th>
                  <th style={{ padding: '1rem' }}>النوع</th>
                  <th style={{ padding: '1rem' }}>العنوان والمحتوى</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>مرئي للأهل</th>
                  <th style={{ padding: '1rem', width: '130px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{u.residents?.full_name}<br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.residents?.file_number}</span></td>
                    <td style={{ padding: '1rem' }}><span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', backgroundColor: '#e2e8f0', color: 'var(--primary)' }}>{UPDATE_TYPES[u.update_type] || u.update_type}</span></td>
                    <td style={{ padding: '1rem', maxWidth: '250px' }}>
                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{u.title}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.content}</p>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(u.created_at).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', backgroundColor: u.visible_to_family ? '#f0fff4' : '#fff5f5', color: u.visible_to_family ? '#2f855a' : '#c53030', fontWeight: '600' }}>
                        {u.visible_to_family ? '✓ نعم' : '✗ لا'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleShareWhatsApp(u)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#25D366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(37, 211, 102, 0.15)',
                            transition: 'all 0.15s ease',
                            fontFamily: 'Cairo, sans-serif'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'none'}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginLeft: '0.25rem' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.488 4.957 1.49 5.373 0 9.749-4.373 9.753-9.743.002-2.602-1.01-5.05-2.854-6.894-1.844-1.843-4.29-2.853-6.894-2.855-5.377 0-9.754 4.375-9.759 9.748-.002 1.761.47 3.427 1.365 4.908L1.925 22l4.722-1.246zm12.355-6.587c-.272-.136-1.61-.794-1.86-.885-.25-.09-.432-.136-.613.136-.18.273-.7 0-.88-.7-.18-.273-.362-.636-.61-.59-.25-.045-1.248-.46-2.378-1.467-.88-.785-1.474-1.755-1.647-2.05-.172-.293-.018-.452.12-.59.123-.123.272-.317.408-.475.136-.158.18-.27.272-.452.09-.18.045-.34-.022-.475-.067-.136-.613-1.477-.84-2.02-.22-.533-.48-.46-.613-.467-.12-.006-.27-.008-.423-.008-.152 0-.402.057-.613.284-.21.227-.803.784-.803 1.91 0 1.127.82 2.215.933 2.37.113.153 1.615 2.467 3.91 3.46.545.236.97.377 1.302.482.548.174 1.047.15 1.44.09.438-.066 1.61-.657 1.838-1.294.227-.636.227-1.18.158-1.293-.068-.113-.25-.204-.522-.34z"/>
                          </svg>
                          مشاركة
                        </button>
                        <button 
                          onClick={() => handleEditClick(u)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#ebf8ff',
                            color: '#2b6cb0',
                            border: '1px solid #bee3f8',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: 'Cairo, sans-serif'
                          }}
                        >
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleDeleteUpdate(u.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#fff5f5',
                            color: '#c53030',
                            border: '1px solid #fed7d7',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: 'Cairo, sans-serif'
                          }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد تحديثات</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Multiple Family Options Modal */}
        {showShareModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', borderRadius: '16px', background: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>اختر المستلم من العائلة</h3>
                <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#718096' }}>✕</button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6', fontWeight: '500' }}>
                تم العثور على أكثر من حساب عائلة مرتبط بالمقيم. اختر الشخص الذي ترغب في إرسال التحديث له عبر واتساب:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingLeft: '0.25rem' }}>
                {familyOptions.map((fo, idx) => (
                  <button
                    key={idx}
                    onClick={() => openWhatsAppRedirect(fo, sharingUpdate)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'white',
                      textAlign: 'right',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#f7fafc';
                      e.currentTarget.style.borderColor = '#cbd5e0';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--primary)' }}>{fo.name}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: '600' }}>الصلة: {fo.relation || 'غير محدد'}</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#25D366', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      📲 إرسال
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {editingId ? 'تعديل التحديث الحالي' : 'إضافة تحديث جديد'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>المقيم *</label>
                  <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                    <option value="">اختر المقيم...</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.full_name} — {r.file_number}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>نوع التحديث</label>
                  <select value={form.update_type} onChange={e => setForm({ ...form, update_type: e.target.value, title: e.target.value === 'badge' ? '' : form.title })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                    {Object.entries(UPDATE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                {form.update_type === 'badge' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>اختر الوسام التقديري *</label>
                    <select required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', marginBottom: '0.5rem' }}>
                      <option value="">اختر من الأوسمة المعتمدة...</option>
                      {BADGE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      <option value="custom">أخرى (كتابة وسام مخصص)...</option>
                    </select>
                    {(form.title === 'custom' || (!BADGE_PRESETS.some(p => p.value === form.title) && form.title !== '')) ? (
                      <input required type="text" value={form.title === 'custom' ? '' : form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="اكتب اسم الوسام المخصص هنا..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>العنوان *</label>
                    <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="عنوان مختصر" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    {form.update_type === 'badge' ? 'رسالة التهنئة والثناء (تظهر للأهل) *' : 'المحتوى *'}
                  </label>
                  <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder={form.update_type === 'badge' ? 'مثال: نهنئ البطل على التزامه اليومي الممتاز بالتمارين الرياضية ومساعدة زملائه في صالة اللياقة!' : 'تفاصيل التحديث...'} rows={4}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.visible_to_family} onChange={e => setForm({ ...form, visible_to_family: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: '600' }}>مرئي للأهالي (يظهر في البوابة والتطبيق)</span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#e2e8f0', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التحديث'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
