'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Old login page — redirects to family portal
export default function OldLoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/family/login');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D2137 0%, #1B4F72 100%)',
      color: 'white',
      fontFamily: 'Cairo, sans-serif',
    }}>
      <p>جاري التحويل...</p>
    </div>
  );
}
