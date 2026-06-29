import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK: useReveal
───────────────────────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix = '', decimals = 0, duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [started, setStart] = useState(false);
  const [ref, visible] = useReveal(0.3);

  useEffect(() => { if (visible) setStart(true); }, [visible]);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((e * to).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, to, decimals, duration]);

  return (
    <span ref={ref} className="counter-value">
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 1: HERO - Live Wallpaper Background
───────────────────────────────────────────────────────────────────────────── */
function HeroSection({ theme }) {
  const isDark = theme === 'dark';

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20 pb-20 overflow-hidden"
      aria-labelledby="hero-heading"
      suppressHydrationWarning
    >
      {/* ─── Live Video & Wallpaper Background ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" suppressHydrationWarning>
        
        {/* HTML5 Video Element */}
        {isDark ? (
          <video
            key="dark-video"
            src="https://res.cloudinary.com/dvgitcbce/video/upload/v1782729892/dark_svbw10.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ filter: 'brightness(0.65)' }}
          />
        ) : (
          <video
            key="light-video"
            src="https://res.cloudinary.com/dvgitcbce/video/upload/v1782729978/light_ejcqgd.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ filter: 'brightness(0.95) contrast(1.02)' }}
          />
        )}

        {/* Overlay Gradient (Ensures high text readability) */}
        <div 
          className="absolute inset-0 z-10 transition-all duration-1000"
          style={{
            background: isDark 
              ? 'linear-gradient(to bottom, rgba(10, 10, 26, 0.4) 0%, rgba(5, 5, 16, 0.85) 100%)'
              : 'linear-gradient(to bottom, rgba(232, 245, 233, 0.25) 0%, rgba(165, 214, 167, 0.5) 100%)',
          }}
          suppressHydrationWarning
        />

        {/* --- DARK MODE OVERLAYS: Galaxy / Starry Night --- */}
        {isDark && (
          <div className="absolute inset-0 z-20 opacity-100 transition-opacity duration-1000" suppressHydrationWarning>
            {/* Rotating Galaxy Center */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] animate-spin-slow opacity-20"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, #6c3ce1 25%, transparent 50%, #4a90e2 75%, transparent 100%)',
              }}
              suppressHydrationWarning
            />

            {/* Nebula Clouds */}
            <div 
              className="absolute rounded-full blur-[80px] animate-float-nebula-1"
              style={{
                width: '600px', height: '600px', top: '-10%', left: '-10%',
                background: 'radial-gradient(circle, rgba(108,60,225,0.2) 0%, transparent 70%)',
              }}
              suppressHydrationWarning
            />
            <div 
              className="absolute rounded-full blur-[80px] animate-float-nebula-2"
              style={{
                width: '700px', height: '700px', bottom: '-20%', right: '-10%',
                background: 'radial-gradient(circle, rgba(74,144,226,0.15) 0%, transparent 70%)',
              }}
              suppressHydrationWarning
            />
            
            {/* Twinkling Stars overlaying the video */}
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-twinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                }}
                suppressHydrationWarning
              />
            ))}

            {/* Shooting Stars */}
            <div className="absolute animate-shooting-star" style={{ top: '15%', left: '10%', animationDelay: '2s' }} suppressHydrationWarning>
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
              <div className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[-30deg] origin-left" />
            </div>
            <div className="absolute animate-shooting-star" style={{ top: '30%', right: '15%', animationDelay: '7s' }} suppressHydrationWarning>
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" />
              <div className="absolute top-0 left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[-30deg] origin-left" />
            </div>
          </div>
        )}

        {/* --- LIGHT MODE OVERLAYS: Breezy Green Day --- */}
        {!isDark && (
          <div className="absolute inset-0 z-20 opacity-100 transition-opacity duration-1000" suppressHydrationWarning>
            {/* Soft Green Shifting Gradients overlaying the video */}
            <div 
              className="absolute inset-0 opacity-20 animate-gradient-shift mix-blend-overlay"
              style={{
                background: 'linear-gradient(120deg, #81c784, #aed581, #fff59d, #4db6ac)',
                backgroundSize: '300% 300%'
              }}
              suppressHydrationWarning
            />

            {/* Sunlight Rays */}
            <div className="absolute top-[-20%] left-[-10%] w-[150%] h-[150%] animate-sun-rays opacity-15 pointer-events-none"
                 style={{
                   background: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0%, transparent 45%)',
                   transformOrigin: '20% 0%'
                 }}
                 suppressHydrationWarning
            />

            {/* Moving Clouds */}
            <div className="absolute top-[10%] left-[-20%] w-[300px] h-[100px] bg-white rounded-full opacity-40 blur-3xl animate-cloud-1" suppressHydrationWarning />
            <div className="absolute top-[30%] left-[-10%] w-[400px] h-[120px] bg-white rounded-full opacity-30 blur-3xl animate-cloud-2" suppressHydrationWarning />
            <div className="absolute top-[15%] left-[-30%] w-[250px] h-[80px] bg-white rounded-full opacity-35 blur-3xl animate-cloud-3" suppressHydrationWarning />

            {/* Floating Leaves drifting down over the video */}
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 animate-falling-leaf"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  background: Math.random() > 0.5 ? '#4caf50' : '#81c784',
                  borderRadius: '0 50% 0 50%',
                  opacity: Math.random() * 0.4 + 0.2,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${Math.random() * 8 + 7}s`,
                }}
                suppressHydrationWarning
              />
            ))}
          </div>
        )}
      </div>

      {/* Heading */}
      <h1
        id="hero-heading"
        className="font-black leading-tight mb-5 z-10"
        style={{
          fontFamily: 'Poppins, Inter, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          maxWidth: '860px',
          color: isDark ? '#FFFFFF' : '#1a1a2e',
          textShadow: isDark 
            ? '0 4px 30px rgba(0,0,0,0.8), 0 0 40px rgba(108,60,225,0.4)' 
            : '0 2px 20px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.5)',
        }}
        suppressHydrationWarning
      >
        Cool Mumbai
      </h1>

      {/* Subheading */}
      <p
        className="mb-10 max-w-xl leading-relaxed z-10"
        style={{
          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
          textShadow: isDark 
            ? '0 2px 15px rgba(0,0,0,0.8)' 
            : '0 2px 15px rgba(255,255,255,0.9)',
        }}
        suppressHydrationWarning
      >
        AI-Powered Heat Mitigation for India's Financial Capital
      </p>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes float-nebula-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.1); }
        }
        @keyframes float-nebula-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(-30deg); opacity: 0; }
          10% { opacity: 1; }
          20% { transform: translateX(-300px) translateY(150px) rotate(-30deg); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes sun-rays {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.2; }
          50% { transform: rotate(5deg) scale(1.05); opacity: 0.3; }
        }
        @keyframes cloud-1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(120vw); }
        }
        @keyframes cloud-2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(120vw); }
        }
        @keyframes cloud-3 {
          0% { transform: translateX(0); }
          100% { transform: translateX(120vw); }
        }
        @keyframes falling-leaf {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(100px, 110vh) rotate(360deg); opacity: 0; }
        }

        .animate-float-nebula-1 { animation: float-nebula-1 15s ease-in-out infinite; }
        .animate-float-nebula-2 { animation: float-nebula-2 18s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-shooting-star { animation: shooting-star 8s linear infinite; }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        
        .animate-gradient-shift { animation: gradient-shift 15s ease infinite; }
        .animate-sun-rays { animation: sun-rays 10s ease-in-out infinite; }
        .animate-cloud-1 { animation: cloud-1 40s linear infinite; }
        .animate-cloud-2 { animation: cloud-2 60s linear infinite; animation-delay: -20s; }
        .animate-cloud-3 { animation: cloud-3 50s linear infinite; animation-delay: -10s; }
        .animate-falling-leaf { animation: falling-leaf 10s linear infinite; }
      `}</style>
    </section>
  );
}

