import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  ChevronLeft,
  Clock3,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import './PlatformOverviewPage.css';

const COPY = {
  en: {
    brand: 'Chain',
    backHome: 'Back Home',
    requestDemo: 'Request a Demo',
    heroEyebrow: 'A guided tour of the platform',
    heroTitle: 'One HR workspace for payroll, people operations and employee support.',
    heroSubtitle:
      'Chain brings time tracking, leave approvals, salary clarity and AI support into one experience that feels fast for employees and reliable for managers.',
    heroPrimary: 'Book a Demo',
    heroSecondary: 'See the Landing Page',
    heroStats: [
      { value: '3 min', label: 'to approve leave and schedule updates' },
      { value: '1 app', label: 'for HR, payroll and employee self-service' },
      { value: '24/7', label: 'AI guidance for routine questions' },
    ],
    capabilityTitle: 'What teams can do with it',
    capabilityKicker: 'Product overview',
    capabilitySubtitle:
      'The platform is designed around the daily questions every company gets from employees, HR and operations.',
    capabilities: [
      {
        icon: Clock3,
        title: 'Track working time cleanly',
        description:
          'Employees clock in and out, managers see attendance patterns, and payroll has a trustworthy source of hours.',
      },
      {
        icon: CalendarCheck,
        title: 'Manage leave without chaos',
        description:
          'Requests, balances and approvals stay visible so nobody has to chase spreadsheets or inbox threads.',
      },
      {
        icon: CreditCard,
        title: 'Make payroll easier to explain',
        description:
          'Salary views, bonus logic and reporting give employees transparency while helping admins close the month faster.',
      },
    ],
    showcaseTitle: 'A presentation-style look at the product',
    showcases: [
      {
        eyebrow: 'Operations dashboard',
        title: 'A single place to see activity, exceptions and approvals.',
        description:
          'Supervisors can keep an eye on attendance, upcoming leave and schedule pressure without opening three separate tools.',
        points: ['Live attendance overview', 'Shift and leave visibility', 'Clear action queue for approvals'],
      },
      {
        eyebrow: 'Employee self-service',
        title: 'Employees can find what they need without waiting for HR.',
        description:
          'From salary details to work history and profile data, the app gives people a direct line to their own information.',
        points: ['Salary and history access', 'Profile and personal details', 'Fast requests from the same account'],
      },
      {
        eyebrow: 'AI support layer',
        title: 'Routine questions can be answered instantly.',
        description:
          'The chatbot helps employees understand schedules, worked hours and salary-related context, reducing repetitive support work.',
        points: ['Context-aware employee answers', 'Practical app guidance', 'Better response speed for support'],
      },
    ],
    flowTitle: 'How the platform fits a normal work week',
    flowSteps: [
      { step: '01', title: 'Employees track time', text: 'Daily activity and shifts are captured from the same workspace.' },
      { step: '02', title: 'Managers review exceptions', text: 'Approvals, absences and staffing issues become visible early.' },
      { step: '03', title: 'Payroll uses consistent data', text: 'Hours, bonuses and reporting stay connected instead of fragmented.' },
      { step: '04', title: 'Support load drops', text: 'Employees self-serve more often, and the AI assistant covers routine questions.' },
    ],
    finalTitle: 'Want the full walkthrough with your team’s use case?',
    finalText:
      'We can turn this overview into a tailored demo focused on your employee flow, admin workflow and reporting needs.',
    finalCta: 'Request Your Demo',
    footer: `© ${new Date().getFullYear()} Chain. Built for modern HR operations.`,
  },
  ro: {
    brand: 'Chain',
    backHome: 'Înapoi Acasă',
    requestDemo: 'Solicită o Demonstrație',
    heroEyebrow: 'Tur ghidat al platformei',
    heroTitle: 'Un singur spațiu HR pentru salarizare, operațiuni și suport pentru angajați.',
    heroSubtitle:
      'Chain aduce pontajul, aprobările de concediu, claritatea salarială și suportul AI într-o singură experiență, rapidă pentru angajați și sigură pentru management.',
    heroPrimary: 'Programează un Demo',
    heroSecondary: 'Vezi Landing Page-ul',
    heroStats: [
      { value: '3 min', label: 'pentru aprobări de concediu și actualizări de program' },
      { value: '1 app', label: 'pentru HR, payroll și self-service pentru angajați' },
      { value: '24/7', label: 'ghidaj AI pentru întrebările repetitive' },
    ],
    capabilityTitle: 'Ce pot face echipele cu platforma',
    capabilityKicker: 'Prezentare produs',
    capabilitySubtitle:
      'Platforma este gândită în jurul întrebărilor zilnice pe care le au angajații, HR-ul și operațiunile.',
    capabilities: [
      {
        icon: Clock3,
        title: 'Pontaj clar și coerent',
        description:
          'Angajații intră și ies din tură, managerii văd tiparele de prezență, iar payroll-ul primește o sursă sigură pentru ore.',
      },
      {
        icon: CalendarCheck,
        title: 'Concedii fără haos',
        description:
          'Cererile, soldurile și aprobările rămân vizibile, fără foi Excel răspândite și fără conversații pierdute în inbox.',
      },
      {
        icon: CreditCard,
        title: 'Salarizare mai ușor de explicat',
        description:
          'Vizualizările de salariu, logica bonusurilor și raportarea oferă transparență angajaților și viteză administratorilor.',
      },
    ],
    showcaseTitle: 'O prezentare vizuală a produsului',
    showcases: [
      {
        eyebrow: 'Dashboard operațional',
        title: 'Un singur loc pentru activitate, excepții și aprobări.',
        description:
          'Supervizorii pot urmări prezența, concediile viitoare și presiunea pe program fără să deschidă mai multe instrumente.',
        points: ['Overview live pentru prezență', 'Vizibilitate pe ture și concedii', 'Cozi clare pentru aprobări'],
      },
      {
        eyebrow: 'Self-service pentru angajați',
        title: 'Angajații găsesc rapid informațiile fără să aștepte după HR.',
        description:
          'De la detalii salariale la istoric de muncă și date de profil, aplicația oferă acces direct la informațiile personale.',
        points: ['Acces la salariu și istoric', 'Profil și date personale', 'Cereri rapide din același cont'],
      },
      {
        eyebrow: 'Strat de suport AI',
        title: 'Întrebările repetitive pot primi răspuns instant.',
        description:
          'Chatbotul îi ajută pe angajați să înțeleagă programul, orele lucrate și contextul salarial, reducând munca repetitivă de suport.',
        points: ['Răspunsuri contextuale pentru angajați', 'Ghidaj practic în aplicație', 'Timp de răspuns mai bun pentru suport'],
      },
    ],
    flowTitle: 'Cum intră platforma într-o săptămână normală de lucru',
    flowSteps: [
      { step: '01', title: 'Angajații își fac pontajul', text: 'Activitatea zilnică și turele sunt urmărite în același spațiu.' },
      { step: '02', title: 'Managerii revizuiesc excepțiile', text: 'Aprobările, absențele și problemele de staffing devin vizibile din timp.' },
      { step: '03', title: 'Payroll folosește date coerente', text: 'Orele, bonusurile și rapoartele rămân conectate, nu fragmentate.' },
      { step: '04', title: 'Scade presiunea pe suport', text: 'Angajații își rezolvă singuri mai multe cereri, iar AI-ul preia întrebările de rutină.' },
    ],
    finalTitle: 'Vrei prezentarea completă pe cazul echipei tale?',
    finalText:
      'Putem transforma acest overview într-un demo adaptat pe fluxul angajaților, workflow-ul administratorilor și nevoile tale de raportare.',
    finalCta: 'Solicită Demo-ul',
    footer: `© ${new Date().getFullYear()} Chain. Creat pentru operațiuni HR moderne.`,
  },
};

