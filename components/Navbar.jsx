import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * Navbar – sticky, glassmorphism, Pages Router compatible.
 * Features:
 *  • Scroll-aware blur + border
 *  • IntersectionObserver active-section tracking
 *  • Light / dark mode toggle (persisted to localStorage)
 *  • Animated hamburger for mobile
 *  • Backend status indicator
 */
export default function Navbar() {
  const router = useRouter();
  const currentPath = router.pathname;
  const [scrolled,       setScrolled]       = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [activeSection,  setActiveSection]  = useState('hero');
  const [theme,          setTheme]          = useState('dark'); // mirrors <html> class

  /* ── Sync theme state with the class already set by the inline script ── */
  useEffect(() => {
    const current = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    setTheme(current);
  }, []);

  /* ── Toggle light / dark ─────────────────────────────────────────────── */
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const prev = theme;
    document.documentElement.classList.replace(prev, next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  /* ── Scroll shadow ───────────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Active section ──────────────────────────────────────────────────── */
  useEffect(() => {
    const ids = ['hero', 'features', 'metrics', 'cta'];
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const links = [
    { href: '#hero',           label: 'Home',          id: 'hero'           },
    { href: '/map',            label: 'Map',           id: 'map'            },
    { href: '/interventions',  label: 'Interventions', id: 'interventions' },
    { href: '/predict',        label: 'Predict',       id: 'predict'        },
  ];

  // Determine active state
  const isActive = (id) => {
    if (currentPath === '/map' && id === 'map') return true;
    if (currentPath === '/predict' && id === 'predict') return true;
    if (currentPath === '/interventions' && id === 'interventions') return true;
    if (currentPath === '/' && activeSection === id) return true;
    return false;
  };

  const close = () => setMenuOpen(false);

  return (
    <nav
      className={`nav-blur fixed top-0 left-0 right-0 z-50 ${scrolled ? 'scrolled' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link href="/#hero" legacyBehavior>
            <a className="flex items-center gap-2.5 shrink-0" onClick={close}>
              <span
                className="font-black text-base tracking-tight"
                style={{ fontFamily: 'Poppins, Inter, sans-serif', color: 'var(--accent)' }}
              >
                SVAR.
              </span>
            </a>
          </Link>

          {/* ── Desktop links ─────────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center gap-0.5" role="list">
            {links.map(({ href, label, id }) => {
              const active = isActive(id);
              const targetHref = href.startsWith('#') ? `/${href}` : href;
              return (
                <li key={id}>
                  <Link href={targetHref} legacyBehavior>
                    <a
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      style={{
                        display: 'block',
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        background: active ? 'var(--accent-subtle)' : 'transparent',
                        border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Right controls ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5">



            {/* Theme toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              id="navbar-theme-toggle"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>



            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl gap-1.5"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
              }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              id="navbar-hamburger"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: 'block',
                    width: '18px',
                    height: '2px',
                    background: 'var(--accent)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease',
                    transform:
                      menuOpen && i === 0 ? 'rotate(45deg) translate(5px, 5px)' :
                      menuOpen && i === 1 ? 'scaleX(0)' :
                      menuOpen && i === 2 ? 'rotate(-45deg) translate(4px, -4px)' :
                      'none',
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ─────────────────────────────────────────────── */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: menuOpen ? '320px' : '0',
            opacity: menuOpen ? 1 : 0,
            transition: 'max-height 0.35s ease, opacity 0.25s ease',
            paddingBottom: menuOpen ? '12px' : '0',
          }}
        >
          <ul className="flex flex-col gap-1 pt-2" role="list">
            {links.map(({ href, label, id }) => {
              const active = isActive(id);
              const targetHref = href.startsWith('#') ? `/${href}` : href;
              return (
                <li key={id}>
                  <Link href={targetHref} legacyBehavior>
                    <a
                      onClick={close}
                      style={{
                        display: 'block',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        background: active ? 'var(--accent-subtle)' : 'transparent',
                        border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
                      }}
                    >
                      {label}
                    </a>
                  </Link>
                </li>
              );
            })}

          </ul>
        </div>
      </div>
    </nav>
  );
}