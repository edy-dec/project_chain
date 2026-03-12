import React, { useState } from 'react';
import { TopNav } from '../TopNav';
import { Search, Filter } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useT } from '../../../../i18n/useT';

const ALL_EVENTS = [
  { id: 1,  date: '2025-06-13', type: 'Attendance', desc: 'Clocked in at 08:50, clocked out at 17:30',        status: 'Completed' },
  { id: 2,  date: '2025-06-12', type: 'Attendance', desc: 'Clocked in at 09:00, clocked out at 18:00',        status: 'Completed' },
  { id: 3,  date: '2025-06-11', type: 'Attendance', desc: 'Clocked in at 09:10, clocked out at 17:40',        status: 'Completed' },
  { id: 4,  date: '2025-06-10', type: 'Overtime',   desc: 'Logged 9h 15m — overtime approved',                status: 'Approved'  },
  { id: 5,  date: '2025-06-09', type: 'Attendance', desc: 'Clocked in at 09:02, clocked out at 17:58',        status: 'Completed' },
  { id: 6,  date: '2025-06-05', type: 'Leave',      desc: 'Leave request approved — Annual Leave (1 day)',    status: 'Approved'  },
  { id: 7,  date: '2025-05-30', type: 'Salary',     desc: 'Payslip for May 2025 issued — Net: 4.250 RON',     status: 'Paid'      },
  { id: 8,  date: '2025-05-12', type: 'Leave',      desc: 'Sick leave approved — 2 days',                    status: 'Approved'  },
  { id: 9,  date: '2025-04-30', type: 'Salary',     desc: 'Payslip for April 2025 issued — Net: 4.110 RON',  status: 'Paid'      },
  { id: 10, date: '2025-04-02', type: 'Overtime',   desc: 'Logged 9h 00m — overtime approved',               status: 'Approved'  },
];

const TYPES = ['All', 'Attendance', 'Leave', 'Salary', 'Overtime'];

const typeColors = {
  Attendance: 'bg-blue-400/10 text-blue-400',
  Leave:      'bg-amber-400/10 text-amber-400',
  Salary:     'bg-emerald-400/10 text-emerald-400',
  Overtime:   'bg-dash-primary/10 text-dash-primary',
};

export default function HistoryPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const { lang } = useTheme();
  const t = useT(lang);

  const filtered = ALL_EVENTS.filter((e) => {
    const matchType = filter === 'All' || e.type === filter;
    const matchQuery = !query || e.desc.toLowerCase().includes(query.toLowerCase()) || e.type.toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <div className="flex flex-col min-h-full bg-dash-bg">
      <TopNav title={t('history.title')} />
      <main className="p-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('history.search')}
              className="w-full bg-dash-card border border-dash-border rounded-lg pl-8 pr-3 py-2 text-dash-text placeholder-dash-text-muted outline-none focus:border-dash-primary transition-colors"
              style={{ fontSize: '13px' }}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-dash-card border border-dash-border rounded-lg px-2">
            <Filter size={13} className="text-dash-text-muted" />
            {TYPES.map((tp) => (
              <button
                key={tp}
                onClick={() => setFilter(tp)}
                className={`px-2.5 py-1 rounded-md transition-colors ${filter === tp ? 'bg-dash-primary/10 text-dash-primary' : 'text-dash-text-secondary hover:text-dash-text'}`}
                style={{ fontSize: '12px', fontWeight: filter === tp ? 600 : 400 }}
              >
                {tp === 'All' ? t('history.all') : tp}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-dash-card border border-dash-border rounded-xl overflow-hidden">
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-dash-text-muted" style={{ fontSize: '13px' }}>{t('history.noEvents')}</p>
          )}
          {filtered.map((ev, i) => (
            <div key={ev.id} className={`flex gap-4 px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-dash-border' : ''} hover:bg-dash-sidebar-hover transition-colors`}>
              <div className="shrink-0 pt-0.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${typeColors[ev.type]?.replace('bg-', 'bg-').split(' ')[0] || 'bg-dash-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[ev.type] || ''}`}>{ev.type}</span>
                    <span className="text-dash-text-muted" style={{ fontSize: '11px' }}>{ev.date}</span>
                  </div>
                </div>
                <p className="mt-1 text-dash-text-secondary" style={{ fontSize: '13px' }}>{ev.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
