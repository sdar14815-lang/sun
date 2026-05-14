'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Save, X, Newspaper, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    published: true
  });

  useEffect(() => {
    if (id) fetchNewsItem();
  }, [id]);

  async function fetchNewsItem() {
    try {
      const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title,
          body: data.body,
          published: data.published
        });
      }
    } catch (err: any) {
      setError('فشل في تحميل الخبر');
    } finally {
      setFetching(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: saveError } = await supabase
        .from('news')
        .update({
          title: formData.title,
          body: formData.body,
          published: formData.published
        })
        .eq('id', id);

      if (saveError) throw saveError;
      router.push('/news');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل الخبر');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="dashboard-container"><Sidebar /><main className="main-content" style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</main></div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <form onSubmit={handleSave}>
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>تعديل الخبر</h1>
              <p style={{ color: 'var(--text-muted)' }}>تحديث بيانات الخبر</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => router.back()} className="btn btn-outline" style={{ borderColor: '#ccc', color: '#666' }}>
                <X size={20} />
                إلغاء
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save size={20} />
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
