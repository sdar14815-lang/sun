'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

export default function FamilyMessagesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resident_id: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => { 
    loadData(); 

    // Subscribe to real-time message updates
    const channel = supabase
      .channel('realtime-family-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }
      
      // Combined Query: Fetch profile details, active family links, and linked residents in a single request
      const { data: prof } = await supabase
        .from('profiles')
        .select('*, family_links(resident_id, is_active, residents(id, full_name))')
        .eq('id', user.id)
        .single();
        
      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      if (prof.status !== 'active') { router.push('/family/dashboard'); return; }
      setProfile(prof);

      const activeLinks = prof.family_links?.filter((l: any) => l.is_active) || [];
      setResidents(activeLinks.map((l: any) => l.residents).filter(Boolean) || []);

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
        body: form.message,
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

  const statusInfo: Record<string, { label: string; color: string; bg: string; border: string }> = {
    open: { label: 'مرسلة للإدارة', color: 'var(--fp-primary)', bg: 'rgba(13, 40, 71, 0.05)', border: 'rgba(13, 40, 71, 0.12)' },
    answered: { label: 'تم الرد من الطبيب', color: 'var(--fp-accent)', bg: 'rgba(240, 165, 0, 0.05)', border: 'rgba(240, 165, 0, 0.15)' },
    closed: { label: 'مستلمة ومغلقة', color: 'var(--fp-success)', bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.15)' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--fp-surface)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="fp-skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: '700' }}>جاري تحميل المراسلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>
        
        {/* Header Widget */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               المراسلة الفورية الفعالة
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.2rem' }}>تواصل مباشر وسري وآمن مع الكادر الطبي والمشرفين على الحالة</p>
          </div>
          
          <button onClick={() => setShowForm(!showForm)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))', color: 'white', border: 'none', 
              padding: '0.65rem 1.25rem', borderRadius: '12px', 
              cursor: 'pointer', fontWeight: '800', fontSize: '0.82rem', 
              fontFamily: 'Cairo, sans-serif', boxShadow: 'var(--fp-shadow-double)',
              minHeight: '44px',
              width: 'auto',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
            <Send size={15} /> إرسال رسالة جديدة
          </button>
        </div>

        {/* Message Input Dialog */}
        {showForm && (
          <div className="fp-glass-card fp-animate" style={{ marginBottom: '1.5rem', borderRight: '5px solid var(--fp-accent)' }}>
            <h3 style={{ fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={16} style={{ color: 'var(--fp-accent)' }} /> إرسال استفسار جديد
            </h3>
            <form onSubmit={sendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--fp-primary)' }}>المقيم المرتبط بالاستفسار *</label>
                <select required value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--fp-border)', outline: 'none', fontFamily: 'Cairo, sans-serif', fontSize: '0.9rem', backgroundColor: 'white', fontWeight: '600' }}>
                  <option value="">اختر المقيم...</option>
                  {residents.map((r: any) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--fp-primary)' }}>نص الرسالة والاستفسار *</label>
                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                  placeholder="اكتب استفسارك بالتفصيل وسيقوم الأخصائي المتابع بالرد عليك في أقرب وقت..."
                  style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--fp-border)', outline: 'none', resize: 'vertical', fontFamily: 'Cairo, sans-serif', fontSize: '0.9rem', minHeight: '100px', fontWeight: '600', lineHeight: '1.7' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} 
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'white', color: 'var(--fp-primary)', border: '1px solid var(--fp-border)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: '800', minHeight: '44px', fontSize: '0.82rem', boxShadow: 'var(--fp-shadow-double)' }}>
                  إلغاء
                </button>
                <button type="submit" disabled={sending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-light))', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: '800', minHeight: '44px', fontSize: '0.82rem', boxShadow: 'var(--fp-shadow-double)' }}>
                  <Send size={15} /> {sending ? 'جاري التوجيه...' : 'إرسال الرسالة الآن'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Message Thread History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.length === 0 ? (
            <div className="fp-glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <MessageSquare size={48} color="#a0aec0" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
              <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.95rem', fontWeight: '700' }}>لا يوجد سجل مراسلات حالياً. انقر على "إرسال رسالة جديدة" للبدء.</p>
            </div>
          ) : messages.map((msg, idx) => {
            const s = statusInfo[msg.status] || statusInfo['open'];
            return (
              <div key={msg.id} className="fp-glass-card fp-animate fp-animate-delay-2" style={{ 
                borderRight: `5px solid ${s.color}`,
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color }} />
                    <span style={{ fontSize: '0.65rem', color: s.color, fontWeight: '800', backgroundColor: s.bg, padding: '0.25rem 0.6rem', borderRadius: '8px', border: `1px solid ${s.border}` }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', backgroundColor: 'white', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid var(--fp-border)', fontWeight: '600' }}>
                    {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                
                <p style={{ color: '#2d3748', lineHeight: '1.7', fontSize: '0.92rem', marginBottom: msg.reply_text ? '1.25rem' : '0', whiteSpace: 'pre-wrap', fontWeight: '600' }}>
                  {msg.body || msg.message}
                </p>
                
                {msg.reply_text && (
                  <div style={{ backgroundColor: 'white', borderRight: '4px solid var(--fp-accent)', padding: '1.25rem', borderRadius: '12px', marginTop: '1rem', border: '1px solid var(--fp-border)', borderRightWidth: '5px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--fp-accent)', fontWeight: '800', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} /> رد الإدارة والأخصائي المتابع:
                    </p>
                    <p style={{ color: '#4a5568', fontSize: '0.88rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontWeight: '600' }}>{msg.reply_text}</p>
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
