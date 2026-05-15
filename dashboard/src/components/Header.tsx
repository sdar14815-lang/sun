'use client';
import { useState, useEffect } from 'react';
import { Search, Bell, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="page-header" style={{ alignItems: 'center' }}>
      <div style={{ flexShrink: 0 }}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="header-widgets">
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="بحث سريع..." aria-label="بحث سريع" />
        </div>

        <div className="time-widget">
          <span>{formattedTime}</span>
          <span>{formattedDate}</span>
        </div>

        <Link href="/notifications" className="notification-bell" aria-label="الإشعارات">
          <Bell size={20} />
          <div className="notification-dot" />
        </Link>
      </div>

      <div className="page-header-actions">
        {actions}
      </div>
    </header>
  );
}
