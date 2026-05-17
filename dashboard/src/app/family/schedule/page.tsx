'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Clock, Coffee, Dumbbell, User, Shield, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

const DAYS = [
  { id: 0, name: 'الأحد' },
  { id: 1, name: 'الاثنين' },
  { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' },
  { id: 4, name: 'الخميس' },
  { id: 5, name: 'الجمعة' },
  { id: 6, name: 'السبت' },
];

const ACTIVITY_TYPES = [
  { id: 'session',  name: 'جلسة علاجية', icon: User,     color: '#2563EB' },
  { id: 'meal',     name: 'وجبة طعام صحية',   icon: Coffee,   color: '#D97706' },
  { id: 'exercise', name: 'نشاط بدني ورياضي',   icon: Dumbbell, color: '#10B981' },
  { id: 'rest',     name: 'وقت راحة واستشفاء',    icon: Clock,    color: '#64748B' },
  { id: 'other',    name: 'أنشطة أخرى',        icon: Shield,   color: '#7C3AED' },
];

export default function FamilySchedulePage() {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [activeDay]);

  async function fetchSchedule() {
    setLoading(true);
    const { data } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('day_of_week', activeDay)
      .eq('is_active', true)
      .order('start_time');
    
    if (data) setSchedule(data);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               الخطة والجدول اليومي للمقيمين
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>متابعة تفصيلية للبرنامج والنشاط اليومي العلاجي والترفيهي</p>
          </div>
          <div className="fp-glow-icon">
            <Calendar size={22} />
          </div>
        </div>

        {/* Days Scroll */}
        <div style={{ 
          display: 'flex', 
          gap: '0.6rem', 
          overflowX: 'auto', 
          paddingBottom: '0.85rem',
          marginBottom: '2rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {DAYS.map(day => {
            const isActive = activeDay === day.id;
            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(day.id)}
                style={{
                  padding: '0.65rem 1.35rem',
                  borderRadius: '12px',
                  border: isActive ? '1px solid transparent' : '1px solid var(--fp-border)',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  backgroundColor: isActive ? 'var(--fp-primary)' : 'var(--fp-glass)',
                  color: isActive ? 'white' : 'var(--fp-text)',
                  boxShadow: isActive ? '0 8px 16px rgba(13,40,71,0.15)' : 'var(--fp-shadow-double)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.25s',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Cairo, sans-serif'
                }}
              >
                {day.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="fp-glass-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem' }}>
                <div className="fp-skeleton" style={{ width: '60px', height: '40px', borderRadius: '8px' }} />
                <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="fp-skeleton" style={{ width: '50%', height: '1rem', marginBottom: '0.5rem' }} />
                  <div className="fp-skeleton" style={{ width: '30%', height: '0.75rem' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedule.length === 0 ? (
              <div className="fp-glass-card fp-animate" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <Calendar size={48} color="#cbd5e0" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
                <h3 style={{ color: 'var(--fp-primary)', fontWeight: '800', marginBottom: '0.5rem', fontSize: '1.1rem' }}>لا توجد أنشطة مبرمجة</h3>
                <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>لم تتم جدولة أي نشاط أو حصة علاجية للمقيمين لهذا اليوم بعد.</p>
              </div>
            ) : (
              schedule.map((item, idx) => {
                const type = ACTIVITY_TYPES.find(t => t.id === item.activity_type) || ACTIVITY_TYPES[4];
                const Icon = type.icon;
                return (
                  <div key={item.id} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    borderRight: `5px solid ${type.color}`,
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ minWidth: '70px', borderLeft: '1px solid var(--fp-border)', paddingLeft: '0.5rem' }}>
                      <p style={{ fontWeight: '900', color: 'var(--fp-primary)', fontSize: '1.05rem', marginBottom: '0.1rem', fontFamily: 'monospace' }}>
                        {item.start_time.substring(0, 5)}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '700', fontFamily: 'monospace' }}>
                        {item.end_time.substring(0, 5)}
                      </p>
                    </div>

                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '10px', 
                      backgroundColor: `${type.color}12`, 
                      color: type.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${type.color}25`
                    }}>
                      <Icon size={20} />
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--fp-primary)', fontWeight: '800' }}>{item.activity_name}</h4>
                      <span style={{ fontSize: '0.72rem', color: type.color, fontWeight: '800', marginTop: '0.2rem', display: 'inline-block' }}>{type.name}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
