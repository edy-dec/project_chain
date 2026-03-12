import { useState, useEffect } from 'react';
import {
  Users, UserCheck, Clock, DollarSign, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import employeeService from '../../services/employeeService';
import leaveService from '../../services/leaveService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

// ── Mock payroll trend data ────────────────────────────────────────────────
const payrollChartData = [
  { week: 'W1', cost: 38000 },
  { week: 'W2', cost: 42000 },
  { week: 'W3', cost: 39500 },
  { week: 'W4', cost: 45200 },
];

const recentActivity = {
  EN: [
    { id: 1, type: 'leave',      text: 'Maria Pop requested 3 days of vacation leave',              time: '10m ago' },
    { id: 2, type: 'clock',      text: 'Ion Ionescu clocked in at 08:54',                           time: '1h ago' },
    { id: 3, type: 'salary',     text: 'March payroll processed – 45.200 RON total',                time: '2h ago' },
    { id: 4, type: 'employee',   text: 'New employee Elena Marin added to Engineering',              time: '3h ago' },
    { id: 5, type: 'leave',      text: 'Leave request from Andrei Popa approved',                   time: '5h ago' },
  ],
  RO: [
    { id: 1, type: 'leave',      text: 'Maria Pop a solicitat 3 zile de concediu',                  time: 'acum 10m' },
    { id: 2, type: 'clock',      text: 'Ion Ionescu a intrat la 08:54',                              time: 'acum 1h' },
    { id: 3, type: 'salary',     text: 'Salariile din Martie procesate – 45.200 RON total',         time: 'acum 2h' },
    { id: 4, type: 'employee',   text: 'Angajat nou Elena Marin adăugată în Engineering',            time: 'acum 3h' },
    { id: 5, type: 'leave',      text: 'Cererea de concediu a lui Andrei Popa a fost aprobată',     time: 'acum 5h' },
  ],
};

const upcomingShifts = [
  { name: 'Ion Ionescu',   role: 'Developer',   time: 'Today 09:00–17:00',   type: 'Morning' },
  { name: 'Maria Pop',     role: 'Designer',    time: 'Today 10:00–18:00',   type: 'Morning' },
  { name: 'Andrei Popa',   role: 'QA',          time: 'Tomorrow 14:00–22:00', type: 'Afternoon' },
  { name: 'Elena Marin',   role: 'PM',          time: 'Tomorrow 09:00–17:00', type: 'Morning' },
];

const shiftColors = {
  Morning:   'bg-primary/10 text-primary',
  Afternoon: 'bg-warning/10 text-warning',
  Night:     'bg-purple-100 text-purple-700',
};

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── KPI card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, delta, deltaPositive }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {delta !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              deltaPositive ? 'text-success' : 'text-destructive'
            }`}
          >
            {deltaPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AdminOverview() {
  const { lang } = useTheme();
  const t = useT(lang);
  const [stats, setStats] = useState({ total: '–', activeNow: '–', pendingLeave: '–', payroll: '–' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, leaveRes] = await Promise.all([
          employeeService.getAll({ limit: 200 }),
          leaveService.getAll({ status: 'pending', limit: 100 }),
        ]);
        const employees = empRes.data?.data ?? empRes.data?.employees ?? [];
        const pending   = leaveRes.data?.data ?? leaveRes.data?.leaves ?? [];
        const active    = employees.filter((e) => e.status === 'active').length;

        // Rough payroll estimate
        const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.baseSalary) || Number(e.salary) || 0), 0);

        setStats({
          total:        employees.length,
          activeNow:    active,
          pendingLeave: pending.length,
          payroll:      `${Math.round(totalPayroll).toLocaleString('ro-RO')} RON`,
        });
      } catch {
        setStats({ total: '–', activeNow: '–', pendingLeave: '–', payroll: '–' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const kpis = [
    { icon: Users,    label: t('overview.totalEmployees'), value: stats.total,        delta: t('overview.thisMonth'),  deltaPositive: true },
    { icon: UserCheck,label: t('overview.activeNow'),       value: stats.activeNow,   delta: undefined },
    { icon: Clock,    label: t('overview.pendingLeave'),    value: stats.pendingLeave, delta: undefined },
    { icon: DollarSign,label: t('overview.monthlyPayroll'),  value: stats.payroll,     delta: '+3.2%',          deltaPositive: true },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      <h2 className="text-xl font-semibold">{t('overview.title')}</h2>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.recentActivity')}</h3>
          <ul className="space-y-3">
            {(recentActivity[lang] || recentActivity.RO).map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="size-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Payroll chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.payrollCost')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={payrollChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k RON`}
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming shifts */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.upcomingShifts')}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.employee')}</th>
                <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.time')}</th>
                <th className="text-left pb-2 text-xs text-muted-foreground font-medium">{t('overview.type')}</th>
              </tr>
            </thead>
            <tbody>
              {upcomingShifts.map((s, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground text-xs">{s.time}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${shiftColors[s.type] || 'bg-muted text-muted-foreground'}`}>
                      {t(`overview.${s.type.toLowerCase()}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leave summary */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium mb-4">{t('overview.leaveSummary')}</h3>
          <div className="space-y-4">
            {[
              { label: t('overview.annualLeave'),  taken: 12, total: 21, color: 'bg-primary' },
              { label: t('overview.sickLeave'),    taken: 3,  total: 10, color: 'bg-warning' },
              { label: t('overview.unpaidLeave'),  taken: 1,  total: 5,  color: 'bg-muted-foreground' },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{item.taken}/{item.total} {t('overview.days')}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${(item.taken / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
