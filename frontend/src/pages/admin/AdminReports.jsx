import { useMemo, useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import employeeService from '../../services/employeeService';
import reportService from '../../services/reportService';
import leaveService from '../../services/leaveService';
import salaryService from '../../services/salaryService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';
import { getDepartmentKey, getDepartmentLabel } from '../../utils/departmentLabel';

const fmtName = (employee) => `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || '-';
const formatRon = (value) => `${Number(value || 0).toLocaleString('ro-RO')} RON`;
const formatHours = (value) => `${Number(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}h`;

function downloadTextFile(fileName, content, mime = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function overlapsRange(startDate, endDate, rangeStart, rangeEnd) {
  const start = String(startDate || '').slice(0, 10);
  const end = String(endDate || startDate || '').slice(0, 10);
  return Boolean(start) && Boolean(end) && start <= rangeEnd && end >= rangeStart;
}

function generateDateColumns(start, end) {
  const dates = [];
  let cursor = new Date(`${start}T00:00:00`);
  const limit = new Date(`${end}T00:00:00`);

  while (cursor <= limit) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function generateMonthBuckets(start, end, lang) {
  const buckets = [];
  let year = Number(String(start).slice(0, 4));
  let month = Number(String(start).slice(5, 7));
  const endYear = Number(String(end).slice(0, 4));
  const endMonth = Number(String(end).slice(5, 7));

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const date = new Date(year, month - 1, 1);
    buckets.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: date.toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US', { month: 'short', year: '2-digit' }),
      year,
      month,
    });

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return buckets;
}

function formatDayLabel(dateStr, lang) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthValue(value) {
  const [yearStr, monthStr] = String(value || '').split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  return {
    year,
    month,
    valid: Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12,
  };
}

function getMonthBounds(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

function buildPdfReport({
  lang,
  dateFrom,
  dateTo,
  filteredHours,
  salaryRows,
  leaveAnalyticsData,
  deptFilter,
  departments,
}) {
  const isRo = lang === 'RO';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const right = pageWidth - margin;
  let y = 56;

  const departmentLabel = deptFilter === 'all'
    ? (isRo ? 'Toate departamentele' : 'All departments')
    : departments.find((item) => item.value === deptFilter)?.label || deptFilter;

  const totals = {
    workedHours: filteredHours.reduce((sum, row) => sum + Number(row.total || 0), 0),
    overtimeHours: filteredHours.reduce((sum, row) => sum + Number(row.overtime || 0), 0),
    absentDays: filteredHours.reduce((sum, row) => sum + Number(row.absentDays || 0), 0),
    grossPayroll: salaryRows.reduce((sum, row) => sum + Number(row.grossSalary || 0), 0),
    netPayroll: salaryRows.reduce((sum, row) => sum + Number(row.netSalary || 0), 0),
    bonuses: salaryRows.reduce((sum, row) => sum + Number(row.bonusesTotal || 0), 0),
    leaveDays: leaveAnalyticsData.reduce((sum, row) => sum + Number(row.vacation || 0) + Number(row.sick || 0) + Number(row.personal || 0), 0),
  };

  const ensureSpace = (required = 24) => {
    if (y + required <= pageHeight - margin) return;
    doc.addPage();
    y = 56;
  };

  const line = (label, value, options = {}) => {
    ensureSpace(options.spacingAfter ?? 18);
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size || 10);
    doc.text(String(label), margin, y);
    doc.text(String(value), right, y, { align: 'right' });
    y += options.spacingAfter ?? 18;
  };

  const sectionTitle = (title) => {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 18;
  };

  const paragraph = (text) => {
    const lines = doc.splitTextToSize(String(text), right - margin);
    lines.forEach((segment) => {
      ensureSpace(16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(segment, margin, y);
      y += 14;
    });
  };

  const table = (title, headers, rows) => {
    sectionTitle(title);
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(headers.join('   |   '), margin, y);
    y += 14;

    doc.setDrawColor(210);
    doc.line(margin, y, right, y);
    y += 12;

    rows.forEach((row) => {
      const parts = row.map((cell) => String(cell ?? ''));
      const text = doc.splitTextToSize(parts.join('   |   '), right - margin);
      ensureSpace(14 * text.length + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      text.forEach((segment) => {
        doc.text(segment, margin, y);
        y += 12;
      });
      y += 4;
    });

    if (rows.length === 0) {
      ensureSpace(18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(isRo ? 'Nu exista date pentru aceasta sectiune.' : 'No data available for this section.', margin, y);
      y += 16;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(isRo ? 'Raport operational HR' : 'HR operational report', margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${dateFrom} - ${dateTo}`, margin, y);
  doc.text(departmentLabel, right, y, { align: 'right' });
  y += 24;

  sectionTitle(isRo ? 'Sumar' : 'Summary');
  line(isRo ? 'Ore lucrate' : 'Worked hours', formatHours(totals.workedHours));
  line(isRo ? 'Ore suplimentare' : 'Overtime hours', formatHours(totals.overtimeHours));
  line(isRo ? 'Zile absente' : 'Absent days', Number(totals.absentDays).toLocaleString('ro-RO'));
  line(isRo ? 'Cost brut payroll' : 'Gross payroll cost', formatRon(totals.grossPayroll));
  line(isRo ? 'Bonusuri totale' : 'Total bonuses', formatRon(totals.bonuses));
  line(isRo ? 'Cost net payroll' : 'Net payroll cost', formatRon(totals.netPayroll));
  line(isRo ? 'Zile de concediu in interval' : 'Leave days in range', Number(totals.leaveDays).toLocaleString('ro-RO'));

  table(
    isRo ? 'Ore lucrate pe angajat' : 'Worked hours by employee',
    isRo ? ['Angajat', 'Departament', 'Total', 'Suplimentare', 'Absente'] : ['Employee', 'Department', 'Total', 'Overtime', 'Absent'],
    filteredHours.map((row) => [
      row.name,
      row.department,
      formatHours(row.total),
      formatHours(row.overtime),
      Number(row.absentDays || 0).toLocaleString('ro-RO'),
    ])
  );

  table(
    isRo ? 'Salarizare' : 'Payroll',
    isRo ? ['Angajat', 'Luna', 'Baza', 'Bonusuri', 'Retineri', 'Net'] : ['Employee', 'Month', 'Base', 'Bonuses', 'Deductions', 'Net'],
    salaryRows.map((row) => {
      const deductions = Number(row.taxAmount || 0) + Number(row.socialContributions || 0) + Number(row.deductions || 0);
      return [
        fmtName(row.employee),
        `${String(row.month).padStart(2, '0')}/${row.year}`,
        formatRon(row.baseSalary),
        formatRon(row.bonusesTotal),
        formatRon(deductions),
        formatRon(row.netSalary),
      ];
    })
  );

  table(
    isRo ? 'Concedii pe departament' : 'Leave by department',
    isRo ? ['Departament', 'Vacanta', 'Medical', 'Personal'] : ['Department', 'Vacation', 'Sick', 'Personal'],
    leaveAnalyticsData.map((row) => [
      row.name,
      Number(row.vacation || 0).toLocaleString('ro-RO'),
      Number(row.sick || 0).toLocaleString('ro-RO'),
      Number(row.personal || 0).toLocaleString('ro-RO'),
    ])
  );

  ensureSpace(30);
  paragraph(isRo ? 'Raport generat automat din datele filtrate curent din aplicatie.' : 'Report generated automatically from the currently filtered application data.');
  paragraph(`${isRo ? 'Generat la' : 'Generated at'} ${new Date().toLocaleString(isRo ? 'ro-RO' : 'en-US')}`);

  doc.save(`reports-${dateFrom}-to-${dateTo}.pdf`);
}

