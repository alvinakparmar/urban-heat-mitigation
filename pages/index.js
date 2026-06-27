import Head from 'next/head';
import Link from 'next/link';  // ← Add this line

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   HOOK: useReveal  — fires once when element enters viewport
───────────────────────────────────────────────────────────────────────────── */
function useReveal(threshold = 0.2) {
  const ref     = useRef(null);
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

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: RevealOnScroll
───────────────────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT: AnimatedCounter
───────────────────────────────────────────────────────────────────────────── */
function Counter({ to, suffix = '', decimals = 0, duration = 2000, prefix = '', textValue = null }) {
  const [val, setVal]       = useState(0);
  const [started, setStart] = useState(false);
  const [ref, visible]      = useReveal(0.3);

  useEffect(() => { if (visible) setStart(true); }, [visible]);

  useEffect(() => {
    if (textValue || !started) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(parseFloat((e * to).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, to, decimals, duration, textValue]);

  if (textValue) {
    return (
      <span ref={ref} className="counter-value">
        {prefix}{textValue}{suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className="counter-value">
      {prefix}
      {decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 1: HERO
───────────────────────────────────────────────────────────────────────────── */
function HeroSection({ apiStatus }) {
  const statusColor =
    apiStatus === 'connected'    ? '#22c55e' :
    apiStatus === 'disconnected' ? '#ef4444' : '#a8a29e';
  const statusLabel =
    apiStatus === 'connected'    ? 'Systems Online'  :
    apiStatus === 'disconnected' ? 'Backend Offline' : 'Connecting…';

  return (
    <section
      id="hero"
      className="hero-bg relative flex flex-col items-center justify-center min-h-screen text-center px-4 pt-20 pb-20 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Decorative particles */}
      {[1,2,3,4,5].map((n) => (
        <div key={n} className={`particle particle-${n}`} aria-hidden="true" />
      ))}
      {/* Heat wave lines */}
      <div className="heat-wave-container" aria-hidden="true">
        {[1,2,3,4].map((n) => <div key={n} className="heat-wave-line" />)}
      </div>

      {/* Status badge */}
      <div
        className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
        style={{
          background: 'var(--badge-bg)',
          border: '1px solid var(--accent-border)',
          color: statusColor,
          animationDelay: '0.1s',
        }}
        aria-live="polite"
        id="hero-status-badge"
      >
        <span className="status-dot w-2 h-2 rounded-full" style={{ background: statusColor }} />
        {statusLabel}
      </div>

      {/* Heading */}
      <h1
        id="hero-heading"
        className="font-black leading-tight mb-5"
        style={{
          fontFamily: 'Poppins, Inter, sans-serif',
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          maxWidth: '860px',
          background: 'linear-gradient(to right, #eab308, #22c55e, #3b82f6, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        🌆 Urban Heat Mitigation System
      </h1>

      {/* Subheading */}
      <p
        className="mb-10 max-w-xl leading-relaxed"
        style={{
          color: 'var(--text-secondary)',
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
        }}
      >
        AI-Powered Solutions for Cooler, Sustainable Cities
      </p>
    </section>
  );
}



/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: LIVE METRICS
───────────────────────────────────────────────────────────────────────────── */
const METRICS = [
  { id: 'cities', textValue: 'Mumbai', suffix: '', label: 'Metropolitan Region', sub: 'Target focus area', emoji: '🌍' },
  { id: 'hotspots', to: 250, suffix: '+', label: 'Heat Hotspots', sub: 'Identified in Mumbai', emoji: '🌡️' },
  { id: 'temp', to: 2.5, suffix: '°C', decimals: 1, prefix: 'Up to ', label: 'Cooling Possible', sub: 'Based on ML predictions', emoji: '❄️' },
];



function MetricsSection() {
  return (
    <section
      id="metrics"
      className="py-24 px-4"
      style={{ background: 'var(--bg-base)' }}
      aria-labelledby="metrics-heading"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <Reveal>
          <div className="text-center mb-14">
            <span className="badge mb-4">📊 Live Metrics</span>
            <h2
              id="metrics-heading"
              className="font-black leading-tight mb-4"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                background: 'linear-gradient(to right, #eab308, #22c55e, #3b82f6, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Real-Time Impact Data
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto' }}>
              Updated every 15 minutes from satellite feeds and ground sensors.
            </p>
          </div>
        </Reveal>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {METRICS.map(({ id, to, textValue, prefix, suffix, decimals, label, sub, emoji }, i) => (
            <Reveal key={id} delay={i * 110}>
              <div className="metric-card" id={`metric-${id}`}>
                <div className="text-3xl mb-3" aria-hidden="true">{emoji}</div>
                <div
                  className="font-black mb-1"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif', 
                    fontSize: 'clamp(2.4rem, 4vw, 3.25rem)',
                    background: 'linear-gradient(to right, #eab308, #22c55e, #3b82f6, #ef4444)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  <Counter to={to} textValue={textValue} prefix={prefix} suffix={suffix} decimals={decimals || 0} duration={2000} />
                </div>
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {label}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub}</div>
              </div>
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
function CTASection() {
  return (
    <section
      id="cta"
      className="section-alt py-24 px-4"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Reveal delay={80}>
            <h2
              id="cta-heading"
              className="font-black leading-tight mb-5"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                background: 'linear-gradient(to right, #eab308, #22c55e, #3b82f6, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              🌆 Understand Mumbai's Urban Heat
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p
              className="max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}
            >
              This system uses real satellite data from the Yale Center for Earth Observation (YCEO) to analyze urban heat patterns across Mumbai. Powered by AI, it helps you understand why certain areas are hotter and what can be done about it.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Reveal delay={240}>
            <div className="card p-6 h-full flex flex-col">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Find Heat Hotspots</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Explore 250+ identified heat hotspots across Mumbai. Click any location to see its temperature and what's causing the heat.
              </p>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="card p-6 h-full flex flex-col">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Understand the Causes</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                AI-powered analysis shows you the top drivers of heat - from population density to lack of vegetation. Know WHY an area is hot.
              </p>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="card p-6 h-full flex flex-col">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Test Cooling Solutions</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                Simulate interventions like tree planting or cool roofs. See exactly how much temperature can be reduced - before spending any money.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={480}>
          <div className="flex flex-col items-center justify-center space-y-8 mt-12">
            <div className="inline-flex items-center justify-center text-center">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                📊 Powered by: YCEO Surface Urban Heat Islands Dataset • NASA • Yale Center for Earth Observation
              </span>
            </div>
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
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((r) => r.json())
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  return (
    <>
      <Head>
        <title>Urban Heat Mitigation System – AI-Powered Cooling for Mumbai</title>
        <meta
          name="description"
          content="Detect urban heat islands in Mumbai, analyse root causes with AI, and deploy smart cooling interventions based on real YCEO satellite data."
        />
      </Head>
      <main>
        <HeroSection    apiStatus={apiStatus} />
        <MetricsSection />
        <CTASection />
      </main>
    </>
  );
}