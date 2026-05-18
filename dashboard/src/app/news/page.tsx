'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Plus, Edit, Trash2, CheckCircle, Clock, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NewsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('news')
      .select('id, title, body, image_url, published, sort_order, created_at')
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (data) setNews(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const togglePublish = async (item: any) => {
    const newVal = !item.published;
    const { error } = await supabase.from('news').update({ published: newVal }).eq('id', item.id);
    if (!error) setNews(prev => prev.map(n => n.id === item.id ? { ...n, published: newVal } : n));
  };

  const deleteNews = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) setNews(prev => prev.filter(n => n.id !== id));
  };

  const reorder = async (id: string, direction: 'up' | 'down') => {
    const idx = news.findIndex(n => n.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === news.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...news];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    
    setNews(updated);
    
    // Update sort_order for both
    await Promise.all([
      supabase.from('news').update({ sort_order: swapIdx }).eq('id', updated[idx].id),
      supabase.from('news').update({ sort_order: idx }).eq('id', updated[swapIdx].id),
    ]);
  };

  const publishedCount = useMemo(() => news.filter(n => n.published).length, [news]);

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إدارة الأخبار</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              الأخبار المنشورة ({publishedCount}/{news.length}) — تظهر في بوابة الأهالي
            </p>
          </div>
          <Link href="/news/add" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={20} /> إضافة خبر جديد
          </Link>
        </header>

        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
               <div className="spinner" style={{ marginBottom: '1rem' }} />
               جاري التحميل...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem' }}>الترتيب</th>
                  <th style={{ padding: '1rem' }}>عنوان الخبر</th>
                  <th style={{ padding: '1rem' }}>الصورة</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>الحالة</th>
                  <th style={{ padding: '1rem' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: item.published ? 'white' : '#f8fafc', transition: 'background 0.2s' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <button onClick={() => reorder(item.id, 'up')} disabled={idx === 0}
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#e2e8f0' : 'var(--text-muted)' }}>
                          <ArrowUp size={16} />
                        </button>
                        <button onClick={() => reorder(item.id, 'down')} disabled={idx === news.length - 1}
                          style={{ background: 'none', border: 'none', cursor: idx === news.length - 1 ? 'default' : 'pointer', color: idx === news.length - 1 ? '#e2e8f0' : 'var(--text-muted)' }}>
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>{item.title}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{item.body}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} loading="lazy" style={{ width: '64px', height: '44px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#f1f5f9' }} />
                      ) : (
                        <div style={{ width: '64px', height: '44px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <ImageIcon size={16} color="#cbd5e1" />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString('ar-EG')}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => togglePublish(item)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700',
                          backgroundColor: item.published ? '#dcfce7' : '#fee2e2',
                          color: item.published ? '#166534' : '#991b1b' }}>
                        {item.published ? <><CheckCircle size={14} /> منشور</> : <><Clock size={14} /> مسودة</>}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/news/${item.id}/edit`} style={{ padding: '0.5rem', borderRadius: '8px', background: '#f1f5f9', color: 'var(--primary)', display: 'inline-flex' }}>
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => deleteNews(item.id)} style={{ padding: '0.5rem', borderRadius: '8px', background: '#fff1f2', color: '#e11d48', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {news.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد أخبار بعد</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
