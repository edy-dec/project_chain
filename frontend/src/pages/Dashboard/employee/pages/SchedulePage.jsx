import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../TopNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import attendanceService from '../../../../services/attendanceService';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

const DAYS_RO = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

const ATT_COLORS = {
  present:  'bg-emerald-400/10 text-emerald-400',
  late:     'bg-amber-400/10 text-amber-400',
  absent:   'bg-red-400/10 text-red-400',
  half_day: 'bg-blue-400/10 text-blue-400',
  on_leave: 'bg-purple-400/10 text-purple-400',
};
const ATT_LABELS = {
  present: 'Prezent', late: 'Târziu', absent: 'Absent', half_day: 'Jumătate', on_leave: 'Concediu',
};

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function SchedulePage() {
  const { currentUser } = useAuth();
  const { lang } = useTheme();
  const t = useT(lang);
  const shift = currentUser?.shift;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [attByDate, setAttByDate] = useState({});

  const cells = buildCalendarDays(year, month);
  const todayDate = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const loadAtt = useCallback(async () => {
    try {
      const res = await attendanceService.getMyMonthly(year, month + 1).catch(() => null);
      const atts = res?.data?.data?.attendances || [];
      const map = {};
      atts.forEach(a => {
        const d = parseInt(String(a.date).substring(8, 10), 10);
        map[d] = a.status;
      });
      setAttByDate(map);
    } catch { /* silent */ }
  }, [year, month]);

  useEffect(() => { loadAtt(); }, [loadAtt]);

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const monthLabel = new Date(year, month).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('schedule.title')} />
      <main className="p-6 space-y-6">

        {/* Shift info banner */}
        {shift ? (
          <div className="bg-dash-card border border-dash-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-dash-primary/10 flex items-center justify-center text-xl">⏰</div>
            <div>
              <p className="text-dash-text" style={{ fontSize: '14px', fontWeight: 600 }}>{shift.name}</p>
              <p className="text-dash-text-muted" style={{ fontSize: '13px' }}>
                {shift.startTime} – {shift.endTime} · {t('schedule.monFri')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-dash-card border border-dash-border rounded-xl p-4 text-dash-text-muted" style={{ fontSize: '13px' }}>
            {t('schedule.noShift')}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dash-border">
            <h3 className="text-dash-text capitalize" style={{ fontSize: '14px', fontWeight: 600 }}>{monthLabel}</h3>
            <div className="flex gap-1">
              <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-md text-dash-text-secondary hover:bg-dash-sidebar-hover transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-dash-border">
            {[t('schedule.sun'), t('schedule.mon'), t('schedule.tue'), t('schedule.wed'), t('schedule.thu'), t('schedule.fri'), t('schedule.sat')].map((d) => (
              <div key={d} className="py-2 text-center text-dash-text-muted" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[80px] p-2 border-b border-r border-dash-border opacity-0 pointer-events-none" />;
              const date = new Date(year, month, day);
              const dow = date.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isToday = isCurrentMonth && day === todayDate;
              const attStatus = attByDate[day];
              return (
                <div key={i} className={`min-h-[80px] p-2 border-b border-r border-dash-border ${isWeekend ? 'opacity-40' : ''}`}>
                  <span
                    className={`inline-flex w-6 h-6 items-center justify-center rounded-full ${
                      isToday ? 'bg-dash-primary text-white' : 'text-dash-text-secondary'
                    }`}
                    style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400 }}
                  >
                    {day}
                  </span>
                  {attStatus ? (
                    <div className={`mt-1 px-1.5 py-0.5 rounded text-center ${ATT_COLORS[attStatus] || ''}`}
                      style={{ fontSize: '10px', fontWeight: 500 }}>
                      {t(`schedule.att_${attStatus}`) || attStatus}
                    </div>
                  ) : !isWeekend && shift ? (
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-dash-primary/10 text-dash-primary text-center"
                      style={{ fontSize: '10px', fontWeight: 500 }}>
                      {shift.startTime}–{shift.endTime}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-dash-primary/10 text-dash-primary">{t('schedule.shiftAssigned')}</span>
          {Object.keys(ATT_LABELS).map((k) => (
            <span key={k} className={`px-2 py-0.5 rounded text-xs font-medium ${ATT_COLORS[k]}`}>{t(`schedule.att_${k}`)}</span>
          ))}
        </div>

      </main>
    </div>
  );
}
