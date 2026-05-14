'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sun, Home, User, FileText, Newspaper, Image, MessageSquare, Bell, LogOut, Menu, X, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { name: 'الرئيسية',  icon: Home,          path: '/family/dashboard' },
  { name: 'ملف المقيم', icon: User,         path: '/family/resident' },
  { name: 'التقارير',  icon: FileText,      path: '/family/reports' },
  { name: 'الأخبار',   icon: Newspaper,     path: '/family/news' },
  { name: 'الصور',     icon: Image,         path: '/family/gallery' },
  { name: 'الرسائل',   icon: MessageSquare, path: '/family/messages' },
  { name: 'الإشعارات', icon: Bell,          path: '/family/notifications' },
];

export default function FamilyNavbar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/family/login');
  }

  return (
    <>
      {/* ── Top Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1a365d, #2d4a8a)',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '0.5rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sun size={20} color="#D4AF37" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.3 }}>دار شمس التعافي</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.75, lineHeight: 1 }}>بوابة الأهالي</p>
          </div>
        </div>

        {/* Desktop: username + logout */}
        <div className="family-header-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          {userName && (
            <span style={{ fontSize: '0.88rem', opacity: 0.9, whiteSpace: 'nowrap' }}>
              مرحباً، {userName}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', padding: '0.5rem 0.875rem',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.85rem', fontFamily: 'inherit',
              minHeight: '40px', whiteSpace: 'nowrap',
            }}
          >
            <LogOut size={15} /> خروج
          </button>
        </div>

        {/* Mobile: hamburger */}
        <button
          className="family-header-mobile"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mobileMenuOpen}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '40px', minHeight: '40px', flexShrink: 0,
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Desktop Navigation Tabs ── */}
      <nav
        className="family-nav-desktop"
        style={{
          backgroundColor: 'white',
          borderBottom: '2px solid #e2e8f0',
          display: 'flex',
          padding: '0 1rem',
          gap: '0.125rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
        aria-label="روابط التنقل"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.75rem 1rem', textDecoration: 'none',
                color: isActive ? '#1a365d' : '#718096',
                borderBottom: isActive ? '2px solid #1a365d' : '2px solid transparent',
                fontWeight: isActive ? '700' : '500',
                whiteSpace: 'nowrap', fontSize: '0.85rem',
                transition: 'color 0.2s', marginBottom: '-2px',
                minHeight: '48px',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={15} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile Drawer Menu ── */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              zIndex: 60, backdropFilter: 'blur(2px)',
            }}
            aria-hidden="true"
          />
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: 'min(280px, 85vw)', height: '100vh',
            background: 'white', zIndex: 61,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.2)',
            overflowY: 'auto',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقل"
          >
            {/* Drawer header */}
            <div style={{
              background: 'linear-gradient(135deg, #1a365d, #2d4a8a)',
              padding: '1.25rem 1rem',
              color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '1rem' }}>دار شمس التعافي</p>
                {userName && <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.2rem' }}>مرحباً، {userName}</p>}
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '0.45rem', cursor: 'pointer' }}
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer nav items */}
            <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem 1rem', borderRadius: '10px',
                      textDecoration: 'none', marginBottom: '0.25rem',
                      background: isActive ? '#ebf4ff' : 'transparent',
                      color: isActive ? '#1a365d' : '#4a5568',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.95rem',
                      borderRight: isActive ? '3px solid #1a365d' : '3px solid transparent',
                      minHeight: '52px',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={20} color={isActive ? '#1a365d' : '#718096'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.875rem', borderRadius: '10px',
                  background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: '600',
                  minHeight: '52px',
                }}
              >
                <LogOut size={18} /> تسجيل الخروج
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .family-header-desktop { display: flex; }
        .family-header-mobile  { display: none; }
        .family-nav-desktop    { display: flex; }

        @media (max-width: 768px) {
          .family-header-desktop { display: none !important; }
          .family-header-mobile  { display: flex !important; }
          .family-nav-desktop    { display: none !important; }
        }
      `}</style>
    </>
  );
}
