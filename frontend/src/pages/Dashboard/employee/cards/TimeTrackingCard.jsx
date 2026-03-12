import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

function buildWeekData(weekAtt, dayLabels) {
  const hoursByDate = {};
  weekAtt.forEach(a => {
    if (a.date) {
      const key = String(a.date).substring(0, 10);
      hoursByDate[key] = parseFloat(a.totalHours || 0);
    }
  });
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return dayLabels.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().substring(0, 10);
    return { day, hours: hoursByDate[key] ?? 0 };
  });
}

export function TimeTrackingCard({ weekAtt = [], todayAtt, loading }) {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const textMuted = theme === 'dark' ? '#64748b' : '#94a3b8';
  const primary = '#6366f1';

  const DAY_LABELS = [t('card.dayMon'), t('card.dayTue'), t('card.dayWed'), t('card.dayThu'), t('card.dayFri'), t('card.daySat'), t('card.daySun')];
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();
  const weekData = buildWeekData(weekAtt, DAY_LABELS);
  const todayHours = parseFloat(todayAtt?.totalHours || weekData[todayIndex]?.hours || 0).toFixed(1);
  const weekTotal = weekData.reduce((s, d) => s + d.hours, 0).toFixed(1);

  return (
    <div className="bg-dash-card border border-dash-border rounded-xl p-5 flex flex-col gap-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('card.timeTracking')}</h3>
        <span className="text-xs text-dash-text-muted">{t('card.thisWeek')}</span>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <p className="text-dash-text" style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1 }}>
            {loading ? '...' : `${todayHours}h`}
          </p>
          <p className="text-dash-text-muted mt-1" style={{ fontSize: '12px' }}>{t('card.hoursToday')}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-dash-primary" style={{ fontSize: '13px', fontWeight: 600 }}>
            {loading ? '...' : `${weekTotal}h`}
          </p>
          <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>{t('card.weekTotal')}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={weekData} barSize={10} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: textMuted }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: theme === 'dark' ? '#1e293b' : '#fff',
              border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            }}
            formatter={(v) => [`${v}h`, t('card.hours')]}
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {weekData.map((_, i) => (
              <Cell key={i} fill={i === todayIndex ? primary : theme === 'dark' ? '#334155' : '#e2e8f0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
