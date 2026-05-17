'use client';
import { useState, useEffect } from 'react';
import FamilyNavbar from '@/components/FamilyNavbar';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FAQS = [
  {
    q: 'كيف يتم التعامل مع الانتكاسات أثناء فترة التأهيل؟',
    a: 'يتم التعامل مع الانتكاسات كجزء من عملية التقييم والتعلّم المستمر. يقوم الفريق الطبي والنفسي بمراجعة وتعديل الخطة العلاجية فوراً لتقديم دعم استثنائي مركّز وسريع يضمن عودة المقيم لمساره الصحيح بثبات.'
  },
  {
    q: 'متى يمكنني إحضار ملابس جديدة أو مستلزمات شخصية؟',
    a: 'يمكنكم إرسال طلب المستلزمات بكل سهولة من خلال صفحة "الاحتياجات" في هذه البوابة. بعد مراجعة وقبول الطلب من الأخصائي المتابع، ستصلكم موافقة فورية وتحديد توقيت التسليم المناسب.'
  },
  {
    q: 'ما هي سياسة التواصل الهاتفي والزيارات مع المقيم؟',
    a: 'تعتمد سياسة التواصل الهاتفي على التقدم الفعلي والمرحلة العلاجية الحالية للمقيم. تبدأ السياسة حذرة في مرحلة الانسحاب (Detox) لضمان التركيز التام، وتتوسع تدريجياً لتعزيز الروابط الأسرية في مراحل الدمج.'
  },
  {
    q: 'كيف أتابع تطور الحالة الطبية والتزام المقيم بانتظام؟',
    a: 'يتم إصدار تقارير دورية وشاملة عبر قسم "التقارير" في البوابة، وتتضمن تحديثات أسبوعية تفصيلية للجانب الطبي، النفسي، الاجتماعي ومؤشر الالتزام العام المدار مباشرة من الأطباء.'
  },
  {
    q: 'ما هو دور الأسرة في دعم رحلة الاستشفاء؟',
    a: 'دور الأسرة محوري وحاسم في مرحلة الدمج المجتمعي والمتابعة اللاحقة. نوصي بحضور الجلسات الإرشادية للأهالي وقراءة النصائح الدورية لدعم بيئة خالية من المحفزات بعد التخرج.'
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
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={userName} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               الأسئلة الشائعة والإرشادات
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>إجابات وافية عن استفساراتكم حول رحلة العلاج والتعافي بدار شمس</p>
          </div>
          <div className="fp-glow-icon">
            <HelpCircle size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
                overflow: 'hidden',
                padding: 0,
                border: isOpen ? '1px solid rgba(240, 165, 0, 0.25)' : '1px solid var(--fp-border)',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
              }}>
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : i)}
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
                    fontFamily: 'Cairo, sans-serif'
                  }}
                >
                  <span style={{ fontWeight: '900', color: isOpen ? 'var(--fp-primary)' : 'var(--fp-text)', fontSize: '0.92rem' }}>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} style={{ color: 'var(--fp-accent)' }} /> : <ChevronDown size={18} style={{ color: 'var(--fp-text-muted)' }} />}
                </button>
                
                {isOpen && (
                  <div style={{ 
                    padding: '0 1.5rem 1.5rem 1.5rem', 
                    color: '#4a5568', 
                    lineHeight: '1.8',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    animation: 'fp-fadeIn 0.25s ease'
                  }}>
                    <div style={{ height: '1px', background: 'var(--fp-border)', marginBottom: '1rem' }} />
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Support Center Banner */}
        <div className="fp-glass-card fp-animate fp-animate-delay-3" style={{ 
          marginTop: '3rem', 
          textAlign: 'center',
          borderRight: '5px solid var(--fp-accent)',
          borderLeft: '5px solid var(--fp-accent)'
        }}>
          <p style={{ color: 'var(--fp-accent)', fontWeight: '900', marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Sparkles size={16} /> هل لديكم أي استفسارات أخرى؟
          </p>
          <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.82rem', fontWeight: '700', lineHeight: 1.6 }}>
             لا تترددوا أبداً في التحدث المباشر مع أخصائي الحالة عبر بوابة <b style={{ color: 'var(--fp-primary)' }}>"المراسلات"</b>، أو التنسيق معنا هاتفياً لتقديم أفضل رعاية وتوجيه.
          </p>
        </div>
      </div>
    </div>
  );
}
