import React, { useEffect, useMemo, useState } from 'react';
import { TopNav } from '../TopNav';
import { useAuth } from '../../../../context/AuthContext';
import { User, Mail, Phone, Building2, CalendarDays, Edit2, Check } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';
import { getDepartmentLabel } from '../../../../utils/departmentLabel';
import api from '../../../../services/api';

export default function ProfilePage() {
  const { currentUser, refreshCurrentUser } = useAuth();
  const { lang } = useTheme();
  const t = useT(lang);
  const copy = {
    nameValidation: lang === 'RO' ? 'Completeaza prenumele si numele.' : 'Please enter both first and last name.',
    saved: lang === 'RO' ? 'Profil actualizat cu succes.' : 'Profile updated successfully.',
    saveError: lang === 'RO' ? 'Actualizarea profilului a esuat.' : 'Failed to update profile.',
    saving: lang === 'RO' ? 'Se salveaza...' : 'Saving...',
  };
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const initialForm = useMemo(() => ({
    name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.name || 'Employee',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: getDepartmentLabel(currentUser?.department, t, { fallback: '—' }),
    role: currentUser?.position || currentUser?.role || '—',
    joined: currentUser?.hireDate || currentUser?.createdAt?.slice(0, 10) || '',
  }), [currentUser, t]);

  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(form);

  useEffect(() => {
    setForm(initialForm);
    setSaved(initialForm);
  }, [initialForm]);

  async function handleSave() {
    const nameParts = form.name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');

    if (!firstName || !lastName) {
      setError(copy.nameValidation);
      return;
    }

    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      await api.put('/auth/me', {
        firstName,
        lastName,
        phone: form.phone,
      });
      await refreshCurrentUser?.();
      setSaved({
        ...form,
        name: `${firstName} ${lastName}`.trim(),
      });
      setEditMode(false);
      setSavedMessage(copy.saved);
    } catch (err) {
      setError(err.message || copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  const initials = saved.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const fields = [
    { label: t('profile.fullName'),   key: 'name',       icon: User,         type: 'text', editable: true  },
    { label: t('profile.email'),      key: 'email',      icon: Mail,         type: 'email', editable: false },
    { label: t('profile.phone'),      key: 'phone',      icon: Phone,        type: 'tel', editable: true   },
    { label: t('profile.department'), key: 'department', icon: Building2,    type: 'text', editable: false  },
    { label: t('profile.role'),       key: 'role',       icon: User,         type: 'text', editable: false  },
    { label: t('profile.joinedLabel'),key: 'joined',     icon: CalendarDays, type: 'date', editable: false  },
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
            <p className="text-dash-text-muted" style={{ fontSize: '12px' }}>
              {t('profile.joined')} {saved.joined ? new Date(saved.joined).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US', { month: 'long', year: 'numeric' }) : '—'}
            </p>
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
          {fields.map(({ label, key, icon: Icon, type, editable }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dash-sidebar flex items-center justify-center shrink-0">
                <Icon size={15} className="text-dash-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-dash-text-muted" style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                {editMode && editable ? (
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

          {savedMessage && (
            <p className="text-emerald-400" style={{ fontSize: '12px' }}>{savedMessage}</p>
          )}
          {error && (
            <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>
          )}

          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-dash-primary text-white py-2 rounded-lg hover:bg-dash-primary/90 transition-colors"
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              <Check size={15} />
              {saving ? copy.saving : t('profile.saveChanges')}
            </button>
          )}
        </div>

      </main>
    </div>
  );
}
