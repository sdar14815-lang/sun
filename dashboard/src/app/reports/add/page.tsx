'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AddReportPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    resident_id: '', report_title: '', report_body: '',
    progress_score: 50,
    status: 'draft', visible_to_family: false,
  });

  useEffect(() => {
    supabase.from('residents').select('id, full_name, file_number').eq('is_active', true).order('full_name').then(({ data }) => setResidents(data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('weekly_reports').insert({ 
        resident_id: form.resident_id,
        report_title: form.report_title,
        report_body: form.report_body,
        progress_score: form.progress_score,
        report_status: form.status,
        visible_to_family: form.visible_to_family,
        created_by: user?.id 
      });
      if (error) throw error;

      // Send Push Notification if visible to family
      if (form.status === 'published' && form.visible_to_family) {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `تقرير طبي جديد: ${form.report_title}`,
            body: `تم إصدار تقرير طبي جديد لمتابعته في لوحة تحكم الأهل.`,
            url: `${window.location.origin}/family/reports`
          }),
        }).catch(err => console.error("Failed to send notification:", err));
      }

      router.push('/reports');
    } catch (e: any) { alert('حدث خطأ: ' + e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/reports" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><ArrowRight size={20} /></Link>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إنشاء تقرير جديد</h1>
            <p style={{ color: 'var(--text-muted)' }}>أنشئ تقريراً دورياً وتحكم في ظهوره للأهالي</p>
          </div>
        </header>

        <div className="card" style={{ maxWidth: '700px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>المقيم *</label>
                <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                  <option value="">اختر المقيم...</option>
                  {residents.map(r => <option key={r.id} value={r.id}>{r.full_name} — {r.file_number}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>نوع التقرير</label>
                <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#f8fafc', fontSize: '0.9rem' }}>
                  تقرير أسبوعي (Weekly)
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>عنوان التقرير *</label>
              <input required type="text" value={form.report_title} onChange={e => setForm({ ...form, report_title: e.target.value })}
                placeholder="مثال: التقرير الأسبوعي — الأسبوع الثالث من مايو"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>محتوى التقرير *</label>
              <textarea required value={form.report_body} onChange={e => setForm({ ...form, report_body: e.target.value })}
                placeholder="اكتب تفاصيل التقرير هنا..." rows={8}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.8' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>نسبة التقدم: {form.progress_score}%</label>
              <input type="range" min="0" max="100" value={form.progress_score} onChange={e => setForm({ ...form, progress_score: Number(e.target.value) })}
                style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>حالة التقرير</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                  <option value="draft">مسودة (Draft) — لا يظهر للأهالي</option>
                  <option value="published">منشور (Published)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem' }}>
                  <input type="checkbox" checked={form.visible_to_family} onChange={e => setForm({ ...form, visible_to_family: e.target.checked })}
                    style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: '600' }}>مرئي للأهالي</span>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingRight: '1rem' }}>
                  يظهر فقط إذا كان منشوراً ومرئياً معاً
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <Link href="/reports" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#e2e8f0', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>إلغاء</Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التقرير'}</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