function PublicTopBar({ lang, setLang, backLabel, demoLabel }) {
  const navigate = useNavigate();

  return (
    <header className="pp-header">
      <div className="pp-shell pp-header-inner">
        <button className="pp-brand" onClick={() => navigate('/')}>
          Chain
        </button>

        <div className="pp-header-actions">
          <div className="pp-language-switch" role="tablist" aria-label="Language selector">
            {['en', 'ro'].map((code) => (
              <button
                key={code}
                className={`pp-language-btn${lang === code ? ' is-active' : ''}`}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button className="pp-nav-link" onClick={() => navigate('/')}>
            {backLabel}
          </button>
          <button className="pp-nav-cta" onClick={() => navigate('/request-demo', { state: { lang } })}>
            {demoLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

function OverviewVisual() {
  return (
    <div className="pp-visual-stage">
      <div className="pp-main-media-card">
        <div className="pp-media-topline">
          <span className="pp-dot is-red" />
          <span className="pp-dot is-amber" />
          <span className="pp-dot is-green" />
        </div>
        <video
          src="/hero-video.mp4"
          className="pp-main-media"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <div className="pp-floating-card pp-floating-card--kpi">
        <div className="pp-floating-label">Attendance sync</div>
        <div className="pp-floating-value">98.4%</div>
        <div className="pp-progress">
          <span style={{ width: '98.4%' }} />
        </div>
      </div>

      <div className="pp-floating-card pp-floating-card--team">
        <div className="pp-avatar-row">
          <span />
          <span />
          <span />
        </div>
        <div className="pp-floating-label">Approvals in queue</div>
        <div className="pp-task-row">
          <strong>14 items</strong>
          <span>today</span>
        </div>
      </div>
    </div>
  );
}

function ShowcaseMock({ index }) {
  if (index === 0) {
    return (
      <div className="pp-mock-card">
        <div className="pp-mock-header">
          <ShieldCheck size={18} />
          <span>Ops board</span>
        </div>
        <div className="pp-mock-grid">
          <div className="pp-metric-box">
            <strong>124</strong>
            <span>checked in</span>
          </div>
          <div className="pp-metric-box">
            <strong>08</strong>
            <span>requests pending</span>
          </div>
          <div className="pp-chart-bars">
            <span style={{ height: '52%' }} />
            <span style={{ height: '74%' }} />
            <span style={{ height: '61%' }} />
            <span style={{ height: '88%' }} />
            <span style={{ height: '66%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="pp-mock-card pp-mock-card--profile">
        <div className="pp-profile-chip">
          <Users size={18} />
          <span>Employee self-service</span>
        </div>
        <div className="pp-profile-list">
          <div>
            <span>Salary summary</span>
            <strong>Updated monthly</strong>
          </div>
          <div>
            <span>Vacation balance</span>
            <strong>12 days left</strong>
          </div>
          <div>
            <span>Work history</span>
            <strong>Always available</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-mock-card pp-mock-card--assistant">
      <div className="pp-assistant-badge">
        <Bot size={18} />
        <span>AI assistant</span>
      </div>
      <div className="pp-chat-bubbles">
        <div className="pp-bubble">
          How many hours did I work this week?
        </div>
        <div className="pp-bubble is-answer">
          You logged 34.5 hours so far. Your next shift starts tomorrow at 09:00.
        </div>
        <div className="pp-bubble">
          Show my latest salary breakdown.
        </div>
      </div>
    </div>
  );
}

export default function PlatformOverviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(location.state?.lang || 'en');
  const t = COPY[lang];

  return (
    <div className="pp-root">
      <PublicTopBar
        lang={lang}
        setLang={setLang}
        backLabel={t.backHome}
        demoLabel={t.requestDemo}
      />

      <main>
        <section className="pp-hero">
          <div className="pp-shell pp-hero-grid">
            <div className="pp-hero-copy">
              <span className="pp-eyebrow">{t.heroEyebrow}</span>
              <h1 className="pp-title">{t.heroTitle}</h1>
              <p className="pp-subtitle">{t.heroSubtitle}</p>

              <div className="pp-hero-actions">
                <button
                  className="pp-primary-btn"
                  onClick={() => navigate('/request-demo', { state: { lang } })}
                >
                  {t.heroPrimary}
                  <ArrowRight size={18} />
                </button>
                <button className="pp-secondary-btn" onClick={() => navigate('/')}>
                  <ChevronLeft size={18} />
                  {t.heroSecondary}
                </button>
              </div>

              <div className="pp-stats-grid">
                {t.heroStats.map((stat) => (
                  <div key={stat.label} className="pp-stat-card">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <OverviewVisual />
          </div>
        </section>

        <section className="pp-capabilities">
          <div className="pp-shell">
            <div className="pp-section-header">
              <span className="pp-section-kicker">
                <Sparkles size={16} />
                {t.capabilityKicker}
              </span>
              <h2>{t.capabilityTitle}</h2>
              <p>{t.capabilitySubtitle}</p>
            </div>

            <div className="pp-capability-grid">
              {t.capabilities.map(({ icon: Icon, title, description }) => (
                <article key={title} className="pp-capability-card">
                  <div className="pp-capability-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pp-showcase">
          <div className="pp-shell">
            <div className="pp-section-header">
              <h2>{t.showcaseTitle}</h2>
            </div>

            <div className="pp-showcase-list">
              {t.showcases.map((item, index) => (
                <article
                  key={item.title}
                  className={`pp-showcase-row${index % 2 === 1 ? ' is-reversed' : ''}`}
                >
                  <div className="pp-showcase-copy">
                    <span className="pp-showcase-eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <ul className="pp-point-list">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pp-showcase-visual">
                    <ShowcaseMock index={index} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pp-flow">
          <div className="pp-shell">
            <div className="pp-section-header">
              <h2>{t.flowTitle}</h2>
            </div>

            <div className="pp-flow-grid">
              {t.flowSteps.map((step) => (
                <article key={step.step} className="pp-flow-card">
                  <span className="pp-flow-step">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pp-cta">
          <div className="pp-shell">
            <div className="pp-cta-panel">
              <div>
                <h2>{t.finalTitle}</h2>
                <p>{t.finalText}</p>
              </div>
              <button
                className="pp-primary-btn"
                onClick={() => navigate('/request-demo', { state: { lang } })}
              >
                {t.finalCta}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="pp-footer">
        <div className="pp-shell">
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
