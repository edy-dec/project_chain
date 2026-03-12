import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../TopNav';
import { useTheme } from '../ThemeContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Download } from 'lucide-react';
import salaryService from '../../../../services/salaryService';
import { useT } from '../../../../i18n/useT';
import { useAuth } from '../../../../context/AuthContext';

const MONTHS_RO = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLORS = {
  paid:      'bg-emerald-400/10 text-emerald-400',
  generated: 'bg-amber-400/10 text-amber-400',
  draft:     'bg-gray-400/10 text-gray-400',
};
const STATUS_LABELS = { paid: 'Plătit', generated: 'Generat', draft: 'Draft' };

function downloadPDF(row, user) {
  const retineri = parseFloat(row.taxAmount||0) + parseFloat(row.socialContributions||0) + parseFloat(row.deductions||0);
  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"/>
  <title>Fluturare – ${MONTHS_RO[(row.month||1)-1]} ${row.year}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#111;font-size:13px;max-width:600px;margin:0 auto}
    h1{font-size:22px;margin-bottom:4px} .sub{color:#555;margin-bottom:28px;font-size:13px}
    h2{font-size:13px;font-weight:700;border-bottom:1px solid #ddd;padding-bottom:6px;margin:20px 0 10px;color:#333}
    .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f0f0}
    .total{font-weight:700;border-top:2px solid #ddd;border-bottom:none;margin-top:6px;padding-top:8px}
    .red{color:#dc2626} .green{color:#16a34a}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;
      background:${row.status==='paid'?'#dcfce7':'#fef9c3'};color:${row.status==='paid'?'#15803d':'#854d0e'}}
    .footer{margin-top:40px;color:#999;font-size:11px;text-align:center;border-top:1px solid #eee;padding-top:16px}
  </style></head><body>
  <h1>Fluturare de salariu</h1>
  <p class="sub">${MONTHS_RO[(row.month||1)-1]} ${row.year} &nbsp;·&nbsp; <span class="badge">${STATUS_LABELS[row.status]||row.status}</span></p>
  <h2>Angajat</h2>
  <div class="row"><span>Nume</span><span>${user?.firstName||''} ${user?.lastName||''}</span></div>
  <div class="row"><span>Email</span><span>${user?.email||''}</span></div>
  <div class="row"><span>Funcție</span><span>${user?.position||'—'}</span></div>
  <h2>Detalii</h2>
  <div class="row"><span>Salariu bază</span><span>${parseFloat(row.baseSalary||0).toLocaleString('ro-RO')} RON</span></div>
  <div class="row"><span>Ore lucrate</span><span>${parseFloat(row.workedHours||0).toFixed(1)}h (${row.workedDays||0} zile)</span></div>
  <div class="row"><span>Ore suplimentare</span><span>+${parseFloat(row.overtimeHours||0).toFixed(1)}h</span></div>
  <div class="row"><span>Bonusuri</span><span>${parseFloat(row.bonusesTotal||0).toLocaleString('ro-RO')} RON</span></div>
  <div class="row total"><span>Salariu brut</span><span>${parseFloat(row.grossSalary||0).toLocaleString('ro-RO')} RON</span></div>
  <h2>Rețineri</h2>
  <div class="row red"><span>Impozit</span><span>-${parseFloat(row.taxAmount||0).toLocaleString('ro-RO')} RON</span></div>
  <div class="row red"><span>Contribuții sociale</span><span>-${parseFloat(row.socialContributions||0).toLocaleString('ro-RO')} RON</span></div>
  <div class="row red"><span>Alte deduceri</span><span>-${parseFloat(row.deductions||0).toLocaleString('ro-RO')} RON</span></div>
  <div class="row total green"><span>Salariu net</span><span>${parseFloat(row.netSalary||0).toLocaleString('ro-RO')} RON</span></div>
  <p class="footer">Chain HR Platform · Generat automat · ${new Date().toLocaleDateString('ro-RO')}</p>
  </body></html>`;
  const w = window.open('', '_blank', 'width=700,height=900');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

export default function SalaryPage() {
  const { theme, lang } = useTheme();
  const t = useT(lang);
  const { currentUser } = useAuth();
  const textMuted = theme === 'dark' ? '#64748b' : '#94a3b8';
  const grid      = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const cardBg    = theme === 'dark' ? '#1e293b' : '#fff';
  const border    = theme === 'dark' ? '#334155' : '#e2e8f0';
  const text      = theme === 'dark' ? '#f1f5f9' : '#0f172a';

  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salaryService.getMySalaries({ limit: 12 });
      setSalaries(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const latest = salaries[0] || null;
  const chartData = [...salaries].reverse().map(s => ({
    month: `${MONTHS_RO[(s.month||1)-1]} ${String(s.year).slice(-2)}`,
    net: parseFloat(s.netSalary || 0),
  }));

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('salary.title')} />
      <main className="p-6 space-y-6">

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('salary.gross'),    value: latest ? `${parseFloat(latest.grossSalary).toLocaleString('ro-RO')} RON` : '—' },
            { label: t('salary.totalDeductions'), value: latest ? `-${(parseFloat(latest.taxAmount||0)+parseFloat(latest.socialContributions||0)+parseFloat(latest.deductions||0)).toLocaleString('ro-RO')} RON` : '—' },
            { label: t('salary.net'),     value: latest ? `${parseFloat(latest.netSalary).toLocaleString('ro-RO')} RON` : '—' },
          ].map((k) => (
            <div key={k.label} className="bg-dash-card border border-dash-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{k.label}</span>
              <span className="text-dash-text" style={{ fontSize: loading ? '14px' : '22px', fontWeight: 700 }}>
                {loading ? t('salary.loading') : k.value}
              </span>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        {!loading && chartData.length > 0 && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-5">
            <h3 className="text-dash-text mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>{t('salary.netTrend')}</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', color: text }}
                  formatter={(v) => [`${v.toLocaleString('ro-RO')} RON`, t('salary.netCol')]} />
                <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? '#6366f1' : (theme === 'dark' ? '#334155' : '#e2e8f0')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payslip table */}
        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dash-border">
            <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('salary.payslips')}</h3>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{t('salary.loading')}</div>
          ) : salaries.length === 0 ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{t('salary.noPayslips')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dash-border">
                    {[t('salary.month'), t('salary.grossCol'), t('salary.deductionsCol'), t('salary.netCol'), t('salary.status'), ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-dash-text-muted"
                        style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => {
                    const ret = parseFloat(row.taxAmount||0)+parseFloat(row.socialContributions||0)+parseFloat(row.deductions||0);
                    return (
                      <tr key={row.id} className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                        <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px' }}>
                          {MONTHS_RO[(row.month||1)-1]} {row.year}
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>
                          {parseFloat(row.grossSalary).toLocaleString('ro-RO')} RON
                        </td>
                        <td className="px-5 py-3 text-red-400" style={{ fontSize: '13px' }}>
                          -{ret.toLocaleString('ro-RO')} RON
                        </td>
                        <td className="px-5 py-3 text-dash-primary" style={{ fontSize: '13px', fontWeight: 600 }}>
                          {parseFloat(row.netSalary).toLocaleString('ro-RO')} RON
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status] || ''}`}>
                            {t(`salary.status_${row.status}`) || row.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => downloadPDF(row, currentUser)}
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
