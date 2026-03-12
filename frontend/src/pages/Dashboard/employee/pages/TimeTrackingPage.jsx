import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../TopNav';
import { Clock, Play, Square, Coffee } from 'lucide-react';
import attendanceService from '../../../../services/attendanceService';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

const STATUS_META = {
  present:  { label: 'Regular',    cls: 'bg-emerald-400/10 text-emerald-400' },
  late:     { label: 'Întârziat',  cls: 'bg-amber-400/10 text-amber-400'    },
  absent:   { label: 'Absent',     cls: 'bg-red-400/10 text-red-400'        },
  half_day: { label: 'Jumătate',   cls: 'bg-blue-400/10 text-blue-400'      },
  on_leave: { label: 'Concediu',   cls: 'bg-purple-400/10 text-purple-400'  },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
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

export default function TimeTrackingPage() {
  const [now, setNow] = useState(new Date());
  const [today, setToday] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [error, setError] = useState(null);
  const { lang } = useTheme();
  const t = useT(lang);

  // Live clock – tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
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

  useEffect(() => { loadData(); }, [loadData]);

  const isCheckedIn  = !!today?.checkIn;
  const isCheckedOut = !!today?.checkOut;

  async function handleClock() {
    setActionLoading(true);
    setError(null);
    try {
      if (!isCheckedIn) {
        const res = await attendanceService.checkIn();
        setToday(res.data.data.attendance);
        await loadData();
      } else if (!isCheckedOut) {
        const res = await attendanceService.checkOut();
        setToday(res.data.data.attendance);
        setOnBreak(false);
        await loadData();
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
    const base = STATUS_META[att.status] || { label: att.status, cls: 'bg-gray-400/10 text-gray-400' };
    return { ...base, label: STATUS_LABELS_T[att.status] || base.label };
  }

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('timeTracking.title')} />
      <main className="flex-1 p-6 space-y-6">

        {/* Clock card */}
        <div className="bg-dash-card border border-dash-border rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-dash-text-muted" style={{ fontSize: '13px' }}>
            <Clock size={16} />
            <span>{now.toLocaleDateString('ro-RO', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <p className="text-dash-text tabular-nums" style={{ fontSize: '48px', fontWeight: 700 }}>
            {now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>

          {/* Today summary */}
          {isCheckedIn && (
            <div className="flex gap-6 text-center">
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

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isCheckedOut && (
              <button
                onClick={handleClock}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                  isCheckedIn
                    ? 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                    : 'bg-dash-primary text-white hover:bg-dash-primary/90'
                }`}
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {actionLoading ? '⏳' : isCheckedIn
                  ? <><Square size={14} /> {t('timeTracking.clockOut')}</>
                  : <><Play size={14} /> {t('timeTracking.clockIn')}</>
                }
              </button>
            )}
            {isCheckedIn && !isCheckedOut && (
              <button
                onClick={() => setOnBreak((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  onBreak
                    ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                    : 'border-dash-border text-dash-text-secondary hover:bg-dash-sidebar-hover'
                }`}
                style={{ fontSize: '13px' }}
              >
                <Coffee size={14} />
                {onBreak ? t('timeTracking.endBreak') : t('timeTracking.break')}
              </button>
            )}
            {isCheckedOut && (
              <span className="text-emerald-400 font-medium" style={{ fontSize: '13px' }}>✓ {t('timeTracking.dayDone')}</span>
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
              <table className="w-full">
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

      </main>
    </div>
  );
}
