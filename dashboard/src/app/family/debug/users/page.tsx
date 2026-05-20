'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize a direct service client to bypass RLS for debugging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcGFmbG5kbmFvbXR5Ym94c3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3MzgwOCwiZXhwIjoyMDk0MjQ5ODA4fQ.F1jwfnGtT2O2TfcVlMnEXFBBZXHSF1_GsgquAVjYVa0'
);

export default function UsersDebugPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseState();
  }, []);

  async function loadDatabaseState() {
    try {
      setLoading(true);
      setError(null);

      // Fetch Profiles
      const { data: pData, error: pErr } = await supabaseAdmin.from('profiles').select('*');
      if (pErr) throw new Error('Error fetching profiles: ' + pErr.message);
      setProfiles(pData || []);

      // Fetch Residents
      const { data: rData, error: rErr } = await supabaseAdmin.from('residents').select('*');
      if (rErr) throw new Error('Error fetching residents: ' + rErr.message);
      setResidents(rData || []);

      // Fetch Links
      const { data: lData, error: lErr } = await supabaseAdmin.from('family_links').select('*');
      if (lErr) throw new Error('Error fetching family_links: ' + lErr.message);
      setLinks(lData || []);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', direction: 'rtl', background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '1.5rem' }}>🔍 قاعدة البيانات المباشرة (أداة المطور)</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>هذه الصفحة تستخدم مفتاح الإدارة للتحقق من الحسابات المسجلة فعلياً في قاعدة البيانات لمساعدتك في الدخول.</p>

      {loading && <p>جاري تحميل البيانات...</p>}
      {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profiles Section */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }}>👤 الحسابات (Profiles)</h2>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>الاسم الكامل</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>اسم المستخدم</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>البريد الإلكتروني</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>الدور (Role)</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>الحالة (Status)</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>معرف الحساب (ID)</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>{p.full_name}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#2563eb' }}>{p.username}</td>
                      <td style={{ padding: '0.75rem' }}>{p.email}</td>
                      <td style={{ padding: '0.75rem' }}><span style={{ background: p.role === 'family' ? '#eff6ff' : '#f0fdf4', color: p.role === 'family' ? '#1e40af' : '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{p.role}</span></td>
                      <td style={{ padding: '0.75rem' }}><span style={{ background: p.status === 'active' ? '#ecfdf5' : '#fef2f2', color: p.status === 'active' ? '#065f46' : '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{p.status}</span></td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Family Links Section */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }}>🔗 الربط العائلي (Family Links)</h2>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>معرف ولي الأمر (Family ID)</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>معرف المقيم (Resident ID)</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>صلة القرابة</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>حالة الربط</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(l => (
                    <tr key={l.id || `${l.family_user_id}-${l.resident_id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.family_user_id}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.resident_id}</td>
                      <td style={{ padding: '0.75rem' }}>{l.relation}</td>
                      <td style={{ padding: '0.75rem' }}><span style={{ color: l.is_active ? 'green' : 'red' }}>{l.is_active ? 'نشط' : 'غير نشط'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Residents Section */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <h2 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }}>🏥 المقيمون (Residents)</h2>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>اسم المقيم</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>رقم الملف</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>المرحلة الحالية</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>الحالة</th>
                    <th style={{ padding: '0.75rem', border: '1px solid #cbd5e1' }}>معرف المقيم (Resident ID)</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{r.full_name}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{r.file_number}</td>
                      <td style={{ padding: '0.75rem' }}>{r.current_stage}</td>
                      <td style={{ padding: '0.75rem' }}>{r.current_status}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
