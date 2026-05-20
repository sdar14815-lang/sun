'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  Send, 
  Mail, 
  X, 
  Heart, 
  Clock, 
  Award, 
  ChevronRight, 
  Compass, 
  Activity, 
  BookOpen,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface Leaf {
  id: number;
  text: string;
  x: number;
  y: number;
  scale: number;
  date: string;
}

interface Letter {
  id: string | number;
  content: string;
  sender: string;
  date: string;
  status: string;
  reply_image_url?: string;
}

export default function FamilyHealingCorner({ resident }: { resident?: any }) {
  const [activeTab, setActiveTab] = useState<'tree' | 'mailbox' | 'resonance'>('tree');

  // Listen to tab search parameter changes from navbar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'tree' || tab === 'mailbox' || tab === 'resonance') {
        setActiveTab(tab as any);
        
        setTimeout(() => {
          const element = document.getElementById('family-healing-corner-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, []);

  // ── 1. Healing Tree States ──
  const [leaves, setLeaves] = useState<Leaf[]>([
    { id: 1, text: "الله يشفيك يا بني وترجع لنا بألف سلامة", x: 120, y: 70, scale: 1, date: "17-05-2026" },
    { id: 2, text: "فخورين جداً بالتزامك وقوتك اليومية 💪", x: 180, y: 55, scale: 1, date: "18-05-2026" },
    { id: 3, text: "كل يوم يمر يقربنا منك أكثر يا غالي", x: 80, y: 90, scale: 1.1, date: "19-05-2026" },
  ]);
  const [newPrayer, setNewPrayer] = useState('');
  const [watering, setWatering] = useState(false);
  const [treeMessage, setTreeMessage] = useState<string | null>(null);

  // ── 2. Empathy Mailbox States ──
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [newLetterContent, setNewLetterContent] = useState('');
  const [letters, setLetters] = useState<Letter[]>([
    { id: 1, content: "السلام عليكم يا بني الحبيب، أود أن أطمئنك أن الجميع هنا بخير وندعو لك في كل صلاة. إخوتك يرسلون لك سلاماً حاراً وينتظرون عودتك بشوق. استمر في التزامك يا بطل.", sender: "الوالد والوالدة", date: "15-05-2026", status: "تم التسليم يدوياً" },
  ]);
  const [showMailSuccess, setShowMailSuccess] = useState(false);

  // ── 3. Resonance Board States ──
  const [resonanceState, setResonanceState] = useState<'calm' | 'active' | 'spiritual'>('calm');

  // ── Sync database state dynamically if resident is loaded ──
  useEffect(() => {
    if (resident?.resonance_state) {
      setResonanceState(resident.resonance_state as any);
    }
  }, [resident?.resonance_state]);

  useEffect(() => {
    if (resident?.id) {
      fetchLetters();
    }
  }, [resident?.id]);

  async function fetchLetters() {
    try {
      const { data, error } = await supabase
        .from('empathy_letters')
        .select('*')
        .eq('resident_id', resident.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setLetters(data.map((l: any) => ({
          id: l.id,
          content: l.content,
          sender: l.sender_name || 'العائلة',
          date: new Date(l.created_at).toLocaleDateString('ar-EG'),
          status: l.status === 'delivered' ? 'تم التسليم يدوياً' : l.status === 'printing' ? 'جاري الطباعة' : 'تم الإرسال',
          reply_image_url: l.reply_image_url
        })));
      }
    } catch (e) {
      console.warn("Table empathy_letters does not exist or not fully configured yet.");
    }
  }

  // Spawning leaf animation coords helper
  const spawnLeaf = (text: string) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 60;
    const x = Math.round(150 + Math.cos(angle) * distance);
    const y = Math.round(80 + Math.sin(angle) * (distance * 0.7)); // oval canopy

    const newLeaf: Leaf = {
      id: Date.now(),
      text,
      x,
      y,
      scale: 1.1,
      date: new Date().toLocaleDateString('ar-EG'),
    };
    setLeaves(prev => [...prev, newLeaf]);
  };

  const handleWaterTree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim()) return;

    setWatering(true);
    setTreeMessage("جاري ري شجرة التعافي وبث طاقتك التشجيعية... 💧🌱");

    setTimeout(() => {
      spawnLeaf(newPrayer.trim());
      setNewPrayer('');
      setWatering(false);
      setTreeMessage("تم سقي شجرة تعافي ابنك بنجاح! نبتت ورقة ذهبية جديدة تحمل دعاءك 🍃✨");
      
      // Auto-clear message
      setTimeout(() => setTreeMessage(null), 5000);
    }, 2000);
  };

  const handleSendLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLetterContent.trim()) return;

    const content = newLetterContent.trim();
    const sender = resident?.relation === 'parent' ? 'الوالدين' : 'العائلة';

    if (resident?.id) {
      try {
        const { data, error } = await supabase
          .from('empathy_letters')
          .insert({
            resident_id: resident.id,
            sender_name: sender,
            content: content,
            status: 'sent'
          })
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          const newL: Letter = {
            id: data.id,
            content: data.content,
            sender: data.sender_name || 'العائلة',
            date: new Date(data.created_at).toLocaleDateString('ar-EG'),
            status: 'تم الإرسال',
          };
          setLetters(prev => [newL, ...prev]);
        }
      } catch (err: any) {
        console.error("Failed to save letter:", err);
        // Fallback to local state if table isn't created yet
        const localL: Letter = {
          id: Date.now(),
          content: content,
          sender: sender,
          date: new Date().toLocaleDateString('ar-EG'),
          status: 'تم الإرسال',
        };
        setLetters(prev => [localL, ...prev]);
      }
    } else {
      // Offline mock fallback
      const localL: Letter = {
        id: Date.now(),
        content: content,
        sender: sender,
        date: new Date().toLocaleDateString('ar-EG'),
        status: 'تم الإرسال',
      };
      setLetters(prev => [localL, ...prev]);
    }

    setNewLetterContent('');
    setIsMailboxOpen(false);
    setShowMailSuccess(true);
    setTimeout(() => setShowMailSuccess(false), 4500);
  };

  // Helper functions for Resonance Orb Styling
  const getOrbBackground = (state: string) => {
    if (state === 'active') {
      return 'radial-gradient(circle, rgba(249,115,22,0.85) 0%, rgba(234,88,12,0.3) 60%, rgba(251,146,60,0.05) 100%)';
    }
    if (state === 'spiritual') {
      return 'radial-gradient(circle, rgba(139,92,246,0.85) 0%, rgba(109,40,217,0.3) 60%, rgba(167,139,250,0.05) 100%)';
    }
    return 'radial-gradient(circle, rgba(20,184,166,0.85) 0%, rgba(13,148,136,0.3) 60%, rgba(45,212,191,0.05) 100%)';
  };

  const getOrbShadow = (state: string) => {
    if (state === 'active') {
      return '0 0 60px rgba(249,115,22,0.4), inset 0 0 30px rgba(255,255,255,0.6)';
    }
    if (state === 'spiritual') {
      return '0 0 60px rgba(139,92,246,0.4), inset 0 0 30px rgba(255,255,255,0.6)';
    }
    return '0 0 60px rgba(20,184,166,0.4), inset 0 0 30px rgba(255,255,255,0.6)';
  };

  const getOrbBorder = (state: string) => {
    if (state === 'active') return '1px solid rgba(251,146,60,0.4)';
    if (state === 'spiritual') return '1px solid rgba(167,139,250,0.4)';
    return '1px solid rgba(45,212,191,0.4)';
  };



  return (
    <div 
      id="family-healing-corner-section"
      className="fp-glass-card fp-animate" 
      style={{ 
        marginBottom: '2.5rem', 
        padding: '0', 
        overflow: 'hidden', 
        border: '1.5px solid rgba(46, 134, 193, 0.15)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(244, 247, 246, 0.9) 100%)',
        boxShadow: '0 20px 40px rgba(13, 40, 71, 0.08)',
        borderRadius: '24px'
      }}
    >
      <style>{`
        @keyframes orbPulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 1; filter: brightness(1.1); }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes leafFloat {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(4deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .resonance-orb-glow {
          animation: orbPulse 4s infinite ease-in-out;
        }
        .leaf-animated-item {
          animation: leafFloat 5s infinite ease-in-out;
          transition: all 0.3s ease;
        }
        .leaf-animated-item:hover {
          transform: scale(1.3);
          filter: drop-shadow(0 0 8px #D4AF37);
        }
      `}</style>

      {/* 🔮 Corner Header */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, var(--fp-primary) 0%, var(--fp-primary-dark) 100%)',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '3px solid var(--fp-accent)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: 'rgba(255,255,255,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            <Sparkles size={20} color="var(--fp-accent)" style={{ animation: 'fp-pulse 2s infinite' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: 'white', letterSpacing: '-0.2px' }}>أركان الاستشفاء والتعافي التفاعلية 🔮</h2>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.1rem', fontWeight: '600' }}>رحلة دعم مشتركة ومتابعة حسية دافئة لأبنائكم</p>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '14px', gap: '0.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { id: 'tree', label: 'شجرة الحياة 🌳' },
            { id: 'mailbox', label: 'صندوق البريد 📬' },
            { id: 'resonance', label: 'لوحة التوازن 🔮' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '900',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Tajawal, Cairo, sans-serif',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === tab.id ? 'var(--fp-accent)' : 'transparent',
                color: activeTab === tab.id ? 'var(--fp-primary)' : 'rgba(255,255,255,0.85)',
                boxShadow: activeTab === tab.id ? '0 4px 10px rgba(212,175,55,0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Viewport */}
      <div style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>

        {/* ── 1. The Healing Tree (🌳) ── */}
        {activeTab === 'tree' && (
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Tree Canvas */}
            <div style={{ flex: '1.2 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '360px', 
                  background: '#FFFFFF', 
                  borderRadius: '24px', 
                  padding: '1.5rem', 
                  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* Dynamic SVG Tree drawing */}
                <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <radialGradient id="canopyGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="70%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#047857" />
                    </radialGradient>
                    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFE082" />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Trunk */}
                  <path d="M140 190 Q150 130 150 110 T160 190 Z" fill="#7A5C33" />
                  <path d="M150 120 Q130 90 110 85" stroke="#7A5C33" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M150 115 Q170 85 190 80" stroke="#7A5C33" strokeWidth="4" fill="none" strokeLinecap="round" />
                  
                  {/* Main Canopy */}
                  <ellipse cx="150" cy="80" rx="90" ry="50" fill="url(#canopyGrad)" opacity="0.92" />
                  <ellipse cx="120" cy="70" rx="40" ry="25" fill="#10B981" opacity="0.4" />
                  <ellipse cx="180" cy="75" rx="40" ry="25" fill="#047857" opacity="0.4" />
                  
                  {/* Dynamic Leaves Rendering */}
                  {leaves.map((leaf) => (
                    <g 
                      key={leaf.id} 
                      transform={`translate(${leaf.x}, ${leaf.y}) scale(${leaf.scale})`} 
                      className="leaf-animated-item"
                    >
                      <circle cx="0" cy="0" r="10" fill="url(#goldGlow)" opacity="0.6" />
                      <path 
                        d="M0,0 Q6,-12 12,-12 Q6,0 0,0 Z" 
                        fill="#D4AF37" 
                        stroke="#FFF" 
                        strokeWidth="0.5" 
                      />
                      <title>{`"${leaf.text}" - ${leaf.date}`}</title>
                    </g>
                  ))}
                </svg>

                {/* Particle effect simulator */}
                {watering && (
                  <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', color: '#60A5FA', fontSize: '1.2rem', animation: 'fp-pulse 0.4s infinite' }}>
                    💧 🌊 💧
                  </div>
                )}
              </div>
            </div>

            {/* Tree Controls & Praying Box */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span style={{ background: '#E6FFFA', color: '#00A3C4', padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '800' }}>مشاركة عائلية تفاعلية 🌳</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--fp-primary)', marginTop: '0.5rem' }}>شجرة الحياة والتزام المتعافي</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--fp-text-muted)', marginTop: '0.4rem', lineHeight: '1.6', fontWeight: '600' }}>
                  هذه الشجرة تنبض بالحياة في حسابكم. كلما أرسلتم دعاءً أو عبارة تشجيع، أو التزم ابنكم بجلساته العلاجية، تنبت ورقة ذهبية جديدة محفورة بدعواتكم الطيبة.
                </p>
              </div>

              {/* Water the tree form */}
              <form onSubmit={handleWaterTree} style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--fp-primary)', display: 'block', marginBottom: '0.5rem' }}>اروِ الشجرة بدعاء أو كلمة حب لابنك: </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    value={newPrayer}
                    onChange={(e) => setNewPrayer(e.target.value)}
                    placeholder="مثال: الله يقويك يا بطل، فخورين بيك..."
                    disabled={watering}
                    style={{
                      flex: 1,
                      padding: '0.6rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.78rem',
                      fontFamily: 'Tajawal, Cairo, sans-serif',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newPrayer.trim() || watering}
                    style={{
                      background: 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      opacity: (!newPrayer.trim() || watering) ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    سقي الشجرة 💧
                  </button>
                </div>
              </form>

              {/* Live Feedback Message Banner */}
              {treeMessage && (
                <div style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: '#FFFDF5', border: '1px solid #FDE68A', fontSize: '0.78rem', fontWeight: '800', color: '#B45309', animation: 'fp-fadeIn 0.3s ease' }}>
                  {treeMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2. Empathy Mailbox (📬) ── */}
        {activeTab === 'mailbox' && (
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            {/* Left side: Animated Envelope */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {showMailSuccess && (
                <div 
                  style={{ 
                    padding: '0.8rem 1rem', 
                    borderRadius: '12px', 
                    fontSize: '0.82rem', 
                    background: '#E6FFFA', 
                    color: '#319795',
                    border: '1px solid #B2F5EA',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    animation: 'fp-fadeIn 0.3s ease'
                  }}
                >
                  ✓ تم إرسال رسالتك الدافئة بنجاح! جاري تسليمها للإدارة لطباعتها فوراً 📬
                </div>
              )}

              {/* Flipping Luxury Letter Container */}
              <div 
                style={{ 
                  perspective: '1000px', 
                  width: '100%', 
                  maxWidth: '300px', 
                  height: '240px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setIsMailboxOpen(true)}
              >
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'relative',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: isMailboxOpen ? 'rotateY(180deg)' : 'none',
                  }}
                >
                  {/* Envelope FRONT (Unopened envelope) */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #FFF9E6 0%, #F5E6C4 100%)',
                      border: '2px solid #D4AF37',
                      borderRadius: '16px',
                      boxShadow: '0 12px 24px rgba(212,175,55,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      padding: '1.5rem',
                      zIndex: 2,
                    }}
                  >
                    <Mail size={44} style={{ color: '#D4AF37', animation: 'fp-pulse 3s infinite' }} />
                    <h3 style={{ fontSize: '0.98rem', fontWeight: '900', color: '#0D2847', textAlign: 'center' }}>
                      صندوق بريد الاستشفاء الدافئ
                    </h3>
                    <p style={{ fontSize: '0.7rem', color: '#7A6B48', textAlign: 'center', lineHeight: '1.4', fontWeight: '600' }}>
                      اكتب رسالة تدعم ابنك في مرحلته الحالية.<br />انقر لفتح المظروف وكتابة الرسالة ✉️
                    </p>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', color: 'white', fontWeight: '900', fontSize: '0.8rem' }}>
                      شمس
                    </div>
                  </div>

                  {/* Envelope BACK (Opened letter/paper) */}
                  <div 
                    style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1.25rem',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDF2F7', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--fp-primary)' }}>📝 رسالة من القلب</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMailboxOpen(false);
                        }}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleSendLetter} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <textarea
                        value={newLetterContent}
                        onChange={(e) => setNewLetterContent(e.target.value)}
                        placeholder="أكتب رسالتك الصادقة هنا... (عن شوقكم، فخركم به، دعواتكم الصالحة)..."
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          fontSize: '0.78rem',
                          fontFamily: 'Tajawal, Cairo, sans-serif',
                          lineHeight: '1.6',
                          color: '#2D3748',
                          fontWeight: '600',
                        }}
                      />
                      <button
                        type="submit"
                        onClick={(e) => e.stopPropagation()}
                        disabled={!newLetterContent.trim()}
                        style={{
                          background: 'var(--fp-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 1rem',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          opacity: !newLetterContent.trim() ? 0.6 : 1,
                          transition: 'all 0.2s',
                          marginTop: '0.5rem'
                        }}
                      >
                        <Send size={12} /> إرسال الرسالة 📬
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </div>

            {/* Right side: Mailbox explanation & Letters history */}
            <div style={{ flex: '1.3 1 350px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--fp-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  التواصل الإنساني والرسائل المكتوبة 📬
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--fp-text-muted)', marginTop: '0.25rem', lineHeight: '1.5', fontWeight: '600' }}>
                  لأن المتعافين في المراكز يقضون أوقات علاجية بدون تشتيت الهواتف، تعد الرسائل المكتوبة بخط اليد هي أفضل وأكثر الطرق تأثيراً في تحفيزهم. اكتب رسالتك هنا، وسيقوم الكادر المعالج بطباعتها فوراً وتسليمها له يدوياً بشكل راقٍ ومحبب.
                </p>
              </div>

              {/* Letters History Log */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--fp-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  أرشيف الرسائل العائلية المرسلة وحالتها:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {letters.map((letter) => (
                    <div 
                      key={letter.id} 
                      style={{ 
                        background: 'white', 
                        border: '1px solid rgba(0,0,0,0.05)', 
                        padding: '1rem', 
                        borderRadius: '16px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.01)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #EDF2F7', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--fp-text-muted)', fontWeight: '700' }}>📅 {letter.date}</span>
                        <span 
                          style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: letter.status === 'تم التسليم يدوياً' ? '#E6FFFA' : letter.status === 'جاري الطباعة' ? '#FFFDF5' : '#EBF8FF', 
                            color: letter.status === 'تم التسليم يدوياً' ? '#059669' : letter.status === 'جاري الطباعة' ? '#D97706' : '#2563EB',
                            border: `1px solid ${letter.status === 'تم التسليم يدوياً' ? '#A7F3D0' : letter.status === 'جاري الطباعة' ? '#FDE68A' : '#BFDBFE'}`,
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '8px', 
                            fontWeight: '800' 
                          }}
                        >
                          {letter.status}
                        </span>
                      </div>
                      <p 
                        style={{ 
                          fontSize: '0.78rem', 
                          color: '#4A5568', 
                          lineHeight: '1.6', 
                          fontWeight: '600',
                          fontStyle: 'italic',
                          fontFamily: 'Tajawal, Cairo, sans-serif' 
                        }}
                      >
                        "{letter.content}"
                      </p>
                      {/* Check if there is a handwritten reply image from resident */}
                      {letter.reply_image_url && (
                        <div style={{ marginTop: '0.75rem', background: '#F0FFF4', border: '1px solid #C6F6D5', padding: '0.5rem 0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#276749', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Heart size={12} color="#059669" /> وصلكم رد مكتوب بخط يده! 💌
                          </span>
                          <a href={letter.reply_image_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '900', textDecoration: 'underline' }}>
                            عرض صورة الرسالة 📷
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── 3. Resonance Board (🔮) ── */}
        {activeTab === 'resonance' && (
          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Left side: Beautiful Glowing Generative Orb */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                className="resonance-orb-glow"
                style={{ 
                  width: '220px', 
                  height: '220px', 
                  borderRadius: '50%',
                  background: getOrbBackground(resonanceState),
                  boxShadow: getOrbShadow(resonanceState),
                  border: getOrbBorder(resonanceState),
                  transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: '10px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }} />
                
                <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>
                    {resonanceState === 'active' ? '🏋️‍♂️' : resonanceState === 'spiritual' ? '🕌' : '🧘‍♂️'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0D2847', fontFamily: 'Tajawal, Cairo, sans-serif' }}>
                    {resonanceState === 'active' ? 'طور النشاط والتحدي' : resonanceState === 'spiritual' ? 'الطور الروحي والقيمي' : 'طور الهدوء والسكينة'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Explanations and status info */}
            <div style={{ flex: '1.2 1 300px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ background: '#F3E8FF', color: '#7C3AED', padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '800' }}>لوحة التوازن واستشفاء الطاقة 🔮</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--fp-primary)', marginTop: '0.5rem' }}>مؤشر الحالة البلورية (Resonance)</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--fp-text-muted)', marginTop: '0.4rem', lineHeight: '1.6', fontWeight: '600' }}>
                  يقوم الفريق العلاجي والسريري برصد وتحديث حالة التركيز الفكري والطاقة الاستشفائية للمقيم دورياً. تظهر هذه البلورة متناغمة مع حالته النفسية لتعطيكم لمحة بصرية فورية ودقيقة عن نمط يومه العلاجي الحالي.
                </p>
              </div>

              {/* Status explanation boxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { id: 'calm', label: '🧘‍♂️ طور الهدوء والسكينة والتركيز العميق', desc: 'يمر المقيم الآن بفترة استرخاء فكري، تأمل هادئ، ومراجعة ذاتية للدروس السلوكية وتطوير الهدوء الداخلي.', activeBg: '#E6FFFA', activeColor: '#0D9488', activeBorder: '#2DD4BF' },
                  { id: 'active', label: '🏋️‍♂️ طور النشاط والهمة وبناء القوة البدنية', desc: 'ينخرط المقيم حالياً بفاعلية في ممارسة التمارين البدنية، والمنافسات الرياضية التثقيفية، وأعمال بناء الفريق والمسؤوليات اليومية.', activeBg: '#FFF7ED', activeColor: '#EA580C', activeBorder: '#FDBA74' },
                  { id: 'spiritual', label: '🕌 الطور الروحي وتغذية القيم الدينية', desc: 'يركز المقيم في هذا الطور على الجلسات القيمية، الصلاة، وحفظ ومراجعة الأذكار والقرآن، وترميم البوصلة الأخلاقية والروحية.', activeBg: '#F5F3FF', activeColor: '#7C3AED', activeBorder: '#C7D2FE' }
                ].map((status) => {
                  const isActive = resonanceState === status.id;
                  return (
                    <div 
                      key={status.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '16px',
                        border: '1.5px solid',
                        borderColor: isActive ? status.activeBorder : 'rgba(0,0,0,0.04)',
                        background: isActive ? status.activeBg : 'white',
                        transition: 'all 0.5s',
                        boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.02)' : 'none'
                      }}
                    >
                      <h4 style={{ fontSize: '0.82rem', fontWeight: '900', color: isActive ? status.activeColor : 'var(--fp-primary)' }}>{status.label}</h4>
                      <p style={{ fontSize: '0.74rem', color: isActive ? 'rgba(0,0,0,0.7)' : 'var(--fp-text-muted)', marginTop: '0.25rem', lineHeight: '1.5', fontWeight: '600' }}>{status.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
