import React from 'react';
import { TopNav } from '../TopNav';
import { KPIRow } from '../cards/KPIRow';
import { TimeTrackingCard } from '../cards/TimeTrackingCard';
import { SalaryCard } from '../cards/SalaryCard';
import { LeaveAttendanceCard } from '../cards/LeaveAttendanceCard';
import { MonthlyAnalytics } from '../cards/MonthlyAnalytics';
import { Clock, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import { useEmployeeDashboard } from '../useEmployeeDashboard';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

const now = new Date();

function workingDaysThisMonth() {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  let count = 0;
  for (let d = 1; d <= today; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default function OverviewPage() {
  const { monthlyAtt, leaveBalance, salaries, todayAtt, weekAtt, loading } = useEmployeeDashboard();
  const { lang } = useTheme();
  const t = useT(lang);

  const lastSalary = salaries[0] ?? null;
  const presentDays = monthlyAtt?.presentDays ?? 0;
  const wdThisMonth = workingDaysThisMonth();
  const attRate = wdThisMonth > 0 ? Math.round((presentDays / wdThisMonth) * 100) : 0;
  const weekHours = weekAtt.reduce((sum, a) => sum + parseFloat(a.totalHours || 0), 0).toFixed(1);
  const todayHours = parseFloat(todayAtt?.totalHours || 0).toFixed(1);

  const kpiCards = [
    {
      label: t('empOverview.weekHours'),
      value: loading ? '—' : `${weekHours}h`,
      sub: parseFloat(todayHours) > 0 ? `↑ ${todayHours}h ${t('empOverview.today')}` : t('empOverview.noRecordToday'),
      subColor: 'text-emerald-400',
      icon: Clock,
      iconBg: 'bg-dash-primary/10',
      iconColor: 'text-dash-primary',
    },
    {
      label: t('empOverview.netSalary'),
      value: loading ? '—' : lastSalary ? `${parseFloat(lastSalary.netSalary).toLocaleString('ro-RO')} RON` : '—',
      sub: lastSalary ? `${t('empOverview.month')} ${lastSalary.month}/${lastSalary.year}` : t('empOverview.noRecord'),
      subColor: 'text-emerald-400',
      icon: DollarSign,
      iconBg: 'bg-emerald-400/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: t('empOverview.leaveRemaining'),
      value: loading ? '—' : leaveBalance ? `${leaveBalance.annual ?? '—'} ${t('empOverview.days')}` : '—',
      sub: leaveBalance?.sick != null ? `${leaveBalance.sick} ${t('empOverview.sickRemaining')}` : '—',
      subColor: 'text-dash-text-muted',
      icon: CalendarCheck,
      iconBg: 'bg-amber-400/10',
      iconColor: 'text-amber-400',
    },
    {
      label: t('empOverview.attRate'),
      value: loading ? '—' : `${attRate}%`,
      sub: `${presentDays} / ${wdThisMonth} ${t('empOverview.daysPresent')}`,
      subColor: 'text-dash-text-muted',
      icon: TrendingUp,
      iconBg: 'bg-blue-400/10',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('empOverview.title')} />
      <main className="flex-1 p-6 space-y-6">
        <KPIRow cards={kpiCards} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TimeTrackingCard weekAtt={weekAtt} todayAtt={todayAtt} loading={loading} />
          <SalaryCard salary={lastSalary} loading={loading} />
          <LeaveAttendanceCard
            presentDays={presentDays}
            workingDays={wdThisMonth}
            leaveBalance={leaveBalance}
            loading={loading}
          />
        </div>
        <MonthlyAnalytics salaries={salaries} loading={loading} />
      </main>
    </div>
  );
}
