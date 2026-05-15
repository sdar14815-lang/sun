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
};

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('resident_updates').insert({ ...form, created_by: user?.id });
      if (error) throw error;
      setShowModal(false);
      setForm({ resident_id: '', update_type: 'general', title: '', content: '', visible_to_family: true });
      fetchUpdates();
    } catch (e: any) { alert('حدث خطأ: ' + e.message); }
    finally { setSaving(false); }
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
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد تحديثات</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>إضافة تحديث جديد</h2>
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
                  <select value={form.update_type} onChange={e => setForm({ ...form, update_type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                    {Object.entries(UPDATE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>العنوان</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="عنوان مختصر" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>المحتوى *</label>
                  <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="تفاصيل التحديث..." rows={4}
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
