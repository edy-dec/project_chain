import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CalendarCheck, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { createDemoRequest } from '../../services/demoRequestService';
import { subscribeToNewsletter } from '../../services/newsletterService';
import './LandingPage.css';

const T = {
  en: {
    login: 'Login',
    requestAccess: 'Request Access',
    goToDashboard: 'Go to Dashboard',
    heroTitle: 'Complete HR Management Platform for Your Company.',
    heroSubtitle:
      'Time tracking, payroll automation, leave management and AI-powered support all in one place.',
    requestDemo: 'Request a Demo',
    demoModalTitle: 'Request a Demo',
    demoModalSubtitle:
      'Tell us a bit about your company and we will shape the walkthrough around your team.',
    demoFields: {
      fullName: 'Full name',
      company: 'Company',
      email: 'Work email',
      phone: 'Phone number',
      role: 'Role',
      teamSize: 'Team size',
      focus: 'What would you like to see in the demo?',
    },
    demoPlaceholders: {
      fullName: 'Jane Smith',
      company: 'Northwind Logistics',
      email: 'jane@company.com',
      phone: '+40 7xx xxx xxx',
      role: 'HR Manager',
      focus: 'We want to streamline attendance, leave approvals and payroll visibility.',
    },
    demoSizes: ['1-20 employees', '21-50 employees', '51-200 employees', '200+ employees'],
    demoSelectSize: 'Select',
    demoSubmit: 'Send Request',
    demoClose: 'Close',
    demoSubmitting: 'Sending...',
    demoSuccessTitle: 'Request sent successfully.',
    demoSuccessText:
      'Your demo request has been sent to our team. We will get back to you soon.',
    demoReset: 'Send another request',
    demoError: 'We could not submit your request right now.',
    featuresTitle: 'Built for ambitious teams.',
    features: [
      {
        title: 'Automated Time Tracking',
        description:
          'Clock in and out with automatic salary calculation, shift management, and comprehensive work history.',
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
    newsletterSuccess: 'Confirmation email sent. Please check your inbox.',
    newsletterError: 'We could not send the confirmation email right now.',
    footerText: `(c) ${new Date().getFullYear()} Chain. All rights reserved.`,
  },
  ro: {
    login: 'Autentificare',
    requestAccess: 'Solicita Acces',
    goToDashboard: 'Mergi la Dashboard',
    heroTitle: 'Platforma Completa de Management HR pentru Compania Ta.',
    heroSubtitle:
      'Pontaj digital, automatizare salarizare, gestionare concedii si asistenta AI, totul intr-un singur loc.',
    requestDemo: 'Solicita o Demonstratie',
    demoModalTitle: 'Solicita o Demonstratie',
    demoModalSubtitle:
      'Spune-ne cateva lucruri despre companie si pregatim prezentarea in jurul echipei tale.',
    demoFields: {
      fullName: 'Nume complet',
      company: 'Companie',
      email: 'Email de serviciu',
      phone: 'Numar de telefon',
      role: 'Rol',
      teamSize: 'Dimensiunea echipei',
      focus: 'Ce ai vrea sa vezi in demo?',
    },
    demoPlaceholders: {
      fullName: 'Andreea Popescu',
      company: 'Northwind Logistics',
      email: 'andreea@companie.ro',
      phone: '+40 7xx xxx xxx',
      role: 'HR Manager',
      focus: 'Vrem sa simplificam pontajul, aprobarile de concediu si claritatea pe salarizare.',
    },
    demoSizes: ['1-20 angajati', '21-50 angajati', '51-200 angajati', '200+ angajati'],
    demoSelectSize: 'Selecteaza',
    demoSubmit: 'Trimite Cererea',
    demoClose: 'Inchide',
    demoSubmitting: 'Se trimite...',
    demoSuccessTitle: 'Cererea a fost trimisa cu succes.',
    demoSuccessText:
      'Cererea ta de demo a fost trimisa catre echipa noastra. Revenim cat mai curand.',
    demoReset: 'Trimite alta cerere',
    demoError: 'Nu am putut trimite cererea acum.',
    featuresTitle: 'Construit pentru echipe ambitioase.',
    features: [
      {
        title: 'Pontaj Automat',
        description:
          'Intrare si iesire cu calcul automat al salariului, gestionare ture si istoric complet al activitatii.',
      },
      {
        title: 'Gestionare Concedii',
        description:
          'Depune cereri de concediu, urmareste zilele disponibile si gestioneaza aprobarile cu transparenta totala.',
      },
      {
        title: 'Asistent AI Chatbot',
        description:
          'Primeste raspunsuri instant despre program, ore lucrate, detalii salariu si suport pentru aplicatie.',
      },
    ],
    newsletterTitle: 'Informatii pentru Lideri',
    emailPlaceholder: 'Introdu adresa de email',
    subscribe: 'Aboneaza-te',
    newsletterSuccess: 'Emailul de confirmare a fost trimis. Verifica inbox-ul.',
    newsletterError: 'Nu am putut trimite emailul de confirmare acum.',
    footerText: `(c) ${new Date().getFullYear()} Chain. Toate drepturile rezervate.`,
  },
};

const FEATURE_ICONS = [Clock, CalendarCheck, Bot];
const INITIAL_DEMO_FORM = {
  fullName: '',
  company: '',
  email: '',
  phone: '',
  role: '',
  teamSize: '',
  focus: '',
};

function LandingDemoModal({ lang, isOpen, onClose }) {
  const t = T[lang];
  const [form, setForm] = useState(INITIAL_DEMO_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createDemoRequest(form);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error.message || t.demoError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_DEMO_FORM);
    setSubmitted(false);
    setIsSubmitting(false);
    setErrorMessage('');
    onClose();
  };

  const resetForm = () => {
    setForm(INITIAL_DEMO_FORM);
    setSubmitted(false);
    setIsSubmitting(false);
    setErrorMessage('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t.demoModalTitle} size="lg">
      {!submitted ? (
        <div className="lp-demo-modal">
          <p className="lp-demo-subtitle">{t.demoModalSubtitle}</p>

          <form className="lp-demo-form" onSubmit={handleSubmit}>
            <label className="lp-demo-field">
              <span>{t.demoFields.fullName}</span>
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder={t.demoPlaceholders.fullName}
                disabled={isSubmitting}
                required
              />
            </label>

            <label className="lp-demo-field">
              <span>{t.demoFields.company}</span>
              <input
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                placeholder={t.demoPlaceholders.company}
                disabled={isSubmitting}
                required
              />
            </label>

            <div className="lp-demo-grid">
              <label className="lp-demo-field">
                <span>{t.demoFields.email}</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder={t.demoPlaceholders.email}
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label className="lp-demo-field">
                <span>{t.demoFields.phone}</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder={t.demoPlaceholders.phone}
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className="lp-demo-grid">
              <label className="lp-demo-field">
                <span>{t.demoFields.role}</span>
                <input
                  type="text"
                  value={form.role}
                  onChange={handleChange('role')}
                  placeholder={t.demoPlaceholders.role}
                  disabled={isSubmitting}
                  required
                />
              </label>

              <label className="lp-demo-field">
                <span>{t.demoFields.teamSize}</span>
                <select
                  value={form.teamSize}
                  onChange={handleChange('teamSize')}
                  disabled={isSubmitting}
                  required
                >
                  <option value="">{t.demoSelectSize}</option>
                  {t.demoSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="lp-demo-field">
              <span>{t.demoFields.focus}</span>
              <textarea
                rows="5"
                value={form.focus}
                onChange={handleChange('focus')}
                placeholder={t.demoPlaceholders.focus}
                disabled={isSubmitting}
                required
              />
            </label>

            {errorMessage ? <p className="lp-demo-error">{errorMessage}</p> : null}

            <div className="lp-demo-actions">
              <button
                type="button"
                className="lp-btn lp-btn-outline lp-btn-pill lp-btn-lg"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t.demoClose}
              </button>
              <button type="submit" className="lp-btn lp-btn-dark lp-btn-pill lp-btn-lg">
                {isSubmitting ? t.demoSubmitting : t.demoSubmit}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="lp-demo-success">
          <h4 className="lp-demo-success-title">{t.demoSuccessTitle}</h4>
          <p className="lp-demo-success-text">{t.demoSuccessText}</p>
          <div className="lp-demo-actions">
            <button
              type="button"
              className="lp-btn lp-btn-outline lp-btn-pill lp-btn-lg"
              onClick={handleClose}
            >
              {t.demoClose}
            </button>
            <button
              type="button"
              className="lp-btn lp-btn-dark lp-btn-pill lp-btn-lg"
              onClick={resetForm}
            >
              {t.demoReset}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function LandingHeader({ lang, setLang }) {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const t = T[lang];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
          <span className="lp-logo">Chain</span>

          <nav className="lp-header-nav">
            <div className="lp-lang-wrapper" ref={dropdownRef}>
              <button
                className="lp-lang-btn"
                aria-label="Language"
                onClick={() => setDropdownOpen((open) => !open)}
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
                  {['en', 'ro'].map((option) => (
                    <button
                      key={option}
                      className={`lp-lang-option${lang === option ? ' lp-lang-option--active' : ''}`}
                      onClick={() => handleLangSelect(option)}
                    >
                      {option.toUpperCase()}
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

function LandingHero({ lang, onRequestDemo }) {
  const t = T[lang];

  return (
    <section className="lp-hero">
      <div className="lp-hero-glow" aria-hidden="true" />
      <div className="lp-container lp-hero-container">
        <div className="lp-hero-grid">
          <div className="lp-hero-copy">
            <h1 className="lp-hero-title">{t.heroTitle}</h1>
            <p className="lp-hero-subtitle">{t.heroSubtitle}</p>

            <div className="lp-hero-ctas">
              <button className="lp-btn lp-btn-dark lp-btn-pill lp-btn-lg" onClick={onRequestDemo}>
                {t.requestDemo}
              </button>
            </div>
          </div>

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

function LandingFeatures({ lang }) {
  const t = T[lang];

  return (
    <section className="lp-features">
      <div className="lp-container">
        <div className="lp-features-header">
          <h2 className="lp-features-title">{t.featuresTitle}</h2>
        </div>

        <div className="lp-features-grid">
          {t.features.map(({ title, description }, index) => {
            const Icon = FEATURE_ICONS[index];
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

function LandingNewsletter({ lang }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const t = T[lang];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await subscribeToNewsletter(email);
      setEmail('');
      setFeedback({ type: 'success', message: t.newsletterSuccess });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || t.newsletterError });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="lp-newsletter">
      <div className="lp-container lp-newsletter-container">
        <h2 className="lp-newsletter-title">{t.newsletterTitle}</h2>
        <form className="lp-newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="lp-email-input"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            required
          />
          <button type="submit" className="lp-btn lp-btn-dark lp-btn-subscribe" disabled={isSubmitting}>
            {isSubmitting ? '...' : t.subscribe}
          </button>
        </form>
        {feedback.message ? (
          <p className={`lp-newsletter-feedback lp-newsletter-feedback--${feedback.type}`}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function LandingFooter({ lang }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <p className="lp-footer-text">{T[lang].footerText}</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { loading } = useAuth();
  const [lang, setLang] = useState('en');
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="lp-root">
      <LandingHeader lang={lang} setLang={setLang} />
      <main>
        <LandingHero lang={lang} onRequestDemo={() => setIsDemoOpen(true)} />
        <LandingFeatures lang={lang} />
        <LandingNewsletter lang={lang} />
      </main>
      <LandingFooter lang={lang} />
      <LandingDemoModal lang={lang} isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
