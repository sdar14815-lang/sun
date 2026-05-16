'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Image as ImageIcon, LayoutGrid, User as UserIcon, Calendar, Maximize2, X } from 'lucide-react';

export default function FamilyGalleryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'resident'>('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      // 1. Get linked resident IDs
      const { data: links } = await supabase
        .from('family_links')
        .select('resident_id')
        .eq('family_user_id', user.id)
        .eq('is_active', true);

      const residentIds = links?.map(l => l.resident_id).filter(Boolean) || [];

      // 2. Fetch photos: 
      // - All visible_to_family = true
      // - (visibility = 'public' OR resident_id IN linked_ids)
      
      let query = supabase
        .from('gallery')
        .select('*, residents(full_name)')
        .eq('visible_to_family', true)
        .order('created_at', { ascending: false });

      const { data: allPhotos, error } = await query;
      
      if (error) throw error;

      // Manual filtering for complex OR logic (Supabase filters can be tricky for mixed OR/AND without complex strings)
      const filteredPhotos = (allPhotos || []).filter(p => {
        // If it's public, everyone sees it
        if (p.visibility === 'public') return true;
        // If it's private but belongs to my resident, I see it
        if (p.visibility === 'private' && residentIds.includes(p.resident_id)) return true;
        // Fallback: if category is not resident and visibility is not private, show it
        if (p.category !== 'resident' && p.visibility !== 'private') return true;
        return false;
      });

      setPhotos(filteredPhotos);
    } catch (err) {
      console.error('Error loading gallery:', err);
    } finally {
      setLoading(false);
    }
  }

  const displayedPhotos = filter === 'all' 
    ? photos 
    : filter === 'public' 
      ? photos.filter(p => p.visibility === 'public')
      : photos.filter(p => p.visibility === 'private');

  if (loading) {
    return (
      <div className="family-portal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
           <div className="spinner" style={{ marginBottom: '1rem' }} />
           <p style={{ color: '#64748B', fontWeight: '600' }}>جاري تحميل المعرض...</p>
        </div>
      </div>
    );
  }

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

        {displayedPhotos.length === 0 ? (
          <div className="fp-animate" style={{ backgroundColor: 'white', borderRadius: '24px', padding: '4rem 2rem', textAlign: 'center', boxShadow: 'var(--fp-shadow)' }}>
            <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
               <ImageIcon size={40} color="#94A3B8" />
            </div>
            <h3 style={{ color: '#1B4F72', fontWeight: '800', marginBottom: '0.5rem' }}>لا توجد صور</h3>
            <p style={{ color: '#94A3B8' }}>لم يتم إضافة صور في هذا القسم بعد</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {displayedPhotos.map((p, i) => (
              <div key={p.id} className={`fp-animate fp-animate-delay-${(i % 5) + 1}`}
                onClick={() => setLightbox(p.image_url)}
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
                }}>
                
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img src={p.image_url} alt={p.title || 'صورة'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="image-overlay">
                      <Maximize2 color="white" size={32} />
                  </div>
                  
                  {p.visibility === 'private' && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(240, 165, 0, 0.9)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', backdropFilter: 'blur(4px)' }}>
                       صورة خاصة
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1B4F72', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {p.title || 'صورة من المصحة'}
                     </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                     <Calendar size={12} color="#94A3B8" />
                     <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  {p.residents && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', padding: '0.4rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', width: 'fit-content' }}>
                       <UserIcon size={12} color="#1B4F72" />
                       <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1B4F72' }}>{p.residents.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13, 33, 55, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', animation: 'fp-fadeIn 0.3s ease' }}>
          <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer' }}>
             <X size={24} />
          </button>
          <img src={lightbox} alt="صورة مكبرة" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '16px', objectFit: 'contain', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'fp-scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        </div>
      )}

      <style jsx>{`
        .image-overlay {
          pointer-events: none;
        }
        div:hover .image-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
