'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Bell, Plus, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ target: 'all', family_user_id: '', resident_id: '', title: '', body: '', type: 'general' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [notifRes, resRes, famRes] = await Promise.all([
        supabase.from('notifications').select('*, profiles!notifications_recipient_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('residents').select('id, full_name').eq('is_active', true).order('full_name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'family').eq('status', 'active'),
      ]);
      setNotifications(notifRes.data || []);
      setResidents(resRes.data || []);
      setFamilies(famRes.data || []);
    } finally { setLoading(false); }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.target === 'all') {
        // Send to all family accounts
        const inserts = families.map(f => ({ recipient_user_id: f.id, title: form.title, body: form.body, type: form.type }));
        if (inserts.length === 0) { alert('لا يوجد أهالي مسجلون'); return; }
        const { error } = await supabase.from('notifications').insert(inserts);
        if (error) throw error;
      } else if (form.target === 'resident') {
        // Send to all family linked to resident
        const { data: links } = await supabase.from('family_links').select('family_user_id').eq('resident_id', form.resident_id).eq('is_active', true);
        if (!links || links.length === 0) { alert('لا يوجد أهالي مرتبطون بهذا المقيم'); return; }
        const inserts = links.map(l => ({ recipient_user_id: l.family_user_id, title: form.title, body: form.body, type: form.type }));
        const { error } = await supabase.from('notifications').insert(inserts);
        if (error) throw error;
      } else {
        // Send to specific family
        const { error } = await supabase.from('notifications').insert({ recipient_user_id: form.family_user_id, title: form.title, body: form.body, type: form.type });
        if (error) throw error;
      }
      setShowModal(false);
      setForm({ target: 'all', family_user_id: '', resident_id: '', title: '', body: '', type: 'general' });
      fetchAll();
      alert('تم إرسال الإشعار بنجاح');
    } catch (e: any) { alert('حدث خطأ: ' + e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إدارة الإشعارات</h1>
            <p style={{ color: 'var(--text-muted)' }}>إرسال إشعارات للأهالي تظهر في البوابة والتطبيق</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> إرسال إشعار
          </button>
        </header>

        <div className="card" style={{ padding: '0' }}>
          {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '1rem' }}>المستلم</th>
                  <th style={{ padding: '1rem' }}>العنوان</th>
                  <th style={{ padding: '1rem' }}>النص</th>
                  <th style={{ padding: '1rem' }}>النوع</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>مقروءة</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{n.profiles?.full_name || '-'}</td>
                    <td style={{ padding: '1rem' }}>{n.title}</td>
                    <td style={{ padding: '1rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</td>
                    <td style={{ padding: '1rem' }}><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#e2e8f0' }}>{n.type}</span></td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(n.created_at).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: n.is_read ? '#f0fff4' : '#fff5f5', color: n.is_read ? '#2f855a' : '#c53030' }}>
                        {n.is_read ? 'نعم' : 'لا'}
                      </span>
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد إشعارات</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>إرسال إشعار جديد</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
              </div>
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>الإرسال إلى</label>
                  <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                    <option value="all">كل الأهالي (إعلان عام)</option>
                    <option value="resident">أهالي مقيم محدد</option>
                    <option value="family">أسرة محددة</option>
                  </select>
                </div>
                {form.target === 'resident' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>اختر المقيم</label>
                    <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                      <option value="">اختر...</option>
                      {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                    </select>
                  </div>
                )}
                {form.target === 'family' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>اختر الأسرة</label>
                    <select required value={form.family_user_id} onChange={e => setForm({ ...form, family_user_id: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                      <option value="">اختر...</option>
                      {families.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>عنوان الإشعار *</label>
                  <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>نص الإشعار *</label>
                  <textarea required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#e2e8f0', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={16} /> {saving ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
