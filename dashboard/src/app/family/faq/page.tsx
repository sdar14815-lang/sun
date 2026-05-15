'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FAQS = [
  {
    q: 'كيف يتم التعامل مع الانتكاسات أثناء فترة التأهيل؟',
    a: 'يتم التعامل مع الانتكاسات كجزء من عملية التعلم. فريقنا الطبي والنفسي يقوم بتقييم الحالة فوراً وتعديل الخطة العلاجية لضمان العودة للمسار الصحيح مع تقديم الدعم المكثف.'
  },
  {
    q: 'متى يمكنني إحضار ملابس جديدة أو مستلزمات شخصية؟',
    a: 'يمكن إحضار المستلزمات بعد التنسيق مع مشرف الحالة عبر صفحة "الطلبات" في البوابة، وسيتم تحديد الموعد المناسب للتسليم.'
  },
  {
    q: 'ما هي سياسة الاتصال الهاتفي مع المقيم؟',
    a: 'تختلف السياسة حسب مرحلة العلاج. عادة ما يسمح بالاتصال في مراحل متقدمة لضمان تركيز المقيم في البرنامج العلاجي الأولية. يرجى مراجعة مشرفك الخاص.'
  },
  {
    q: 'هل يمكنني زيارة المقيم في أي وقت؟',
    a: 'الزيارات محددة بمواعيد يقررها الفريق العلاجي لضمان سير البرنامج اليومي للمقيمين واستقرار حالتهم. يرجى التنسيق مع المشرف المتابع.'
  },
  {
    q: 'كيف أتابع تطور الحالة الطبية؟',
    a: 'يتم نشر تقارير أسبوعية مفصلة في قسم "التقارير" توضح التقدم السلوكي والطبي والاجتماعي.'
  }
];

export default function FAQPage() {
  const [userName, setUserName] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('full_name').eq('id', data.user.id).single()
          .then(({ data: prof }) => setUserName(prof?.full_name || ''));
      }
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar userName={userName} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <HelpCircle size={48} color="#1a365d" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a365d' }}>الأسئلة الشائعة للأهالي</h1>
          <p style={{ color: '#718096', marginTop: '0.5rem' }}>كل ما تحتاج معرفته عن رحلة التعافي في دار شمس</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'right',
                  fontFamily: 'inherit'
                }}
              >
                <span style={{ fontWeight: '700', color: '#1a365d', fontSize: '1rem' }}>{faq.q}</span>
                {openIndex === i ? <ChevronUp size={20} color="#718096" /> : <ChevronDown size={20} color="#718096" />}
              </button>
              
              {openIndex === i && (
                <div style={{ 
                  padding: '0 1.5rem 1.5rem 1.5rem', 
                  color: '#4a5568', 
                  lineHeight: '1.8',
                  fontSize: '0.95rem'
                }}>
                  <div style={{ height: '1px', background: '#edf2f7', marginBottom: '1rem' }} />
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '3rem', 
          backgroundColor: '#ebf8ff', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          textAlign: 'center',
          border: '1px solid #bee3f8'
        }}>
          <p style={{ color: '#2b6cb0', fontWeight: '600', marginBottom: '0.5rem' }}>هل لديك سؤال آخر؟</p>
          <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>يمكنك دائماً التواصل مع مشرف الحالة عبر نظام الرسائل أو الواتساب.</p>
        </div>
      </div>
    </div>
  );
}