export default function AdminReports() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [employees, setEmployees] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [salaryRows, setSalaryRows] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [deptFilter, setDeptFilter] = useState('all');
  const [payrollMonth, setPayrollMonth] = useState(getCurrentMonthValue);
  const [payrollBusy, setPayrollBusy] = useState(false);
  const [payrollMessage, setPayrollMessage] = useState('');
  const [payrollError, setPayrollError] = useState('');

  const employeeById = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => map.set(employee.id, employee));
    return map;
  }, [employees]);

  const departments = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => {
      const raw = employee?.department?.name;
      const key = getDepartmentKey(raw);
      if (!key || key === 'all') return;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: getDepartmentLabel(raw, t, { fallback: raw || '-' }),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, lang === 'RO' ? 'ro' : 'en'));
  }, [employees, t, lang]);

  useEffect(() => {
    employeeService.getAll({ limit: 200 })
      .then((res) => {
        const list = res.data?.data ?? res.data?.employees ?? res.data ?? [];
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => setEmployees([]));
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const params = { dateFrom, dateTo };
      const [attendanceRes, salaryRes, leavesRes] = await Promise.all([
        reportService.getAttendance(params),
        reportService.getSalary(params),
        leaveService.getAll({ limit: 1000 }),
      ]);

      const nextAttendance = attendanceRes.data?.data?.report ?? [];
      const nextSalaries = salaryRes.data?.data?.salaries ?? [];
      const nextLeaves = leavesRes.data?.data ?? leavesRes.data?.leaves ?? [];

      setAttendanceRows(Array.isArray(nextAttendance) ? nextAttendance : []);
      setSalaryRows(Array.isArray(nextSalaries) ? nextSalaries : []);
      setLeaves(Array.isArray(nextLeaves) ? nextLeaves : []);
    } catch {
      setAttendanceRows([]);
      setSalaryRows([]);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const hoursData = useMemo(() => attendanceRows.map((row) => {
    const rawDept = row.employee?.department?.name;
    const departmentKey = getDepartmentKey(rawDept) || 'none';
    const department = getDepartmentLabel(rawDept, t, {
      fallback: lang === 'RO' ? 'Fara departament' : 'No department',
    });
    const total = Number(row.totalHours || 0);
    const overtime = Number(row.overtimeHours || 0);
    return {
      id: row.employee?.id,
      name: fmtName(row.employee),
      department,
      departmentKey,
      total: Number(total.toFixed(2)),
      regular: Number((total - overtime).toFixed(2)),
      overtime: Number(overtime.toFixed(2)),
      absentDays: Number(row.absentDays || 0),
      activityByDate: row.activityByDate || {},
    };
  }), [attendanceRows, t, lang]);

  const filteredHours = useMemo(() => (
    deptFilter === 'all'
      ? hoursData
      : hoursData.filter((item) => item.departmentKey === deptFilter)
  ), [hoursData, deptFilter]);

  const dateColumns = useMemo(() => generateDateColumns(dateFrom, dateTo), [dateFrom, dateTo]);

  const payrollTrend = useMemo(() => {
    const buckets = generateMonthBuckets(dateFrom, dateTo, lang);
    const totals = new Map();

    salaryRows.forEach((row) => {
      const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
      totals.set(key, (totals.get(key) || 0) + (Number(row.grossSalary) || 0));
    });

    return buckets.map((bucket) => ({
      month: bucket.label,
      cost: Number((totals.get(bucket.key) || 0).toFixed(2)),
    }));
  }, [salaryRows, dateFrom, dateTo, lang]);

  const leaveAnalyticsData = useMemo(() => {
    const departmentMap = new Map();

    leaves
      .filter((leave) => overlapsRange(leave.startDate, leave.endDate, dateFrom, dateTo))
      .forEach((leave) => {
        const employee = employeeById.get(leave.employee?.id);
        const rawDept = employee?.department?.name;
        const deptKey = getDepartmentKey(rawDept) || 'none';
        const deptLabel = getDepartmentLabel(rawDept, t, {
          fallback: lang === 'RO' ? 'Fara departament' : 'No department',
        });

        if (!departmentMap.has(deptKey)) {
          departmentMap.set(deptKey, { name: deptLabel, vacation: 0, sick: 0, personal: 0 });
        }

        const row = departmentMap.get(deptKey);
        if (leave.type === 'annual') row.vacation += leave.days || 0;
        else if (leave.type === 'sick') row.sick += leave.days || 0;
        else row.personal += leave.days || 0;
      });

    return Array.from(departmentMap.values());
  }, [leaves, employeeById, dateFrom, dateTo, t, lang]);

  const handleExport = (format) => {
    if (format === 'CSV') {
      const rows = [
        ['Employee', 'Department', 'TotalHours', 'RegularHours', 'OvertimeHours', 'AbsentDays'],
        ...filteredHours.map((row) => [row.name, row.department, row.total, row.regular, row.overtime, row.absentDays]),
      ];
      const csv = rows.map((row) => row.join(',')).join('\n');
      downloadTextFile(`reports-${dateFrom}-to-${dateTo}.csv`, csv, 'text/csv;charset=utf-8;');
      return;
    }

    buildPdfReport({
      lang,
      dateFrom,
      dateTo,
      filteredHours,
      salaryRows,
      leaveAnalyticsData,
      deptFilter,
      departments,
    });
  };

  const handlePaySalariesNow = async () => {
    const period = parseMonthValue(payrollMonth);
    if (!period.valid) {
      setPayrollError(t('reports.payMonthInvalid'));
      setPayrollMessage('');
      return;
    }

    setPayrollBusy(true);
    setPayrollError('');
    setPayrollMessage('');

    try {
      const response = await salaryService.payAll({
        month: period.month,
        year: period.year,
      });

      const summary = response.data?.data?.summary || {};
      const { start, end } = getMonthBounds(period.year, period.month);
      const sameRange = dateFrom === start && dateTo === end;

      setPayrollMessage(
        t('reports.paySuccess')
          .replace('{0}', String(summary.paidNow ?? 0))
          .replace('{1}', String(summary.generated ?? 0))
          .replace('{2}', String(summary.alreadyPaid ?? 0))
      );

      setDateFrom(start);
      setDateTo(end);
      if (sameRange) {
        await loadReports();
      }
    } catch (error) {
      setPayrollError(error?.message || t('reports.payFailed'));
    } finally {
      setPayrollBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('reports.title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-36" />
          <span className="text-sm text-muted-foreground">{t('reports.to')}</span>
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-36" />
          <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
            <Download className="size-3.5" /> PDF
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-medium">{t('reports.hoursReport')}</h3>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder={t('reports.department')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.allDepts')}</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.value} value={department.value}>{department.label}</SelectItem>
              ))}
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
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.employee')}</TableHead>
                <TableHead>{t('reports.totalHours')}</TableHead>
                <TableHead>{t('reports.regular')}</TableHead>
                <TableHead>{t('reports.overtime')}</TableHead>
                <TableHead>{t('reports.absentDays')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHours.map((row) => (
                <TableRow key={row.id || row.name}>
                  <TableCell className="text-sm font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm">{row.total}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.regular}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.overtime}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.absentDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-medium">{t('reports.payrollCost')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('reports.payHelp')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="month"
              value={payrollMonth}
              onChange={(event) => setPayrollMonth(event.target.value)}
              className="w-40"
            />
            <Button onClick={handlePaySalariesNow} disabled={payrollBusy}>
              {payrollBusy ? t('reports.payingNow') : t('reports.payNow')}
            </Button>
          </div>
        </div>

        {payrollMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {payrollMessage}
          </div>
        )}

        {payrollError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {payrollError}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k RON`} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} formatter={(value) => [`${value.toLocaleString('ro-RO')} RON`, t('reports.cost')]} />
              <Line type="monotone" dataKey="cost" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.employee')}</TableHead>
                <TableHead>{t('salary.month')}</TableHead>
                <TableHead>{t('reports.base')}</TableHead>
                <TableHead>{t('reports.bonuses')}</TableHead>
                <TableHead>{t('reports.deductions')}</TableHead>
                <TableHead>{t('reports.net')}</TableHead>
                <TableHead>{t('salary.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryRows.map((row) => {
                const base = Number(row.baseSalary || 0);
                const bonus = Number(row.bonusesTotal || 0);
                const deduction = Number(row.taxAmount || 0) + Number(row.socialContributions || 0) + Number(row.deductions || 0);
                const net = Number(row.netSalary || 0);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium">{fmtName(row.employee)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {String(row.month).padStart(2, '0')}/{row.year}
                    </TableCell>
                    <TableCell className="text-sm">{formatRon(base)}</TableCell>
                    <TableCell className="text-sm text-success">+{formatRon(bonus)}</TableCell>
                    <TableCell className="text-sm text-destructive">-{formatRon(deduction)}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatRon(net)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t(`salary.status_${row.status}`) || row.status || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-medium">{t('reports.attendance')}</h3>
        <div className="bg-card border border-border rounded-lg p-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `100px repeat(${dateColumns.length}, minmax(24px, 1fr))` }}>
              <div />
              {dateColumns.map((dateStr) => (
                <div key={dateStr} className="text-center text-[10px] text-muted-foreground py-1 whitespace-nowrap">
                  {formatDayLabel(dateStr, lang)}
                </div>
              ))}

              {filteredHours.slice(0, 8).map((row) => {
                const shortName = row.name.split(' ').slice(-1)[0]?.slice(0, 12) || '?';
                return (
                  <div key={row.id || row.name} className="contents">
                    <div className="text-xs text-right pr-2 flex items-center justify-end text-muted-foreground">
                      {shortName}
                    </div>
                    {dateColumns.map((dateStr) => {
                      const activity = row.activityByDate?.[dateStr];
                      const intensity = activity
                        ? Math.min(1, Math.max(0.2, Number(activity.totalHours || 0) / 8))
                        : 0.05;
                      return (
                        <div
                          key={`${row.id || row.name}-${dateStr}`}
                          className="aspect-square rounded-sm"
                          style={{ backgroundColor: `rgba(29, 78, 216, ${intensity})` }}
                          title={activity ? `${dateStr}: ${Number(activity.totalHours || 0).toFixed(1)}h` : dateStr}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-xs text-muted-foreground">{t('reports.less')}</span>
              {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
                <div key={opacity} className="size-3 rounded-sm" style={{ backgroundColor: `rgba(29, 78, 216, ${opacity})` }} />
              ))}
              <span className="text-xs text-muted-foreground">{t('reports.more')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-medium">{t('reports.leaveAnalytics')}</h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leaveAnalyticsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              <Legend />
              <Bar dataKey="vacation" stackId="a" fill="var(--primary)" name={t('reports.vacation')} />
              <Bar dataKey="sick" stackId="a" fill="var(--warning)" name={t('reports.sick')} />
              <Bar dataKey="personal" stackId="a" fill="var(--muted-foreground)" name={t('reports.personal')} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {loading && (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      )}
    </div>
  );
}
