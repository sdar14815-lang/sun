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
    const path = getPathFromUrl(photo.image_url, 'public-gallery');
    return path ? getThumbnailUrl(supabase, 'public-gallery', path, 400) : photo.image_url;
  }, [photo.image_url]);

  return (
    <div 
      className={`fp-animate fp-animate-delay-${(index % 5) + 1}`}
      onClick={() => onOpen(photo.image_url)}
      style={{ 
        backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', 
        boxShadow: 'var(--fp-shadow)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative', border: '1px solid #F1F5F9'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = 'var(--fp-shadow-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--fp-shadow)';
      }}
    >
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
        <img 
          src={thumbUrl} 
          alt={photo.title || 'صورة'} 
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease' }} 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }} className="image-overlay">
            <Maximize2 color="white" size={32} />
        </div>
        
        {photo.visibility === 'private' && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(240, 165, 0, 0.9)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', backdropFilter: 'blur(4px)' }}>
             صورة خاصة
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1B4F72', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {photo.title || 'صورة من المصحة'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
           <Calendar size={12} color="#94A3B8" />
           <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(photo.created_at).toLocaleDateString('ar-EG')}</span>
        </div>
        {photo.residents && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', padding: '0.4rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', width: 'fit-content' }}>
             <UserIcon size={12} color="#1B4F72" />
             <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1B4F72' }}>{photo.residents.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
});
PhotoCard.displayName = 'PhotoCard';

const SkeletonPhoto = () => (
  <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--fp-shadow)', border: '1px solid #F1F5F9' }}>
    <div className="fp-skeleton" style={{ height: '220px', width: '100%' }} />
    <div style={{ padding: '1.25rem' }}>
      <div className="fp-skeleton" style={{ height: '1.2rem', width: '80%', marginBottom: '0.8rem' }} />
      <div className="fp-skeleton" style={{ height: '0.8rem', width: '40%' }} />
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

  const PAGE_SIZE = 10;

  const loadProfileAndLinks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/family/login'); return; }
    
    const { data: prof } = await supabase.from('profiles').select('id, full_name, role').eq('id', user.id).single();
    if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
    setProfile(prof);

    const { data: links } = await supabase
      .from('family_links')
      .select('resident_id')
      .eq('family_user_id', user.id)
      .eq('is_active', true);

    const ids = links?.map(l => l.resident_id).filter(Boolean) || [];
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
        // For 'all', we need a complex filter. In Supabase, OR can be done with .or()
        // But visibility='public' OR (visibility='private' AND resident_id IN ids)
        // Simplified: we'll fetch everything that is visible_to_family and manually filter if needed, 
        // OR better: use a filter that captures most things and refine.
        // Actually, let's use the OR filter string:
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
  }, [loadProfileAndLinks, fetchPhotos]); // Fetch on mount or when loadProfileAndLinks changes (it shouldn't)

  // Re-fetch when filter changes
  useEffect(() => {
    if (profile) {
      setPage(0);
      fetchPhotos(0, true, residentIds);
    }
  }, [filter, profile, fetchPhotos, residentIds]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPhotos(nextPage, false, residentIds);
  };

  return (
    <div className="family-portal" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2.5rem)' }}>
        
        <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: '900', color: '#1B4F72', marginBottom: '0.75rem' }}>
            معرض الصور
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            مجموعة من الصور المختارة لنشاطات المصحة واللحظات الخاصة بذويكم
          </p>
        </header>

        {/* Debug Info (Only for development or if needed) */}
        <div style={{ backgroundColor: 'white', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#64748B', justifyContent: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Info size={12} /> الأداء:</div>
           <div>الطلبات: <b>{stats.requests}</b></div>
           <div>البيانات: <b>~{stats.dataSize.toFixed(1)} KB</b></div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
           {[
             { id: 'all',     label: 'الكل',    icon: LayoutGrid },
             { id: 'public',  label: 'عام',    icon: ImageIcon },
             { id: 'resident', label: 'خاص',    icon: UserIcon },
           ].map(t => (
             <button 
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.25rem', borderRadius: '12px',
                  background: filter === t.id ? '#1B4F72' : 'white',
                  color: filter === t.id ? 'white' : '#64748B',
                  fontWeight: '700', fontSize: '0.88rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: filter === t.id ? 'none' : '1px solid #E2E8F0',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}
             >
                <t.icon size={16} />
                {t.label}
             </button>
           ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPhoto key={i} />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="fp-animate" style={{ backgroundColor: 'white', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', boxShadow: 'var(--fp-shadow)' }}>
            <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
               <ImageIcon size={40} color="#94A3B8" />
            </div>
            <h3 style={{ color: '#1B4F72', fontWeight: '800', marginBottom: '0.5rem' }}>لا توجد صور</h3>
            <p style={{ color: '#94A3B8' }}>لم يتم إضافة صور في هذا القسم بعد</p>
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
                    padding: '0.8rem 2.5rem', borderRadius: '14px', 
                    background: 'white', color: '#1B4F72', border: '2px solid #1B4F72',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  {loadingMore ? <><Loader2 size={20} className="spin" /> جاري التحميل...</> : 'عرض المزيد من الصور'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox - Full Image */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13, 33, 55, 0.98)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', animation: 'fp-fadeIn 0.3s ease' }}>
          <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <X size={24} />
          </button>
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh' }}>
             {/* Loading indicator for full image */}
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
                <Loader2 size={40} color="white" className="spin" />
             </div>
             <img 
               src={lightbox} 
               alt="صورة مكبرة" 
               style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fp-scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} 
             />
          </div>
        </div>
      )}

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .image-overlay { pointer-events: none; }
        .fp-animate:hover .image-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
