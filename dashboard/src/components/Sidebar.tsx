'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Newspaper,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  ClipboardList,
  Bell,
  Activity,
  BarChart2,
  X,
  Menu,
  Calendar,
  LogOut,
  Tv,
  Send,
} from 'lucide-react';

const menuItems = [
  { name: 'الرئيسية',        icon: LayoutDashboard, path: '/' },
  { name: 'المقيمون',        icon: Users,           path: '/residents' },
  { name: 'الأسر والأهالي',  icon: UserPlus,        path: '/families' },
  { name: 'طلبات الأهالي 🔔', icon: Send,          path: '/requests' },
  { name: 'التقارير',        icon: ClipboardList,   path: '/reports' },
  { name: 'التحديثات اليومية', icon: Activity,      path: '/updates' },
  { name: 'الجدول اليومي',     icon: Calendar,      path: '/schedule' },
  { name: 'البث المباشر 🔴',   icon: Tv,            path: '/live' },
  { name: 'الأخبار',         icon: Newspaper,       path: '/news' },
  { name: 'معرض الصور',      icon: ImageIcon,       path: '/gallery' },
  { name: 'الرسائل',         icon: MessageSquare,   path: '/messages' },
  { name: 'الإشعارات',       icon: Bell,            path: '/notifications' },
  { name: 'فريق العمل',      icon: Users,           path: '/staff' },
  { name: 'الإحصائيات',      icon: BarChart2,       path: '/analytics' },
  { name: 'الإعدادات',       icon: Settings,        path: '/settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await supabase.auth.signOut();
      window.location.href = '/gate-islam';
    }
  };

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Trap focus / close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay${isOpen ? ' active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`sidebar${isOpen ? ' open' : ''}`}
        role="navigation"
        aria-label="القائمة الرئيسية"
      >
        {/* Header */}
        <div style={{
          padding: '0 0.5rem 1.5rem 0.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--secondary)', lineHeight: 1.3 }}>
              دار شمس التعافي
            </h2>
            <p style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: '0.2rem' }}>
              لوحة التحكم المركزية
            </p>
          </div>
          {/* Close button — visible only on mobile */}
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
            }}
            className="sidebar-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path ||
              (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.875rem',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  borderRight: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
                  transition: 'var(--transition)',
                  color: isActive ? 'var(--secondary)' : 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? '700' : '400',
                  minHeight: '44px',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '1rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              width: '100%',
              transition: 'all 0.2s',
              fontFamily: 'Cairo, sans-serif'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textAlign: 'center' }}>
            النسخة المفتوحة
          </div>
        </div>
      </div>

      {/* Sidebar close-btn visibility — only shown on mobile via CSS */}
      <style>{`
        .sidebar-close-btn { display: none; }
        @media (max-width: 768px) {
          .sidebar-close-btn { display: flex; }
        }
      `}</style>
    </>
  );
}

/* ─── Standalone HamburgerButton ───────────────────────────── */
export function HamburgerButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className="hamburger-btn"
      aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
      aria-expanded={isOpen}
    >
      {isOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  );
}
