'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { UserPlus, Search, Trash2, Shield, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'family')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setStaff(staff.filter(s => s.id !== id));
    } catch (error: any) {
      alert('حدث خطأ أثناء الحذف');
    }
  }

  const filteredStaff = staff.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>إدارة فريق العمل</h1>
            <p style={{ color: 'var(--text-muted)' }}>إدارة الأطباء، الأخصائيين، وموظفي المركز</p>
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} />
            إضافة موظف جديد
          </button>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو اسم المستخدم..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 2.5rem 0.75rem 1rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border)',
                  outline: 'none'
                }} 
              />
              <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '1rem' }}>الاسم</th>
                  <th style={{ padding: '1rem' }}>اسم المستخدم</th>
                  <th style={{ padding: '1rem' }}>الدور (Role)</th>
                  <th style={{ padding: '1rem' }}>الحالة</th>
                  <th style={{ padding: '1rem' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((person) => (
                  <tr key={person.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="var(--primary)" />
                        {person.full_name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{person.username || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        backgroundColor: person.role === 'super_admin' ? '#ebf8ff' : '#f0fff4',
                        color: person.role === 'super_admin' ? '#2b6cb0' : '#2f855a'
                      }}>
                        {person.role === 'super_admin' ? 'مدير نظام' : person.role === 'doctor' ? 'طبيب' : person.role === 'therapist' ? 'أخصائي' : 'موظف'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: person.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                        <Shield size={16} />
                        <span style={{ fontSize: '0.9rem' }}>{person.status === 'active' ? 'نشط' : 'موقوف'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleDelete(person.id)} style={{ padding: '0.5rem', borderRadius: '4px', background: '#fff5f5', color: '#c53030', border: 'none', cursor: 'pointer' }} title="حذف"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد موظفين</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
