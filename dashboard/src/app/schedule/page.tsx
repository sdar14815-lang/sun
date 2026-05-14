'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Plus, Trash2, Clock, Calendar, Coffee, Dumbbell, User, Shield, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export default function SchedulePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    activity_name: '',
    activity_type: 'session',
    start_time: '08:00',
    end_time: '09:00',
    day_of_week: activeDay
  });

  useEffect(() => {
    fetchSchedule();
  }, [activeDay]);

  async function fetchSchedule() {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('day_of_week', activeDay)
      .order('start_time');
    
    if (data) setSchedule(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('daily_schedules')
      .insert([{
        ...formData,
        day_of_week: activeDay
      }]);
    
    if (!error) {
      setShowAddModal(false);
      setFormData({ activity_name: '', activity_type: 'session', start_time: '08:00', end_time: '09:00', day_of_week: activeDay });
      fetchSchedule();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط؟')) return;
    const { error } = await supabase.from('daily_schedules').delete().eq('id', id);
    if (!error) fetchSchedule();
  }

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>الجدول اليومي</h1>
            <p>إدارة البرنامج اليومي للمقيمين في المركز</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            إضافة نشاط
          </button>
        </header>

        {/* Days Navigation */}
        <div className="card" style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {DAYS.map(day => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                backgroundColor: activeDay === day.id ? 'var(--primary)' : 'transparent',
                color: activeDay === day.id ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {day.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</div>
        ) : (
          <div className="schedule-timeline">
            {schedule.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                لا يوجد أنشطة مضافة لهذا اليوم
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {schedule.map((item) => {
                  const type = ACTIVITY_TYPES.find(t => t.id === item.activity_type) || ACTIVITY_TYPES[4];
                  const Icon = type.icon;
                  return (
                    <div key={item.id} className="card" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.5rem', 
                      padding: '1rem',
                      borderLeft: `4px solid ${type.color}`
                    }}>
                      <div style={{ minWidth: '100px', textAlign: 'center' }}>
                        <p style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>{item.start_time.substring(0, 5)}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إلى {item.end_time.substring(0, 5)}</p>
                      </div>
                      
                      <div style={{ 
                        width: '45px', 
                        height: '45px', 
                        borderRadius: '12px', 
                        backgroundColor: `${type.color}15`, 
                        color: type.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={24} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.activity_name}</h4>
                        <span style={{ fontSize: '0.8rem', color: type.color, fontWeight: '600' }}>{type.name}</span>
                      </div>

                      <button 
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: '0.5rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>إضافة نشاط جديد</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
              </div>
              
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>اسم النشاط</label>
                  <input required type="text" className="form-input" value={formData.activity_name} onChange={e => setFormData({...formData, activity_name: e.target.value})} placeholder="مثلاً: جلسة إرشاد جمعي" />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>نوع النشاط</label>
                  <select className="form-input" value={formData.activity_type} onChange={e => setFormData({...formData, activity_type: e.target.value})}>
                    {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>وقت البدء</label>
                    <input required type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>وقت الانتهاء</label>
                    <input required type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={18} />
                    {saving ? 'جاري الحفظ...' : 'حفظ النشاط'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
