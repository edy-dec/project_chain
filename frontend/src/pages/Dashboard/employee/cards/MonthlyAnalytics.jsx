import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

export function MonthlyAnalytics({ salaries = [], loading }) {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const MONTH_SHORT = [t('card.monthJan'), t('card.monthFeb'), t('card.monthMar'), t('card.monthApr'), t('card.monthMay'), t('card.monthJun'), t('card.monthJul'), t('card.monthAug'), t('card.monthSep'), t('card.monthOct'), t('card.monthNov'), t('card.monthDec')];
  const grid      = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const textMuted = theme === 'dark' ? '#64748b' : '#94a3b8';
  const cardBg    = theme === 'dark' ? '#1e293b' : '#fff';
  const border    = theme === 'dark' ? '#334155' : '#e2e8f0';
  const text      = theme === 'dark' ? '#f1f5f9' : '#0f172a';

  // salaries come newest-first — reverse for chronological chart
  const chartData = [...salaries].reverse().map(s => ({
    luna: `${MONTH_SHORT[(s.month || 1) - 1]} ${String(s.year).slice(-2)}`,
    ore: parseFloat(s.workedHours || 0),
    salariu: parseFloat(s.netSalary || 0),
  }));

  return (
    <div className="bg-dash-card border border-dash-border rounded-xl p-5 flex flex-col gap-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('card.monthlyAnalytics')}</h3>
        <span className="text-xs text-dash-text-muted">
          {chartData.length > 0 ? t('card.lastXMonths', [chartData.length]) : '—'}
        </span>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-dash-text-muted text-sm">{t('card.loadingData')}</div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-dash-text-muted text-sm">{t('card.noSalaryRecords')}</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="luna" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', color: text }} />
            <Legend wrapperStyle={{ fontSize: '12px', color: textMuted }} />
            <Line yAxisId="left" type="monotone" dataKey="ore" stroke="#6366f1" strokeWidth={2} dot={false} name={t('card.workedHours')} />
            <Line yAxisId="right" type="monotone" dataKey="salariu" stroke="#10b981" strokeWidth={2} dot={false} name={t('card.netSalaryRON')} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
