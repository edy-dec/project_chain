import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../TopNav';
import {
  Clock, Play, Square, Coffee, MapPin, Plus, X,
  CheckCircle, XCircle, ChevronDown, Briefcase, Truck, Monitor, GraduationCap,
} from 'lucide-react';
import attendanceService from '../../../../services/attendanceService';
import fieldActivityService from '../../../../services/fieldActivityService';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_META_CLS = {
  present:  'bg-emerald-400/10 text-emerald-400',
  late:     'bg-amber-400/10 text-amber-400',
  absent:   'bg-red-400/10 text-red-400',
  half_day: 'bg-blue-400/10 text-blue-400',
  on_leave: 'bg-purple-400/10 text-purple-400',
};

const ACTIVITY_ICONS = {
  delegation: Briefcase,
  detachment: Briefcase,
  field_work: MapPin,
  remote:     Monitor,
  transport:  Truck,
  training:   GraduationCap,
};

const ACTIVITY_CLS = {
  delegation: 'bg-blue-400/10 text-blue-400',
  detachment: 'bg-violet-400/10 text-violet-400',
  field_work: 'bg-orange-400/10 text-orange-400',
  remote:     'bg-cyan-400/10 text-cyan-400',
  transport:  'bg-yellow-400/10 text-yellow-400',
  training:   'bg-pink-400/10 text-pink-400',
};

const ACT_STATUS_CLS = {
  draft:    'bg-gray-400/10 text-gray-400',
  pending:  'bg-amber-400/10 text-amber-400',
  approved: 'bg-emerald-400/10 text-emerald-400',
  rejected: 'bg-red-400/10 text-red-400',
};

