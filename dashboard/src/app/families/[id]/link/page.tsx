'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Link2, Shield, Eye, Image, MessageSquare, Bell } from 'lucide-react';
import Link from 'next/link';

export default function FamilyLinkPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params?.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [family, setFamily] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [existingLinks, setExistingLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    resident_id: '',
    relation: '',
    can_view_reports: true,
    can_view_photos: true,
    can_receive_notifications: true,
    can_send_messages: true,
  });

  useEffect(() => { if (familyId) fetchData(); }, [familyId]);

  async function fetchData() {
    const [famRes, resRes, linkRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', familyId).single(),
      supabase.from('residents').select('id, full_name, file_number').eq('is_active', true).order('full_name'),
      supabase.from('family_links').select('*, residents(full_name, file_number)').eq('family_user_id', familyId),
    ]);
    setFamily(famRes.data);
    setResidents(resRes.data || []);
    setExistingLinks(linkRes.data || []);
    setLoading(false);
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!form.resident_id) { alert('يرجى اختيار مقيم'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('family_links').upsert({
        family_user_id: familyId,
        resident_id: form.resident_id,
        relation: form.relation,
        can_view_reports: form.can_view_reports,
        can_view_photos: form.can_view_photos,
        can_receive_notifications: form.can_receive_notifications,
        can_send_messages: form.can_send_messages,
        is_active: true,
      }, { onConflict: 'family_user_id,resident_id' });
      if (error) throw error;
      setForm({ resident_id: '', relation: '', can_view_reports: true, can_view_photos: true, can_receive_notifications: true, can_send_messages: true });
      fetchData();
    } catch (e: any) { alert('خطأ: ' + e.message); }
    finally { setSaving(false); }
  }

  async function toggleLink(linkId: string, current: boolean) {
    const { error } = await supabase.from('family_links').update({ is_active: !current }).eq('id', linkId);
    if (!error) fetchData();
  }

  async function deleteLink(linkId: string) {
    if (!confirm('حذف هذا الربط؟')) return;
    const { error } = await supabase.from('family_links').delete().eq('id', linkId);
    if (!error) fetchData();
  }

  async function updatePermissions(linkId: string, field: string, value: boolean) {
    const { error } = await supabase.from('family_links').update({ [field]: value }).eq('id', linkId);
    if (!error) fetchData();
  }

  if (loading) return <div className="dashboard-container"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>جاري التحميل...</main></div>;

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/families" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><ArrowRight size={22} /></Link>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
              ربط الأهل بمقيم — {family?.full_name}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>إدارة صلاحيات وصول هذا الحساب للبيانات</p>
          </div>
        </header>

        {/* Add Link Form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link2 size={18} /> ربط بمقيم جديد
          </h3>
          <form onSubmit={handleLink} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.9rem' }}>المقيم *</label>
                <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                  <option value="">اختر المقيم...</option>
                  {residents.map(r => <option key={r.id} value={r.id}>{r.full_name} — {r.file_number}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.9rem' }}>صلة القرابة</label>
                <input type="text" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })}
                  placeholder="مثال: والد، والدة، أخ..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
              </div>
            </div>

            <div>
              <p style={{ fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} /> الصلاحيات
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {[
                  { field: 'can_view_reports', label: 'عرض التقارير', icon: Eye },
                  { field: 'can_view_photos', label: 'عرض الصور', icon: Image },
                  { field: 'can_receive_notifications', label: 'استقبال الإشعارات', icon: Bell },
                  { field: 'can_send_messages', label: 'إرسال رسائل', icon: MessageSquare },
                ].map(({ field, label, icon: Icon }) => (
                  <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${(form as any)[field] ? '#c6f6d5' : '#e2e8f0'}`, backgroundColor: (form as any)[field] ? '#f0fff4' : 'white' }}>
                    <input type="checkbox" checked={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                    <Icon size={14} color={(form as any)[field] ? '#2f855a' : '#a0aec0'} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: (form as any)[field] ? '#276749' : 'var(--text-muted)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'ربط المقيم'}</button>
            </div>
          </form>
        </div>

        {/* Existing Links */}
        <div className="card">
          <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem' }}>الروابط الحالية ({existingLinks.length})</h3>
          {existingLinks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>لا توجد روابط مع مقيمين بعد</p>
          ) : existingLinks.map(link => (
            <div key={link.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', opacity: link.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--primary)' }}>{link.residents?.full_name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{link.residents?.file_number} · {link.relation || 'علاقة غير محددة'}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleLink(link.id, link.is_active)}
                    style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit', backgroundColor: link.is_active ? '#fff5f5' : '#f0fff4', color: link.is_active ? '#c53030' : '#2f855a' }}>
                    {link.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button onClick={() => deleteLink(link.id)}
                    style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit', backgroundColor: '#fff5f5', color: '#c53030' }}>
                    حذف
                  </button>
                </div>
              </div>
              {/* Permissions Row */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { field: 'can_view_reports', label: 'التقارير' },
                  { field: 'can_view_photos', label: 'الصور' },
                  { field: 'can_receive_notifications', label: 'الإشعارات' },
                  { field: 'can_send_messages', label: 'الرسائل' },
                ].map(({ field, label }) => (
                  <button key={field} onClick={() => updatePermissions(link.id, field, !link[field])}
                    style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.2s',
                      borderColor: link[field] ? '#c6f6d5' : '#fed7d7',
                      backgroundColor: link[field] ? '#f0fff4' : '#fff5f5',
                      color: link[field] ? '#2f855a' : '#c53030' }}>
                    {link[field] ? '✓' : '✗'} {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
