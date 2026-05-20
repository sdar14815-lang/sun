'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FamilyNavbar from '@/components/FamilyNavbar';
import { Send, Clock, CheckCircle, MessageSquare, AlertCircle, Plus, X } from 'lucide-react';

const REQUEST_TYPES = [
  { value: 'visit',    label: '🏥 طلب زيارة',         desc: 'تحديد موعد لزيارة ذويكم في المصحة' },
  { value: 'call',     label: '📞 طلب مكالمة',         desc: 'التواصل الهاتفي مع المسؤول المناوب' },
  { value: 'report',   label: '📋 طلب تقرير طبي',      desc: 'الحصول على تقرير مفصل عن الحالة' },
  { value: 'inquiry',  label: '❓ استفسار عام',         desc: 'أي سؤال يخص البرنامج العلاجي' },
  { value: 'item',     label: '🎁 إرسال مستلزمات',     desc: 'إرسال ملابس أو أغراض شخصية' },
  { value: 'other',    label: '💬 طلب آخر',            desc: 'طلبات متنوعة خارج التصنيفات' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: 'قيد المراجعة',  color: '#d97706', bg: '#fffbeb', icon: Clock        },
  reviewed: { label: 'تمت المراجعة', color: '#2563eb', bg: '#eff6ff', icon: CheckCircle  },
  replied:  { label: 'تم الرد',       color: '#059669', bg: '#f0fdf4', icon: CheckCircle  },
  rejected: { label: 'مرفوض',         color: '#dc2626', bg: '#fef2f2', icon: AlertCircle  },
};

