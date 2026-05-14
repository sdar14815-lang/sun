'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Image as ImageIcon } from 'lucide-react';

export default function FamilyGalleryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/family/login'); return; }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
    setProfile(prof);

    // RLS handles filtering: general visible photos + resident photos linked to family
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    setPhotos(data || []);
    setLoading(false);
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>جاري التحميل...</div>;

  return (
    <div>
      <FamilyNavbar userName={profile?.full_name} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1a365d', marginBottom: '0.5rem' }}>معرض الصور</h1>
        <p style={{ color: '#718096', marginBottom: '2rem' }}>صور من داخل دار شمس التعافي</p>

        {photos.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <ImageIcon size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: '#718096' }}>لا توجد صور متاحة حالياً</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {photos.map(p => (
              <div key={p.id} onClick={() => setLightbox(p.image_url)}
                style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                <img src={p.image_url} alt={p.title || 'صورة'} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                {p.title && <p style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600', color: '#1a365d' }}>{p.title}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}>
          <img src={lightbox} alt="صورة" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
