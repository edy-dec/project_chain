import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Rocket, Send, Sparkles } from 'lucide-react';
import './DemoRequestPage.css';

const COPY = {
  en: {
    brand: 'Chain',
    back: 'Back Home',
    explore: 'Explore Platform',
    eyebrow: 'Request a Demo',
    title: 'Tell us a bit about your team and we will shape the walkthrough around it.',
    subtitle:
      'Use the form to request a tailored demo focused on scheduling, payroll, employee self-service or reporting.',
    asideTitle: 'What happens next',
    asidePoints: [
      'We review your team size and use case.',
      'We prepare a relevant walkthrough instead of a generic pitch.',
      'We contact you to confirm the best time for a live demo.',
    ],
    fields: {
      fullName: 'Full name',
      company: 'Company',
      email: 'Work email',
      phone: 'Phone number',
      role: 'Role',
      teamSize: 'Team size',
      focus: 'What would you like to see in the demo?',
    },
    placeholders: {
      fullName: 'Jane Smith',
      company: 'Northwind Logistics',
      email: 'jane@company.com',
      phone: '+40 7xx xxx xxx',
      role: 'HR Manager',
      focus: 'We want to streamline attendance, leave approvals and payroll visibility.',
    },
    sizes: ['1-20 employees', '21-50 employees', '51-200 employees', '200+ employees'],
    selectSize: 'Select',
    submit: 'Send Demo Request',
    successTitle: 'Your request is ready.',
    successText:
      'The demo request was captured locally in the form flow. If you want, the next step can be wiring this to a backend endpoint or email service.',
    reset: 'Submit another request',
  },
  ro: {
    brand: 'Chain',
    back: 'Înapoi Acasă',
    explore: 'Explorează Platforma',
    eyebrow: 'Solicită un Demo',
    title: 'Spune-ne câteva lucruri despre echipa ta și construim prezentarea în jurul lor.',
    subtitle:
      'Folosește formularul pentru a cere un demo adaptat pe programare, salarizare, self-service pentru angajați sau raportare.',
    asideTitle: 'Ce urmează după cerere',
    asidePoints: [
      'Analizăm dimensiunea echipei și cazul de utilizare.',
      'Pregătim un walkthrough relevant, nu o prezentare generică.',
      'Te contactăm pentru a confirma momentul potrivit pentru un demo live.',
    ],
    fields: {
      fullName: 'Nume complet',
      company: 'Companie',
      email: 'Email de serviciu',
      phone: 'Număr de telefon',
      role: 'Rol',
      teamSize: 'Dimensiunea echipei',
      focus: 'Ce ai vrea să vezi în demo?',
    },
    placeholders: {
      fullName: 'Andreea Popescu',
      company: 'Northwind Logistics',
      email: 'andreea@companie.ro',
      phone: '+40 7xx xxx xxx',
      role: 'HR Manager',
      focus: 'Vrem să simplificăm pontajul, aprobările de concediu și claritatea pe salarizare.',
    },
    sizes: ['1-20 angajați', '21-50 angajați', '51-200 angajați', '200+ angajați'],
    selectSize: 'Selectează',
    submit: 'Trimite Cererea',
    successTitle: 'Cererea este pregătită.',
    successText:
      'Cererea de demo a fost capturată local în flow-ul formularului. Dacă vrei, următorul pas poate fi conectarea la un endpoint backend sau la un serviciu de email.',
    reset: 'Trimite o altă cerere',
  },
};

const INITIAL_FORM = {
  fullName: '',
  company: '',
  email: '',
  phone: '',
  role: '',
  teamSize: '',
  focus: '',
};

function DemoTopBar({ lang, setLang, backLabel, exploreLabel }) {
  const navigate = useNavigate();

  return (
    <header className="dr-header">
      <div className="dr-shell dr-header-inner">
        <button className="dr-brand" onClick={() => navigate('/')}>
          Chain
        </button>

        <div className="dr-header-actions">
          <div className="dr-language-switch">
            {['en', 'ro'].map((code) => (
              <button
                key={code}
                className={`dr-language-btn${lang === code ? ' is-active' : ''}`}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="dr-link-btn" onClick={() => navigate('/')}>
            {backLabel}
          </button>
          <button
            className="dr-outline-btn"
            onClick={() => navigate('/platform-overview', { state: { lang } })}
          >
            {exploreLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function DemoRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(location.state?.lang || 'en');
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const t = COPY[lang];

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setSubmitted(false);
  };

  return (
    <div className="dr-root">
      <DemoTopBar
        lang={lang}
        setLang={setLang}
        backLabel={t.back}
        exploreLabel={t.explore}
      />

      <main className="dr-main">
        <div className="dr-shell dr-layout">
          <section className="dr-intro">
            <span className="dr-eyebrow">
              <Sparkles size={16} />
              {t.eyebrow}
            </span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>

            <div className="dr-aside-card">
              <div className="dr-aside-icon">
                <Rocket size={22} />
              </div>
              <h2>{t.asideTitle}</h2>
              <ul className="dr-point-list">
                {t.asidePoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="dr-form-card">
            {!submitted ? (
              <form className="dr-form" onSubmit={handleSubmit}>
                <label className="dr-field">
                  <span>{t.fields.fullName}</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    placeholder={t.placeholders.fullName}
                    required
                  />
                </label>

                <label className="dr-field">
                  <span>{t.fields.company}</span>
                  <input
                    type="text"
                    value={form.company}
                    onChange={handleChange('company')}
                    placeholder={t.placeholders.company}
                    required
                  />
                </label>

                <div className="dr-two-col">
                  <label className="dr-field">
                    <span>{t.fields.email}</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder={t.placeholders.email}
                      required
                    />
                  </label>

                  <label className="dr-field">
                    <span>{t.fields.phone}</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      placeholder={t.placeholders.phone}
                    />
                  </label>
                </div>

                <div className="dr-two-col">
                  <label className="dr-field">
                    <span>{t.fields.role}</span>
                    <input
                      type="text"
                      value={form.role}
                      onChange={handleChange('role')}
                      placeholder={t.placeholders.role}
                      required
                    />
                  </label>

                  <label className="dr-field">
                    <span>{t.fields.teamSize}</span>
                    <select
                      value={form.teamSize}
                      onChange={handleChange('teamSize')}
                      required
                    >
                      <option value="">{t.selectSize}</option>
                      {t.sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="dr-field">
                  <span>{t.fields.focus}</span>
                  <textarea
                    rows="5"
                    value={form.focus}
                    onChange={handleChange('focus')}
                    placeholder={t.placeholders.focus}
                    required
                  />
                </label>

                <button type="submit" className="dr-submit-btn">
                  {t.submit}
                  <Send size={17} />
                </button>
              </form>
            ) : (
              <div className="dr-success-state">
                <CheckCircle2 size={56} />
                <h2>{t.successTitle}</h2>
                <p>{t.successText}</p>
                <div className="dr-success-actions">
                  <button className="dr-submit-btn" onClick={resetForm}>
                    {t.reset}
                  </button>
                  <button
                    className="dr-outline-btn"
                    onClick={() => navigate('/platform-overview', { state: { lang } })}
                  >
                    <ArrowLeft size={17} />
                    {t.explore}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
