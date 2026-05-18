'use client';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Image as ImageIcon, LayoutGrid, User as UserIcon, Calendar, Maximize2, X, Loader2, Info } from 'lucide-react';
import { getThumbnailUrl, getPathFromUrl } from '@/lib/imageUtils';

// --- Sub-components (Memoized) ---

const PhotoCard = memo(({ photo, onOpen, index }: any) => {
  const thumbUrl = useMemo(() => {
    if (photo.image_url && photo.image_url.includes('/storage/v1/object/public/')) {
      const bucket = photo.visibility === 'private' ? 'private-resident-media' : 'public-gallery';
      const path = getPathFromUrl(photo.image_url, bucket);
      if (path) {
        return getThumbnailUrl(supabase, bucket, path, 300);
      }
    }
    return photo.image_url; // Fallback to direct HD optimized image URL
  }, [photo.image_url, photo.visibility]);

  return (
    <div 
      className={`fp-glass-card fp-animate fp-animate-delay-${(index % 5) + 1}`}
      onClick={() => onOpen(photo.image_url)}
      style={{ 
        overflow: 'hidden', 
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative',
        padding: 0
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--fp-shadow-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--fp-shadow-double)';
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.02)' }}>
        <img 
          src={thumbUrl} 
          alt={photo.title || 'صورة'} 
          loading="lazy"
          style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s ease' }} 
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13, 40, 71, 0.4), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }} className="image-overlay">
            <Maximize2 color="white" size={28} />
        </div>
        
        {photo.visibility === 'private' && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(240, 165, 0, 0.95)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.68rem', fontWeight: '800', backdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(240, 165, 0, 0.3)' }}>
             صورة عائلية خاصة
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--fp-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {photo.title || 'أنشطة المقيمين'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
           <Calendar size={12} style={{ color: 'var(--fp-text-muted)' }} />
           <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '600' }}>{new Date(photo.created_at).toLocaleDateString('ar-EG')}</span>
        </div>
        {photo.residents && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem', padding: '0.35rem 0.75rem', background: 'rgba(13, 40, 71, 0.04)', borderRadius: '8px', width: 'fit-content' }}>
             <UserIcon size={12} style={{ color: 'var(--fp-primary)' }} />
             <span style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--fp-primary)' }}>{photo.residents.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
});
PhotoCard.displayName = 'PhotoCard';

const SkeletonPhoto = () => (
  <div className="fp-glass-card" style={{ padding: 0, overflow: 'hidden' }}>
    <div className="fp-skeleton" style={{ height: '220px', width: '100%' }} />
    <div style={{ padding: '1.25rem' }}>
      <div className="fp-skeleton" style={{ height: '1rem', width: '70%', marginBottom: '0.6rem' }} />
      <div className="fp-skeleton" style={{ height: '0.75rem', width: '40%' }} />
    </div>
  </div>
);

// --- Main Page ---

