'use client';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProfileErrorPage() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/family/login';
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a365d 0%, #2d4a8a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'Cairo, sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '3rem',
        maxWidth: '480px', width: '100%', textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#fff5f5', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '2rem'
        }}>⚠️</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#c53030', marginBottom: '1rem' }}>
          حساب غير مكتمل
        </h1>
        <p style={{ color: '#4a5568', lineHeight: '1.8', marginBottom: '0.75rem' }}>
          تم التحقق من هويتك بنجاح، لكن لم يتم العثور على ملف تعريفي (Profile) مرتبط بحسابك.
        </p>
        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '2rem' }}>
          يرجى التواصل مع إدارة دار شمس التعافي لإتمام تسجيلك في النظام.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleLogout}
            style={{
              padding: '0.75rem 2rem', borderRadius: '10px',
              background: '#1a365d', color: 'white', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem'
            }}>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
