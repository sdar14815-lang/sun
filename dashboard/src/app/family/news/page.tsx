'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Newspaper, Calendar, Sparkles } from 'lucide-react';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل الأخبار...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               أخبار وإعلانات دار شمس
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>آخر الفعاليات والإعلانات والبرامج التطويرية المعتمدة في المصحة</p>
          </div>
          <div className="fp-glow-icon">
            <Newspaper size={22} />
          </div>
        </div>

        {news.length === 0 ? (
          <div className="fp-glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Newspaper size={48} color="#a0aec0" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.95rem', fontWeight: '700' }}>لا توجد أخبار أو إعلانات منشورة حالياً.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {news.map((n, idx) => (
              <div key={n.id} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
                overflow: 'hidden', 
                padding: 0,
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                {n.image_url && (
                  <div style={{ width: '100%', height: 'clamp(180px, 40vw, 260px)', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                    <img src={n.image_url} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2 style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--fp-primary)', flex: 1, minWidth: '200px' }}>
                      {n.title}
                    </h2>
                    <span style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.35rem', 
                      fontSize: '0.72rem', color: 'var(--fp-text-muted)', 
                      backgroundColor: 'white', padding: '0.25rem 0.6rem', 
                      borderRadius: '8px', border: '1px solid var(--fp-border)',
                      whiteSpace: 'nowrap',
                      fontWeight: '800'
                    }}>
                      <Calendar size={13} style={{ color: 'var(--fp-accent)' }} />
                      {new Date(n.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <p style={{ color: '#4a5568', lineHeight: '1.8', fontSize: '0.88rem', whiteSpace: 'pre-wrap', fontWeight: '600' }}>
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
