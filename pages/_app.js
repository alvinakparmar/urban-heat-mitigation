import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ✅ Import Leaflet CSS for maps
import 'leaflet/dist/leaflet.css';

/**
 * _app.js – Next.js 12 Pages Router app wrapper.
 *
 * Theme initialisation: an inline <script> runs before React hydrates so
 * there is ZERO flash of the wrong theme on page load. It reads the
 * 'theme' key from localStorage (or falls back to the OS preference)
 * and adds the matching class ('dark' | 'light') to <html>.
 */

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`.trim();

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* ── Google Fonts ──────────────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ── SEO ───────────────────────────────────────────────── */}
        <title>Urban Heat Mitigation System – AI-Powered Cooling for Cities</title>
        <meta
          name="description"
          content="AI-powered platform that detects urban heat islands, analyses root causes, and recommends smart cooling interventions for cities worldwide."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots"   content="index, follow" />
        <meta charSet="utf-8" />

        {/* ── Open Graph ────────────────────────────────────────── */}
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content="Urban Heat Mitigation System" />
        <meta property="og:description" content="AI cooling solutions for sustainable cities." />
        <meta property="og:site_name"   content="UrbanHeatAI" />

        {/* ── Twitter Card ──────────────────────────────────────── */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Urban Heat Mitigation System" />
        <meta name="twitter:description" content="AI cooling solutions for sustainable cities." />

        {/* ── Theme ─────────────────────────────────────────────── */}
        <meta name="theme-color" content="#f59e0b" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/*
        This inline script must run BEFORE the page renders to avoid a
        flash of unstyled content. dangerouslySetInnerHTML is intentional.
      */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

      {/* ── Layout ──────────────────────────────────────────────── */}
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}

export default MyApp;