import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import settingsService from '../../services/settingsService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const DEFAULT_SETTINGS = {
  general: {
    companyName: 'Chain Technologies SRL',
    timezone: 'Europe/Bucharest',
    currency: 'RON',
    paydayDay: 10,
  },
  notifications: {
    emailNotifications: true,
    slackNotifications: false,
  },
  leavePolicy: {
    maxAnnualLeaveDays: 21,
    autoApproveShortLeave: false,
  },
};

const TIMEZONES = [
  'Europe/Bucharest',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
];

const CURRENCIES = [
  { value: 'RON', label: 'RON (lei)' },
  { value: 'EUR', label: 'EUR (EUR)' },
  { value: 'USD', label: 'USD (USD)' },
  { value: 'GBP', label: 'GBP (GBP)' },
];

export default function AdminSettings() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState({
    section: '',
    status: 'idle',
    message: '',
  });

  const isSavingSection = (section) => saveState.section === section && saveState.status === 'saving';
  const isSavedSection = (section) => saveState.section === section && saveState.status === 'success';

  useEffect(() => {
    settingsService.get()
      .then((res) => {
        const next = res.data?.data?.settings || {};
        setSettings({
          general: {
            companyName: next.general?.companyName || DEFAULT_SETTINGS.general.companyName,
            timezone: next.general?.timezone || DEFAULT_SETTINGS.general.timezone,
            currency: next.general?.currency || DEFAULT_SETTINGS.general.currency,
            paydayDay: next.general?.paydayDay ?? DEFAULT_SETTINGS.general.paydayDay,
          },
          notifications: {
            emailNotifications: Boolean(next.notifications?.emailNotifications ?? DEFAULT_SETTINGS.notifications.emailNotifications),
            slackNotifications: Boolean(next.notifications?.slackNotifications ?? DEFAULT_SETTINGS.notifications.slackNotifications),
          },
          leavePolicy: {
            maxAnnualLeaveDays: next.leavePolicy?.maxAnnualLeaveDays ?? DEFAULT_SETTINGS.leavePolicy.maxAnnualLeaveDays,
            autoApproveShortLeave: Boolean(next.leavePolicy?.autoApproveShortLeave ?? DEFAULT_SETTINGS.leavePolicy.autoApproveShortLeave),
          },
        });
      })
      .catch((error) => {
        setLoadError(error?.response?.data?.message || t('settings.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const saveButtonLabel = (section) => {
    if (isSavingSection(section)) return t('settings.saving');
    if (isSavedSection(section)) return t('settings.saved');
    return t('settings.save');
  };

  const saveErrorMessage = useMemo(() => (
    saveState.status === 'error' ? saveState.message || t('settings.saveFailed') : ''
  ), [saveState, t]);

  const handleSave = async (section) => {
    let payload;

    if (section === 'general') {
      const companyName = String(settings.general.companyName || '').trim();
      const paydayDay = Number(settings.general.paydayDay);
      if (!companyName) {
        setSaveState({ section, status: 'error', message: t('settings.companyNameRequired') });
        return;
      }
      if (!Number.isInteger(paydayDay) || paydayDay < 1 || paydayDay > 28) {
        setSaveState({ section, status: 'error', message: t('settings.paydayHelp') });
        return;
      }
      payload = {
        general: {
          companyName,
          timezone: settings.general.timezone,
          currency: settings.general.currency,
          paydayDay,
        },
      };
    } else if (section === 'notifications') {
      payload = {
        notifications: {
          emailNotifications: settings.notifications.emailNotifications,
          slackNotifications: settings.notifications.slackNotifications,
        },
      };
    } else {
      const maxAnnualLeaveDays = Number(settings.leavePolicy.maxAnnualLeaveDays);
      if (!Number.isInteger(maxAnnualLeaveDays) || maxAnnualLeaveDays < 0 || maxAnnualLeaveDays > 365) {
        setSaveState({ section, status: 'error', message: t('settings.leaveDaysInvalid') });
        return;
      }
      payload = {
        leavePolicy: {
          maxAnnualLeaveDays,
          autoApproveShortLeave: settings.leavePolicy.autoApproveShortLeave,
        },
      };
    }

    setSaveState({ section, status: 'saving', message: '' });

    try {
      const res = await settingsService.update(payload);
      const updated = res.data?.data?.settings || {};
      setSettings((current) => ({
        general: {
          ...current.general,
          ...(updated.general || {}),
        },
        notifications: {
          ...current.notifications,
          ...(updated.notifications || {}),
        },
        leavePolicy: {
          ...current.leavePolicy,
          ...(updated.leavePolicy || {}),
        },
      }));
      setSaveState({ section, status: 'success', message: '' });
      setTimeout(() => {
        setSaveState((current) => (current.section === section && current.status === 'success'
          ? { section: '', status: 'idle', message: '' }
          : current));
      }, 2000);
    } catch (error) {
      setSaveState({
        section,
        status: 'error',
        message: error?.response?.data?.message || t('settings.saveFailed'),
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <h2 className="text-xl font-semibold">{t('settings.title')}</h2>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {saveErrorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveErrorMessage}
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="leave">{t('settings.leavePolicy')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.companyName')}</label>
              <Input
                value={settings.general.companyName}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  general: { ...current.general, companyName: event.target.value },
                }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.timezone')}</label>
                <Select
                  value={settings.general.timezone}
                  onValueChange={(value) => setSettings((current) => ({
                    ...current,
                    general: { ...current.general, timezone: value },
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.currency')}</label>
                <Select
                  value={settings.general.currency}
                  onValueChange={(value) => setSettings((current) => ({
                    ...current,
                    general: { ...current.general, currency: value },
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>{currency.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">{t('settings.payday')}</label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={String(settings.general.paydayDay)}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    general: { ...current.general, paydayDay: event.target.value },
                  }))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">{t('settings.paydayHelp')}</p>
              </div>
            </div>
            <Button onClick={() => handleSave('general')} disabled={loading || isSavingSection('general')}>
              {saveButtonLabel('general')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.emailNotifs')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.emailDesc')}</p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(value) => setSettings((current) => ({
                  ...current,
                  notifications: { ...current.notifications, emailNotifications: value },
                }))}
                disabled={loading}
              />
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.slack')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.slackDesc')}</p>
              </div>
              <Switch
                checked={settings.notifications.slackNotifications}
                onCheckedChange={(value) => setSettings((current) => ({
                  ...current,
                  notifications: { ...current.notifications, slackNotifications: value },
                }))}
                disabled={loading}
              />
            </div>
            <Button onClick={() => handleSave('notifications')} disabled={loading || isSavingSection('notifications')}>
              {saveButtonLabel('notifications')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.maxLeave')}</label>
              <Input
                type="number"
                min="0"
                max="365"
                value={String(settings.leavePolicy.maxAnnualLeaveDays)}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  leavePolicy: { ...current.leavePolicy, maxAnnualLeaveDays: event.target.value },
                }))}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.autoApprove')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.autoDesc')}</p>
              </div>
              <Switch
                checked={settings.leavePolicy.autoApproveShortLeave}
                onCheckedChange={(value) => setSettings((current) => ({
                  ...current,
                  leavePolicy: { ...current.leavePolicy, autoApproveShortLeave: value },
                }))}
                disabled={loading}
              />
            </div>
            <Button onClick={() => handleSave('leave')} disabled={loading || isSavingSection('leave')}>
              {saveButtonLabel('leave')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="bg-card border border-border rounded-lg p-6 space-y-3 mt-4">
            <h3 className="text-sm font-semibold">{t('settings.securityManagedTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('settings.securityManagedDesc')}
            </p>
            <Button variant="outline" disabled>
              {t('settings.updatePwd')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
