'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sun, Home, User, FileText, Newspaper, Image, MessageSquare, Bell, LogOut, Menu, X, Phone, MessageCircle, Info, Calendar, ChevronDown, Tv, TrendingUp, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';


// ── Desktop items (Top Tabs Bar) ──
const desktopItems = [
  { name: 'الرئيسية', icon: Home, path: '/family/dashboard' },
  { name: 'ملف المقيم', icon: User, path: '/family/resident' },
  { name: 'مسار التقدم', icon: TrendingUp, path: '/family/progress' },
  { name: 'التقارير', icon: FileText, path: '/family/reports' },
  { name: 'طلباتي', icon: Send, path: '/family/requests' },
  { name: 'الصور', icon: Image, path: '/family/gallery' },
];

// ── Dropdown items (Desktop "More" menu) ──
const dropdownItems = [
  { name: 'بث الاطمئنان اليومي 🔴', icon: Tv, path: '/family/live' },
  { name: 'جدول اليوم', icon: Calendar, path: '/family/schedule' },
  { name: 'طلب مستلزمات', icon: MessageCircle, path: '/family/needs' },
  { name: 'أخبار المصحة', icon: Newspaper, path: '/family/news' },
  { name: 'الأسئلة الشائعة', icon: Info, path: '/family/faq' },
  { name: 'الإشعارات', icon: Bell, path: '/family/notifications' },
  { name: 'إعدادات حسابي', icon: User, path: '/family/profile' },
];

// ── Mobile Bottom Navigation Bar (Core 4 items + "More" trigger) ──
const mobileBottomItems = [
  { name: 'الرئيسية', icon: Home, path: '/family/dashboard' },
  { name: 'مسار التقدم', icon: TrendingUp, path: '/family/progress' },
  { name: 'التقارير', icon: FileText, path: '/family/reports' },
  { name: 'طلباتي', icon: Send, path: '/family/requests' },
];

// ── Grouped Categories for the Mobile Side Drawer ──
const groupedCategories = [
  {
    title: '👤 ملف المقيم وحالته',
    items: [
      { name: 'الرئيسية الموحدة', icon: Home, path: '/family/dashboard' },
      { name: 'ملف المقيم الكامل', icon: User, path: '/family/resident' },
      { name: 'جدول الحصص المباشر', icon: Calendar, path: '/family/schedule' },
    ]
  },
  {
    title: '💬 التواصل والطلبات',
    items: [
      { name: 'طلباتي والتواصل مع الإدارة', icon: Send, path: '/family/requests' },
      { name: 'الرسائل والمراسلة', icon: MessageSquare, path: '/family/messages' },
      { name: 'طلبات الاحتياجات', icon: MessageCircle, path: '/family/needs' },
      { name: 'مركز التنبيهات', icon: Bell, path: '/family/notifications' },
    ]
  },
  {
    title: '📋 التقارير الطبية والمستندات',
    items: [
      { name: 'مسار التقدم التراكمي', icon: TrendingUp, path: '/family/progress' },
      { name: 'التقارير الأسبوعية', icon: FileText, path: '/family/reports' },
    ]
  },
  {
    title: '📸 مصحة شمس والمجتمع',
    items: [
      { name: 'بث الاطمئنان اليومي 🔴', icon: Tv, path: '/family/live' },
      { name: 'ألبوم صور الأنشطة', icon: Image, path: '/family/gallery' },
      { name: 'أخبار وفعاليات شمس', icon: Newspaper, path: '/family/news' },
      { name: 'الأسئلة الشائعة', icon: Info, path: '/family/faq' },
      { name: 'إعدادات حسابي', icon: User, path: '/family/profile' },
    ]
  }
];

export default function FamilyNavbar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/family/login';
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

        {/* Mobile: hamburger (Hidden - Now relies completely on Bottom Nav "المزيد") */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          style={{
            display: 'none',
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
          overflow: 'visible',
          position: 'relative',
          borderBottom: '2px solid var(--fp-border)'
        }}
      >
        {desktopItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}
              className={isActive ? 'fp-nav-active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 1.25rem', textDecoration: 'none',
                color: isActive ? 'var(--fp-primary)' : '#64748B',
                borderBottom: isActive ? '3px solid var(--fp-accent)' : '3px solid transparent',
                fontWeight: isActive ? '800' : '600',
                whiteSpace: 'nowrap', fontSize: '0.88rem',
                transition: 'all 0.2s', marginBottom: '-2px',
                minHeight: '52px',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--fp-accent)' : '#94A3B8'} />
              {item.name}
            </Link>
          );
        })}

        {/* Desktop "More" Dropdown */}
        <div
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          onMouseEnter={() => setDesktopDropdownOpen(true)}
          onMouseLeave={() => setDesktopDropdownOpen(false)}
        >
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 1.25rem', background: 'none', border: 'none',
              color: desktopDropdownOpen ? 'var(--fp-primary)' : '#64748B',
              fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer',
              minHeight: '52px', borderBottom: '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            <span>المزيد</span>
            <ChevronDown size={14} style={{ transform: desktopDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {desktopDropdownOpen && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0,
                width: '220px', background: 'white',
                borderRadius: '16px', border: '1px solid var(--fp-border)',
                boxShadow: 'var(--fp-shadow-hover)', padding: '0.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.25rem',
                zIndex: 100, animation: 'fp-fadeIn 0.2s ease',
              }}
            >
              {dropdownItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path}
                    onClick={() => setDesktopDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: '10px',
                      textDecoration: 'none', color: isActive ? 'var(--fp-primary)' : '#475569',
                      background: isActive ? 'rgba(240, 165, 0, 0.08)' : 'transparent',
                      fontWeight: isActive ? '800' : '500',
                      fontSize: '0.85rem', transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={16} color={isActive ? 'var(--fp-accent)' : '#94A3B8'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* ── Bottom Navigation (Mobile) ── */}
      <nav className="fp-bottom-nav">
        <div className="fp-bottom-nav-inner">
          {mobileBottomItems.map(item => {
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
            width: 'min(290px, 85vw)', height: '100vh',
            background: 'white', zIndex: 101,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            animation: 'fp-fadeSlideRight 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            overflowY: 'auto',
          }}
          >
            {/* Drawer header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-primary-dark))',
              padding: '1.5rem 1.25rem',
              color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '3px solid var(--fp-accent)'
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

            {/* Drawer nav items grouped by Category */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
              {groupedCategories.map((group, groupIdx) => (
                <div key={groupIdx} style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '0.75rem', fontWeight: '900', color: 'var(--fp-accent)',
                    padding: '0 0.5rem 0.5rem 0.5rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9'
                  }}>
                    {group.title}
                  </p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.85rem 1rem', borderRadius: '12px',
                            textDecoration: 'none',
                            background: isActive ? 'rgba(240, 165, 0, 0.08)' : 'transparent',
                            color: isActive ? 'var(--fp-primary)' : '#475569',
                            fontWeight: isActive ? '800' : '600',
                            fontSize: '0.9rem',
                            borderRight: isActive ? '4px solid var(--fp-accent)' : '4px solid transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Icon size={18} color={isActive ? 'var(--fp-accent)' : '#94A3B8'} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
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
