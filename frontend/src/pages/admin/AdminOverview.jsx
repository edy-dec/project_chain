import { useEffect, useMemo, useState } from 'react';
import {
  Users, UserCheck, Clock, DollarSign, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import employeeService from '../../services/employeeService';
import leaveService from '../../services/leaveService';
import reportService from '../../services/reportService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';
import { getDepartmentLabel } from '../../utils/departmentLabel';

function getInitials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(value, lang) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US');
}

function formatRon(value) {
  return `${Number(value || 0).toLocaleString('ro-RO')} RON`;
}

function monthBounds(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    year,
    month: month + 1,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function shiftBadgeClass(name = '') {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('morning') || normalized.includes('dimine')) return 'bg-primary/10 text-primary';
  if (normalized.includes('afternoon') || normalized.includes('dupa')) return 'bg-warning/10 text-warning';
  if (normalized.includes('night') || normalized.includes('noapte')) return 'bg-blue-500/10 text-blue-500';
  return 'bg-muted text-muted-foreground';
}

function KpiCard({ icon: Icon, label, value, delta, deltaPositive }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {delta ? (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              deltaPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {deltaPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {delta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [stats, setStats] = useState({
    total: '—',
    activeNow: '—',
    pendingLeave: '—',
    payroll: '—',
  });
  const [deltas, setDeltas] = useState({
    employees: '',
    payroll: '',
    payrollPositive: true,
  });
  const [payrollTrend, setPayrollTrend] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const now = new Date();
        const current = monthBounds(now);
        const previous = monthBounds(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const firstTrendMonth = monthBounds(new Date(now.getFullYear(), now.getMonth() - 5, 1));

        const [empRes, leaveRes, currentSummaryRes, previousSummaryRes, trendSalaryRes] = await Promise.all([
          employeeService.getAll({ limit: 200 }),
          leaveService.getAll({ status: 'pending', limit: 100 }),
          reportService.getSummary({ year: current.year, month: current.month }),
          reportService.getSummary({ year: previous.year, month: previous.month }),
          reportService.getSalary({ dateFrom: firstTrendMonth.start, dateTo: current.end }),
        ]);

        const employeeList = empRes.data?.data ?? empRes.data?.employees ?? [];
        const pendingList = leaveRes.data?.data ?? leaveRes.data?.leaves ?? [];
        const currentSummary = currentSummaryRes.data?.data?.summary || {};
        const previousSummary = previousSummaryRes.data?.data?.summary || {};
        const salaryRows = trendSalaryRes.data?.data?.salaries ?? [];

        const activeEmployees = Array.isArray(employeeList)
          ? employeeList.filter((employee) => employee.status === 'active').length
          : 0;
        const newThisMonth = Array.isArray(employeeList)
          ? employeeList.filter((employee) => {
            const createdAt = String(employee.createdAt || '').slice(0, 10);
            return createdAt >= current.start && createdAt <= current.end;
          }).length
          : 0;

        const currentPayroll = Number(currentSummary.monthlyCosts || 0);
        const previousPayroll = Number(previousSummary.monthlyCosts || 0);
        const payrollDeltaPercent = previousPayroll > 0
          ? ((currentPayroll - previousPayroll) / previousPayroll) * 100
          : 0;

        const trendMap = new Map();
        salaryRows.forEach((row) => {
          const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
          trendMap.set(key, (trendMap.get(key) || 0) + Number(row.grossSalary || 0));
        });

        const chartRows = Array.from({ length: 6 }, (_, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return {
            month: date.toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US', { month: 'short' }),
            cost: Number((trendMap.get(key) || 0).toFixed(2)),
          };
        });

        setEmployees(Array.isArray(employeeList) ? employeeList : []);
        setPendingLeaves(Array.isArray(pendingList) ? pendingList : []);
        setStats({
          total: Array.isArray(employeeList) ? employeeList.length : 0,
          activeNow: activeEmployees,
          pendingLeave: Array.isArray(pendingList) ? pendingList.length : 0,
          payroll: formatRon(currentPayroll),
        });
        setDeltas({
          employees: newThisMonth > 0
            ? `${newThisMonth > 0 ? '+' : ''}${newThisMonth} ${lang === 'RO' ? 'luna aceasta' : 'this month'}`
            : '',
          payroll: previousPayroll > 0
            ? `${payrollDeltaPercent >= 0 ? '+' : ''}${payrollDeltaPercent.toFixed(1)}%`
            : '',
          payrollPositive: payrollDeltaPercent >= 0,
        });
        setPayrollTrend(chartRows);
      } catch {
        setEmployees([]);
        setPendingLeaves([]);
        setStats({ total: '—', activeNow: '—', pendingLeave: '—', payroll: '—' });
        setDeltas({ employees: '', payroll: '', payrollPositive: true });
        setPayrollTrend([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lang]);

  const recentActivity = useMemo(() => [
    ...pendingLeaves.slice(0, 3).map((leave) => ({
      id: `leave-${leave.id}`,
      text: lang === 'RO'
        ? `Cerere concediu: ${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim()
        : `Leave request: ${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim(),
      time: formatDate(leave.createdAt, lang),
    })),
    ...employees
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 2)
      .map((employee) => ({
        id: `employee-${employee.id}`,
        text: lang === 'RO'
          ? `Angajat: ${(employee.firstName || '').trim()} ${(employee.lastName || '').trim()} (${getDepartmentLabel(employee.department, t, { fallback: 'Fara departament' })})`
          : `Employee: ${(employee.firstName || '').trim()} ${(employee.lastName || '').trim()} (${getDepartmentLabel(employee.department, t, { fallback: 'No department' })})`,
        time: formatDate(employee.createdAt, lang),
      })),
  ].slice(0, 5), [pendingLeaves, employees, lang, t]);

  const upcomingShifts = useMemo(() => employees
    .filter((employee) => employee.shift)
    .sort((a, b) => String(a.shift?.startTime || '').localeCompare(String(b.shift?.startTime || '')))
    .slice(0, 5)
    .map((employee) => ({
      id: employee.id,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      role: employee.position || employee.role || '-',
      time: `${employee.shift?.startTime?.slice(0, 5) || '--:--'}-${employee.shift?.endTime?.slice(0, 5) || '--:--'}`,
      type: employee.shift?.name || 'Custom',
    })), [employees]);

  const annualRemaining = useMemo(
    () => employees.reduce((sum, employee) => sum + (Number(employee.annualLeaveBalance) || 0), 0),
    [employees]
  );
  const sickRemaining = useMemo(
    () => employees.reduce((sum, employee) => sum + (Number(employee.sickLeaveBalance) || 0), 0),
    [employees]
  );

  const kpis = [
    {
      icon: Users,
      label: t('overview.totalEmployees'),
      value: stats.total,
      delta: deltas.employees,
      deltaPositive: true,
    },
    {
      icon: UserCheck,
      label: t('overview.activeNow'),
      value: stats.activeNow,
    },
    {
      icon: Clock,
      label: t('overview.pendingLeave'),
      value: stats.pendingLeave,
    },
    {
      icon: DollarSign,
      label: t('overview.monthlyPayroll'),
      value: stats.payroll,
      delta: deltas.payroll,
      deltaPositive: deltas.payrollPositive,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <h2 className="text-xl font-semibold">{t('overview.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.recentActivity')}</h3>
          {recentActivity.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              {lang === 'RO' ? 'Nu exista activitate recenta.' : 'No recent activity.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.payrollCost')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k RON`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value.toLocaleString('ro-RO')} RON`, t('overview.cost')]}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.upcomingShifts')}</h3>
          {upcomingShifts.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">
              {lang === 'RO' ? 'Nu exista schimburi alocate momentan.' : 'No assigned shifts at the moment.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.employee')}</th>
                    <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.time')}</th>
                    <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.type')}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShifts.map((shift) => (
                    <tr key={shift.id} className="border-b border-border last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {getInitials(shift.name)}
                          </div>
                          <div>
                            <p className="font-medium">{shift.name}</p>
                            <p className="text-xs text-muted-foreground">{shift.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">{shift.time}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${shiftBadgeClass(shift.type)}`}>
                          {shift.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.leaveSummary')}</h3>
          <div className="space-y-3">
            {[
              {
                label: t('overview.annualLeave'),
                value: `${annualRemaining.toLocaleString('ro-RO')} ${t('overview.days')}`,
                tone: 'bg-primary/10 text-primary',
              },
              {
                label: t('overview.sickLeave'),
                value: `${sickRemaining.toLocaleString('ro-RO')} ${t('overview.days')}`,
                tone: 'bg-warning/10 text-warning',
              },
              {
                label: t('overview.pendingLeave'),
                value: pendingLeaves.length.toLocaleString('ro-RO'),
                tone: 'bg-muted text-muted-foreground',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
