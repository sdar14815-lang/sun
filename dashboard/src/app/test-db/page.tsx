'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestDbPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  async function runTests() {
    const testResults = [];
    
    const tables = [
      'profiles',
      'branches',
      'rooms',
      'residents',
      'family_links',
      'resident_updates',
      'weekly_reports',
      'sessions_attendance',
      'news',
      'gallery',
      'messages',
      'notifications',
      'settings',
      'audit_logs'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          testResults.push({ table, status: 'Error', message: error.message });
        } else {
          testResults.push({ table, status: 'Success', message: 'Table exists and is accessible' });
        }
      } catch (err: any) {
        testResults.push({ table, status: 'Exception', message: err.message });
      }
    }

    setResults(testResults);
    setLoading(false);
  }

  return (
    <div style={{ padding: '2rem', direction: 'ltr', fontFamily: 'monospace' }}>
      <h1>Database Functions Test Report</h1>
      {loading ? (
        <p>Running tests...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem', border: '1px solid #d1d5db' }}>Table / Function</th>
              <th style={{ padding: '0.5rem', border: '1px solid #d1d5db' }}>Status</th>
              <th style={{ padding: '0.5rem', border: '1px solid #d1d5db' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ backgroundColor: r.status === 'Success' ? '#dcfce7' : '#fee2e2' }}>
                <td style={{ padding: '0.5rem', border: '1px solid #d1d5db', fontWeight: 'bold' }}>{r.table}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #d1d5db' }}>{r.status}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #d1d5db' }}>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div id="test-complete" style={{ display: loading ? 'none' : 'block', marginTop: '2rem' }}>
        <p>TEST COMPLETE</p>
      </div>
    </div>
  );
}
