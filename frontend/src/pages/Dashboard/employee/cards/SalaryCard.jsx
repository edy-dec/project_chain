import React, { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';
import { TrendingUp } from 'lucide-react';
import settingsService from '../../../../services/settingsService';
import { useAuth } from '../../../../context/AuthContext';

export function SalaryCard({ salary, loading }) {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const { currentUser } = useAuth();
  const [paydayDay, setPaydayDay] = useState(10);

  useEffect(() => {
    settingsService.get()
      .then((res) => {
        const configuredDay = Number(res.data?.data?.settings?.general?.paydayDay || 10);
        setPaydayDay(configuredDay);
      })
      .catch(() => setPaydayDay(10));
  }, []);

  const netSalary = salary ? parseFloat(salary.netSalary) : null;
  const baseSalary = currentUser?.baseSalary != null ? parseFloat(currentUser.baseSalary) : null;
  const gross = salary ? parseFloat(salary.grossSalary) : null;
  const bonuses = salary ? parseFloat(salary.bonusesTotal || 0) : null;
  const tax = salary
    ? parseFloat(salary.taxAmount || 0) + parseFloat(salary.socialContributions || 0) + parseFloat(salary.deductions || 0)
    : null;

  const breakdown = salary ? [
    { label: t('card.grossSalary'), value: `${gross?.toLocaleString('ro-RO')} RON`, color: 'text-dash-text' },
    { label: t('reports.bonuses'), value: `+${bonuses?.toLocaleString('ro-RO')} RON`, color: 'text-emerald-400' },
    { label: t('card.taxContrib'), value: `-${tax?.toLocaleString('ro-RO')} RON`, color: 'text-red-400' },
    { label: t('card.netSalaryLabel'), value: `${netSalary?.toLocaleString('ro-RO')} RON`, color: 'text-dash-primary' },
  ] : [];

  const now = new Date();
  const nextPaymentDate = now.getDate() <= paydayDay
    ? new Date(now.getFullYear(), now.getMonth(), paydayDay)
    : new Date(now.getFullYear(), now.getMonth() + 1, paydayDay);
  const nextPayment = nextPaymentDate
    .toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-dash-card border border-dash-border rounded-xl p-5 flex flex-col gap-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('card.salary')}</h3>
        <span className="text-xs text-dash-text-muted">
          {salary ? `${salary.month}/${salary.year}` : t('card.currentMonth')}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <p className="text-dash-text" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>
          {loading ? '...' : netSalary != null ? `${netSalary.toLocaleString('ro-RO')} RON` : '—'}
        </p>
        {netSalary != null && (
          <div className="flex items-center gap-1 mb-1 text-emerald-400" style={{ fontSize: '12px' }}>
            <TrendingUp size={14} />
            <span>{t('card.generated')}</span>
          </div>
        )}
      </div>

      {breakdown.length > 0 && (
        <div className="space-y-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{item.label}</span>
              <span className={item.color} style={{ fontSize: '13px', fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {!salary && !loading && (
        <div className="space-y-1 text-center">
          <p className="text-dash-text-muted" style={{ fontSize: '12px' }}>
            {t('card.noSalary')}
          </p>
          {baseSalary != null && (
            <p className="text-dash-text-muted" style={{ fontSize: '12px' }}>
              {t('salary.baseSalary')}: {baseSalary.toLocaleString('ro-RO')} RON
            </p>
          )}
        </div>
      )}

      <div className="h-px bg-dash-border" />

      <div className="flex items-center justify-between">
        <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{t('card.nextPayment')}</span>
        <span className="text-dash-text" style={{ fontSize: '12px', fontWeight: 500 }}>{nextPayment}</span>
      </div>
    </div>
  );
}
