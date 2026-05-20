'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Send, RefreshCw, Filter } from 'lucide-react';

const STATUS_OPTS = [
  { value: 'all',      label: 'جميع الطلبات' },
  { value: 'pending',  label: 'قيد المراجعة'  },
  { value: 'reviewed', label: 'تمت المراجعة'  },
  { value: 'replied',  label: 'تم الرد'        },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'قيد المراجعة',  color: '#d97706', bg: '#fffbeb' },
  reviewed: { label: 'تمت المراجعة', color: '#2563eb', bg: '#eff6ff' },
  replied:  { label: 'تم الرد',       color: '#059669', bg: '#f0fdf4' },
  rejected: { label: 'مرفوض',         color: '#dc2626', bg: '#fef2f2' },
};

export default function AdminRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests]  = useState<any[]>([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState<string | null>(null);
  const [filter, setFilter]      = useState('pending');
  const [replyMap, setReplyMap]  = useState<Record<string, string>>({});
  const [sending, setSending]    = useState<Record<string, boolean>>({});

  useEffect(() => { loadRequests(); }, [filter]);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/family-requests?status=${filter}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'فشل تحميل الطلبات');
      setRequests(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(id: string) {
    const reply = replyMap[id]?.trim();
    if (!reply) return;
    setSending(s => ({ ...s, [id]: true }));
    try {
      const res = await fetch('/api/family-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_reply: reply, status: 'replied', replied_at: new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setReplyMap(m => { const n = { ...m }; delete n[id]; return n; });
      loadRequests();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
      setSending(s => ({ ...s, [id]: false }));
    }
  }

  async function markReviewed(id: string) {
    await fetch('/api/family-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'reviewed' }),
    });
    loadRequests();
  }


  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header className="page-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={26} style={{ color: 'var(--primary)' }} />
              طلبات الأهالي
              {pending > 0 && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: '0.72rem', fontWeight: '900', padding: '0.2rem 0.6rem', borderRadius: '999px', animation: 'pulse 2s infinite' }}>
                  {pending} جديد
                </span>
              )}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>استعراض طلبات الأهالي والرد عليها</p>
          </div>
          <button onClick={loadRequests} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} /> تحديث
          </button>
        </header>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
          {STATUS_OPTS.map(o => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
                cursor: 'pointer', transition: 'all 0.2s', border: '2px solid',
                borderColor: filter === o.value ? 'var(--primary)' : 'var(--border)',
                background: filter === o.value ? 'var(--primary)' : 'white',
                color: filter === o.value ? 'white' : 'var(--text-muted)',
              }}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            خطأ: {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <MessageSquare size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>لا توجد طلبات في هذا القسم</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.map((req: any) => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              return (
                <div key={req.id} className="card" style={{ padding: '1.25rem', borderRight: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)' }}>{req.family_name}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>{req.type_label}</span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: '600' }}>
                        <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '0.3rem' }} />
                        {new Date(req.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: s.color, background: s.bg, padding: '0.3rem 0.8rem', borderRadius: '10px' }}>{s.label}</span>
                      {req.status === 'pending' && (
                        <button onClick={() => markReviewed(req.id)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: '700' }}>
                          تأشير مراجعة
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontWeight: '600' }}>{req.message}</p>
                  </div>

                  {/* Existing Reply */}
                  {req.admin_reply && (
                    <div style={{ background: '#f0fdf4', padding: '0.875rem', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#059669', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={12} /> ردك على الطلب
                      </p>
                      <p style={{ fontSize: '0.88rem', color: '#065f46', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontWeight: '600' }}>{req.admin_reply}</p>
                    </div>
                  )}

                  {/* Reply Box */}
                  {req.status !== 'replied' && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <textarea
                        value={replyMap[req.id] || ''}
                        onChange={e => setReplyMap(m => ({ ...m, [req.id]: e.target.value }))}
                        rows={2} placeholder="اكتب ردك هنا..."
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)', fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem', resize: 'vertical', outline: 'none' }}
                      />
                      <button
                        onClick={() => sendReply(req.id)}
                        disabled={!replyMap[req.id]?.trim() || sending[req.id]}
                        className="btn btn-primary"
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem' }}
                      >
                        <Send size={15} />
                        {sending[req.id] ? 'إرسال...' : 'إرسال الرد'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  );
}
