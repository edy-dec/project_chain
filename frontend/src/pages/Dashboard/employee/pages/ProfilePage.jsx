import React, { useState } from 'react';
import { TopNav } from '../TopNav';
import { useAuth } from '../../../../context/AuthContext';
import { User, Mail, Phone, Building2, CalendarDays, Edit2, Check } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { lang } = useTheme();
  const t = useT(lang);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name:       currentUser?.name  || 'Employee',
    email:      currentUser?.email || '',
    phone:      '+1 (555) 000-0000',
    department: 'Engineering',
    role:       'Software Developer',
    joined:     '2023-03-15',
  });
  const [saved, setSaved] = useState(form);

  function handleSave() {
    setSaved(form);
    setEditMode(false);
  }

  const initials = saved.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const fields = [
    { label: t('profile.fullName'),   key: 'name',       icon: User,         type: 'text'  },
    { label: t('profile.email'),      key: 'email',       icon: Mail,         type: 'email' },
    { label: t('profile.phone'),      key: 'phone',       icon: Phone,        type: 'tel'   },
    { label: t('profile.department'), key: 'department',  icon: Building2,    type: 'text'  },
    { label: t('profile.role'),       key: 'role',        icon: User,         type: 'text'  },
    { label: t('profile.joinedLabel'),key: 'joined',      icon: CalendarDays, type: 'date'  },
  ];

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('profile.title')} />
      <main className="p-6 space-y-6 max-w-2xl">

        {/* Avatar card */}
        <div className="bg-dash-card border border-dash-border rounded-xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-dash-primary flex items-center justify-center text-white shrink-0" style={{ fontSize: '28px', fontWeight: 700 }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-dash-text truncate" style={{ fontSize: '20px', fontWeight: 700 }}>{saved.name}</p>
            <p className="text-dash-text-muted" style={{ fontSize: '13px' }}>{saved.role} · {saved.department}</p>
            <p className="text-dash-text-muted" style={{ fontSize: '12px' }}>{t('profile.joined')} {new Date(saved.joined).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              editMode ? 'border-dash-primary text-dash-primary bg-dash-primary/10' : 'border-dash-border text-dash-text-secondary hover:bg-dash-sidebar-hover'
            }`}
            style={{ fontSize: '13px' }}
          >
            <Edit2 size={13} />
            {editMode ? t('profile.editing') : t('profile.edit')}
          </button>
        </div>

        {/* Details */}
        <div className="bg-dash-card border border-dash-border rounded-xl p-5 space-y-4">
          <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('profile.personalInfo')}</h3>
          {fields.map(({ label, key, icon: Icon, type }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dash-sidebar flex items-center justify-center shrink-0">
                <Icon size={15} className="text-dash-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-dash-text-muted" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                {editMode ? (
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-0.5 w-full bg-dash-sidebar border border-dash-border rounded-md px-2 py-1 text-dash-text outline-none focus:border-dash-primary transition-colors"
                    style={{ fontSize: '13px' }}
                  />
                ) : (
                  <p className="text-dash-text mt-0.5 truncate" style={{ fontSize: '13px' }}>{saved[key]}</p>
                )}
              </div>
            </div>
          ))}

          {editMode && (
            <button
              onClick={handleSave}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-dash-primary text-white py-2 rounded-lg hover:bg-dash-primary/90 transition-colors"
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              <Check size={15} />
              {t('profile.saveChanges')}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
