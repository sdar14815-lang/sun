'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Newspaper, Calendar } from 'lucide-react';

export default function FamilyNewsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      const { data } = await supabase
        .from('news')
        .select('*')
        .eq('published', true)
        .order('sort_order')
        .order('created_at', { ascending: false });
      setNews(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#718096', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: '800', color: '#1a365d', marginBottom: '0.25rem' }}>الأخبار والإعلانات</h1>
          <p style={{ color: '#718096', fontSize: '0.9rem' }}>آخر الأخبار والإعلانات من دار شمس التعافي</p>
        </div>

        {news.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Newspaper size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ color: '#718096', fontSize: '0.95rem' }}>لا توجد أخبار منشورة حالياً</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {news.map(n => (
              <div key={n.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #edf2f7'
              }}>
                {n.image_url && (
                  <div style={{ width: '100%', height: 'clamp(180px, 40vw, 260px)', position: 'relative' }}>
                    <img src={n.image_url} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 'clamp(1rem, 4vw, 1.75rem)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={{ fontWeight: '700', fontSize: 'clamp(1rem, 3vw, 1.15rem)', color: '#1a365d', flex: 1, minWidth: '200px' }}>
                      {n.title}
                    </h2>
                    <span style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.35rem', 
                      fontSize: '0.75rem', color: '#718096', 
                      backgroundColor: '#f7fafc', padding: '0.25rem 0.6rem', 
                      borderRadius: '8px', border: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap' 
                    }}>
                      <Calendar size={13} />
                      {new Date(n.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {n.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
