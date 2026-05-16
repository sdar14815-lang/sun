'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Plus, Image as ImageIcon, Trash2, Loader2, ExternalLink, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GalleryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'general', resident_id: '', visible_to_family: true, is_public: true });
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [galRes, resRes] = await Promise.all([
      supabase.from('gallery').select('*, residents(full_name)').order('created_at', { ascending: false }),
      supabase.from('residents').select('id, full_name').eq('is_active', true).order('full_name'),
    ]);
    setImages(galRes.data || []);
    setResidents(resRes.data || []);
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { alert('يرجى اختيار صورة'); return; }
    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${uploadForm.category}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public-gallery').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('public-gallery').getPublicUrl(filePath);

      const insertData: any = {
        image_url: publicUrl,
        title: uploadForm.title || selectedFile.name,
        category: uploadForm.category,
        visible_to_family: uploadForm.visible_to_family,
        visibility: uploadForm.is_public ? 'public' : 'private',
      };
      if (uploadForm.category === 'resident' && uploadForm.resident_id) {
        insertData.resident_id = uploadForm.resident_id;
      }

      const { error: dbError } = await supabase.from('gallery').insert(insertData);
      if (dbError) throw dbError;

      setShowForm(false);
      setSelectedFile(null);
      setUploadForm({ title: '', category: 'general', resident_id: '', visible_to_family: true, is_public: true });
      fetchAll();
    } catch (error: any) {
      alert('خطأ: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleVisibility(id: string, current: boolean) {
    const { error } = await supabase.from('gallery').update({ visible_to_family: !current }).eq('id', id);
    if (!error) setImages(images.map(img => img.id === id ? { ...img, visible_to_family: !current } : img));
  }

  async function deleteImage(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة نهائياً؟ سيتم حذف الملف أيضاً من السيرفر.')) return;
    
    try {
      // 1. Find the image to get its URL
      const imgToDelete = images.find(img => img.id === id);
      if (!imgToDelete) return;

      // 2. Extract the file path from the public URL
      // The URL looks like: .../storage/v1/object/public/public-gallery/category/filename.jpg
      const urlParts = imgToDelete.image_url.split('public-gallery/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // 3. Delete from Supabase Storage
        const { error: storageError } = await supabase.storage.from('public-gallery').remove([filePath]);
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // We continue to delete from DB even if storage fails, or we can choose to stop.
          // Usually, it's better to clean up the DB if the user wants it gone.
        }
      }

      // 4. Delete from Database
      const { error: dbError } = await supabase.from('gallery').delete().eq('id', id);
      if (dbError) throw dbError;

      // 5. Update local state
      setImages(images.filter(img => img.id !== id));
    } catch (error: any) {
      alert('حدث خطأ أثناء الحذف: ' + error.message);
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    general: 'عامة', facility: 'مرافق', activity: 'نشاطات', resident: 'مقيم'
  };

  const filtered = filterType === 'all' ? images : images.filter(img => img.category === filterType);

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>معرض الصور</h1>
            <p style={{ color: 'var(--text-muted)' }}>إدارة الصور التي تظهر في البوابة والتطبيق</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> رفع صورة جديدة
          </button>
        </header>

        {/* Upload Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem' }}>رفع صورة جديدة</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>اختر الصورة *</label>
                  <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>العنوان</label>
                  <input type="text" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="عنوان الصورة" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>نوع الصورة</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value, resident_id: '' })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                    <option value="general">عامة (تظهر للجميع)</option>
                    <option value="facility">مرافق المصحة</option>
                    <option value="activity">نشاطات</option>
                    <option value="resident">خاصة بمقيم</option>
                  </select>
                </div>
                {uploadForm.category === 'resident' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>اختر المقيم</label>
                    <select required value={uploadForm.resident_id} onChange={e => setUploadForm({ ...uploadForm, resident_id: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                      <option value="">اختر المقيم...</option>
                      {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={uploadForm.visible_to_family} onChange={e => setUploadForm({ ...uploadForm, visible_to_family: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>ظاهرة في بوابة الأهل</span>
                </label>
                <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={uploadForm.is_public} onChange={e => setUploadForm({ ...uploadForm, is_public: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>صورة عامة (تظهر للجميع)</span>
                </label>
                {!uploadForm.is_public && <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>(ستكون خاصة بالمقيم المختار فقط)</span>}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', background: '#e2e8f0', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جاري الرفع...</> : 'رفع الصورة'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['all', 'general', 'facility', 'activity', 'resident'].map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                borderColor: filterType === type ? 'var(--primary)' : 'var(--border)',
                backgroundColor: filterType === type ? 'var(--primary)' : 'white',
                color: filterType === type ? 'white' : 'var(--text-muted)' }}>
              {type === 'all' ? `الكل (${images.length})` : `${TYPE_LABELS[type]} (${images.filter(i => i.category === type).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>جاري تحميل المعرض...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(img => (
              <div key={img.id} className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative', opacity: img.visible_to_family ? 1 : 0.6, marginBottom: 0 }}>
                {!img.visible_to_family && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#c53030', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', zIndex: 1 }}>
                    مخفية
                  </div>
                )}
                <img src={img.image_url} alt={img.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>{img.title || 'بدون عنوان'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', backgroundColor: '#e2e8f0', color: 'var(--primary)', fontWeight: '600' }}>
                        {TYPE_LABELS[img.category] || img.category}
                      </span>
                      {img.category === 'resident' && img.residents && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{img.residents.full_name}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => toggleVisibility(img.id, img.visible_to_family)} style={{ padding: '0.4rem', borderRadius: '6px', background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: img.visible_to_family ? '#2f855a' : '#c53030' }}>
                        {img.visible_to_family ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <a href={img.image_url} target="_blank" rel="noreferrer" style={{ padding: '0.4rem', borderRadius: '6px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex' }}>
                        <ExternalLink size={15} />
                      </a>
                      <button onClick={() => deleteImage(img.id)} style={{ padding: '0.4rem', borderRadius: '6px', background: '#fff5f5', border: '1px solid #fed7d7', cursor: 'pointer', color: '#c53030' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} />
                <p>لا توجد صور في هذا القسم</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
