import { useState, useEffect, useCallback } from 'react';
import {
  addDays, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, getDay,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import employeeService from '../../services/employeeService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const emptyForm = {
  employeeId: '',
  date: '',
  shiftType: 'Morning',
  startTime: '09:00',
  endTime: '17:00',
};

const shiftTypeDefaults = {
  Morning:   { startTime: '09:00', endTime: '17:00' },
  Afternoon: { startTime: '14:00', endTime: '22:00' },
  Night:     { startTime: '22:00', endTime: '06:00' },
  Custom:    { startTime: '09:00', endTime: '17:00' },
};

const shiftColors = {
  Morning:   'bg-primary/10 text-primary',
  Afternoon: 'bg-warning/10 text-warning',
  Night:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Custom:    'bg-success/10 text-success',
};

export default function AdminShifts() {
  const [shifts, setShifts]         = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [view, setView]             = useState('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen]   = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [form, setForm]             = useState(emptyForm);

  const { lang } = useTheme();
  const t = useT(lang);

  useEffect(() => {
    employeeService.getAll({ limit: 200 })
      .then((res) => {
        const list = res.data?.data ?? res.data?.employees ?? res.data ?? [];
        setEmployees(Array.isArray(list) ? list.filter((e) => e.status === 'active' || !e.status) : []);
      })
      .catch(() => setEmployees([]));
  }, []);

  const navigate = (dir) => {
    if (view === 'weekly') {
      setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthStart    = startOfMonth(currentDate);
  const monthEnd      = endOfMonth(currentDate);
  const monthDays     = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthStartDay = getDay(monthStart);
  const paddingDays   = monthStartDay === 0 ? 6 : monthStartDay - 1;

  const handleShiftTypeChange = (v) => {
    const defs = shiftTypeDefaults[v] || emptyForm;
    setForm((f) => ({ ...f, shiftType: v, startTime: defs.startTime, endTime: defs.endTime }));
  };

  const handleSave = () => {
    if (!form.employeeId || !form.date) {
      alert('Please select employee and date.');
      return;
    }
    const emp = employees.find((e) => String(e.id) === form.employeeId);
    const newShift = {
      id:           String(Date.now()),
      employeeId:   form.employeeId,
      employeeName: emp?.name || '',
      date:         form.date,
      shiftType:    form.shiftType,
      startTime:    form.startTime,
      endTime:      form.endTime,
    };
    setShifts((prev) => [...prev, newShift]);
    setModalOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[160px] text-center">
            {view === 'weekly'
              ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded-md p-0.5 flex text-sm">
            {['weekly', 'monthly'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  view === v ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground'
                }`}
              >
                {t(`shifts.${v}`)}
              </button>
            ))}
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> {t('shifts.defineShift')}
          </Button>
        </div>
      </div>

      {/* Weekly view */}
      {view === 'weekly' && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left w-40 text-xs text-muted-foreground font-medium">{t('shifts.employee')}</th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="p-3 text-center text-xs text-muted-foreground font-medium">
                    <div>{format(day, 'EEE')}</div>
                    <div className="font-normal">{format(day, 'MMM d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-6 text-muted-foreground text-sm">{t('shifts.loadingEmp')}</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-sm font-medium">{emp.name}</td>
                    {weekDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const shift = shifts.find(
                        (s) => String(s.employeeId) === String(emp.id) && s.date === dayStr
                      );
                      return (
                        <td key={dayStr} className="p-1.5 text-center">
                          {shift ? (
                            <div className={`rounded-md px-2 py-1.5 text-xs font-medium ${shiftColors[shift.shiftType] || 'bg-muted text-muted-foreground'}`}>
                              {shift.startTime}–{shift.endTime}
                            </div>
                          ) : (
                            <div className="bg-muted/50 rounded-md px-2 py-1.5 text-xs text-muted-foreground">–</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly view */}
      {view === 'monthly' && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-7 gap-px">
            {[t('shifts.mon'), t('shifts.tue'), t('shifts.wed'), t('shifts.thu'), t('shifts.fri'), t('shifts.sat'), t('shifts.sun')].map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
            ))}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="p-2 min-h-[80px]" />
            ))}
            {monthDays.map((day) => {
              const dayStr   = format(day, 'yyyy-MM-dd');
              const dayShifts = shifts.filter((s) => s.date === dayStr);
              const isExpanded = expandedDay === dayStr;
              return (
                <div
                  key={dayStr}
                  onClick={() => setExpandedDay(isExpanded ? null : dayStr)}
                  className={`p-2 min-h-[80px] border border-border/50 rounded cursor-pointer transition-colors hover:bg-accent/50 ${
                    !isSameMonth(day, currentDate) ? 'opacity-40' : ''
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-1">{format(day, 'd')}</div>
                  {dayShifts.length > 0 && (
                    <div className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                      {dayShifts.length} {t('shifts.scheduled')}
                    </div>
                  )}
                  {isExpanded && dayShifts.map((s) => (
                    <div key={s.id} className="text-xs text-muted-foreground truncate mt-0.5">
                      {s.employeeName?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Define Shift modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('shifts.defineShift')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shifts.employee')}</label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder={t('shifts.selectEmployee')} /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shifts.date')}</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('shifts.shiftType')}</label>
              <Select value={form.shiftType} onValueChange={handleShiftTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Morning', 'Afternoon', 'Night', 'Custom'].map((st) => (
                    <SelectItem key={st} value={st}>{t(`shifts.${st.toLowerCase()}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('shifts.startTime')}</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('shifts.endTime')}</label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('shifts.cancel')}</Button>
            <Button onClick={handleSave}>{t('shifts.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