const ALLOWANCE_TYPES = ['delegation', 'detachment'];

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}
function fmtHours(h) {
  if (h == null || h === '') return '—';
  const n = parseFloat(h);
  if (isNaN(n)) return '—';
  const hrs = Math.floor(n);
  const mins = Math.round((n - hrs) * 60);
  return `${hrs}h${mins > 0 ? ' ' + mins + 'm' : ''}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtRON(v) {
  if (!v || parseFloat(v) === 0) return '—';
  return `${parseFloat(v).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`;
}

const EMPTY_FORM = {
  activityType: 'field_work',
  destination: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  startTime: '',
  endTime: '',
  dailyAllowance: '',
  transportCost: '',
  accommodationCost: '',
  otherCosts: '',
  notes: '',
};

// ─── Modal ───────────────────────────────────────────────────────────────────
function ActivityModal({ open, onClose, onSaved, editing, lang }) {
  const t = useT(lang);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const ACTIVITY_TYPE_OPTIONS = [
    'delegation','detachment','field_work','remote','transport','training',
  ];

  useEffect(() => {
    if (editing) {
      setForm({
        activityType:      editing.activityType || 'field_work',
        destination:       editing.destination || '',
        startDate:         editing.startDate || '',
        endDate:           editing.endDate || '',
        startTime:         editing.startTime || '',
        endTime:           editing.endTime || '',
        dailyAllowance:    editing.dailyAllowance || '',
        transportCost:     editing.transportCost || '',
        accommodationCost: editing.accommodationCost || '',
        otherCosts:        editing.otherCosts || '',
        notes:             editing.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErr(null);
  }, [editing, open]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const showAllowance = ALLOWANCE_TYPES.includes(form.activityType);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form };
      if (!payload.startTime) delete payload.startTime;
      if (!payload.endTime)   delete payload.endTime;
      if (!showAllowance)     delete payload.dailyAllowance;
      ['transportCost','accommodationCost','otherCosts','dailyAllowance'].forEach((k) => {
        if (payload[k] === '') payload[k] = 0;
      });

      if (editing) {
        await fieldActivityService.update(editing.id, payload);
      } else {
        await fieldActivityService.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-dash-sidebar border border-dash-border text-dash-text outline-none focus:border-dash-primary transition-colors';
  const labelCls = 'block text-dash-text-muted mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-dash-card border border-dash-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dash-border">
          <h2 className="text-dash-text font-semibold" style={{ fontSize: '14px' }}>
            {editing ? t('fieldActivity.modalEditTitle') : t('fieldActivity.modalNewTitle')}
          </h2>
          <button onClick={onClose} className="text-dash-text-muted hover:text-dash-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelType')}</label>
            <select value={form.activityType} onChange={(e) => set('activityType', e.target.value)}
              className={inputCls} style={{ fontSize: '13px' }} required>
              {ACTIVITY_TYPE_OPTIONS.map((val) => (
                <option key={val} value={val}>{t(`fieldActivity.type_${val}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelDestination')}</label>
            <input type="text" value={form.destination} onChange={(e) => set('destination', e.target.value)}
              className={inputCls} style={{ fontSize: '13px' }} placeholder={t('fieldActivity.destinationHint')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelStartDate')}</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)}
                className={inputCls} style={{ fontSize: '13px' }} required />
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelEndDate')}</label>
              <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)}
                className={inputCls} style={{ fontSize: '13px' }} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelStartTime')}</label>
              <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)}
                className={inputCls} style={{ fontSize: '13px' }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelEndTime')}</label>
              <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)}
                className={inputCls} style={{ fontSize: '13px' }} />
            </div>
          </div>

          {showAllowance && (
            <div>
              <label className={labelCls} style={{ fontSize: '12px' }}>
                {t('fieldActivity.labelDailyAllowance')}
                {' '}<span className="text-dash-text-muted">— {t('fieldActivity.allowanceHint')}</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.dailyAllowance}
                onChange={(e) => set('dailyAllowance', e.target.value)}
                className={inputCls} style={{ fontSize: '13px' }} placeholder="0.00" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'transportCost',     label: t('fieldActivity.labelTransport')      },
              { key: 'accommodationCost', label: t('fieldActivity.labelAccommodation')  },
              { key: 'otherCosts',        label: t('fieldActivity.labelOther')          },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls} style={{ fontSize: '12px' }}>{label}</label>
                <input type="number" min="0" step="0.01" value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={inputCls} style={{ fontSize: '13px' }} placeholder="0.00" />
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls} style={{ fontSize: '12px' }}>{t('fieldActivity.labelNotes')}</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
              className={inputCls} style={{ fontSize: '13px', minHeight: '72px', resize: 'vertical' }} />
          </div>

          {err && <p className="text-red-400" style={{ fontSize: '12px' }}>{err}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-dash-border text-dash-text-secondary hover:bg-dash-sidebar-hover transition-colors"
              style={{ fontSize: '13px' }}>
              {t('fieldActivity.btnCancel')}
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg bg-dash-primary text-white hover:bg-dash-primary/90 transition-colors disabled:opacity-60"
              style={{ fontSize: '13px' }}>
              {saving ? t('fieldActivity.btnSaving') : (editing ? t('fieldActivity.btnSave') : t('fieldActivity.btnRegister'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Field Activities tab ────────────────────────────────────────────────────
function FieldActivitiesTab({ lang }) {
  const t = useT(lang);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [actionErr, setActionErr]   = useState(null);

  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        fieldActivityService.getMy({ limit: 30, page: 1 }).catch(() => null),
        fieldActivityService.getMySummary({ year, month }).catch(() => null),
      ]);
      setActivities(listRes?.data?.data || []);
      setSummary(sumRes?.data?.data?.summary || null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(id) {
    setActionErr(null);
    try {
      await fieldActivityService.cancel(id);
      await load();
    } catch (e) {
      setActionErr(e.response?.data?.error || e.message);
    }
  }

  function openEdit(act) {
    setEditing(act);
    setModalOpen(true);
  }
  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  const summaryCards = summary ? [
    { label: t('fieldActivity.summaryDays'),      value: summary.totalDays?.toFixed(1) || '0' },
    { label: t('fieldActivity.summaryHours'),     value: `${summary.totalHours?.toFixed(1) || '0'}h` },
    { label: t('fieldActivity.summaryAllowance'), value: fmtRON(summary.totalAllowance) },
    { label: t('fieldActivity.summaryCosts'),     value: fmtRON(summary.totalCosts) },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summaryCards.map((c) => (
            <div key={c.label} className="bg-dash-card border border-dash-border rounded-xl px-4 py-3">
              <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>{c.label}</p>
              <p className="text-dash-text font-semibold mt-0.5" style={{ fontSize: '18px' }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header + add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-dash-text font-semibold" style={{ fontSize: '14px' }}>
          {t('fieldActivity.myActivities')}
        </h3>
        <button onClick={openNew}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-primary text-white hover:bg-dash-primary/90 transition-colors"
          style={{ fontSize: '13px' }}>
          <Plus size={14} /> {t('fieldActivity.btnNew')}
        </button>
      </div>

      {actionErr && (
        <p className="text-red-400" style={{ fontSize: '12px' }}>{actionErr}</p>
      )}

      {/* List */}
      <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>
            {t('fieldActivity.loading')}
          </div>
        ) : activities.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-2">
            <MapPin size={32} className="mx-auto text-dash-text-muted opacity-40" />
            <p className="text-dash-text-muted" style={{ fontSize: '13px' }}>
              {t('fieldActivity.empty')}
            </p>
            <button onClick={openNew}
              className="text-dash-primary hover:underline" style={{ fontSize: '13px' }}>
              {t('fieldActivity.emptyAction')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-dash-border">
                  {[t('fieldActivity.colType'), t('fieldActivity.colPeriod'), t('fieldActivity.colLocation'), t('fieldActivity.colDays'), t('fieldActivity.colAllowance'), t('fieldActivity.colStatus'), ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-dash-text-muted"
                      style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const Icon      = ACTIVITY_ICONS[a.activityType] || MapPin;
                  const actCls    = ACTIVITY_CLS[a.activityType]   || 'bg-gray-400/10 text-gray-400';
                  const stCls     = ACT_STATUS_CLS[a.status]       || 'bg-gray-400/10 text-gray-400';
                  const actLabel  = t(`fieldActivity.type_${a.activityType}`) || a.activityType;
                  const stLabel   = t(`fieldActivity.status_${a.status}`)     || a.status;
                  const canEdit   = ['draft', 'pending'].includes(a.status);
                  const canCancel = ['pending', 'approved'].includes(a.status);

                  return (
                    <tr key={a.id} className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${actCls}`}>
                          <Icon size={11} />
                          {actLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dash-text-secondary" style={{ fontSize: '12px' }}>
                        {fmtDateShort(a.startDate)}
                        {a.endDate !== a.startDate && <> — {fmtDateShort(a.endDate)}</>}
                      </td>
                      <td className="px-4 py-3 text-dash-text-secondary" style={{ fontSize: '12px' }}>
                        {a.destination || '—'}
                      </td>
                      <td className="px-4 py-3 text-dash-text" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {parseFloat(a.totalDays).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-dash-text-secondary" style={{ fontSize: '12px' }}>
                        {parseFloat(a.totalAllowance) > 0 ? fmtRON(a.totalAllowance) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stCls}`}>
                          {stLabel}
                        </span>
                        {a.rejectionReason && (
                          <p className="text-red-400 mt-0.5" style={{ fontSize: '11px' }}>{a.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button onClick={() => openEdit(a)}
                              className="text-dash-text-muted hover:text-dash-primary transition-colors"
                              style={{ fontSize: '12px' }}>
                              {t('fieldActivity.btnEdit')}
                            </button>
                          )}
                          {canCancel && (
                            <button onClick={() => handleCancel(a.id)}
                              className="text-red-400/70 hover:text-red-400 transition-colors"
                              style={{ fontSize: '12px' }}>
                              {t('fieldActivity.btnCancelActivity')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActivityModal
        open={modalOpen}
        editing={editing}
        lang={lang}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={load}
      />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function TimeTrackingPage() {
  const [tab, setTab]               = useState('pontaj');
  const [now, setNow]               = useState(new Date());
  const [today, setToday]           = useState(null);
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [onBreak, setOnBreak]       = useState(false);
  const [error, setError]           = useState(null);
  const { lang } = useTheme();
  const t = useT(lang);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        attendanceService.getToday().catch(() => null),
        attendanceService.getMyHistory({ limit: 20, page: 1 }).catch(() => null),
      ]);
      setToday(todayRes?.data?.data?.attendance || null);
      setLogs(histRes?.data?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const isCheckedIn  = !!today?.checkIn;
  const isCheckedOut = !!today?.checkOut;

  async function handleClock() {
    setActionLoading(true);
    setError(null);
    try {
      if (!isCheckedIn) {
        const res = await attendanceService.checkIn();
        setToday(res.data.data.attendance);
        await loadAttendance();
      } else if (!isCheckedOut) {
        const res = await attendanceService.checkOut();
        setToday(res.data.data.attendance);
        setOnBreak(false);
        await loadAttendance();
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const STATUS_LABELS_T = {
    present: t('timeTracking.regular'), late: t('timeTracking.late'),
    absent: t('timeTracking.absent'), half_day: t('timeTracking.halfDay'),
    on_leave: t('timeTracking.onLeave'),
  };
  function getStatusMeta(att) {
    if (parseFloat(att.overtimeHours) > 0)
      return { label: t('timeTracking.overtime'), cls: 'bg-amber-400/10 text-amber-400' };
    const cls   = STATUS_META_CLS[att.status] || 'bg-gray-400/10 text-gray-400';
    const label = STATUS_LABELS_T[att.status] || att.status;
    return { label, cls };
  }

  const TABS = [
    { id: 'pontaj',     label: t('fieldActivity.tabAttendance') },
    { id: 'activitate', label: t('fieldActivity.tab'), dot: true },
  ];

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('timeTracking.title')} />
      <main className="flex-1 p-4 sm:p-6 space-y-5">

        {/* Tab switcher */}
        <div className="flex gap-1 bg-dash-card border border-dash-border rounded-xl p-1 w-fit">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-colors ${
                tab === tb.id
                  ? 'bg-dash-primary text-white'
                  : 'text-dash-text-secondary hover:text-dash-text hover:bg-dash-sidebar-hover'
              }`}
              style={{ fontSize: '13px', fontWeight: tab === tb.id ? 500 : 400 }}
            >
              {tb.dot && tab !== tb.id && (
                <MapPin size={13} />
              )}
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Pontaj ─────────────────────────────────────────────── */}
        {tab === 'pontaj' && (
          <>
            {/* Clock card */}
            <div className="bg-dash-card border border-dash-border rounded-xl p-4 sm:p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-dash-text-muted" style={{ fontSize: '13px' }}>
                <Clock size={16} />
                <span>{now.toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <p className="text-dash-text tabular-nums text-center"
                style={{ fontSize: 'clamp(2rem, 8vw, 48px)', fontWeight: 700 }}>
                {now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>

              {isCheckedIn && (
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-center">
                  <div>
                    <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>Check-In</p>
                    <p className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{fmt(today.checkIn)}</p>
                  </div>
                  {isCheckedOut && (
                    <>
                      <div>
                        <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>Check-Out</p>
                        <p className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{fmt(today.checkOut)}</p>
                      </div>
                      <div>
                        <p className="text-dash-text-muted" style={{ fontSize: '11px' }}>{t('timeTracking.totalHrs')}</p>
                        <p className="text-dash-primary" style={{ fontSize: '14px', fontWeight: 600 }}>{fmtHours(today.totalHours)}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {!isCheckedOut && (
                  <button onClick={handleClock} disabled={actionLoading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                      isCheckedIn
                        ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                        : 'bg-dash-primary text-white hover:bg-dash-primary/90'
                    }`}
                    style={{ fontSize: '13px', fontWeight: 500 }}>
                    {actionLoading ? '⏳' : isCheckedIn
                      ? <><Square size={14} /> {t('timeTracking.clockOut')}</>
                      : <><Play size={14} /> {t('timeTracking.clockIn')}</>
                    }
                  </button>
                )}
                {isCheckedIn && !isCheckedOut && (
                  <button onClick={() => setOnBreak((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      onBreak
                        ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                        : 'border-dash-border text-dash-text-secondary hover:bg-dash-sidebar-hover'
                    }`}
                    style={{ fontSize: '13px' }}>
                    <Coffee size={14} />
                    {onBreak ? t('timeTracking.endBreak') : t('timeTracking.break')}
                  </button>
                )}
                {isCheckedOut && (
                  <span className="text-emerald-400 font-medium" style={{ fontSize: '13px' }}>
                    ✓ {t('timeTracking.dayDone')}
                  </span>
                )}
              </div>

              {isCheckedIn && !isCheckedOut && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${onBreak ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className={onBreak ? 'text-amber-400' : 'text-emerald-400'} style={{ fontSize: '12px' }}>
                    {onBreak ? t('timeTracking.onBreak') : t('timeTracking.active')}
                  </span>
                </div>
              )}
              {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}
            </div>

            {/* Logs table */}
            <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dash-border">
                <h3 className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{t('timeTracking.recentLogs')}</h3>
              </div>
              {loading ? (
                <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{t('timeTracking.loading')}</div>
              ) : logs.length === 0 ? (
                <div className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{t('timeTracking.noRecords')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-dash-border">
                        {[t('timeTracking.date'), 'Check-In', 'Check-Out', t('timeTracking.totalHrs'), t('timeTracking.extraHrs'), t('timeTracking.status')].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-dash-text-muted"
                            style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((row) => {
                        const st = getStatusMeta(row);
                        return (
                          <tr key={row.id} className="border-b border-dash-border last:border-0 hover:bg-dash-sidebar-hover transition-colors">
                            <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px' }}>{fmtDate(row.date)}</td>
                            <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>{fmt(row.checkIn)}</td>
                            <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>{fmt(row.checkOut)}</td>
                            <td className="px-5 py-3 text-dash-text" style={{ fontSize: '13px', fontWeight: 500 }}>{fmtHours(row.totalHours)}</td>
                            <td className="px-5 py-3 text-dash-text-secondary" style={{ fontSize: '13px' }}>
                              {parseFloat(row.overtimeHours) > 0 ? `+${parseFloat(row.overtimeHours).toFixed(1)}h` : '—'}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: Activitate specială ─────────────────────────────────── */}
        {tab === 'activitate' && <FieldActivitiesTab lang={lang} />}

      </main>
    </div>
  );
}
