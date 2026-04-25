import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TopNav } from '../TopNav';
import { useTheme } from '../ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';
import salaryService from '../../../../services/salaryService';
import { useT } from '../../../../i18n/useT';
import { useAuth } from '../../../../context/AuthContext';
import { Button } from '../../../../components/ui/Button';

const STATUS_COLORS = {
  paid: 'bg-emerald-400/10 text-emerald-400',
  generated: 'bg-amber-400/10 text-amber-400',
  draft: 'bg-gray-400/10 text-gray-400',
};

function formatRon(value) {
  return `${parseFloat(value || 0).toLocaleString('ro-RO')} RON`;
}

function monthLabel(month, year, lang, format = 'short') {
  return new Date(Number(year), Number(month || 1) - 1, 1).toLocaleDateString(
    lang === 'RO' ? 'ro-RO' : 'en-US',
    format === 'short'
      ? { month: 'short', year: '2-digit' }
      : { month: 'long', year: 'numeric' }
  );
}

function buildPdfLabels(lang, t) {
  if (lang === 'RO') {
    return {
      title: 'Fluturas de salariu',
      employee: 'Angajat',
      name: 'Nume',
      email: 'Email',
      role: 'Rol',
      salaryDetails: 'Detalii salariale',
      baseSalary: 'Salariu baza',
      workedHours: 'Ore lucrate',
      overtime: 'Ore suplimentare',
      bonuses: 'Bonusuri',
      gross: 'Salariu brut',
      deductions: 'Retineri',
      tax: 'Impozit',
      contributions: 'Contributii sociale',
      otherDeductions: 'Alte deduceri',
      net: 'Total net',
      generatedAt: 'Generat la',
      unknown: '-',
    };
  }

  return {
    title: 'Payslip',
    employee: 'Employee',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    salaryDetails: 'Salary details',
    baseSalary: 'Base salary',
    workedHours: 'Worked hours',
    overtime: 'Overtime',
    bonuses: 'Bonuses',
    gross: 'Gross salary',
    deductions: 'Deductions',
    tax: 'Tax',
    contributions: 'Social contributions',
    otherDeductions: 'Other deductions',
    net: 'Net total',
    generatedAt: 'Generated at',
    unknown: '-',
  };
}

