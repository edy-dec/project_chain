import React from 'react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export function LeaveAttendanceCard({ presentDays = 0, workingDays = 0, leaveBalance, loading }) {
  const { lang } = useTheme();
  const t = useT(lang);

  const leaveTaken = leaveBalance != null ? Math.max(0, 21 - (leaveBalance.annual ?? 21)) : 0;
  const absentDays = Math.max(0, workingDays - presentDays - leaveTaken);
  const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  const stats = [
    { label: t('card.daysPresent'),  value: loading ? '...' : presentDays,  icon: CheckCircle2, iconClass: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: t('card.daysAbsent'),   value: loading ? '...' : absentDays,   icon: XCircle,      iconClass: 'text-red-400',     bg: 'bg-red-400/10'     },
    { label: t('card.leaveTaken'), value: loading ? '...' : leaveTaken,   icon: Clock,        iconClass: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  ];

  return (
    <div className="bg-dash-card border border-dash-border rounded-xl p-5 flex flex-col gap-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('card.attendance')}</h3>
        <span className="text-xs text-dash-text-muted">{t('card.thisMonth')}</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{t('card.attendanceRate')}</span>
          <span className="text-dash-primary" style={{ fontSize: '13px', fontWeight: 600 }}>
            {loading ? '...' : `${attendanceRate}%`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-dash-sidebar overflow-hidden">
          <div
            className="h-full rounded-full bg-dash-primary transition-all duration-500"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon size={16} className={s.iconClass} strokeWidth={1.8} />
            </div>
            <p className="text-dash-text" style={{ fontSize: '18px', fontWeight: 700 }}>{s.value}</p>
            <p className="text-dash-text-muted text-center" style={{ fontSize: '10px', lineHeight: 1.3 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
