'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { MessageSquare, Send } from 'lucide-react';

export default function FamilyMessagesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resident_id: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      setProfile(prof);

      const { data: links } = await supabase.from('family_links').select('resident_id, residents(id, full_name)').eq('family_user_id', user.id).eq('is_active', true);
      setResidents(links?.map(l => l.residents).filter(Boolean) || []);

      const { data: msgs } = await supabase.from('messages').select('*').eq('family_user_id', user.id).order('created_at', { ascending: false });
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('messages').insert({
        family_user_id: user?.id,
        resident_id: form.resident_id || null,
        message: form.message,
        status: 'open',
        sender_id: user?.id,
      });
      if (error) throw error;
      setShowForm(false);
      setForm({ resident_id: '', message: '' });
      loadData();
    } catch (e: any) { 
      alert('حدث خطأ: ' + e.message); 
    } finally { 
      setSending(false); 
    }
  }

  const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'مرسلة', color: '#2b6cb0', bg: '#ebf8ff' },
    answered: { label: 'تم الرد', color: '#6b46c1', bg: '#faf5ff' },
    closed: { label: 'مغلقة', color: '#2f855a', bg: '#f0fff4' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#718096', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', paddingBottom: '3rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: '800', color: '#1a365d', marginBottom: '0.25rem' }}>الرسائل</h1>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>تواصل مع فريق الرعاية في أي وقت</p>
          </div>
          
          <button onClick={() => setShowForm(!showForm)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: '#1a365d', color: 'white', border: 'none', 
              padding: '0.75rem 1.25rem', borderRadius: '10px', 
              cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', 
              fontFamily: 'inherit', boxShadow: '0 4px 10px rgba(26,54,93,0.2)',
              minHeight: '44px',
              width: typeof window !== 'undefined' && window.innerWidth <= 480 ? '100%' : 'auto',
              justifyContent: 'center'
            }}>
            <Send size={16} /> رسالة جديدة
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(1.25rem, 4vw, 1.75rem)', boxShadow: '0 2px 15px rgba(0,0,0,0.08)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontWeight: '700', color: '#1a365d', marginBottom: '1.25rem', fontSize: '1.05rem' }}>رسالة جديدة للإدارة</h3>
            <form onSubmit={sendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#4a5568' }}>المقيم المرتبط بالرسالة</label>
                <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', backgroundColor: 'white' }}>
                  <option value="">اختر المقيم...</option>
                  {residents.map((r: any) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#4a5568' }}>نص الرسالة</label>
                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                  placeholder="اكتب رسالتك هنا..."
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', minHeight: '100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: typeof window !== 'undefined' && window.innerWidth <= 480 ? 'column-reverse' : 'row', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} 
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: '#f1f5f9', color: '#4a5568', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', minHeight: '44px' }}>
                  إلغاء
                </button>
                <button type="submit" disabled={sending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #1a365d, #2d4a8a)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', minHeight: '44px' }}>
                  <Send size={16} /> {sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(2rem, 5vw, 3rem)', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <MessageSquare size={48} color="#a0aec0" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p style={{ color: '#718096', fontSize: '0.95rem' }}>لا توجد رسائل بعد</p>
            </div>
          ) : messages.map(msg => {
            const s = statusInfo[msg.status] || statusInfo['open'];
            return (
              <div key={msg.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: 'clamp(1.25rem, 4vw, 1.5rem)', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #edf2f7'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                    <span style={{ fontSize: '0.75rem', color: s.color, fontWeight: '700', backgroundColor: s.bg, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', backgroundColor: '#f7fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p style={{ color: '#2d3748', lineHeight: '1.7', fontSize: '0.95rem', marginBottom: msg.reply_text ? '1rem' : '0', whiteSpace: 'pre-wrap' }}>
                  {msg.body || msg.message}
                </p>
                
                {msg.reply_text && (
                  <div style={{ backgroundColor: '#faf5ff', borderRight: '4px solid #6b46c1', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b46c1', fontWeight: '700', marginBottom: '0.35rem' }}>رد الإدارة</p>
                    <p style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{msg.reply_text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
