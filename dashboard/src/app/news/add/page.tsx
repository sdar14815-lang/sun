'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Save, X, Newspaper, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AddNewsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    published: true
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: saveError } = await supabase
        .from('news')
        .insert([{
          title: formData.title,
          body: formData.body,
          published: formData.published
        }]);

      if (saveError) throw saveError;

      // Send Push Notification if published
      if (formData.published) {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `خبر جديد: ${formData.title}`,
            body: formData.body.length > 80 ? `${formData.body.substring(0, 80)}...` : formData.body,
            url: `${window.location.origin}/family/dashboard`
          }),
        }).catch(err => console.error("Failed to send notification:", err));
      }

      router.push('/news');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الخبر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <form onSubmit={handleSave}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إضافة خبر جديد</h1>
              <p style={{ color: 'var(--text-muted)' }}>نشر تحديث جديد يظهر في تطبيق الموبايل للأهالي</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-outline" style={{ borderColor: '#ccc', color: '#666' }}>
                <X size={20} />
                إلغاء
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save size={20} />
                {loading ? 'جاري النشر...' : 'نشر الخبر'}
              </button>
            </div>
          </header>

          {error && (
            <div style={{ backgroundColor: '#fff5f5', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <Newspaper size={20} />
              <h3 style={{ fontSize: '1.1rem' }}>محتوى الخبر</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>عنوان الخبر</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثلاً: افتتاح قسم جديد أو موعد ندوة" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>التفاصيل</label>
                <textarea required rows={10} value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', resize: 'none' }} placeholder="اكتب تفاصيل الخبر هنا..."></textarea>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="published" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})} />
                <label htmlFor="published" style={{ fontSize: '0.9rem', fontWeight: '600' }}>نشر الخبر فوراً (يظهر في التطبيق)</label>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
