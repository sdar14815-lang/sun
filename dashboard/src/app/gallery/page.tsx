'use client';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Plus, Image as ImageIcon, Trash2, Loader2, ExternalLink, Eye, EyeOff, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateImage, cleanFileName, getPathFromUrl } from '@/lib/imageUtils';

// --- Sub-components (Memoized) ---

const GalleryItem = memo(({ img, onToggle, onDelete, typeLabels }: any) => {
  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative', opacity: img.visible_to_family ? 1 : 0.6, marginBottom: 0, transition: 'all 0.3s ease' }}>
      {!img.visible_to_family && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#c53030', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', zIndex: 1 }}>
          مخفية
        </div>
      )}
      <div style={{ backgroundColor: '#f1f5f9', height: '180px', position: 'relative' }}>
         <Image 
            src={img.image_url} 
            alt={img.title || 'صورة'} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover', transition: 'opacity 0.5s ease' }} 
            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
         />
      </div>
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.title || 'بدون عنوان'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', backgroundColor: '#e2e8f0', color: 'var(--primary)', fontWeight: '600' }}>
              {typeLabels[img.category] || img.category}
            </span>
            {img.category === 'resident' && img.residents && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{img.residents.full_name}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => onToggle(img.id, img.visible_to_family)} style={{ padding: '0.4rem', borderRadius: '6px', background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: img.visible_to_family ? '#2f855a' : '#c53030' }}>
              {img.visible_to_family ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <a href={img.image_url} target="_blank" rel="noreferrer" style={{ padding: '0.4rem', borderRadius: '6px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex' }}>
              <ExternalLink size={15} />
            </a>
            <button onClick={() => onDelete(img.id)} style={{ padding: '0.4rem', borderRadius: '6px', background: '#fff5f5', border: '1px solid #fed7d7', cursor: 'pointer', color: '#c53030' }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
GalleryItem.displayName = 'GalleryItem';

const SkeletonItem = () => (
  <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: 0 }}>
    <div className="skeleton" style={{ width: '100%', height: '180px' }} />
    <div style={{ padding: '0.875rem' }}>
      <div className="skeleton" style={{ height: '1rem', width: '70%', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: '1.5rem', width: '40%' }} />
    </div>
  </div>
);

// --- Main Page ---

export default function GalleryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'general', resident_id: '', visible_to_family: true, is_public: true });
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState('all');
  
  // Monitoring Stats
  const [stats, setStats] = useState({ requests: 0, dataSize: 0 });

  const PAGE_SIZE = 10;

  const fetchImages = useCallback(async (pageNum: number, isNewFilter = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);
      
      setStats(s => ({ ...s, requests: s.requests + 1 }));

      let query = supabase
        .from('gallery')
        .select('id, image_url, title, category, visible_to_family, visibility, created_at, resident_id, residents(full_name)')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (filterType !== 'all') {
        query = query.eq('category', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (isNewFilter || pageNum === 0) {
        setImages(data || []);
      } else {
        setImages(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      
      // Estimate data size (roughly based on image count * avg metadata)
      setStats(s => ({ ...s, dataSize: s.dataSize + (data?.length || 0) * 0.5 })); 

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterType]);

  const fetchResidents = useCallback(async () => {
    const { data } = await supabase.from('residents').select('id, full_name').eq('is_active', true).order('full_name');
    setResidents(data || []);
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  useEffect(() => {
    setPage(0);
    fetchImages(0, true);
  }, [filterType, fetchImages]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { alert('يرجى اختيار صورة'); return; }

    const validation = validateImage(selectedFile);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const fileName = cleanFileName(selectedFile.name);
      const filePath = `${uploadForm.category}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public-gallery').upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });
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
      
      // Refresh first page
      setPage(0);
      fetchImages(0, true);
    } catch (error: any) {
      alert('خطأ: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = useCallback(async (id: string, current: boolean) => {
    const { error } = await supabase.from('gallery').update({ visible_to_family: !current }).eq('id', id);
    if (!error) setImages(prev => prev.map(img => img.id === id ? { ...img, visible_to_family: !current } : img));
  }, []);

  const deleteImage = useCallback(async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة نهائياً؟')) return;
    
    try {
      const imgToDelete = images.find(img => img.id === id);
      if (!imgToDelete) return;

      const filePath = getPathFromUrl(imgToDelete.image_url, 'public-gallery');
      if (filePath) {
        await supabase.storage.from('public-gallery').remove([filePath]);
      }

      const { error: dbError } = await supabase.from('gallery').delete().eq('id', id);
      if (dbError) throw dbError;

      setImages(prev => prev.filter(img => img.id !== id));
    } catch (error: any) {
      alert('حدث خطأ أثناء الحذف: ' + error.message);
    }
  }, [images]);

  const TYPE_LABELS: Record<string, string> = useMemo(() => ({
    general: 'عامة', facility: 'مرافق', activity: 'نشاطات', resident: 'مقيم'
  }), []);

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>معرض الصور</h1>
            <p style={{ color: 'var(--text-muted)' }}>إدارة الصور بأقل استهلاك للباندويث</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus size={20} /> رفع صورة جديدة
          </button>
        </header>

        {/* Debug Panel */}
        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748B' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Info size={14} /> <b>أداء النظام:</b></div>
           <div>الصور المحملة: <b>{images.length}</b></div>
           <div>الطلبات (Requests): <b>{stats.requests}</b></div>
           <div>البيانات التقريبية: <b>{stats.dataSize.toFixed(1)} KB</b></div>
        </div>

        {/* Upload Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '1.25rem' }}>رفع صورة جديدة (WEBP/JPG &lt; 250KB)</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>اختر الملف *</label>
                  <input type="file" accept=".webp,.jpg,.jpeg" onChange={e => setSelectedFile(e.target.files?.[0] || null)}
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
                    <option value="general">عامة</option>
                    <option value="facility">مرافق</option>
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={uploadForm.visible_to_family} onChange={e => setUploadForm({ ...uploadForm, visible_to_family: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>ظاهرة للأهل</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={uploadForm.is_public} onChange={e => setUploadForm({ ...uploadForm, is_public: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>عامة للجميع</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ background: '#e2e8f0' }}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? <><Loader2 size={16} className="spin" /> جاري الرفع...</> : 'رفع الصورة'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['all', 'general', 'facility', 'activity', 'resident'].map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '2px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s',
                borderColor: filterType === type ? 'var(--primary)' : 'var(--border)',
                backgroundColor: filterType === type ? 'var(--primary)' : 'white',
                color: filterType === type ? 'white' : 'var(--text-muted)' }}>
              {type === 'all' ? 'الكل' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonItem key={i} />)}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {images.map(img => (
                <GalleryItem 
                  key={img.id} 
                  img={img} 
                  onToggle={toggleVisibility} 
                  onDelete={deleteImage} 
                  typeLabels={TYPE_LABELS} 
                />
              ))}
              {images.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                  <p>لا توجد صور</p>
                </div>
              )}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button 
                  onClick={handleLoadMore} 
                  className="btn btn-outline" 
                  disabled={loadingMore}
                  style={{ minWidth: '160px' }}
                >
                  {loadingMore ? <><Loader2 size={18} className="spin" /> جاري التحميل...</> : 'عرض المزيد'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
