import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

export default function AdminSettings() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [companyName,   setCompanyName]   = useState('Chain Technologies SRL');
  const [timezone,      setTimezone]      = useState('Europe/Bucharest');
  const [currency,      setCurrency]      = useState('RON');
  const [emailNotifs,   setEmailNotifs]   = useState(true);
  const [slackNotifs,   setSlackNotifs]   = useState(false);
  const [autoApprove,   setAutoApprove]   = useState(false);
  const [maxLeaveDays,  setMaxLeaveDays]  = useState('21');
  const [saved,         setSaved]         = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      <h2 className="text-xl font-semibold">{t('settings.title')}</h2>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="leave">{t('settings.leavePolicy')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.companyName')}</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.timezone')}</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Bucharest">Europe/Bucharest</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New York</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.currency')}</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RON">RON (lei)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave}>
              {saved ? t('settings.saved') : t('settings.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.emailNotifs')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.emailDesc')}</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.slack')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.slackDesc')}</p>
              </div>
              <Switch checked={slackNotifs} onCheckedChange={setSlackNotifs} />
            </div>
            <Button onClick={handleSave}>
              {saved ? t('settings.saved') : t('settings.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Leave Policy */}
        <TabsContent value="leave">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.maxLeave')}</label>
              <Input
                type="number"
                value={maxLeaveDays}
                onChange={(e) => setMaxLeaveDays(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('settings.autoApprove')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.autoDesc')}</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
            <Button onClick={handleSave}>
              {saved ? t('settings.saved') : t('settings.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.currentPwd')}</label>
              <Input type="password" placeholder={t('settings.enterCurrent')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.newPwd')}</label>
                <Input type="password" placeholder={t('settings.enterNew')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('settings.confirmPwd')}</label>
                <Input type="password" placeholder={t('settings.enterNew')} />
              </div>
            </div>
            <Button onClick={() => alert('Password update – connect to Auth0 Management API.')}>
              {t('settings.updatePwd')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