function downloadPDF(row, user, lang, t) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const labels = buildPdfLabels(lang, t);
  const left = 48;
  let y = 56;

  const line = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, left, y);
    doc.text(String(value), 550, y, { align: 'right' });
    y += 20;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(labels.title, left, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${monthLabel(row.month, row.year, lang, 'long')} - ${t(`salary.status_${row.status}`) || row.status}`, left, y);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.text(labels.employee, left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  line(labels.name, `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || labels.unknown);
  line(labels.email, user?.email || labels.unknown);
  line(labels.role, user?.position || user?.role || labels.unknown);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(labels.salaryDetails, left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  line(labels.baseSalary, formatRon(row.baseSalary));
  line(labels.workedHours, `${parseFloat(row.workedHours || 0).toFixed(1)}h (${row.workedDays || 0})`);
  line(labels.overtime, `${parseFloat(row.overtimeHours || 0).toFixed(1)}h`);
  line(labels.bonuses, formatRon(row.bonusesTotal));
  line(labels.gross, formatRon(row.grossSalary), true);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(labels.deductions, left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  line(labels.tax, `-${formatRon(row.taxAmount)}`);
  line(labels.contributions, `-${formatRon(row.socialContributions)}`);
  line(labels.otherDeductions, `-${formatRon(row.deductions)}`);
  line(labels.net, formatRon(row.netSalary), true);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${labels.generatedAt} ${new Date().toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US')}`, left, 800);
  doc.save(`salary-${row.year}-${String(row.month || 1).padStart(2, '0')}.pdf`);
}

export default function SalaryPage() {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const { currentUser, loading: authLoading, isAuthenticated } = useAuth();

  const textMuted = theme === 'dark' ? '#64748b' : '#94a3b8';
  const grid = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const cardBg = theme === 'dark' ? '#1e293b' : '#fff';
  const border = theme === 'dark' ? '#334155' : '#e2e8f0';
  const text = theme === 'dark' ? '#f1f5f9' : '#0f172a';

  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (authLoading || !isAuthenticated || !currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await salaryService.getMySalaries({ limit: 12 });
      const list = res?.data?.data ?? res?.data?.salaries ?? [];
      setSalaries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setSalaries([]);
      setError(lang === 'RO' ? 'Nu am putut incarca datele salariale.' : 'Could not load salary data.');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, currentUser?.id, lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser?.id) {
      setLoading(false);
      return;
    }
    load();
  }, [load, authLoading, isAuthenticated, currentUser?.id]);

  const latest = salaries[0] || null;
  const latestDeductions = latest
    ? parseFloat(latest.taxAmount || 0) + parseFloat(latest.socialContributions || 0) + parseFloat(latest.deductions || 0)
    : 0;

  const summaryCards = [
    {
      label: t('salary.gross'),
      value: latest ? formatRon(latest.grossSalary) : '-',
    },
    {
      label: t('reports.bonuses'),
      value: latest ? `+${formatRon(latest.bonusesTotal)}` : '-',
      valueClass: 'text-emerald-400',
    },
    {
      label: t('salary.totalDeductions'),
      value: latest ? `-${formatRon(latestDeductions)}` : '-',
      valueClass: 'text-red-400',
    },
    {
      label: t('salary.net'),
      value: latest ? formatRon(latest.netSalary) : '-',
      valueClass: 'text-dash-primary',
    },
  ];

  const chartData = useMemo(() => [...salaries].reverse().map((salary) => ({
    month: monthLabel(salary.month, salary.year, lang, 'short'),
    net: parseFloat(salary.netSalary || 0),
  })), [salaries, lang]);

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('salary.title')} />
      <main className="p-4 sm:p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-3.5" />
              {lang === 'RO' ? 'Reincearca' : 'Retry'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((item) => (
            <div key={item.label} className="bg-dash-card border border-dash-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{item.label}</span>
              <span
                className={item.valueClass || 'text-dash-text'}
                style={{ fontSize: loading ? '14px' : '22px', fontWeight: 700 }}
              >
                {loading ? t('salary.loading') : item.value}
              </span>
            </div>
          ))}
        </div>

        {latest && !loading && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-dash-text" style={{ fontSize: '15px', fontWeight: 700 }}>
                  {lang === 'RO' ? 'Ultimul fluturas' : 'Latest payslip'}
                </h3>
                <p className="text-dash-text-muted" style={{ fontSize: '13px' }}>
                  {monthLabel(latest.month, latest.year, lang, 'long')}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${STATUS_COLORS[latest.status] || ''}`}>
                {t(`salary.status_${latest.status}`) || latest.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
              {[
                { label: lang === 'RO' ? 'Baza calculata' : 'Calculated base', value: formatRon(latest.baseSalary) },
                { label: lang === 'RO' ? 'Ore lucrate' : 'Worked hours', value: `${parseFloat(latest.workedHours || 0).toFixed(1)}h` },
                { label: lang === 'RO' ? 'Ore suplimentare' : 'Overtime', value: `${parseFloat(latest.overtimeHours || 0).toFixed(1)}h` },
                { label: t('reports.bonuses'), value: `+${formatRon(latest.bonusesTotal)}` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-background/60 border border-dash-border px-4 py-3">
                  <div className="text-dash-text-muted" style={{ fontSize: '12px' }}>{item.label}</div>
                  <div className="text-dash-text mt-1" style={{ fontSize: '18px', fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && chartData.length > 0 && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-5">
            <h3 className="text-dash-text mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>{t('salary.netTrend')}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', color: text }}
                  formatter={(value) => [`${Number(value).toLocaleString('ro-RO')} RON`, t('salary.netCol')]}
                />
                <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={index === chartData.length - 1 ? '#6366f1' : (theme === 'dark' ? '#334155' : '#e2e8f0')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dash-border">
            <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('salary.payslips')}</h3>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>
              {t('salary.loading')}
            </div>
          ) : salaries.length === 0 ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>
              {t('salary.noPayslips')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-dash-border">
                    {[t('salary.month'), t('salary.grossCol'), t('reports.bonuses'), t('salary.deductionsCol'), t('salary.netCol'), t('salary.status'), ''].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-dash-text-muted" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => {
                    const bonuses = parseFloat(row.bonusesTotal || 0);
                    const deductions = parseFloat(row.taxAmount || 0) + parseFloat(row.socialContributions || 0) + parseFloat(row.deductions || 0);
                    return (
                      <tr key={row.id} className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                        <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px' }}>
                          {monthLabel(row.month, row.year, lang, 'long')}
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>
                          {formatRon(row.grossSalary)}
                        </td>
                        <td className="px-5 py-3 text-emerald-400" style={{ fontSize: '13px' }}>
                          +{formatRon(bonuses)}
                        </td>
                        <td className="px-5 py-3 text-red-400" style={{ fontSize: '13px' }}>
                          -{formatRon(deductions)}
                        </td>
                        <td className="px-5 py-3 text-dash-primary" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {formatRon(row.netSalary)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || ''}`}>
                            {t(`salary.status_${row.status}`) || row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => downloadPDF(row, currentUser, lang, t)}
                            className="flex items-center gap-1 text-dash-text-muted hover:text-dash-primary transition-colors"
                            style={{ fontSize: '12px' }}
                          >
                            <Download size={13} /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
