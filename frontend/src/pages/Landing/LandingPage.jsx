import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, CalendarCheck, Bot, ChevronDown } from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import './LandingPage.css';

/* ── Translations ───────────────────────────────────────────────────────── */
const T = {
  en: {
    login: 'Login',
    requestAccess: 'Request Access',
    goToDashboard: 'Go to Dashboard',
    heroTitle: 'Complete HR Management Platform for Your Company.',
    heroSubtitle:
      'Time tracking, payroll automation, leave management and AI-powered support – all in one place.',
    requestDemo: 'Request a Demo',
    explorePlatform: 'Explore Platform',
    featuresTitle: 'Built for ambitious teams.',
    features: [
      {
        title: 'Automated Time Tracking',
        description:
          'Clock in/out with automatic salary calculation, shift management, and comprehensive work history.',
      },
      {
        title: 'Leave Management',
        description:
          'Submit leave requests, track vacation days, and manage approvals with full transparency.',
      },
      {
        title: 'AI Chatbot Assistant',
        description:
          'Get instant answers about your schedule, hours worked, salary breakdown, and app support.',
      },
    ],
    newsletterTitle: 'Insights for Leaders',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    footerText: `© ${new Date().getFullYear()} Chain. All rights reserved.`,
  },
  ro: {
    login: 'Autentificare',
    requestAccess: 'Solicită Acces',
    goToDashboard: 'Mergi la Dashboard',
    heroTitle: 'Platforma Completă de Management HR pentru Compania Ta.',
    heroSubtitle:
      'Pontaj digital, automatizare salarizare, gestionare concedii și asistență AI – totul într-un singur loc.',
    requestDemo: 'Solicită o Demonstrație',
    explorePlatform: 'Explorează Platforma',
    featuresTitle: 'Construit pentru echipe ambițioase.',
    features: [
      {
        title: 'Pontaj Automat',
        description:
          'Intrare/ieșire cu calcul automat al salariului, gestionare ture și istoric complet al activității.',
      },
      {
        title: 'Gestionare Concedii',
        description:
          'Depune cereri de concediu, urmărește zilele disponibile și gestionează aprobările cu transparență totală.',
      },
      {
        title: 'Asistent AI Chatbot',
        description:
          'Primește răspunsuri instant despre program, ore lucrate, detalii salariu și suport pentru aplicație.',
      },
    ],
    newsletterTitle: 'Informații pentru Lideri',
    emailPlaceholder: 'Introdu adresa de email',
    subscribe: 'Abonează-te',
    footerText: `© ${new Date().getFullYear()} Chain. Toate drepturile rezervate.`,
  },
};

const FEATURE_ICONS = [Clock, CalendarCheck, Bot];

/* ── Header ─────────────────────────────────────────────────────────────── */
function LandingHeader({ lang, setLang }) {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const t = T[lang];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLangSelect = (value) => {
    setLang(value);
    setDropdownOpen(false);
  };

  return (
    <header className="lp-header">
      <div className="lp-container">
        <div className="lp-header-inner">
          {/* Logo */}
          <span className="lp-logo">Chain</span>

          {/* Right side */}
          <nav className="lp-header-nav">
            {/* Language selector */}
            <div className="lp-lang-wrapper" ref={dropdownRef}>
              <button
                className="lp-lang-btn"
                aria-label="Language"
                onClick={() => setDropdownOpen((p) => !p)}
              >
                <span>{lang.toUpperCase()}</span>
                <ChevronDown
                  className="lp-lang-chevron"
                  size={14}
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
              {dropdownOpen && (
                <div className="lp-lang-dropdown">
                  {['en', 'ro'].map((l) => (
                    <button
                      key={l}
                      className={`lp-lang-option${lang === l ? ' lp-lang-option--active' : ''}`}
                      onClick={() => handleLangSelect(l)}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <button
                className="lp-btn lp-btn-dark lp-btn-pill lp-btn-sm"
                onClick={() => navigate('/dashboard')}
              >
                {t.goToDashboard}
              </button>
            ) : (
              <>
                <button className="lp-link-btn" onClick={() => login()}>
                  {t.login}
                </button>
                <button
                  className="lp-btn lp-btn-dark lp-btn-pill lp-btn-sm"
                  onClick={() => login()}
                >
                  {t.requestAccess}
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function LandingHero({ lang }) {
  const { login } = useAuth();
  const t = T[lang];

  return (
    <section className="lp-hero">
      <div className="lp-hero-glow" aria-hidden="true" />
      <div className="lp-container lp-hero-container">
        <div className="lp-hero-grid">
          {/* Left – copy */}
          <div className="lp-hero-copy">
            <h1 className="lp-hero-title">{t.heroTitle}</h1>
            <p className="lp-hero-subtitle">{t.heroSubtitle}</p>

            <div className="lp-hero-ctas">
              <button
                className="lp-btn lp-btn-dark lp-btn-pill lp-btn-lg"
                onClick={() => login()}
              >
                {t.requestDemo}
              </button>
              <button
                className="lp-btn lp-btn-outline lp-btn-pill lp-btn-lg"
                onClick={() => login()}
              >
                {t.explorePlatform}
              </button>
            </div>
          </div>

          {/* Right – dashboard video */}
          <div className="lp-hero-image-wrap">
            <div className="lp-hero-image-card">
              <video
                src="/hero-video.mp4"
                className="lp-hero-img"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
            <div className="lp-hero-image-glow" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features / Trust section ───────────────────────────────────────────── */
function LandingFeatures({ lang }) {
  const t = T[lang];

  return (
    <section className="lp-features">
      <div className="lp-container">
        <div className="lp-features-header">
          <h2 className="lp-features-title">{t.featuresTitle}</h2>
        </div>

        <div className="lp-features-grid">
          {t.features.map(({ title, description }, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon-wrap">
                  <Icon size={24} />
                </div>
                <h3 className="lp-feature-card-title">{title}</h3>
                <p className="lp-feature-card-desc">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Newsletter ─────────────────────────────────────────────────────────── */
function LandingNewsletter({ lang }) {
  const [email, setEmail] = useState('');
  const t = T[lang];

  return (
    <section className="lp-newsletter">
      <div className="lp-container lp-newsletter-container">
        <h2 className="lp-newsletter-title">{t.newsletterTitle}</h2>
        <form
          className="lp-newsletter-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            className="lp-email-input"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="lp-btn lp-btn-dark lp-btn-subscribe">
            {t.subscribe}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function LandingFooter({ lang }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <p className="lp-footer-text">{T[lang].footerText}</p>
      </div>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { loading } = useAuth();
  const [lang, setLang] = useState('en');

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="lp-root">
      <LandingHeader lang={lang} setLang={setLang} />
      <main>
        <LandingHero lang={lang} />
        <LandingFeatures lang={lang} />
        <LandingNewsletter lang={lang} />
      </main>
      <LandingFooter lang={lang} />
    </div>
  );
}
