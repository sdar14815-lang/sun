'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Clock, Coffee, Dumbbell, User, Shield, ArrowRight, Calendar } from 'lucide-react';
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
  { id: 'session',  name: 'جلسة علاجية', icon: User,     color: '#4299e1' },
  { id: 'meal',     name: 'وجبة طعام',   icon: Coffee,   color: '#ed8936' },
  { id: 'exercise', name: 'نشاط بدني',   icon: Dumbbell, color: '#48bb78' },
  { id: 'rest',     name: 'وقت راحة',    icon: Clock,    color: '#a0aec0' },
  { id: 'other',    name: 'أخرى',        icon: Shield,   color: '#805ad5' },
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
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(0.875rem, 4vw, 2rem)' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/family/dashboard" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <ArrowRight size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: '#1a365d', fontWeight: '800' }}>الجدول اليومي</h1>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>برنامج النشاط اليومي للمقيمين في المركز</p>
          </div>
        </header>

        {/* Days Scroll */}
        <div style={{ 
          display: 'flex', 
          gap: '0.6rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {DAYS.map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem',
                backgroundColor: activeDay === day.id ? '#1a365d' : 'white',
                color: activeDay === day.id ? 'white' : '#718096',
                boxShadow: activeDay === day.id ? '0 4px 12px rgba(26,54,93,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {day.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedule.length === 0 ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#a0aec0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>لا توجد أنشطة مبرمجة لهذا اليوم</p>
              </div>
            ) : (
              schedule.map((item) => {
                const type = ACTIVITY_TYPES.find(t => t.id === item.activity_type) || ACTIVITY_TYPES[4];
                const Icon = type.icon;
                return (
                  <div key={item.id} style={{ 
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    borderRight: `5px solid ${type.color}`
                  }}>
                    <div style={{ minWidth: '70px' }}>
                      <p style={{ fontWeight: '800', color: '#1a365d', fontSize: '1.1rem', marginBottom: '0.1rem' }}>
                        {item.start_time.substring(0, 5)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
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
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a365d', fontWeight: '700' }}>{item.activity_name}</h4>
                      <span style={{ fontSize: '0.75rem', color: type.color, fontWeight: '600' }}>{type.name}</span>
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