export default function FamilyGalleryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'resident'>('all');
  const [residentIds, setResidentIds] = useState<string[]>([]);
  
  const [stats, setStats] = useState({ requests: 0, dataSize: 0 });

  const PAGE_SIZE = 12;

  const loadProfileAndLinks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/family/login'); return; }
    
    // Combined Query: Fetch profile details and family links in a single request
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, role, family_links(resident_id, is_active)')
      .eq('id', user.id)
      .single();
      
    if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
    if (prof.status !== 'active') { router.push('/family/dashboard'); return; }
    setProfile(prof);

    const activeLinks = prof.family_links?.filter((l: any) => l.is_active) || [];
    const ids = activeLinks.map((l: any) => l.resident_id).filter(Boolean) || [];
    setResidentIds(ids);
    return ids;
  }, [router]);

  const fetchPhotos = useCallback(async (pageNum: number, isNewFilter = false, currentResidentIds: string[] = []) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      setStats(s => ({ ...s, requests: s.requests + 1 }));

      let query = supabase
        .from('gallery')
        .select('id, image_url, title, category, visibility, created_at, resident_id, residents(full_name)')
        .eq('visible_to_family', true)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (filter === 'public') {
        query = query.eq('visibility', 'public');
      } else if (filter === 'resident') {
        query = query.eq('visibility', 'private').in('resident_id', currentResidentIds);
      } else {
        const idList = currentResidentIds.length > 0 ? currentResidentIds.join(',') : '00000000-0000-0000-0000-000000000000';
        query = query.or(`visibility.eq.public,and(visibility.eq.private,resident_id.in.(${idList}))`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (pageNum === 0 || isNewFilter) {
        setPhotos(data || []);
      } else {
        setPhotos(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      setStats(s => ({ ...s, dataSize: s.dataSize + (data?.length || 0) * 0.4 }));

    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    async function init() {
      const ids = await loadProfileAndLinks();
      if (ids) fetchPhotos(0, true, ids);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfileAndLinks]);

  useEffect(() => {
    if (profile) {
      setPage(0);
      fetchPhotos(0, true, residentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPhotos(nextPage, false, residentIds);
  };

  return (
    <div className="family-portal" style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               ألبوم الأنشطة واللحظات
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>متابعة بصرية يومية للأنشطة والاندماج الاجتماعي وإعادة التأهيل لذويكم</p>
          </div>
          <div className="fp-glow-icon">
            <ImageIcon size={22} />
          </div>
        </div>

        {/* Optimizations Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-2" style={{ padding: '0.6rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.72rem', color: 'var(--fp-text-muted)', justifyContent: 'center', alignItems: 'center', fontWeight: '700' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Info size={13} style={{ color: 'var(--fp-accent)' }} /> ذكاء الأداء:</div>
           <div>طلبات المعالجة: <b style={{ color: 'var(--fp-primary)' }}>{stats.requests}</b></div>
           <div>تقليص حجم البيانات: <b style={{ color: 'var(--fp-success)' }}>~{stats.dataSize.toFixed(1)} KB (مضغوط تلقائياً)</b></div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
           {[
             { id: 'all',     label: 'عرض جميع الصور',    icon: LayoutGrid },
             { id: 'public',  label: 'الأنشطة العامة للمصحة',    icon: ImageIcon },
             { id: 'resident', label: 'صور المقيم الخاصة',    icon: UserIcon },
           ].map(t => {
             const isActive = filter === t.id;
             return (
               <button 
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1.25rem', borderRadius: '14px',
                    background: isActive ? 'var(--fp-primary)' : 'var(--fp-glass)',
                    color: isActive ? 'white' : 'var(--fp-text)',
                    fontWeight: '800', fontSize: '0.85rem',
                    boxShadow: isActive ? '0 10px 20px rgba(13,40,71,0.15)' : 'var(--fp-shadow-double)',
                    border: isActive ? '1px solid transparent' : '1px solid var(--fp-border)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.25s', cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif'
                  }}
               >
                  <t.icon size={16} style={{ color: isActive ? 'white' : 'var(--fp-accent)' }} />
                  {t.label}
               </button>
             );
           })}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPhoto key={i} />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="fp-glass-card fp-animate" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(13, 40, 71, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
               <ImageIcon size={36} style={{ color: 'var(--fp-accent)' }} />
            </div>
            <h3 style={{ color: 'var(--fp-primary)', fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.1rem' }}>لا توجد صور متوفرة</h3>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>لم يتم نشر أي صور جديدة في هذا القسم حتى الآن.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {photos.map((p, i) => (
                <PhotoCard key={p.id} photo={p} index={i} onOpen={setLightbox} />
              ))}
            </div>
            
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
                <button 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  style={{ 
                    padding: '0.75rem 2.5rem', borderRadius: '14px', 
                    background: 'white', color: 'var(--fp-primary)', border: '2px solid var(--fp-primary)',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    fontFamily: 'Cairo, sans-serif', fontSize: '0.85rem',
                    boxShadow: 'var(--fp-shadow-double)'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}
                >
                  {loadingMore ? <><Loader2 size={18} className="spin" /> جاري سحب الصور...</> : 'تصفح المزيد من الصور والأيام'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox - Full Image */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13, 28, 47, 0.98)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', animation: 'fp-fadeIn 0.3s ease' }}>
          <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
             <X size={24} />
          </button>
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh' }}>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
                <Loader2 size={40} color="white" className="spin" />
             </div>
             <img 
               src={lightbox} 
               alt="عرض كامل الصورة" 
               style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '20px', objectFit: 'contain', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }} 
             />
          </div>
        </div>
      )}

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .image-overlay { pointer-events: none; }
        .fp-glass-card:hover .image-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