// ... rest of your components (MetricsSection, FeaturesSection, CTASection) remain the same

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 2: METRICS
───────────────────────────────────────────────────────────────────────────── */
const METRICS = [
  { id: 'city',   to: 1,  suffix: '', label: '📍 Mumbai Metropolitan Region',   sub: 'India\'s Financial Capital',     emoji: '🌆' },
  { id: 'hotspots', to: 250, suffix: '+',  label: 'Heat Hotspots Identified',       sub: 'Across Mumbai',     emoji: '🌡️' },
  { id: 'temp',     to: 2.5,  suffix: '°C', decimals: 1, label: 'Cooling Possible', sub: 'with smart interventions', emoji: '❄️' },
];

function MetricsSection({ theme }) {
  const isDark = theme === 'dark';

  return (
    <section
      id="metrics"
      className="py-24 px-4"
      style={{
        background: isDark 
          ? 'linear-gradient(180deg, #0f0c29, #1B2735)'
          : 'linear-gradient(180deg, #e8f5e9, #f1f8e9)',
        transition: 'background 0.5s ease',
      }}
    >
      <div className="max-w-6xl mx-auto">

        <Reveal>
          <div className="text-center mb-14">
            <span className="badge mb-4" style={{
              background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(46,125,50,0.1)',
              border: isDark ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(46,125,50,0.2)',
              color: isDark ? '#FFD93D' : '#2e7d32',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>📊 Mumbai in Numbers</span>
            <h2
              id="metrics-heading"
              className="font-black leading-tight mb-4"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                color: isDark ? '#FFFFFF' : '#1a1a2e',
              }}
            >
              Mumbai's Urban Heat Story
            </h2>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '1rem', lineHeight: '1.7' }}>
              Real data from NASA and Yale satellites
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {METRICS.map(({ id, to, suffix, decimals, label, sub, emoji }, i) => (
            <Reveal key={id} delay={i * 110}>
              <div className="metric-card" style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '20px',
                padding: '36px 28px',
                textAlign: 'center',
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
              }}>
                <div className="text-3xl mb-3" aria-hidden="true">{emoji}</div>
                <div
                  className="font-black mb-1"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 'clamp(2.4rem, 4vw, 3.25rem)',
                    color: isDark ? '#FFD93D' : '#2e7d32',
                  }}
                >
                  <Counter to={to} suffix={suffix} decimals={decimals || 0} duration={2000} />
                </div>
                <div className="font-semibold mb-1" style={{ color: isDark ? '#FFFFFF' : '#1a1a2e', fontSize: '1rem' }}>
                  {label}
                </div>
                <div style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.8rem' }}>{sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: FEATURES
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 'heat-detection',
    emoji: '🗺️',
    title: 'Find Heat Hotspots',
    description: 'Interactive map showing 250+ heat hotspots across Mumbai. Click any location to see its temperature and what\'s causing the heat.',
    stat: '250+ locations',
  },
  {
    id: 'ai-analysis',
    emoji: '🧠',
    title: 'Understand the Causes',
    description: 'AI-powered analysis shows the top drivers of heat — from population density to lack of vegetation. Know WHY an area is hot.',
    stat: '98% accuracy',
  },
  {
    id: 'interventions',
    emoji: '🌱',
    title: 'Test Cooling Solutions',
    description: 'Simulate interventions like tree planting or cool roofs. See exactly how much temperature can be reduced — before spending any money.',
    stat: 'Real-time sim',
  },
];

