'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { ShoppingBag, Send, CheckCircle2, AlertCircle, User, LayoutGrid, FileText, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FamilyNeedsPage() {
  const [userName, setUserName] = useState('');
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [category, setCategory] = useState('clothes');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [{ data: prof }, { data: links }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          supabase.from('family_links').select('residents(id, full_name)').eq('family_user_id', user.id).eq('is_active', true)
        ]);
        setUserName(prof?.full_name || '');
        const linked = links?.map((l: any) => l.residents).filter(Boolean) || [];
        setResidents(linked);
        if (linked.length > 0) setSelectedResident(linked[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const residentName = residents.find(r => r.id === selectedResident)?.full_name || 'المقيم';
      const categoryLabel = {
        clothes: 'ملابس',
        hygiene: 'أدوات نظافة',
        books: 'كتب / أدوات',
        other: 'أخرى'
      }[category] || category;

      const { error } = await supabase.from('messages').insert({
        family_user_id: user?.id,
        resident_id: selectedResident,
        body: `[طلب احتياجات - ${categoryLabel}]: ${description}`,
        status: 'open',
        sender_id: user?.id,
      });

      if (error) throw error;
      setSuccess(true);
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً. تأكد من اتصالك بالإنترنت.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل الصفحة...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
        <FamilyNavbar userName={userName} />
        <div className="fp-glass-card fp-animate" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center' }}>
          <div className="fp-glow-icon fp-glow-icon-success" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem auto' }}>
            <CheckCircle2 size={32} color="var(--fp-success)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1rem' }}>تم توجيه طلب الاحتياجات بنجاح</h1>
          <p style={{ color: 'var(--fp-text-muted)', lineHeight: '1.8', marginBottom: '2rem', fontSize: '0.88rem', fontWeight: '600' }}>
            سيقوم فريق المتابعة والدعم بمراجعة طلبكم فوراً والموافقة عليه للتأكد من تلبية الاحتياجات المناسبة في الزيارة القادمة.
          </p>
          <button 
            onClick={() => setSuccess(false)}
            style={{ 
              padding: '0.75rem 2.5rem', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem',
              background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))', color: 'white',
              fontFamily: 'Cairo, sans-serif', boxShadow: 'var(--fp-shadow-double)'
            }}
          >
            إرسال طلب مستلزمات آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={userName} />
      
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               توفير احتياجات المقيم
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>طلب توفير مستلزمات شخصية أو كتب أو أدوات للمقيم ليتم مراجعتها طبيّاً</p>
          </div>
          <div className="fp-glow-icon">
            <ShoppingBag size={22} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.88rem' }}>
               <User size={16} style={{ color: 'var(--fp-accent)' }} /> المقيم المستهدف بالطلب *
            </label>
            <select 
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              required
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--fp-border)', fontFamily: 'Cairo, sans-serif', background: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.88rem' }}>
               <LayoutGrid size={16} style={{ color: 'var(--fp-accent)' }} /> تصنيف ونوع الاحتياجات *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {[
                { id: 'clothes', label: 'ملابس كسوة' },
                { id: 'hygiene', label: 'أدوات عناية شخصية' },
                { id: 'books', label: 'كتب وأدوات تعليمية' },
                { id: 'other', label: 'أخرى / عام' }
              ].map(cat => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '12px',
                      border: '1.5px solid',
                      borderColor: isActive ? 'var(--fp-accent)' : 'var(--fp-border)',
                      backgroundColor: isActive ? 'rgba(240, 165, 0, 0.05)' : 'white',
                      color: isActive ? 'var(--fp-accent)' : 'var(--fp-text)',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontFamily: 'Cairo, sans-serif',
                      fontSize: '0.8rem'
                    }}
                  >
                    {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--fp-accent)' }} />}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', fontWeight: '800', color: 'var(--fp-primary)', fontSize: '0.88rem' }}>
               <FileText size={16} style={{ color: 'var(--fp-accent)' }} /> تفاصيل الأغراض المطلوبة (النوع والعدد) *
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="مثال: قطعتين ملابس شتوية، معجون وفرشاة أسنان، رواية للتوعية..."
              style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--fp-border)', minHeight: '120px', fontFamily: 'Cairo, sans-serif', resize: 'vertical', background: 'white', fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.7' }}
            />
          </div>

          <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
            <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.85rem', color: '#B91C1C', fontWeight: '800', marginBottom: '0.2rem' }}>تنظيم وسياسة التفتيش والقبول:</p>
              <p style={{ fontSize: '0.78rem', color: '#C53030', lineHeight: '1.6', fontWeight: '600' }}>
                 سيتم فرز وتفتيش كافة المتعلقات الواصلة عند البوابة لضمان بيئة آمنة للتعافي. نعتذر عن قبول أي مواد تخالف الخطة العلاجية أو أجهزة ذكية بدون إذن مسبق.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              width: '100%', padding: '1rem', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))',
              fontFamily: 'Cairo, sans-serif',
              boxShadow: 'var(--fp-shadow-double)',
              opacity: submitting ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { if (!submitting) e.currentTarget.style.transform = 'none'; }}
          >
            {submitting ? 'جاري توجيه الطلب...' : <><Send size={16} /> تقديم طلب المستلزمات للمراجعة</>}
          </button>
        </form>

        {/* Previous Requests Helper */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
               <Clock size={13} style={{ color: 'var(--fp-accent)' }} /> مراجعة واعتماد الطلبات تتم في غضون 24 ساعة عمل كحد أقصى.
            </p>
        </div>
      </div>
    </div>
  );
}
