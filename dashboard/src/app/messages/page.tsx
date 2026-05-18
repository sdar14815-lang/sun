'use client';
import { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from '@/components/Sidebar';
import { MessageSquare, Search, Reply, Trash2, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MessagesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyModal, setReplyModal] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    try {
      // Query safe: only existing columns + optional join
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, body, status, created_at, reply_text, replied_at,
          family_user_id, resident_id, sender_id,
          profiles!messages_family_user_id_fkey(full_name),
          residents!messages_resident_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Messages fetch error:', error.message);
        // Fallback without joins if FK names differ
        const { data: fallback } = await supabase
          .from('messages')
          .select('id, body, status, created_at, reply_text, replied_at, family_user_id, resident_id')
          .order('created_at', { ascending: false });
        setMessages(fallback || []);
        return;
      }
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('messages').update({ status: 'closed' }).eq('id', id);
    fetchMessages();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Try with reply_text column (exists after migration), fallback to just status
      const { error } = await supabase.from('messages').update({
        reply_text: replyText,
        status: 'answered',
        replied_at: new Date().toISOString(),
        replied_by: user?.id,
      }).eq('id', replyModal.id);

      if (error) {
        // Fallback if reply_text column doesn't exist yet
        await supabase.from('messages').update({ status: 'answered' }).eq('id', replyModal.id);
        alert('تم تحديث حالة الرسالة. يرجى تشغيل Migration SQL لتفعيل ميزة الردود الكاملة.');
      }
      setReplyModal(null);
      setReplyText('');
      fetchMessages();
    } catch (e: any) { alert('خطأ: ' + e.message); }
    finally { setSending(false); }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm('حذف هذه الرسالة؟')) return;
    await supabase.from('messages').delete().eq('id', id);
    fetchMessages();
  }

  const filteredMessages = messages.filter(m =>
    (m.message || m.body)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: '#ebf8ff', color: '#2b6cb0', label: 'جديدة' },
    closed: { bg: '#f0fff4', color: '#2f855a', label: 'مقروءة' },
    answered: { bg: '#faf5ff', color: '#6b46c1', label: 'تم الرد' },
  };

  return (
    <div className="dashboard-container">
      <HamburgerButton onClick={() => setSidebarOpen(v => !v)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>رسائل الأهالي</h1>
            <p style={{ color: 'var(--text-muted)' }}>صندوق الوارد — الردود تظهر مباشرة في البوابة والتطبيق</p>
          </div>
          <span style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' }}>
            {messages.filter(m => m.status === 'open').length} جديدة
          </span>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="ابحث في الرسائل..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }} />
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '1rem' }}>المرسل</th>
                  <th style={{ padding: '1rem' }}>المقيم</th>
                  <th style={{ padding: '1rem' }}>الرسالة</th>
                  <th style={{ padding: '1rem' }}>الرد</th>
                  <th style={{ padding: '1rem' }}>التاريخ</th>
                  <th style={{ padding: '1rem' }}>الحالة</th>
                  <th style={{ padding: '1rem' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(msg => {
                  const s = statusColors[msg.status] || statusColors['open'];
                  return (
                    <tr key={msg.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: msg.status === 'open' ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>{msg.profiles?.full_name || '—'}</td>
                      <td style={{ padding: '1rem' }}>{msg.residents?.full_name || '—'}</td>
                      <td style={{ padding: '1rem', maxWidth: '220px' }}>
                        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message || msg.body}</p>
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '160px' }}>
                        {msg.reply_text ? (
                          <p style={{ fontSize: '0.85rem', color: '#6b46c1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>↩ {msg.reply_text}</p>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لم يُرد</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleDateString('ar-EG')}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: s.bg, color: s.color, fontWeight: '600' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {msg.status === 'open' && (
                            <button onClick={() => markAsRead(msg.id)} style={{ padding: '0.5rem', borderRadius: '4px', background: '#edf2f7', color: '#2b6cb0', border: 'none', cursor: 'pointer' }} title="تحديد كمقروء"><CheckCircle size={15} /></button>
                          )}
                          <button onClick={() => { setReplyModal(msg); setReplyText(msg.reply_text || ''); }} style={{ padding: '0.5rem', borderRadius: '4px', background: '#faf5ff', color: '#6b46c1', border: 'none', cursor: 'pointer' }} title="رد"><Reply size={15} /></button>
                          <button onClick={() => deleteMessage(msg.id)} style={{ padding: '0.5rem', borderRadius: '4px', background: '#fff5f5', color: '#c53030', border: 'none', cursor: 'pointer' }} title="حذف"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMessages.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {loading ? 'جاري التحميل...' : 'لا توجد رسائل حالياً'}
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Reply Modal */}
        {replyModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>الرد على الرسالة</h2>
                <button onClick={() => setReplyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ backgroundColor: '#f7fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  من: <strong>{replyModal.profiles?.full_name || 'أحد الأهالي'}</strong>
                </p>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{replyModal.message || replyModal.body}</p>
              </div>
              <form onSubmit={handleReply}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>نص الرد *</label>
                <textarea required value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                  placeholder="اكتب ردك هنا... سيظهر في بوابة الأهالي والتطبيق"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: '1rem', lineHeight: '1.7' }} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setReplyModal(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#e2e8f0', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'جاري الإرسال...' : 'إرسال الرد'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
