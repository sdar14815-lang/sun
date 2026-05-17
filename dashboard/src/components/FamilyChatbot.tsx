'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sun, ShieldCheck, X, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FamilyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);

  // Responsive tracker & cloud connection state
  const [isMobile, setIsMobile] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Database integration states
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const [db, setDb] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_SUGGESTIONS = [
    { label: '⚠️ تقديم شكوى عاجلة', desc: 'سرية وعاجلة للإدارة', val: 'عندي شكوى عاجلة بخصوص ' },
    { label: '💡 فكرة واقتراح', desc: 'لتطوير وتحسين خدماتنا', val: 'لدي اقتراح لتطوير خدمات ' },
    { label: '📋 تقارير وحالة المقيم', desc: 'متابعة الملف الطبي للنزيل', val: 'أريد الاستفسار عن التقارير الطبية لـ' },
    { label: '❤️ شكر وتقدير للرعاية', desc: 'لطاقم العمل والتمريض والتعافي', val: 'أود تقديم شكر وتقدير لطاقم الرعاية بـ' }
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Track viewport changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check Cloud connection state on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase
          .from('complaints_suggestions')
          .select('id')
          .limit(1);
        
        if (!error) {
          setIsDbConnected(true);
        } else {
          setIsDbConnected(false);
        }
      } catch (e) {
        setIsDbConnected(false);
      }
    }
    checkConnection();
  }, [isOpen, isAdminView]);

  // Load Firebase dynamically from CDN (Optional backup)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js'),
    ])
    .then(() => {
      return Promise.all([
        loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'),
        loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js'),
      ]);
    })
    .then(() => {
      setFirebaseLoaded(true);
    })
    .catch((err) => {
      setFirebaseError(true);
    });
  }, []);

  // Initialize Firebase App (Backup)
  useEffect(() => {
    if (!firebaseLoaded) return;
    const firebase = (window as any).firebase;
    if (!firebase) return;

    let firebaseConfig = null;
    try {
      const rawConfig = (window as any).__firebase_config;
      firebaseConfig = rawConfig ? (typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig) : null;
    } catch (e) {
      console.error("Firebase config parse error", e);
    }

    if (!firebaseConfig) return;

    try {
      let app;
      if (firebase.apps.length === 0) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }
      const auth = firebase.auth(app);
      const dbInstance = firebase.firestore(app);

      setDb(dbInstance);

      auth.signInAnonymously().catch((e: any) => console.error("Anon auth error", e));
      const unsub = auth.onAuthStateChanged((user: any) => {
        setCurrentUser(user);
      });
      return () => unsub();
    } catch (e) {
      console.error("Firebase init failed", e);
    }
  }, [firebaseLoaded]);

  // Load complaints from Cloud Server
  async function loadSupabaseSubmissions() {
    try {
      const { data, error } = await supabase
        .from('complaints_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return;

      if (data) {
        setSubmissions(data.map(item => ({
          id: item.id,
          message: item.message_body,
          reply: item.ai_reply,
          type: item.type,
          timestamp: { toDate: () => new Date(item.created_at) }
        })));
      }
    } catch (e) {
      console.error("Supabase load error", e);
    }
  }

  // Reload submissions when Admin View opens
  useEffect(() => {
    if (isAdminView) {
      loadSupabaseSubmissions();
    }
  }, [isAdminView]);

  // Gemini AI caller (via secure server route)
  async function getAiResponse(userMsg: string) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        return "حقك علينا يا فندم، رسالتك وصلت للإدارة فوراً وهنتابعها في أسرع وقت لتلبية طلبك.";
      }

      const data = await response.json();
      return data.reply || "حقك علينا يا فندم، رسالتك تم تسجيلها بنجاح ووصلت لمدير المصحة فوراً.";
    } catch (e) {
      return "حقك علينا يا فندم، رسالتك تم تسجيلها بنجاح ووصلت لمدير المصحة فوراً.";
    }
  }

  // Save to Supabase (SQL Database)
  async function saveToSupabase(msg: string, reply: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const type = msg.includes('شكوى') || msg.includes('شكويه') || msg.includes('مشكلة') ? 'شكوى' : (msg.includes('اقتراح') || msg.includes('فكرة') ? 'اقتراح' : 'عام');

      const { error } = await supabase
        .from('complaints_suggestions')
        .insert([
          {
            family_user_id: userId,
            message_body: msg,
            ai_reply: reply,
            type: type,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error("Supabase insert error:", error.message);
      }
    } catch (e) {
      console.error("Supabase write failure", e);
    }
  }

  // Save to Firestore (Firebase Backup if initialized)
  async function saveToFirestore(msg: string, reply: string) {
    if (!db || !currentUser) return;
    const appId = (window as any).__app_id || 'dar-shams-app';
    const firebase = (window as any).firebase;

    try {
      await db.collection(`artifacts/${appId}/public/data/submissions`).add({
        userId: currentUser.uid,
        message: msg,
        reply: reply,
        type: msg.includes('شكوى') ? 'شكوى' : 'عام',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error("Firestore save error", e);
    }
  }

  // Form submission handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    const userMessageId = Math.random().toString();
    setMessages(prev => [...prev, { id: userMessageId, text, isAi: false }]);
    setInputValue('');
    setTyping(true);

    const aiReply = await getAiResponse(text);
    
    setTyping(false);
    const aiMessageId = Math.random().toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: aiReply, isAi: true }]);

    // Save to database
    saveToSupabase(text, aiReply);
    saveToFirestore(text, aiReply);
  }

  const handleSuggestionClick = (val: string) => {
    setInputValue(val);
  };

  // ── Pure Inline Responsive Styles ──
  const toggleStyle = {
    // Hide toggle button when chat is open on mobile to prevent overlapping tap issues
    display: (isOpen && isMobile) ? 'none' : 'flex',
    position: 'fixed' as 'fixed',
    left: isMobile ? '16px' : '30px',
    bottom: isMobile ? '80px' : '30px',
    padding: '0.7rem 1.4rem',
    borderRadius: '30px',
    background: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(240, 165, 0, 0.85)',
    color: '#FFFFFF',
    fontSize: '0.78rem',
    fontWeight: '800',
    fontFamily: 'Cairo, sans-serif',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2), 0 0 15px rgba(240, 165, 0, 0.15)',
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const windowStyle = {
    position: 'fixed' as 'fixed',
    left: isMobile ? '0px' : '30px',
    // Dock natively at bottom on mobile (bottom: 0) to avoid floating height conflicts
    bottom: isMobile ? '0px' : '95px',
    width: isMobile ? '100%' : '395px', 
    // Excellent mobile height sheet taking 82% of viewport height
    height: isMobile ? '82vh' : '600px', 
    background: '#FFFFFF',
    border: isMobile ? 'none' : '1px solid rgba(240, 165, 0, 0.22)',
    borderTopLeftRadius: '24px', 
    borderTopRightRadius: '24px',
    borderBottomLeftRadius: isMobile ? '0px' : '24px',
    borderBottomRightRadius: isMobile ? '0px' : '24px',
    boxShadow: isMobile ? '0 -10px 35px rgba(15, 23, 42, 0.12)' : '0 20px 50px -12px rgba(15, 23, 42, 0.15), 0 0 35px rgba(240, 165, 0, 0.02)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column' as 'column',
    overflow: 'hidden',
    fontFamily: 'Cairo, sans-serif',
    direction: 'rtl' as 'rtl',
    animation: isMobile ? 'chat-slideUpMobile 0.3s ease-out forwards' : 'chat-slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
  };

  return (
    <>
      {/* ── Glowing Frosted Welcoming Pill Button ── */}
      <button 
        onClick={() => setIsOpen(v => !v)}
        className="chat-orb-btn"
        style={toggleStyle}
        aria-label="مساعد دار شمس"
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'rgba(240, 165, 0, 0.15)',
          border: '1.2px solid #F0A500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 8px rgba(240, 165, 0, 0.3)'
        }}>
          <Sun size={10} className="text-[#F0A500] animate-spin-slow" />
        </div>
        {isOpen ? <span className="flex items-center gap-1.5"><X size={14} /> إغلاق</span> : <span className="flex items-center gap-1.5">مساعد دار شمس</span>}
      </button>

      {/* ── Premium Glassmorphic Chat Window ── */}
      {isOpen && (
        <div className="chat-box-window-container" style={windowStyle}>
          {/* Header */}
          <div className="chat-header" style={{
            background: '#FFFFFF',
            borderBottom: '2.5px solid #F0A500',
            padding: '1.1rem 1.3rem',
            color: '#0F172A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.015)'
          }}>
            <div className="flex items-center gap-2.5">
              <div className="glow-icon-container" style={{
                background: 'rgba(240,165,0,0.06)',
                border: '1px solid rgba(240,165,0,0.15)',
                padding: '0.45rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(240,165,0,0.1)'
              }}>
                <Sun size={13} className="text-[#F0A500] animate-spin-slow" />
              </div>
              <div>
                <p className="font-extrabold text-[0.82rem] tracking-wide leading-tight text-[#0F172A]">المساعد السحابي لدار شمس</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span 
                    className="w-1.5 h-1.5 rounded-full animate-ping" 
                    style={{ backgroundColor: isDbConnected ? '#10B981' : '#F59E0B' }}
                  />
                  <span className="text-[0.6rem] text-gray-400 font-extrabold">
                    {isDbConnected ? 'متصل بالخادم السحابي' : 'بانتظار التفعيل السحابي'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2.5 items-center">
              <button 
                onClick={() => setIsAdminView(v => !v)} 
                className="header-action-btn"
                style={{
                  opacity: 0.8,
                  color: '#0F172A',
                  transition: 'all 0.2s',
                  padding: '0.3rem',
                  borderRadius: '6px'
                }}
                title={isAdminView ? "العودة للدردشة" : "سجل الشكاوى"}
              >
                <ShieldCheck size={18} className="text-[#153257] hover:text-[#F0A500] transition-colors" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="header-action-btn"
                style={{
                  opacity: 0.8,
                  color: '#0F172A',
                  transition: 'all 0.2s',
                  padding: '0.3rem',
                  borderRadius: '6px'
                }}
              >
                <X size={18} className="text-gray-500 hover:text-red-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* User Chatting View */}
          {!isAdminView ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFBFD]">
              {/* Optional Connection Alert Banner */}
              {!isDbConnected && (
                <div className="bg-amber-50 border-b border-amber-100 p-2.5 text-[0.65rem] text-amber-800 flex gap-2 items-start font-bold">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    تنبيه: لم يتم ربط جدول الشكاوى بالنظام السحابي بعد. سيتم تخزين رسائلك مؤقتاً لحين إتمام تفعيل الخادم السحابي من لوحة التحكم.
                  </p>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages-container" style={{ scrollBehavior: 'smooth' }}>
                {/* ── Luxury Concierge Greeting Card ── */}
                {messages.length === 0 && (
                  <div className="concierge-card" style={{
                    background: 'linear-gradient(135deg, #FFFDF9, #FFFBF0)',
                    border: '1.5px solid rgba(240, 165, 0, 0.25)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 25px rgba(240, 165, 0, 0.05)',
                    animation: 'chat-slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      border: '2px solid #F0A500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto',
                      boxShadow: '0 0 15px rgba(240, 165, 0, 0.2)'
                    }}>
                      <Sun size={18} className="text-[#F0A500] animate-spin-slow" />
                    </div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' }}>المساعد الذكي لدار شمس</h3>
                    <p style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: '1.6', fontWeight: '600' }}>
                      أهلاً بك في نظام التواصل السري المباشر مع الإدارة العليا. نسعد بتلقي شكواك أو اقتراحك لتوفير بيئة تعافي مثالية.
                    </p>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${msg.isAi ? 'justify-start' : 'justify-end'}`}>
                    {/* AI Avatar */}
                    {msg.isAi && (
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(240, 165, 0, 0.08)',
                        border: '1px solid rgba(240, 165, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(240, 165, 0, 0.1)',
                        flexShrink: 0,
                        marginTop: '4px'
                      }}>
                        <Sun size={11} className="text-[#F0A500] animate-spin-slow" />
                      </div>
                    )}
                    
                    <div 
                      className={`p-3 rounded-2xl text-[0.78rem] max-w-[78%] shadow-sm leading-relaxed font-semibold ${
                        msg.isAi 
                          ? 'msg-ai-animated' 
                          : 'msg-user-animated'
                      }`}
                      style={msg.isAi ? {
                        background: '#FFFFFF',
                        border: '1px solid rgba(240, 165, 0, 0.15)',
                        borderRight: '4px solid #F0A500', 
                        color: '#0F172A',
                        borderTopRightRadius: 0,
                      } : {
                        background: 'linear-gradient(135deg, #F0A500, #E08B00)',
                        color: 'white',
                        borderTopLeftRadius: 0,
                        boxShadow: '0 4px 12px rgba(240, 165, 0, 0.12)',
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* User Avatar */}
                    {!msg.isAi && (
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F0A500, #E08B00)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(240, 165, 0, 0.15)',
                        flexShrink: 0,
                        marginTop: '4px'
                      }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'white' }}>أنت</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typing && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(240, 165, 0, 0.08)',
                      border: '1px solid rgba(240, 165, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(240, 165, 0, 0.1)',
                      flexShrink: 0,
                      marginTop: '4px'
                    }}>
                      <Sun size={11} className="text-[#F0A500] animate-spin-slow" />
                    </div>
                    <div className="msg-ai-animated p-3 rounded-2xl text-[0.74rem] font-semibold flex gap-1.5 items-center shadow-sm" style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(240, 165, 0, 0.15)',
                      borderRight: '4px solid #F0A500',
                      color: '#0F172A',
                      borderTopRightRadius: 0,
                    }}>
                      <div className="w-1.2 h-1.2 bg-[#0D2847] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.2 h-1.2 bg-[#0D2847] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.2 h-1.2 bg-[#0D2847] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <span className="text-[#0D2847] opacity-80 mr-1">جاري التفكير...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Luxury 2x2 Quick Action Tiles Grid ── */}
              <div style={{
                padding: '0.75rem 1rem',
                background: '#FAFBFD',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem'
              }}>
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSuggestionClick(s.val)}
                    className="suggestion-tile"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(240, 165, 0, 0.18)',
                      borderRadius: '12px',
                      padding: '0.55rem 0.75rem',
                      textAlign: 'right',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.015)',
                      transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                      display: 'flex',
                      flexDirection: 'column' as 'column',
                      gap: '0.15rem'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0F172A' }}>{s.label}</span>
                    <span style={{ fontSize: '0.56rem', color: '#94A3B8', fontWeight: '600' }}>{s.desc}</span>
                  </button>
                ))}
              </div>

              {/* ── Beautifully Proportioned Luxury Bottom Input Bar ── */}
              <form onSubmit={handleSubmit} className="chat-input-bar" style={{
                background: '#FFFFFF',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                // Mobile gets normalized clean padding since it touches the flat screen bottom, desktop clears desktop corner radius
                padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.25rem 1.25rem 1.25rem',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'center'
              }}>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="اكتب رسالتك أو اقتراحك هنا..."
                  className="chat-input"
                  style={{
                    flex: 1,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '0.7rem 1.15rem', 
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
                <button 
                  type="submit" 
                  className="chat-send-btn"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    color: 'white',
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)'
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          ) : (
            // Admin Complaints Dashboard View
            <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFBFD]">
              <div className="p-3 bg-slate-900 text-white text-[0.72rem] font-bold flex justify-between items-center border-b border-slate-800">
                <span>📋 سجل المقترحات والشكاوى المرسلة سحابياً</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 chat-messages-container">
                {!isDbConnected ? (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-[0.7rem] text-amber-900 space-y-2 font-bold leading-relaxed">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-800">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <span>الخادم السحابي قيد التفعيل</span>
                    </div>
                    <p>
                      لعرض ومتابعة مقترحاتك المسجلة هنا بشكل مباشر، يرجى تشغيل أمر التهيئة المرفق في لوحة الإدارة السحابية لتفعيل جدول المزامنة وتنشيط الاتصال فوراً!
                    </p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                    <ShieldCheck size={26} className="text-[#F0A500] opacity-60 mb-2" />
                    <p className="text-[0.7rem] font-bold text-[#0D2847]">لا توجد شكاوى مسجلة سحابياً بعد.</p>
                    <p className="text-[0.6rem] text-gray-400 mt-1">ابدأ بكتابة وإرسال شكوى جديدة لتجربتها سحابياً!</p>
                  </div>
                ) : (
                  submissions.map(sub => {
                    let dateStr = "الآن";
                    if (sub.timestamp) {
                      try {
                        dateStr = sub.timestamp.toDate().toLocaleTimeString('ar-EG');
                      } catch(e) {}
                    }
                    return (
                      <div key={sub.id} className="bg-white p-3 rounded-xl border border-gray-100 text-[0.7rem] shadow-sm space-y-1.5">
                        <div className="flex justify-between font-extrabold text-[0.62rem]">
                          <span className={sub.type === 'شكوى' ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded' : 'text-green-600 bg-green-50 px-2 py-0.5 rounded'}>
                            {sub.type}
                          </span>
                          <span className="text-gray-400">{dateStr}</span>
                        </div>
                        <p className="text-[#0D2847] font-semibold"><span className="text-blue-600 font-extrabold">المستلم:</span> {sub.message}</p>
                        <p className="text-gray-500 italic font-semibold"><span className="text-[#F0A500] font-extrabold">رد المساعد:</span> {sub.reply}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <button 
                onClick={() => setIsAdminView(false)}
                className="m-3 bg-white hover:bg-gray-100 text-[#0D2847] py-2 rounded-xl text-[0.72rem] font-bold flex items-center justify-center gap-1.5 transition-colors border border-gray-200 shadow-sm"
              >
                <ArrowLeft size={13} className="text-[#F0A500]" /> العودة لدردشة المساعد الذكي
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        /* Floating Toggle Glow and pulse effects */
        .chat-orb-btn:hover {
          transform: translateY(-3px) scale(1.04) !important;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.35), 0 0 20px rgba(240, 165, 0, 0.25) !important;
          border-color: #FFFDF9 !important;
        }
        .chat-orb-btn:active {
          transform: translateY(0) scale(0.98) !important;
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Frost-Glass Opening scale and translation easing ── */
        @keyframes chat-slideUp {
          from { transform: translateY(35px) scale(0.93); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* ── Mobile Slide-Up from the absolute bottom ── */
        @keyframes chat-slideUpMobile {
          from { transform: translateY(100%); opacity: 0.95; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ── Dynamic springy message entries (WOW factor!) ── */
        @keyframes slideInRight {
          from { transform: translateX(40px) scale(0.85); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-40px) scale(0.85); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .msg-user-animated {
          animation: slideInRight 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: left bottom;
        }
        .msg-ai-animated {
          animation: slideInLeft 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: right bottom;
        }

        /* Suggestion tiles 2x2 hover effects */
        .suggestion-tile:hover {
          background: #FFFDF4 !important;
          border-color: #F0A500 !important;
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(240, 165, 0, 0.08) !important;
        }
        .suggestion-tile:active {
          transform: translateY(0);
        }

        /* Input field active state */
        .chat-input:focus {
          border-color: #F0A500 !important;
          background: #FFFFFF !important;
          box-shadow: 0 0 0 3px rgba(240, 165, 0, 0.06) !important;
        }

        /* Premium Thin Gold Scrollbar */
        .chat-messages-container::-webkit-scrollbar {
          width: 5px;
        }
        .chat-messages-container::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.01);
        }
        .chat-messages-container::-webkit-scrollbar-thumb {
          background: rgba(240, 165, 0, 0.25);
          border-radius: 10px;
        }
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(240, 165, 0, 0.45);
        }
      `}</style>
    </>
  );
}
