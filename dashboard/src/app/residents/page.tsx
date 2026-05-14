'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const STAGE_LABELS: Record<string, string> = {
  detox: 'إزالة السموم',
  rehabilitation: 'إعادة التأهيل',
  social_reintegration: 'الاندماج الاجتماعي',
  follow_up: 'المتابعة',
};

export default function ResidentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResidents();
  }, []);

  async function fetchResidents() {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResidents(data || []);
    } catch (error: any) {
      console.error('Error fetching residents:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المقيم؟')) return;
    try {
      const { error } = await supabase.from('residents').delete().eq('id', id);
      if (error) throw error;
      setResidents(residents.filter((res) => res.id !== id));
    } catch (error: any) {
      console.error('Error deleting resident:', error.message);
      alert('حدث خطأ أثناء الحذف');
    }
  }

  const filteredResidents = residents.filter(
    (res) =>
      res.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.file_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen((v) => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* ── Header ── */}
        <header className="page-header">
          <div>
            <h1>إدارة المقيمين</h1>
            <p>عرض وإدارة بيانات المقيمين المسجلين في المصحة</p>
          </div>
          <div className="page-header-actions">
            <Link href="/residents/add" className="btn btn-primary">
              <Plus size={18} />
              إضافة مقيم جديد
            </Link>
          </div>
        </header>

        {/* ── Search ── */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="ابحث باسم المقيم أو رقم الملف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingRight: '2.75rem' }}
              aria-label="بحث عن مقيم"
            />
            <Search
              size={18}
              style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* ── Table / Cards ── */}
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card desktop-table" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>المقيم</th>
                      <th>رقم الملف</th>
                      <th>المرحلة</th>
                      <th>الحالة</th>
                      <th>تاريخ الدخول</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((res) => (
                      <tr key={res.id}>
                        <td style={{ fontWeight: '600' }}>{res.full_name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{res.file_number}</td>
                        <td>{STAGE_LABELS[res.current_stage] || res.current_stage}</td>
                        <td>
                          <span className={`badge ${res.current_status === 'stable' ? 'badge-success' : 'badge-danger'}`}>
                            {res.current_status === 'stable' ? 'مستقر' : res.current_status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {res.admission_date
                            ? new Date(res.admission_date).toLocaleDateString('ar-EG')
                            : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            <Link
                              href={`/residents/${res.id}`}
                              style={{ padding: '0.45rem', borderRadius: '8px', background: '#edf2f7', color: 'var(--primary)', display: 'inline-flex' }}
                              title="عرض"
                              aria-label={`عرض ${res.full_name}`}
                            >
                              <Eye size={16} />
                            </Link>
                            <Link
                              href={`/residents/${res.id}/edit`}
                              style={{ padding: '0.45rem', borderRadius: '8px', background: '#edf2f7', color: '#2b6cb0', display: 'inline-flex' }}
                              title="تعديل"
                              aria-label={`تعديل ${res.full_name}`}
                            >
                              <Edit size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(res.id)}
                              style={{ padding: '0.45rem', borderRadius: '8px', background: '#fff5f5', color: '#c53030', border: 'none', cursor: 'pointer', display: 'inline-flex' }}
                              title="حذف"
                              aria-label={`حذف ${res.full_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredResidents.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          لا يوجد مقيمين مطابقين للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="mobile-cards">
              {filteredResidents.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  لا يوجد مقيمين مطابقين للبحث
                </div>
              ) : (
                filteredResidents.map((res) => (
                  <div key={res.id} className="card" style={{ padding: '1rem', marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>{res.full_name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {res.file_number}
                        </p>
                      </div>
                      <span className={`badge ${res.current_status === 'stable' ? 'badge-success' : 'badge-danger'}`}>
                        {res.current_status === 'stable' ? 'مستقر' : res.current_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
                      <span>{STAGE_LABELS[res.current_stage] || res.current_stage}</span>
                      <span>
                        {res.admission_date ? new Date(res.admission_date).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/residents/${res.id}`} className="btn btn-sm" style={{ flex: 1, background: '#edf2f7', color: 'var(--primary)', justifyContent: 'center' }}>
                        <Eye size={15} /> عرض
                      </Link>
                      <Link href={`/residents/${res.id}/edit`} className="btn btn-sm" style={{ flex: 1, background: '#ebf8ff', color: '#2b6cb0', justifyContent: 'center' }}>
                        <Edit size={15} /> تعديل
                      </Link>
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="btn btn-sm btn-danger"
                        style={{ flex: 1 }}
                      >
                        <Trash2 size={15} /> حذف
                      </button>
                    </div>
                  </div>
                ))
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
