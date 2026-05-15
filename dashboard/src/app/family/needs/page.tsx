'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { ShoppingBag, Send, CheckCircle2, AlertCircle, User, LayoutGrid, FileText, ChevronLeft, Clock } from 'lucide-react';
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

      // Fixed: Using 'body' instead of 'content' to match schema
      const { error } = await supabase.from('notifications').insert({
        title: 'طلب احتياجات جديد',
        body: `قام ولي الأمر بطلب (${categoryLabel}) للمقيم (${residentName}): ${description}`,
        recipient_user_id: null, // Global notification for admins
        type: 'needs_request',
        metadata: { resident_id: selectedResident, category, description }
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
      <div className="family-portal" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="fp-skeleton" style={{ height: '40px', width: '200px', marginBottom: '1.5rem' }} />
          <div className="fp-skeleton-card">
            {[1, 2, 3, 4].map(i => <div key={i} className="fp-skeleton-line w-full" style={{ height: '50px', marginBottom: '1.5rem' }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <FamilyNavbar userName={userName} />
        <div className="fp-animate" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'white', borderRadius: '24px', boxShadow: 'var(--fp-shadow)' }}>
          <div className="fp-success-check" style={{ width: '80px', height: '80px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={40} color="#059669" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1B4F72', marginBottom: '1rem' }}>تم إرسال طلبك بنجاح</h1>
          <p style={{ color: '#64748B', lineHeight: '1.8', marginBottom: '2rem', fontSize: '1rem' }}>
            سيقوم فريق العمل بمراجعة طلبك والتواصل معك في حال وجود أي استفسارات. يمكنك إحضار المستلزمات في موعد الزيارة القادم.
          </p>
          <button 
            onClick={() => setSuccess(false)}
            className="fp-login-btn"
            style={{ padding: '0.875rem 2.5rem', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}
          >
            إرسال طلب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <FamilyNavbar userName={userName} />
      
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
        <div className="fp-animate" style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1B4F72', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ padding: '0.5rem', background: '#F0A50015', borderRadius: '12px', color: '#F0A500' }}>
               <ShoppingBag size={28} />
            </div>
            طلب احتياجات المقيم
          </h1>
          <p style={{ color: '#64748B', fontWeight: '500' }}>يمكنك طلب إحضار مستلزمات شخصية ليتم مراجعتها من قبل الفريق العلاجي</p>
        </div>

        <form onSubmit={handleSubmit} className="fp-animate fp-animate-delay-1" style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: 'var(--fp-shadow)' }}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', color: '#1E293B' }}>
               <User size={18} color="#F0A500" /> اختر المقيم
            </label>
            <select 
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              required
              className="fp-input"
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '2px solid #F1F5F9', fontFamily: 'inherit', background: '#F8FAFC', cursor: 'pointer' }}
            >
              {residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '700', color: '#1E293B' }}>
               <LayoutGrid size={18} color="#F0A500" /> تصنيف الطلب
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem' }}>
              {[
                { id: 'clothes', label: 'ملابس' },
                { id: 'hygiene', label: 'أدوات نظافة' },
                { id: 'books', label: 'كتب / أدوات' },
                { id: 'other', label: 'أخرى' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    border: '2px solid',
                    borderColor: category === cat.id ? '#F0A500' : '#F1F5F9',
                    backgroundColor: category === cat.id ? '#FFFBEB' : '#F8FAFC',
                    color: category === cat.id ? '#92400E' : '#64748B',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {category === cat.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F0A500' }} />}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', color: '#1E293B' }}>
               <FileText size={18} color="#F0A500" /> التفاصيل (الأنواع، الكميات، إلخ)
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="مثال: قطعتين ملابس داخلية، معجون أسنان، كتاب عن البرمجة..."
              className="fp-input"
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #F1F5F9', minHeight: '140px', fontFamily: 'inherit', resize: 'vertical', background: '#F8FAFC' }}
            />
          </div>

          <div style={{ padding: '1.25rem', background: '#FEF2F2', borderRadius: '16px', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', border: '1px solid #FEE2E2' }}>
            <AlertCircle size={22} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.9rem', color: '#991B1B', fontWeight: '700', marginBottom: '0.25rem' }}>تعليمات هامة:</p>
              <p style={{ fontSize: '0.85rem', color: '#B91C1C', lineHeight: '1.6', fontWeight: '500' }}>
                سيتم تفتيش جميع المتعلقات عند وصولها للمركز لضمان أمن وسلامة الجميع. يرجى عدم إحضار أي مواد مخالفة للوائح أو أجهزة إلكترونية غير مصرح بها.
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="fp-login-btn"
            style={{ 
              width: '100%', padding: '1.125rem', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'جاري الإرسال...' : <><Send size={20} /> إرسال الطلب للمراجعة</>}
          </button>
        </form>

        {/* Previous Requests Helper */}
        <div className="fp-animate fp-animate-delay-2" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '600' }}>
               <Clock size={14} style={{ display: 'inline', marginLeft: '0.25rem' }} /> يتم الرد على الطلبات خلال 24-48 ساعة عمل
            </p>
        </div>
      </div>
    </div>
  );
}
