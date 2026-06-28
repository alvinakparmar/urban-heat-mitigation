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
function Counter({ to, suffix = '', decimals = 0, duration = 2000 }) {
  const [val, setVal]       = useState(0);
  const [started, setStart] = useState(false);
  const [ref, visible]      = useReveal(0.3);

  useEffect(() => { if (visible) setStart(true); }, [visible]);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
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
        className="gradient-text-hero font-black leading-tight mb-5"
        style={{
          fontFamily: 'Poppins, Inter, sans-serif',
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          maxWidth: '860px',
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

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <a href="#features" className="btn-primary" id="hero-explore-btn">
          Explore Solutions
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <Link href="/map" legacyBehavior>
  <a className="btn-secondary" id="hero-map-btn">
    View Live Map
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  </a>
</Link>
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
        aria-hidden="true"
      >
        <svg
          className="animate-bounce-soft"
          width="18" height="18"
          fill="none" stroke="currentColor" strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ animation: 'bounceSoft 2s ease-in-out infinite', color: 'var(--accent)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        scroll
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 2: FEATURES  ("How It Works")
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 'heat-detection',
    emoji: '🛰️',
    title: 'Heat Detection',
    description:
      'Satellite imagery and ground-level sensors identify urban heat island hotspots at 10 m resolution, refreshed every 6 hours.',
    stat: '10 m · 6 hr',
  },
  {
    id: 'ai-analysis',
    emoji: '🧠',
    title: 'AI Analysis',
    description:
      'Explainable ML models pinpoint drivers of overheating — albedo, impervious surfaces, tree cover — with SHAP importance scores.',
    stat: '94 % accuracy',
  },
  {
    id: 'interventions',
    emoji: '🏙️',
    title: 'Smart Interventions',
    description:
      'Scenario planning lets planners simulate green roofs, cool pavements, and tree planting before committing budget and resources.',
    stat: 'Real-time sim',
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      className="section-alt py-24 px-4"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <Reveal>
          <div className="text-center mb-14">
            <span className="badge mb-4">⚡ How It Works</span>
            <h2
              id="features-heading"
              className="gradient-text font-black leading-tight mb-4"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
              }}
            >
              Three Steps to a Cooler City
            </h2>
            <p
              className="max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7' }}
            >
              From raw satellite data to actionable interventions — all in one platform.
            </p>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ id, emoji, title, description, stat }, i) => (
            <Reveal key={id} delay={i * 130}>
              <article className="card p-7 h-full flex flex-col" id={`feature-${id}`}>
                <div className="icon-box mb-5">{emoji}</div>
                <h3
                  className="font-bold mb-3 text-lg"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
                >
                  {title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.65', flex: 1 }}>
                  {description}
                </p>
                <div className="badge mt-5 self-start">✓ {stat}</div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 3: LIVE METRICS
───────────────────────────────────────────────────────────────────────────── */
const METRICS = [
  { id: 'cities',   to: 150,  suffix: '+', label: 'Cities Monitored',   sub: 'across 38 countries',     emoji: '🌍' },
  { id: 'hotspots', to: 2847, suffix: '',  label: 'Heat Hotspots',       sub: 'detected this month',     emoji: '🌡️' },
  { id: 'temp',     to: 3.2,  suffix: '°C', decimals: 1, label: 'Avg Temp Reduction', sub: 'after interventions', emoji: '❄️' },
];

function ChartPreview() {
  const [started, setStart] = useState(false);
  const [ref, visible]      = useReveal(0.2);
  useEffect(() => { if (visible) setStart(true); }, [visible]);

  const bars = [
    { h: 42, label: 'Jan' }, { h: 68, label: 'Feb' }, { h: 56, label: 'Mar' },
    { h: 82, label: 'Apr' }, { h: 48, label: 'May' }, { h: 91, label: 'Jun' },
    { h: 73, label: 'Jul' }, { h: 62, label: 'Aug' }, { h: 50, label: 'Sep' },
    { h: 38, label: 'Oct' }, { h: 27, label: 'Nov' }, { h: 22, label: 'Dec' },
  ];

  const barColor = (h) =>
    h >= 80 ? '#ef4444' : h >= 60 ? '#f59e0b' : h >= 40 ? '#fbbf24' : '#22c55e';

  return (
    <div ref={ref} className="dashboard-preview p-6" aria-label="Monthly heat hotspots chart">
      {/* Window chrome */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1.5">
          {['#ef4444','#f59e0b','#22c55e'].map((c) => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} aria-hidden="true" />
          ))}
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
            Heat Hotspots — Monthly 2025
          </span>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-md font-semibold"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
        >
          ● Live
        </span>
      </div>

      {/* Bars */}
      <div
        className="flex items-end gap-1.5 sm:gap-2"
        style={{ height: '120px' }}
        role="img"
        aria-label="Bar chart of monthly heat hotspot counts"
      >
        {bars.map(({ h, label }, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              style={{
                width: '100%',
                borderRadius: '4px 4px 0 0',
                background: barColor(h),
                opacity: 0.85,
                minHeight: '4px',
                transition: `height 1.1s cubic-bezier(0.34,1.56,0.64,1)`,
                transitionDelay: started ? `${i * 55}ms` : '0ms',
                height: started ? `${h}%` : '4px',
              }}
            />
            <span
              className="hidden sm:block text-center truncate w-full"
              style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {[
          { c: '#ef4444', l: 'Critical' }, { c: '#f59e0b', l: 'High' },
          { c: '#fbbf24', l: 'Moderate' }, { c: '#22c55e', l: 'Low'  },
        ].map(({ c, l }) => (
          <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} aria-hidden="true" />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

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
              className="gradient-text font-black leading-tight mb-4"
              style={{
                fontFamily: 'Poppins, Inter, sans-serif',
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
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
          {METRICS.map(({ id, to, suffix, decimals, label, sub, emoji }, i) => (
            <Reveal key={id} delay={i * 110}>
              <div className="metric-card" id={`metric-${id}`}>
                <div className="text-3xl mb-3" aria-hidden="true">{emoji}</div>
                <div
                  className="gradient-text font-black mb-1"
                  style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2.4rem, 4vw, 3.25rem)' }}
                >
                  <Counter to={to} suffix={suffix} decimals={decimals || 0} duration={2000} />
                </div>
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {label}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Chart */}
        <Reveal>
          <ChartPreview />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION 4: CALL TO ACTION
───────────────────────────────────────────────────────────────────────────── */
function CTASection() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <section
      id="cta"
      className="section-alt py-24 px-4"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-2xl mx-auto text-center">

        <Reveal>
          <span className="badge mb-6">🚀 Early Access</span>
        </Reveal>

        <Reveal delay={80}>
          <h2
            id="cta-heading"
            className="gradient-text font-black leading-tight mb-5"
            style={{
              fontFamily: 'Poppins, Inter, sans-serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
            }}
          >
            Ready to Cool Your City?
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p
            className="mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}
          >
            Join 200+ city planners and climate scientists already using our platform to design
            cooler, more resilient urban environments.
          </p>
        </Reveal>

        {/* Email form */}
        <Reveal delay={240}>
          {submitted ? (
            <div
              className="flex flex-col items-center gap-3 py-8"
              role="alert"
              aria-live="polite"
              id="cta-success"
            >
              <span className="text-5xl">🎉</span>
              <p className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
                You&apos;re on the list!
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                We&apos;ll reach out soon with early access details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate id="cta-email-form">
              <div className="email-input-group mb-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@yourcity.gov"
                  aria-label="Work email address"
                  id="cta-email-input"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="btn-primary"
                  id="cta-submit-btn"
                  style={{
                    flexShrink: 0,
                    margin: '5px',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Get Started
                </button>
              </div>
              {error && (
                <p className="text-sm mt-1" style={{ color: '#ef4444' }} role="alert" id="cta-error">
                  {error}
                </p>
              )}
            </form>
          )}
        </Reveal>

        {/* Trust badges */}
        <Reveal delay={320}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {[
              { icon: '🔓', label: 'Open Source'    },
              { icon: '🤖', label: 'Powered by AI'  },
              { icon: '📈', label: 'Data-Driven'    },
            ].map(({ icon, label }) => (
              <span key={label} className="trust-badge">
                {icon} {label}
              </span>
            ))}
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
        <title>Urban Heat Mitigation System – AI-Powered Cooling for Cities</title>
        <meta
          name="description"
          content="Detect urban heat islands, analyse root causes with AI, and deploy smart cooling interventions. Trusted by 150+ cities worldwide."
        />
      </Head>
      <main>
        <HeroSection    apiStatus={apiStatus} />
        <FeaturesSection />
        <MetricsSection />
        <CTASection />
      </main>
    </>
  );
}