export default function FamilyRequestsPage() {
  const router = useRouter();
  const [profile, setProfile]     = useState<any>(null);
  const [requests, setRequests]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'inquiry', message: '' });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/family/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, role, status')
        .eq('id', user.id)
        .single();

      if (!prof || prof.role !== 'family') { router.push('/family/login'); return; }
      if (prof.status !== 'active') { router.push('/family/dashboard'); return; }
      setProfile(prof);

      const { data: reqs } = await supabase
        .from('family_requests')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      setRequests(reqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const typeLabel = REQUEST_TYPES.find(t => t.value === form.type)?.label || form.type;

      const { error } = await supabase.from('family_requests').insert({
        profile_id:   user!.id,
        family_name:  profile.full_name,
        type:         form.type,
        type_label:   typeLabel,
        message:      form.message.trim(),
        status:       'pending',
      });

      if (error) throw error;

      setSuccessMsg('تم إرسال طلبك بنجاح! سيتواصل معك الفريق قريباً.');
      setShowForm(false);
      setForm({ type: 'inquiry', message: '' });
      loadData();
    } catch (err: any) {
      alert('حدث خطأ: ' + err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--fp-border)', borderTopColor: 'var(--fp-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--fp-text-muted)', fontWeight: '700' }}>جاري تحميل طلباتك...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fp-surface)', paddingBottom: '6rem' }}>
      <FamilyNavbar userName={profile?.full_name} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem)' }}>

        {/* Header */}
        <div className="fp-glass-card fp-animate fp-animate-delay-1" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderRight: '5px solid var(--fp-primary)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: '900', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} style={{ color: 'var(--fp-accent)' }} /> طلباتي والتواصل مع الإدارة
            </h1>
            <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.82rem', fontWeight: '600', marginTop: '0.2rem' }}>أرسل طلبك وسيرد عليك الفريق خلال 24 ساعة</p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setSuccessMsg(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.4rem', borderRadius: '14px',
              background: showForm ? '#f1f5f9' : 'var(--fp-primary)',
              color: showForm ? 'var(--fp-primary)' : 'white',
              border: 'none', cursor: 'pointer', fontWeight: '800',
              fontSize: '0.88rem', fontFamily: 'Cairo, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> طلب جديد</>}
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="fp-animate" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} style={{ color: '#059669', flexShrink: 0 }} />
            <span style={{ color: '#065f46', fontWeight: '700', fontSize: '0.92rem' }}>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
          </div>
        )}

        {/* New Request Form */}
        {showForm && (
          <div className="fp-glass-card fp-animate" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '2px solid var(--fp-primary)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--fp-primary)', marginBottom: '1.25rem' }}>إرسال طلب جديد</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Type Selection */}
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.88rem', color: 'var(--fp-primary)', marginBottom: '0.75rem' }}>نوع الطلب *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {REQUEST_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      style={{
                        padding: '0.75rem', borderRadius: '12px', textAlign: 'right', cursor: 'pointer',
                        border: `2px solid ${form.type === t.value ? 'var(--fp-primary)' : 'var(--fp-border)'}`,
                        background: form.type === t.value ? 'rgba(13,40,71,0.06)' : 'white',
                        transition: 'all 0.2s', fontFamily: 'Cairo, sans-serif',
                      }}>
                      <p style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--fp-primary)' }}>{t.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', marginTop: '0.2rem', fontWeight: '600' }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.88rem', color: 'var(--fp-primary)', marginBottom: '0.5rem' }}>
                  رسالتك / تفاصيل الطلب *
                </label>
                <textarea
                  required value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4} placeholder="اكتب تفاصيل طلبك هنا بوضوح..."
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '2px solid var(--fp-border)', fontFamily: 'Cairo, sans-serif', fontSize: '0.9rem', lineHeight: '1.7', resize: 'vertical', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--fp-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--fp-border)'}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', marginTop: '0.3rem', fontWeight: '600' }}>{form.message.length} / 500 حرف</p>
              </div>

              <button type="submit" disabled={submitting || !form.message.trim()} style={{
                alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.85rem 2rem', borderRadius: '14px',
                background: submitting ? '#94a3b8' : 'var(--fp-primary)',
                color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: '800', fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif',
                transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(13,40,71,0.2)',
              }}>
                <Send size={16} />
                {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.length === 0 ? (
            <div className="fp-glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <MessageSquare size={48} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--fp-primary)', fontWeight: '800', fontSize: '1rem' }}>لا توجد طلبات مسبقة</p>
              <p style={{ color: 'var(--fp-text-muted)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.4rem' }}>اضغط "طلب جديد" لإرسال استفسارك أو طلبك</p>
            </div>
          ) : (
            requests.map((req: any, idx: number) => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              const StatusIcon = s.icon;
              return (
                <div key={req.id} className="fp-glass-card fp-animate" style={{ padding: '1.25rem', borderRight: `4px solid ${s.color}`, animation: `fp-fadeIn 0.35s ease ${idx * 0.07}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--fp-primary)' }}>{req.type_label}</span>
                      <p style={{ fontSize: '0.72rem', color: 'var(--fp-text-muted)', fontWeight: '600', marginTop: '0.2rem' }}>
                        {new Date(req.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '10px', background: s.bg, border: `1px solid ${s.color}30` }}>
                      <StatusIcon size={14} style={{ color: s.color }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: s.color }}>{s.label}</span>
                    </div>
                  </div>

                  {/* Original message */}
                  <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--fp-border)', marginBottom: req.admin_reply ? '0.75rem' : 0 }}>
                    <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: '1.7', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{req.message}</p>
                  </div>

                  {/* Admin Reply */}
                  {req.admin_reply && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(13,40,71,0.04), rgba(240,165,0,0.04))', padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--fp-accent)40', marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--fp-accent)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={12} /> رد الإدارة
                      </p>
                      <p style={{ fontSize: '0.88rem', color: 'var(--fp-primary)', lineHeight: '1.7', fontWeight: '600', whiteSpace: 'pre-wrap' }}>{req.admin_reply}</p>
                      {req.replied_at && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--fp-text-muted)', fontWeight: '600', marginTop: '0.4rem' }}>
                          {new Date(req.replied_at).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
