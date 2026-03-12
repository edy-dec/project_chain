/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Admin design-system tokens ── */
        background:   'var(--background)',
        foreground:   'var(--foreground)',
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border:       'var(--border)',
        input:        'var(--input)',
        ring:         'var(--ring)',
        success:      'var(--success)',
        warning:      'var(--warning)',
        error:        'var(--error)',
        sidebar: {
          DEFAULT:    'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary:    'var(--sidebar-primary)',
          accent:     'var(--sidebar-accent)',
          border:     'var(--sidebar-border)',
          ring:       'var(--sidebar-ring)',
        },
        /* ── Employee dashboard dash-* tokens (light + dark via html.dark) ── */
        'dash-bg':            'var(--dash-bg)',
        'dash-card':          'var(--dash-card)',
        'dash-border':        'var(--dash-border)',
        'dash-divider':       'var(--dash-divider)',
        'dash-primary':       'var(--dash-primary)',
        'dash-primary-light': 'var(--dash-primary-light)',
        'dash-text':          'var(--dash-text)',
        'dash-text-secondary':'var(--dash-text-secondary)',
        'dash-text-muted':    'var(--dash-text-muted)',
        'dash-success':       'var(--dash-success)',
        'dash-success-light': 'var(--dash-success-light)',
        'dash-warning':       'var(--dash-warning)',
        'dash-warning-light': 'var(--dash-warning-light)',
        'dash-error':         'var(--dash-error)',
        'dash-error-light':   'var(--dash-error-light)',
        'dash-surface':       'var(--dash-surface)',
        'dash-sidebar':       'var(--dash-sidebar)',
        'dash-sidebar-hover': 'var(--dash-sidebar-hover)',
        'dash-input':         'var(--dash-input)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'calc(var(--radius-lg) - 2px)',
        sm: 'calc(var(--radius-lg) - 4px)',
      },
    },
  },
  plugins: [],
};
