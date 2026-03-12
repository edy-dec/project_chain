import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../TopNav';
import { Plus, X, CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';
import leaveService from '../../../../services/leaveService';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

const LEAVE_TYPES = [
  { value: 'annual',    label: 'Concediu anual'    },
  { value: 'sick',      label: 'Concediu medical'  },
  { value: 'personal',  label: 'Personal'           },
  { value: 'unpaid',    label: 'Neplătit'           },
  { value: 'maternity', label: 'Maternitate'        },
  { value: 'paternity', label: 'Paternitate'        },
];

const TYPE_LABELS = Object.fromEntries(LEAVE_TYPES.map(t => [t.value, t.label]));

const STATUS_META = {
  approved:  { icon: CheckCircle2, cls: 'bg-emerald-400/10 text-emerald-400' },
  pending:   { icon: Clock,        cls: 'bg-amber-400/10 text-amber-400'    },
  rejected:  { icon: XCircle,      cls: 'bg-red-400/10 text-red-400'        },
  cancelled: { icon: Ban,          cls: 'bg-gray-400/10 text-gray-400'      },
};
const STATUS_LABELS = { approved: 'Aprobat', pending: 'În așteptare', rejected: 'Respins', cancelled: 'Anulat' };

export default function LeavePage() {
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [form, setForm] = useState({ type: 'annual', from: '', to: '', note: '' });

  const { lang } = useTheme();
  const tFn = useT(lang);

  const LEAVE_TYPES_T = [
    { value: 'annual',    label: tFn('empLeave.annual')    },
    { value: 'sick',      label: tFn('empLeave.sick')      },
    { value: 'personal',  label: tFn('empLeave.personal')  },
    { value: 'unpaid',    label: tFn('empLeave.unpaid')    },
    { value: 'maternity', label: tFn('empLeave.maternity') },
    { value: 'paternity', label: tFn('empLeave.paternity') },
  ];
  const TYPE_LABELS_T = Object.fromEntries(LEAVE_TYPES_T.map(lt => [lt.value, lt.label]));
  const STATUS_LABELS_T = { approved: tFn('empLeave.approved'), pending: tFn('empLeave.pending'), rejected: tFn('empLeave.rejected'), cancelled: tFn('empLeave.cancelled') };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, balRes] = await Promise.all([
        leaveService.getMyLeaves({ limit: 50 }).catch(() => null),
        leaveService.getMyBalance().catch(() => null),
      ]);
      setRequests(reqRes?.data?.data || []);
      setBalance(balRes?.data?.data?.balance || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.from || !form.to) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await leaveService.request({
        type: form.type,
        startDate: form.from,
        endDate: form.to,
        reason: form.note,
      });
      setShowModal(false);
      setForm({ type: 'annual', from: '', to: '', note: '' });
      await loadData(); // refresh table + balance
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const TOTAL_ANNUAL = 21;
  const remaining = balance?.annual ?? '—';
  const taken = typeof remaining === 'number' ? TOTAL_ANNUAL - remaining : '—';

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={tFn('empLeave.title')} />
      <main className="p-6 space-y-6">

        {/* Balance cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: tFn('empLeave.totalAnnual'),   value: loading ? '...' : `${TOTAL_ANNUAL} ${tFn('empLeave.days')}` },
            { label: tFn('empLeave.daysTaken'),        value: loading ? '...' : typeof taken === 'number' ? `${taken} ${tFn('empLeave.days')}` : '—' },
            { label: tFn('empLeave.daysRemaining'),   value: loading ? '...' : typeof remaining === 'number' ? `${remaining} ${tFn('empLeave.days')}` : '—' },
          ].map((k) => (
            <div key={k.label} className="bg-dash-card border border-dash-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{k.label}</span>
              <span className="text-dash-text" style={{ fontSize: '22px', fontWeight: 700 }}>{k.value}</span>
            </div>
          ))}
        </div>
        {balance?.sick != null && (
          <div className="bg-dash-card border border-dash-border rounded-xl p-3 flex items-center gap-2">
            <span className="text-dash-text-muted" style={{ fontSize: '12px' }}>{tFn('empLeave.sickRemaining')}:</span>
            <span className="text-dash-text font-semibold" style={{ fontSize: '13px' }}>{balance.sick} {tFn('empLeave.days')}</span>
          </div>
        )}

        {/* Requests table */}
        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dash-border">
            <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{tFn('empLeave.requests')}</h3>
            <button
              onClick={() => { setSubmitError(null); setShowModal(true); }}
              className="flex items-center gap-1.5 bg-dash-primary text-white px-3 py-1.5 rounded-lg hover:bg-dash-primary/90 transition-colors"
              style={{ fontSize: '13px', fontWeight: 500 }}
            >
              <Plus size={14} />
              {tFn('empLeave.newRequest')}
            </button>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{tFn('empLeave.loading')}</div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{tFn('empLeave.noRequests')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dash-border">
                    {[tFn('empLeave.type'), tFn('empLeave.from'), tFn('empLeave.to'), tFn('empLeave.daysCol'), tFn('empLeave.statusCol'), tFn('empLeave.reason')].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-dash-text-muted"
                        style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const meta = STATUS_META[r.status] || STATUS_META.pending;
                    return (
                      <tr key={r.id} className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                        <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px' }}>
                          {TYPE_LABELS_T[r.type] || r.type}
                        </td>
                        <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>{r.startDate}</td>
                        <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>{r.endDate}</td>
                        <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px' }}>{r.days}</td>
                        <td className="px-5 py-3">
                          <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
                            <meta.icon size={11} />
                            {STATUS_LABELS_T[r.status] || r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-dash-text-muted" style={{ fontSize: '13px' }}>{r.reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-dash-card border border-dash-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dash-border">
              <h3 className="text-dash-text" style={{ fontSize: '15px', fontWeight: 600 }}>{tFn('empLeave.leaveRequest')}</h3>
              <button onClick={() => setShowModal(false)} className="text-dash-text-muted hover:text-dash-text transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-dash-text-muted mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>{tFn('empLeave.leaveType')}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-dash-sidebar border border-dash-border rounded-lg px-3 py-2 text-dash-text outline-none focus:border-dash-primary transition-colors"
                  style={{ fontSize: '13px' }}
                >
                  {LEAVE_TYPES_T.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dash-text-muted mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>{tFn('empLeave.from')}</label>
                  <input type="date" required value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                    className="w-full bg-dash-sidebar border border-dash-border rounded-lg px-3 py-2 text-dash-text outline-none focus:border-dash-primary transition-colors" style={{ fontSize: '13px' }} />
                </div>
                <div>
                  <label className="block text-dash-text-muted mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>{tFn('empLeave.to')}</label>
                  <input type="date" required value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                    className="w-full bg-dash-sidebar border border-dash-border rounded-lg px-3 py-2 text-dash-text outline-none focus:border-dash-primary transition-colors" style={{ fontSize: '13px' }} />
                </div>
              </div>
              <div>
                <label className="block text-dash-text-muted mb-1.5" style={{ fontSize: '12px', fontWeight: 500 }}>{tFn('empLeave.reasonOpt')}</label>
                <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2} placeholder={tFn('empLeave.reasonPlaceholder')}
                  className="w-full bg-dash-sidebar border border-dash-border rounded-lg px-3 py-2 text-dash-text placeholder-dash-text-muted outline-none focus:border-dash-primary transition-colors resize-none"
                  style={{ fontSize: '13px' }} />
              </div>
              {submitError && (
                <p className="text-red-400" style={{ fontSize: '12px' }}>{submitError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-dash-border text-dash-text-secondary hover:bg-dash-sidebar-hover transition-colors" style={{ fontSize: '13px' }}>
                  {tFn('empLeave.cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-dash-primary text-white hover:bg-dash-primary/90 transition-colors disabled:opacity-60" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {submitting ? tFn('empLeave.submitting') : tFn('empLeave.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
