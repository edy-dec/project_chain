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
  paid:      'bg-emerald-400/10 text-emerald-400',
  generated: 'bg-amber-400/10 text-amber-400',
  draft:     'bg-gray-400/10 text-gray-400',
};

function formatRon(value) {
  return `${parseFloat(value || 0).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`;
}

function monthLabel(month, year, lang, format = 'short') {
  return new Date(Number(year), Number(month || 1) - 1, 1).toLocaleDateString(
    lang === 'RO' ? 'ro-RO' : 'en-US',
    format === 'short'
      ? { month: 'short', year: '2-digit' }
      : { month: 'long', year: 'numeric' }
  );
}

// ─── PDF generation ───────────────────────────────────────────────────────────
function downloadPDF(row, user, lang) {
  const doc  = new jsPDF({ unit: 'pt', format: 'a4' });
  const RO   = lang === 'RO';
  const left = 48;
  const rightAlign = 550;
  let y = 56;

  const section = (title) => {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(title.toUpperCase(), left, y);
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(left, y, rightAlign, y);
    y += 14;
    doc.setTextColor(30, 30, 30);
  };

  const row2 = (label, value, bold = false, color = null) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    if (color) doc.setTextColor(...color);
    else doc.setTextColor(30, 30, 30);
    doc.text(label, left, y);
    doc.text(String(value), rightAlign, y, { align: 'right' });
    y += 18;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text(RO ? 'Fluturaș de salariu' : 'Payslip', left, y);
  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${monthLabel(row.month, row.year, lang, 'long')}`, left, y);
  const statusLabel = row.status === 'paid' ? (RO ? 'Plătit' : 'Paid') : (RO ? 'Generat' : 'Generated');
  doc.text(statusLabel, rightAlign, y, { align: 'right' });
  y += 28;

  // Angajat
  section(RO ? 'Angajat' : 'Employee');
  row2(RO ? 'Nume' : 'Name', `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '-');
  row2(RO ? 'Email' : 'Email', user?.email || '-');
  row2(RO ? 'Funcție' : 'Position', user?.position || user?.role || '-');

  // Câștiguri
  section(RO ? 'Câștiguri' : 'Earnings');
  row2(RO ? 'Salariu de bază' : 'Base salary', formatRon(row.baseSalary));
  row2(RO ? `Ore lucrate (${row.workedDays || 0} zile)` : `Worked hours (${row.workedDays || 0} days)`,
    `${parseFloat(row.workedHours || 0).toFixed(1)}h`);

  if (parseFloat(row.overtimeHours || 0) > 0) {
    row2(
      RO ? `Ore suplimenare expirate (${parseFloat(row.overtimeHours || 0).toFixed(1)}h × 1.75)`
         : `Expired overtime (${parseFloat(row.overtimeHours || 0).toFixed(1)}h × 1.75)`,
      formatRon(row.overtimePay)
    );
  }
  if (parseFloat(row.bonusesTotal || 0) > 0) {
    row2(RO ? 'Bonusuri' : 'Bonuses', `+${formatRon(row.bonusesTotal)}`, false, [16, 185, 129]);
  }
  if (parseFloat(row.holidayIndemnity || 0) > 0) {
    row2(
      RO ? `Indemnizație concediu (${row.holidayDays || 0} zile)` : `Holiday indemnity (${row.holidayDays || 0} days)`,
      formatRon(row.holidayIndemnity), false, [16, 185, 129]
    );
  }
  row2(RO ? 'BRUT TOTAL' : 'GROSS TOTAL', formatRon(row.grossSalary), true);

  // Retineri angajat
  section(RO ? 'Rețineri angajat' : 'Employee deductions');
  row2('CAS (25%)',  `-${formatRon(row.casAmount  || row.socialContributions * 0.714)}`, false, [239, 68, 68]);
  row2('CASS (10%)', `-${formatRon(row.cassAmount || row.socialContributions * 0.286)}`, false, [239, 68, 68]);
  row2(RO ? 'Impozit pe venit (10%)' : 'Income tax (10%)', `-${formatRon(row.taxAmount)}`, false, [239, 68, 68]);
  if (parseFloat(row.deductions || 0) > 0) {
    row2(RO ? 'Alte rețineri' : 'Other deductions', `-${formatRon(row.deductions)}`, false, [239, 68, 68]);
  }

  const totalDeductions = parseFloat(row.casAmount || 0) + parseFloat(row.cassAmount || 0)
    + parseFloat(row.taxAmount || 0) + parseFloat(row.deductions || 0);
  row2(RO ? 'Total rețineri' : 'Total deductions', `-${formatRon(totalDeductions)}`, true, [239, 68, 68]);

  y += 4;
  // NET
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(left, y, rightAlign - left, 28, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(RO ? 'NET DE PLATĂ' : 'NET PAY', left + 12, y + 18);
  doc.text(formatRon(row.netSalary), rightAlign - 8, y + 18, { align: 'right' });
  y += 42;

  // Cost angajator (informativ)
  if (parseFloat(row.camAmount || 0) > 0) {
    section(RO ? 'Cost angajator (informativ)' : 'Employer cost (informational)');
    row2(RO ? 'CAM (2,25%)' : 'Labour insurance contribution (2.25%)', formatRon(row.camAmount));
    const totalEmployerCost = parseFloat(row.grossSalary || 0) + parseFloat(row.camAmount || 0);
    row2(RO ? 'Cost total angajator' : 'Total employer cost', formatRon(totalEmployerCost), true);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `${RO ? 'Generat la' : 'Generated at'} ${new Date().toLocaleString(RO ? 'ro-RO' : 'en-US')} · Chain HR Platform`,
    left, 820
  );

  doc.save(`fluturas-${row.year}-${String(row.month || 1).padStart(2, '0')}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SalaryPage() {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const { currentUser, loading: authLoading, isAuthenticated } = useAuth();

  const textMuted = theme === 'dark' ? '#64748b' : '#94a3b8';
  const grid      = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const cardBg    = theme === 'dark' ? '#1e293b' : '#fff';
  const border    = theme === 'dark' ? '#334155' : '#e2e8f0';
  const text      = theme === 'dark' ? '#f1f5f9' : '#0f172a';

  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    if (authLoading || !isAuthenticated || !currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const res  = await salaryService.getMySalaries({ limit: 12 });
      const list = res?.data?.data ?? res?.data?.salaries ?? [];
      setSalaries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setSalaries([]);
      setError(t('salary.loadError'));
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, currentUser?.id, lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser?.id) { setLoading(false); return; }
    load();
  }, [load, authLoading, isAuthenticated, currentUser?.id]);

  const latest = salaries[0] || null;

  // Deduceri angajat: CAS + CASS + impozit + alte
  const totalDeductions = (s) => s
    ? parseFloat(s.casAmount  || 0)
    + parseFloat(s.cassAmount || 0)
    + parseFloat(s.taxAmount  || 0)
    + parseFloat(s.deductions || 0)
    : 0;

  const summaryCards = [
    { label: t('salary.gross'),              value: latest ? formatRon(latest.grossSalary)        : '-' },
    { label: t('salary.bonusesAndBenefits'), value: latest ? `+${formatRon(latest.bonusesTotal)}` : '-', valueClass: 'text-emerald-400' },
    { label: t('salary.totalDeductions'),    value: latest ? `-${formatRon(totalDeductions(latest))}` : '-', valueClass: 'text-red-400' },
    { label: t('salary.net'),                value: latest ? formatRon(latest.netSalary)           : '-', valueClass: 'text-dash-primary' },
  ];

  const chartData = useMemo(() =>
    [...salaries].reverse().map((s) => ({
      month: monthLabel(s.month, s.year, lang, 'short'),
      net:   parseFloat(s.netSalary || 0),
    })),
  [salaries, lang]);

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('salary.title')} />
      <main className="p-4 sm:p-6 space-y-6">

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-3.5" />
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((item) => (
            <div key={item.label} className="bg-dash-card border border-dash-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{item.label}</span>
              <span className={item.valueClass || 'text-dash-text'}
                style={{ fontSize: loading ? '14px' : '22px', fontWeight: 700 }}>
                {loading ? t('salary.loading') : item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Payslip detaliat (ultimul) ── */}
        {latest && !loading && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-5 space-y-5">

            {/* Header payslip */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-dash-text" style={{ fontSize: '15px', fontWeight: 700 }}>
                  {t('salary.latestPayslip')}
                </h3>
                <p className="text-dash-text-muted" style={{ fontSize: '13px' }}>
                  {monthLabel(latest.month, latest.year, lang, 'long')}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${STATUS_COLORS[latest.status] || ''}`}>
                {t(`salary.status_${latest.status}`) || latest.status}
              </span>
            </div>

            {/* Câștiguri */}
            <div>
              <p className="text-dash-text-muted mb-2 uppercase tracking-wider"
                style={{ fontSize: '10px', fontWeight: 600 }}>
                {t('salary.earnings')}
              </p>
              <div className="space-y-1.5">
                {[
                  { label: t('salary.baseSalaryLine'), value: formatRon(latest.baseSalary) },
                  { label: `${t('salary.workedLine')} — ${parseFloat(latest.workedHours || 0).toFixed(1)}h (${latest.workedDays || 0} ${t('salary.workedDays')})`, value: null },
                  parseFloat(latest.overtimeHours || 0) > 0 && {
                    label: `${t('salary.overtimeLine')} — ${parseFloat(latest.overtimeHours || 0).toFixed(1)}h × 1,75`,
                    value: `+${formatRon(latest.overtimePay)}`, cls: 'text-emerald-400' },
                  parseFloat(latest.bonusesTotal || 0) > 0 && {
                    label: t('salary.bonusesLine'),
                    value: `+${formatRon(latest.bonusesTotal)}`, cls: 'text-emerald-400' },
                  parseFloat(latest.holidayIndemnity || 0) > 0 && {
                    label: `${t('salary.holidayIndemnityLine')} (${latest.holidayDays || 0} ${t('salary.workedDays')}, ${t('salary.days3MonthAvg')})`,
                    value: `+${formatRon(latest.holidayIndemnity)}`, cls: 'text-emerald-400' },
                ].filter(Boolean).map((item) => (
                  <div key={item.label}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dash-sidebar/50">
                    <span className="text-dash-text-secondary" style={{ fontSize: '13px' }}>{item.label}</span>
                    {item.value && (
                      <span className={item.cls || 'text-dash-text'} style={{ fontSize: '13px', fontWeight: 500 }}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
                {/* Brut total */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-dash-border">
                  <span className="text-dash-text font-semibold" style={{ fontSize: '13px' }}>
                    {t('salary.grossTotal')}
                  </span>
                  <span className="text-dash-text font-bold" style={{ fontSize: '15px' }}>
                    {formatRon(latest.grossSalary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rețineri angajat */}
            <div>
              <p className="text-dash-text-muted mb-2 uppercase tracking-wider"
                style={{ fontSize: '10px', fontWeight: 600 }}>
                {t('salary.employeeDeductions')}
              </p>
              <div className="space-y-1.5">
                {[
                  { label: t('salary.casTax'),  value: `-${formatRon(latest.casAmount  || parseFloat(latest.socialContributions || 0) * 0.714)}` },
                  { label: t('salary.cassTax'), value: `-${formatRon(latest.cassAmount || parseFloat(latest.socialContributions || 0) * 0.286)}` },
                  { label: t('salary.incomeTax'), value: `-${formatRon(latest.taxAmount)}` },
                  parseFloat(latest.deductions || 0) > 0 && {
                    label: t('salary.otherDeductionsLine'),
                    value: `-${formatRon(latest.deductions)}` },
                ].filter(Boolean).map((item) => (
                  <div key={item.label}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-dash-sidebar/50">
                    <span className="text-dash-text-secondary" style={{ fontSize: '13px' }}>{item.label}</span>
                    <span className="text-red-400" style={{ fontSize: '13px', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NET */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-dash-primary/10 border border-dash-primary/30">
              <span className="text-dash-primary font-bold" style={{ fontSize: '14px' }}>
                {t('salary.netPay')}
              </span>
              <span className="text-dash-primary font-bold" style={{ fontSize: '20px' }}>
                {formatRon(latest.netSalary)}
              </span>
            </div>

            {/* Cost angajator — informativ */}
            {parseFloat(latest.camAmount || 0) > 0 && (
              <div className="rounded-lg border border-dash-border px-4 py-3 space-y-1.5">
                <p className="text-dash-text-muted uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: 600 }}>
                  {t('salary.employerCostTitle')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-dash-text-secondary" style={{ fontSize: '13px' }}>{t('salary.camLabel')}</span>
                  <span className="text-dash-text-muted" style={{ fontSize: '13px' }}>{formatRon(latest.camAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dash-border pt-1.5">
                  <span className="text-dash-text-secondary font-medium" style={{ fontSize: '13px' }}>
                    {t('salary.totalEmployerCost')}
                  </span>
                  <span className="text-dash-text font-semibold" style={{ fontSize: '13px' }}>
                    {formatRon(parseFloat(latest.grossSalary || 0) + parseFloat(latest.camAmount || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trend net ── */}
        {!loading && chartData.length > 0 && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-5">
            <h3 className="text-dash-text mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
              {t('salary.netTrend')}
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', color: text }}
                  formatter={(v) => [`${Number(v).toLocaleString('ro-RO')} RON`, t('salary.netCol')]}
                />
                <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? '#6366f1' : (theme === 'dark' ? '#334155' : '#e2e8f0')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Tabel fluturași ── */}
        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dash-border">
            <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>
              {t('salary.payslips')}
            </h3>
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
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-dash-border">
                    {[
                      t('salary.month'),
                      t('salary.grossCol'),
                      t('salary.cassCasCol'),
                      t('salary.taxCol2'),
                      t('salary.camCol'),
                      t('salary.netCol'),
                      t('salary.status'),
                      '',
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-dash-text-muted"
                        style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => {
                    const casCass = parseFloat(row.casAmount  || 0) + parseFloat(row.cassAmount || 0)
                                 || parseFloat(row.socialContributions || 0);
                    return (
                      <tr key={row.id}
                        className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                        <td className="px-4 py-3 text-dash-text" style={{ fontSize: '13px' }}>
                          {monthLabel(row.month, row.year, lang, 'long')}
                        </td>
                        <td className="px-4 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>
                          {formatRon(row.grossSalary)}
                        </td>
                        <td className="px-4 py-3 text-red-400" style={{ fontSize: '13px' }}>
                          -{formatRon(casCass)}
                        </td>
                        <td className="px-4 py-3 text-red-400" style={{ fontSize: '13px' }}>
                          -{formatRon(row.taxAmount)}
                        </td>
                        <td className="px-4 py-3 text-dash-text-muted" style={{ fontSize: '13px' }}>
                          {parseFloat(row.camAmount || 0) > 0 ? formatRon(row.camAmount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-dash-primary font-semibold" style={{ fontSize: '13px' }}>
                          {formatRon(row.netSalary)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || ''}`}>
                            {t(`salary.status_${row.status}`) || row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => downloadPDF(row, currentUser, lang)}
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
