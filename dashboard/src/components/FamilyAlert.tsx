'use client';

import { useState, useEffect } from 'react';
import { BellRing, X, Clock, ShieldCheck } from 'lucide-react';

export default function FamilyAlert() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check localStorage on client mount to prevent SSR hydration mismatch
    const isDismissed = localStorage.getItem('shams_family_alert_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    // Smooth transition before fully unmounting
    setTimeout(() => {
      localStorage.setItem('shams_family_alert_dismissed', 'true');
      setIsVisible(false);
    }, 400); // matches the transition duration
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '1rem auto 0 auto',
        padding: '0 clamp(0.875rem, 4vw, 2rem)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? 'translateY(-15px) scale(0.98)' : 'translateY(0) scale(1)',
        maxHeight: isClosing ? '0px' : '400px',
        overflow: isClosing ? 'hidden' : 'visible',
      }}
      className="fp-animate"
    >
      <div
        className="fp-glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(244, 247, 246, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
          border: '1.5px solid rgba(46, 134, 193, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 12px 30px rgba(13, 40, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          position: 'relative',
          padding: '1.5rem 2rem 1.5rem 1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          transition: 'all 0.3s ease',
          direction: 'rtl',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(13, 40, 71, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(13, 40, 71, 0.08)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        {/* Luxury glowing medical gradient sidebar */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            bottom: '0',
            width: '6px',
            background: 'linear-gradient(to bottom, #10B981, #2E86C1, #0D2847)',
            borderTopRightRadius: '24px',
            borderBottomRightRadius: '24px',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
          }}
        />

        {/* Floating pulse light details */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 8px #10B981',
            animation: 'fp-pulse 2s infinite',
          }}
        />

        {/* Pulse / Glowing Icon Wrapper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(46, 134, 193, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(46, 134, 193, 0.2)',
            color: '#2E86C1',
            flexShrink: 0,
            boxShadow: '0 8px 16px rgba(46, 134, 193, 0.08)',
          }}
        >
          <BellRing size={26} className="fp-notif-bell-icon" style={{ animation: 'bell-wiggle 3s infinite ease-in-out' }} />
        </div>

        {/* Alert Content */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: '900',
              color: '#0D2847',
              marginBottom: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            تنويه رسمي وتحديث يومي لبوابة الأهالي
            <ShieldCheck size={18} style={{ color: '#10B981' }} />
          </h3>
          
          <p
            style={{
              fontSize: '0.9rem',
              color: '#475569',
              lineHeight: '1.7',
              fontWeight: '600',
              marginBottom: '0.75rem',
              fontFamily: 'Tajawal, Cairo, sans-serif',
            }}
          >
            نفيد السادة الزوار وأهالي المقيمين بمنصة دار شمس التعافي أنه يتم تحديث بيانات وتقارير البوابة بشكل يومي في المواعيد التالية:
          </p>

          {/* Time Slots Layout */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '0.85rem',
            }}
          >
            {[
              { time: 'الساعة 12:00 مساءً', desc: 'تحديث مؤشرات التقدم والنشاط' },
              { time: 'الساعة 1:00 ظهراً', desc: 'تحديث التقارير والحالة السلوكية الطبية' },
            ].map((slot, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(46, 134, 193, 0.04)',
                  border: '1px solid rgba(46, 134, 193, 0.1)',
                  borderRadius: '12px',
                  padding: '0.6rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flex: '1 1 200px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(46, 134, 193, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(46, 134, 193, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(46, 134, 193, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(46, 134, 193, 0.1)';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F0A500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0D2847' }}>{slot.time}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600', marginTop: '0.1rem' }}>{slot.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: '0.8rem',
              color: '#64748B',
              lineHeight: '1.6',
              fontWeight: '700',
              fontStyle: 'italic',
              fontFamily: 'Tajawal, Cairo, sans-serif',
              borderRight: '3px solid #F0A500',
              paddingRight: '0.5rem',
            }}
          >
            وذلك حرصًا منا على توفير متابعة مستمرة ودقيقة لحالة أبنائكم داخل دار شمس التعافي.
          </p>
        </div>

        {/* Interactive close button */}
        <button
          onClick={handleDismiss}
          aria-label="إغلاق التنبيه"
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.03)',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            border: 'none',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EF4444';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes bell-wiggle {
          0%, 100% { transform: rotate(0); }
          5% { transform: rotate(10deg); }
          10% { transform: rotate(-8deg); }
          15% { transform: rotate(6deg); }
          20% { transform: rotate(-4deg); }
          25% { transform: rotate(2deg); }
          30% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
}
