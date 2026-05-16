'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sun, Home, User, FileText, Newspaper, Image, MessageSquare, Bell, LogOut, Menu, X, Phone, MessageCircle, Info, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { name: 'الرئيسية',   icon: Home,          path: '/family/dashboard' },
  { name: 'ملف المقيم',  icon: User,          path: '/family/resident' },
  { name: 'التقارير',   icon: FileText,      path: '/family/reports' },
  { name: 'الأخبار',    icon: Newspaper,     path: '/family/news' },
  { name: 'الجدول',     icon: Calendar,      path: '/family/schedule' },
  { name: 'الرسائل',    icon: MessageSquare, path: '/family/messages' },
  { name: 'الطلبات',    icon: MessageCircle, path: '/family/needs' },
  { name: 'الإشعارات',   icon: Bell,          path: '/family/notifications' },
  { name: 'الصور',      icon: Image,         path: '/family/gallery' },
  { name: 'الأسئلة',    icon: Info,          path: '/family/faq' },
  { name: 'حسابي',      icon: User,          path: '/family/profile' },
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
      <header className="fp-navbar" style={{
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '0.5rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Sun size={22} color="#F0A500" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: '800', fontSize: '1rem', lineHeight: 1.2, fontFamily: 'Cairo' }}>دار شمس التعافي</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.8, lineHeight: 1, fontWeight: '600' }}>بوابة الأهالي</p>
          </div>
        </div>

        {/* Desktop: username + logout */}
        <div className="family-header-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
          {userName && (
            <span style={{ fontSize: '0.88rem', fontWeight: '600', opacity: 0.95, whiteSpace: 'nowrap' }}>
              مرحباً، {userName}
            </span>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', padding: '0.5rem 1rem',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: '700', fontFamily: 'Cairo',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <LogOut size={16} /> خروج
          </button>
        </div>

        {/* Mobile: hamburger (still kept for extra links if needed, or simplified) */}
        <button
          className="family-header-mobile"
          onClick={() => setMobileMenuOpen(v => !v)}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            borderRadius: '10px', padding: '0.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '40px', minHeight: '40px',
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* ── Desktop Navigation Tabs ── */}
      <nav
        className="family-nav-desktop fp-navbar-desktop"
        style={{
          display: 'flex',
          padding: '0 1.5rem',
          gap: '0.25rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}
              className={isActive ? 'fp-nav-active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 1.25rem', textDecoration: 'none',
                color: isActive ? '#1B4F72' : '#64748B',
                borderBottom: isActive ? '3px solid #F0A500' : '3px solid transparent',
                fontWeight: isActive ? '800' : '600',
                whiteSpace: 'nowrap', fontSize: '0.88rem',
                transition: 'all 0.2s', marginBottom: '-2px',
                minHeight: '52px',
              }}
            >
              <Icon size={16} color={isActive ? '#F0A500' : '#94A3B8'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Navigation (Mobile) ── */}
      <nav className="fp-bottom-nav">
        <div className="fp-bottom-nav-inner">
          {navItems.slice(0, 4).map(item => { // Take top 4 for bottom bar
             const Icon = item.icon;
             const isActive = pathname === item.path;
             return (
               <Link key={item.path} href={item.path} className={isActive ? 'active' : ''}>
                 <Icon size={22} />
                 <span>{item.name}</span>
               </Link>
             );
          })}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', 
              background: 'none', border: 'none', color: '#64748B', fontSize: '0.65rem', fontWeight: '500'
            }}
          >
            <Menu size={22} />
            <span>المزيد</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer Menu ── */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15, 33, 55, 0.7)',
              zIndex: 100, backdropFilter: 'blur(4px)',
              animation: 'fp-fadeIn 0.3s ease'
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: 'min(280px, 85vw)', height: '100vh',
            background: 'white', zIndex: 101,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            animation: 'fp-fadeSlideRight 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            overflowY: 'auto',
          }}
          >
            {/* Drawer header */}
            <div style={{
              background: 'linear-gradient(135deg, #1B4F72, #0D2137)',
              padding: '1.5rem 1.25rem',
              color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '3px solid #F0A500'
            }}>
              <div>
                <p style={{ fontWeight: '800', fontSize: '1.1rem', fontFamily: 'Cairo' }}>دار شمس التعافي</p>
                {userName && <p style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.2rem', fontWeight: '600' }}>مرحباً، {userName}</p>}
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '10px', padding: '0.5rem' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Drawer nav items */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem', borderRadius: '12px',
                      textDecoration: 'none', marginBottom: '0.5rem',
                      background: isActive ? '#F0A50010' : 'transparent',
                      color: isActive ? '#1B4F72' : '#475569',
                      fontWeight: isActive ? '800' : '600',
                      fontSize: '0.95rem',
                      borderRight: isActive ? '4px solid #F0A500' : '4px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={20} color={isActive ? '#F0A500' : '#94A3B8'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  padding: '1rem', borderRadius: '12px',
                  background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA',
                  cursor: 'pointer', fontFamily: 'Cairo', fontSize: '0.95rem', fontWeight: '800',
                }}
              >
                <LogOut size={20} /> تسجيل الخروج
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fp-fadeSlideRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
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
