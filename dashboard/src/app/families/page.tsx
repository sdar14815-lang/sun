'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { UserPlus, Search, ShieldCheck, ShieldAlert, Link as LinkIcon, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FamiliesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFamilies();
  }, []);

  async function fetchFamilies() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          phone,
          status,
          role,
          family_links (
            resident_id,
            residents (
              full_name
            )
          )
        `)
        .eq('role', 'family');

      if (error) throw error;
      setFamilies(data || []);
    } catch (error: any) {
      console.error('Error fetching families:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      setFamilies(families.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (error: any) {
      alert('حدث خطأ أثناء تغيير الحالة');
    }
  }

  async function deleteFamily(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;
    try {
      const response = await fetch('/api/delete-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error('فشل الحذف');
      setFamilies(families.filter(f => f.id !== id));
    } catch (error) {
      alert('حدث خطأ أثناء الحذف');
    }
  }

  const filteredFamilies = families.filter(acc => 
    acc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>إدارة حسابات الأهالي</h1>
            <p>إنشاء وتدقيق حسابات دخول أهالي المقيمين</p>
          </div>
          <div className="page-header-actions">
            <Link href="/families/add" className="btn btn-primary">
              <UserPlus size={18} />
              إنشاء حساب أسرة
            </Link>
          </div>
        </header>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="ابحث باسم الأهل أو اسم المستخدم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingRight: '2.75rem' }} 
            />
            <Search size={18} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="card desktop-table" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>اسم المستخدم</th>
                      <th>المقيم المرتبط</th>
                      <th>رقم الهاتف</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFamilies.map((acc) => {
                      const linkedResidents = acc.family_links?.map((fl: any) => fl.residents?.full_name).join('، ') || 'غير مرتبط';
                      
                      return (
                        <tr key={acc.id}>
                          <td style={{ fontWeight: '600' }}>{acc.full_name}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{acc.username || '-'}</td>
                          <td>{linkedResidents}</td>
                          <td style={{ direction: 'ltr', textAlign: 'right' }}>{acc.phone || '-'}</td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: acc.status === 'active' ? 'var(--success)' : 'var(--danger)', backgroundColor: acc.status === 'active' ? '#f0fff4' : '#fff5f5', padding: '0.25rem 0.6rem', borderRadius: '20px', border: `1px solid ${acc.status === 'active' ? '#c6f6d5' : '#fed7d7'}` }}>
                              {acc.status === 'active' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{acc.status === 'active' ? 'نشط' : 'موقوف'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                              <Link href={`/families/${acc.id}/link`} style={{ padding: '0.45rem', borderRadius: '8px', background: '#e2e8f0', color: '#4a5568', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="ربط بمقيم">
                                <LinkIcon size={16} />
                              </Link>
                              <button onClick={() => toggleStatus(acc.id, acc.status)} style={{ 
                                padding: '0.45rem 0.875rem', 
                                borderRadius: '8px', 
                                background: acc.status === 'active' ? '#fff5f5' : '#f0fff4', 
                                color: acc.status === 'active' ? '#c53030' : '#2f855a',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {acc.status === 'active' ? 'إيقاف' : 'تفعيل'}
                              </button>
                              <Link href={`/families/${acc.id}/edit`} style={{ padding: '0.45rem', borderRadius: '8px', background: '#edf2f7', color: '#2b6cb0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="تعديل">
                                <Edit size={16} />
                              </Link>
                              <button onClick={() => deleteFamily(acc.id)} style={{ padding: '0.45rem', borderRadius: '8px', background: '#fff5f5', color: '#c53030', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="حذف">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFamilies.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد حسابات أهالي</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards">
              {filteredFamilies.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  لا توجد حسابات أهالي
                </div>
              ) : (
                filteredFamilies.map((acc) => {
                  const linkedResidents = acc.family_links?.map((fl: any) => fl.residents?.full_name).join('، ') || 'غير مرتبط';
                  
                  return (
                    <div key={acc.id} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>{acc.full_name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {acc.username || '-'}
                          </p>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: acc.status === 'active' ? 'var(--success)' : 'var(--danger)', backgroundColor: acc.status === 'active' ? '#f0fff4' : '#fff5f5', padding: '0.2rem 0.5rem', borderRadius: '20px', border: `1px solid ${acc.status === 'active' ? '#c6f6d5' : '#fed7d7'}`, flexShrink: 0 }}>
                          {acc.status === 'active' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{acc.status === 'active' ? 'نشط' : 'موقوف'}</span>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>المرتبط:</span>
                          <span style={{ fontWeight: '600' }}>{linkedResidents}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>الهاتف:</span>
                          <span style={{ direction: 'ltr' }}>{acc.phone || '-'}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/families/${acc.id}/link`} className="btn btn-sm" style={{ flex: 1, background: '#e2e8f0', color: '#4a5568', justifyContent: 'center' }}>
                          <LinkIcon size={15} /> ربط
                        </Link>
                        <button 
                          onClick={() => toggleStatus(acc.id, acc.status)} 
                          className="btn btn-sm"
                          style={{ 
                            flex: 1, 
                            background: acc.status === 'active' ? '#fff5f5' : '#f0fff4', 
                            color: acc.status === 'active' ? '#c53030' : '#2f855a',
                            justifyContent: 'center'
                          }}
                        >
                          {acc.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                        </button>
                        <Link href={`/families/${acc.id}/edit`} className="btn btn-sm" style={{ flex: 1, background: '#edf2f7', color: '#2b6cb0', justifyContent: 'center' }}>
                          <Edit size={15} /> تعديل
                        </Link>
                        <button 
                          onClick={() => deleteFamily(acc.id)} 
                          className="btn btn-sm"
                          style={{ flex: 1, background: '#fff5f5', color: '#c53030', justifyContent: 'center' }}
                        >
                          <Trash2 size={15} /> حذف
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <style>{`
        .desktop-table { display: block; }
        .mobile-cards  { display: none;  }
        @media (max-width: 768px) {
          .desktop-table { display: none;  }
          .mobile-cards  { display: block; }
        }
      `}</style>
    </div>
  );
}
