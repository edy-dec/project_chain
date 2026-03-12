import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import employeeService from '../../services/employeeService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales'];

// ── Static chart data ──────────────────────────────────────────────────────
const monthlyPayrollData = [
  { month: 'Oct', cost: 38000 },
  { month: 'Nov', cost: 40500 },
  { month: 'Dec', cost: 42000 },
  { month: 'Jan', cost: 39800 },
  { month: 'Feb', cost: 43000 },
  { month: 'Mar', cost: 45200 },
];

const leaveAnalyticsData = [
  { name: 'Engineering', vacation: 8,  sick: 2, personal: 1 },
  { name: 'Design',      vacation: 5,  sick: 1, personal: 2 },
  { name: 'Marketing',   vacation: 10, sick: 3, personal: 0 },
  { name: 'HR',          vacation: 4,  sick: 0, personal: 1 },
  { name: 'Finance',     vacation: 6,  sick: 2, personal: 2 },
];

export default function AdminReports() {
  const { lang } = useTheme();
  const t = useT(lang);
  const [employees,   setEmployees]   = useState([]);
  const [dateFrom,    setDateFrom]    = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [dateTo,      setDateTo]      = useState(new Date().toISOString().slice(0, 10));
  const [deptFilter,  setDeptFilter]  = useState('all');

  useEffect(() => {
    employeeService.getAll({ limit: 200 })
      .then((res) => {
        const list = res.data?.data ?? res.data?.employees ?? res.data ?? [];
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Build hours-worked data from employees (synthetic)
  const hoursData = employees
    .filter((e) => e.status === 'active' || !e.status)
    .slice(0, 10)
    .map((e) => {
      const name  = (e.name || '').split(' ').pop() || e.email?.split('@')[0] || '?';
      const total = 155 + Math.floor(Math.random() * 30);
      const overtime = Math.floor(Math.random() * 20);
      return { name, total, regular: total - overtime, overtime, sickDays: Math.floor(Math.random() * 3) };
    });

  const filteredHours = deptFilter === 'all'
    ? hoursData
    : hoursData.filter((h) => {
        const emp = employees.find((e) => (e.name || '').includes(h.name));
        const d = emp?.department;
        return (d && typeof d === 'object' ? d.name : d) === deptFilter;
      });

  const handleExport = (fmt) => alert(`Export as ${fmt} – connect to backend export endpoint.`);

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('reports.title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          <span className="text-sm text-muted-foreground">{t('reports.to')}</span>
          <Input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className="w-36" />
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
            <Download className="size-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Hours Worked */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-medium">{t('reports.hoursReport')}</h3>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder={t('reports.department')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.allDepts')}</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filteredHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.employee')}</TableHead>
                <TableHead>{t('reports.totalHours')}</TableHead>
                <TableHead>{t('reports.regular')}</TableHead>
                <TableHead>{t('reports.overtime')}</TableHead>
                <TableHead>{t('reports.sickDays')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHours.map((h) => (
                <TableRow key={h.name}>
                  <TableCell className="text-sm font-medium">{h.name}</TableCell>
                  <TableCell className="text-sm">{h.total}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.regular}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.overtime}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.sickDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Payroll Cost */}
      <section className="space-y-4">
        <h3 className="text-base font-medium">{t('reports.payrollCost')}</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyPayrollData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k RON`} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} formatter={(v) => [`${v.toLocaleString('ro-RO')} RON`, t('reports.cost')]} />
              <Line type="monotone" dataKey="cost" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.employee')}</TableHead>
                <TableHead>{t('reports.base')}</TableHead>
                <TableHead>{t('reports.bonuses')}</TableHead>
                <TableHead>{t('reports.deductions')}</TableHead>
                <TableHead>{t('reports.net')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.filter((e) => e.status === 'active' || !e.status).slice(0, 8).map((e) => {
                const base      = e.salary || 3000;
                const bonus     = 500;
                const deduction = Math.round(base * 0.35);
                const net       = base + bonus - deduction;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">{e.name}</TableCell>
                    <TableCell className="text-sm">{Number(base).toLocaleString('ro-RO')} RON</TableCell>
                    <TableCell className="text-sm text-success">+{bonus} RON</TableCell>
                    <TableCell className="text-sm text-destructive">-{deduction.toLocaleString('ro-RO')} RON</TableCell>
                    <TableCell className="text-sm font-semibold">{net.toLocaleString('ro-RO')} RON</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Attendance Heatmap */}
      <section className="space-y-4">
        <h3 className="text-base font-medium">{t('reports.attendance')}</h3>
        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `80px repeat(28, 1fr)` }}>
              <div />
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground py-1">{i + 1}</div>
              ))}
              {employees.slice(0, 8).map((emp) => {
                const shortName = (emp.name || '').split(' ').pop() || '?';
                return (
                  <div key={emp.id} className="contents">
                    <div className="text-xs text-right pr-2 flex items-center justify-end text-muted-foreground">
                      {shortName}
                    </div>
                    {Array.from({ length: 28 }, (_, i) => {
                      const hours   = Math.random() > 0.1 ? Math.floor(Math.random() * 4 + 5) : 0;
                      const opacity = hours === 0 ? 0.05 : hours / 9;
                      return (
                        <div
                          key={i}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: `rgba(29, 78, 216, ${opacity})` }}
                          title={`${hours}h`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs text-muted-foreground">{t('reports.less')}</span>
              {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((op) => (
                <div key={op} className="size-3 rounded-sm" style={{ backgroundColor: `rgba(29, 78, 216, ${op})` }} />
              ))}
              <span className="text-xs text-muted-foreground">{t('reports.more')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Leave Analytics */}
      <section className="space-y-4">
        <h3 className="text-base font-medium">{t('reports.leaveAnalytics')}</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leaveAnalyticsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={70} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              <Legend />
              <Bar dataKey="vacation"  stackId="a" fill="var(--primary)"           name={t('reports.vacation')} />
              <Bar dataKey="sick"      stackId="a" fill="var(--warning)"            name={t('reports.sick')} />
              <Bar dataKey="personal"  stackId="a" fill="var(--muted-foreground)"   name={t('reports.personal')} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