function FeaturesSection({ theme }) {
  const isDark = theme === 'dark';

  return (
    <section
      id="features"
      className="py-24 px-4"
      style={{
        background: isDark 
          ? 'linear-gradient(180deg, #1B2735, #0f0c29)'
          : 'linear-gradient(180deg, #f1f8e9, #ffffff)',
        transition: 'background 0.5s ease',
      }}
    >
      <div className="max-w-6xl mx-auto">

        <Reveal>
          <div className="text-center mb-14">
            <span className="badge mb-4" style={{
              background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(46,125,50,0.1)',
              border: isDark ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(46,125,50,0.2)',
              color: isDark ? '#FFD93D' : '#2e7d32',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>⚡ How It Works</span>
            <h2
              id="features-heading"
              className="font-black leading-tight mb-4"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                color: isDark ? '#FFFFFF' : '#1a1a2e',
              }}
            >
              Three Steps to a Cooler Mumbai
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              From satellite data to actionable interventions for Mumbai.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ id, emoji, title, description, stat }, i) => (
            <Reveal key={id} delay={i * 130}>
              <article className="card p-7 h-full flex flex-col" style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '20px',
                boxShadow: isDark 
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
              }}>
                <div className="icon-box mb-5" style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                }}>{emoji}</div>
                <h3 className="font-bold mb-3 text-lg" style={{ color: isDark ? '#FFFFFF' : '#1a1a2e' }}>
                  {title}
                </h3>
                <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: '0.9rem', lineHeight: '1.65', flex: 1 }}>
                  {description}
                </p>
                <div className="badge mt-5 self-start" style={{
                  background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(46,125,50,0.1)',
                  border: isDark ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(46,125,50,0.2)',
                  color: isDark ? '#FFD93D' : '#2e7d32',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}>✓ {stat}</div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 4: CALL TO ACTION
───────────────────────────────────────────────────────────────────────────── */
function CTASection({ theme }) {
  const isDark = theme === 'dark';

  return (
    <section
      id="cta"
      className="py-24 px-4"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)'
          : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
        transition: 'background 0.5s ease',
      }}
    >
      <div className="max-w-3xl mx-auto text-center">

        <Reveal>
          <span className="badge mb-6" style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
            color: isDark ? '#FFFFFF' : '#1a1a2e',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '600',
          }}>🌿 Climate Action</span>
        </Reveal>

        <Reveal delay={80}>
          <h2
            id="cta-heading"
            className="font-black leading-tight mb-5"
            style={{
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
              color: isDark ? '#FFFFFF' : '#1a1a2e',
            }}
          >
            Help Mumbai Beat the Heat
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p
            className="mb-10 leading-relaxed"
            style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
          >
            Explore Mumbai's heat hotspots, understand what's driving them, and test cooling solutions — all powered by real satellite data from NASA and Yale.
          </p>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-12 p-4 rounded-xl" style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          }}>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '0.8rem' }}>
              📊 Powered by: YCEO Surface Urban Heat Islands Dataset • NASA • Yale Center for Earth Observation
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    const observer = new MutationObserver(() => {
      const htmlClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme(htmlClass);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Cool Mumbai – AI-Powered Urban Heat Mitigation</title>
        <meta
          name="description"
          content="AI-powered system for detecting urban heat hotspots in Mumbai. Understand causes and test cooling interventions with real NASA/Yale satellite data."
        />
      </Head>
      <main>
        <HeroSection theme={theme} />
        <MetricsSection theme={theme} />
        <FeaturesSection theme={theme} />
        <CTASection theme={theme} />
      </main>
    </>
  );
}