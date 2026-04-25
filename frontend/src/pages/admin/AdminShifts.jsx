import { useEffect, useState } from 'react';
import { addDays, addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import employeeService from '../../services/employeeService';
import shiftService from '../../services/shiftService';
import { useTheme } from './AdminLayout';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DEFAULT_FORM = {
  name: '',
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: '30',
  color: '#22c55e',
  daysOfWeek: [1, 2, 3, 4, 5],
};

const COPY = {
  RO: {
    title: 'Program si schimburi',
    subtitle: 'Creezi tipurile de program, le ajustezi rapid si apoi le aloci angajatilor fara popup-uri inutile.',
    newShift: 'Shift nou',
    editShift: 'Editeaza shift',
    templates: 'Template-uri de shift',
    templatesHint: 'Fiecare template defineste orele, zilele active si pauza.',
    noTemplates: 'Nu exista niciun shift definit inca.',
    createFirst: 'Creeaza primul shift',
    assignments: 'Asignari angajati',
    assignmentsHint: 'Schimbi programul direct din lista si salvezi doar randul care te intereseaza.',
    searchEmployee: 'Cauta dupa nume sau email',
    employee: 'Angajat',
    currentShift: 'Shift curent',
    assignShift: 'Shift nou',
    noShift: 'Fara shift',
    saveAssignment: 'Salveaza',
    saving: 'Se salveaza...',
    unassigned: 'Neasignat',
    assigned: 'Asignat',
    weeklyPreview: 'Previzualizare pe saptamana',
    weeklyPreviewHint: 'Vezi imediat cine lucreaza in fiecare zi pentru saptamana selectata.',
    shiftName: 'Nume shift',
    startTime: 'Ora start',
    endTime: 'Ora final',
    breakMinutes: 'Pauza (minute)',
    color: 'Culoare',
    workDays: 'Zile de lucru',
    cancel: 'Anuleaza',
    create: 'Creeaza',
    update: 'Actualizeaza',
    edit: 'Editeaza',
    delete: 'Sterge',
    deleteConfirm: 'Sigur vrei sa stergi acest shift?',
    deleteBlocked: 'Shiftul nu poate fi sters daca are angajati asignati.',
    loadError: 'Nu am reusit sa incarc datele pentru shifts.',
    saveError: 'Nu am reusit sa salvez modificarile.',
    assignError: 'Nu am reusit sa actualizez asignarea.',
    validationName: 'Completeaza numele shiftului.',
    validationTime: 'Completeaza intervalul orar.',
    validationDays: 'Selecteaza cel putin o zi de lucru.',
    activeDays: 'Zile active',
    breakLabel: 'pauza',
    employeesOnShift: 'angajati',
    summaryTemplates: 'Template-uri',
    summaryAssigned: 'Asignati',
    summaryUnassigned: 'Neasignati',
    noEmployees: 'Nu exista angajati care sa corespunda filtrului.',
    noOneScheduled: 'Nimeni programat',
    nextWeek: 'Saptamana urmatoare',
    prevWeek: 'Saptamana anterioara',
  },
  EN: {
    title: 'Schedules and shifts',
    subtitle: 'Create shift templates, adjust them quickly, then assign them to employees without a clunky modal flow.',
    newShift: 'New shift',
    editShift: 'Edit shift',
    templates: 'Shift templates',
    templatesHint: 'Each template defines hours, active days and break time.',
    noTemplates: 'No shifts have been created yet.',
    createFirst: 'Create the first shift',
    assignments: 'Employee assignments',
    assignmentsHint: 'Change the schedule inline and save only the row you care about.',
    searchEmployee: 'Search by name or email',
    employee: 'Employee',
    currentShift: 'Current shift',
    assignShift: 'New shift',
    noShift: 'No shift',
    saveAssignment: 'Save',
    saving: 'Saving...',
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    weeklyPreview: 'Weekly preview',
    weeklyPreviewHint: 'See right away who is working each day for the selected week.',
    shiftName: 'Shift name',
    startTime: 'Start time',
    endTime: 'End time',
    breakMinutes: 'Break (minutes)',
    color: 'Color',
    workDays: 'Working days',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this shift?',
    deleteBlocked: 'A shift cannot be deleted while employees are assigned to it.',
    loadError: 'Unable to load shift data.',
    saveError: 'Unable to save changes.',
    assignError: 'Unable to update the assignment.',
    validationName: 'Please enter a shift name.',
    validationTime: 'Please enter both start and end time.',
    validationDays: 'Please select at least one working day.',
    activeDays: 'Active days',
    breakLabel: 'break',
    employeesOnShift: 'employees',
    summaryTemplates: 'Templates',
    summaryAssigned: 'Assigned',
    summaryUnassigned: 'Unassigned',
    noEmployees: 'No employees match the current filter.',
    noOneScheduled: 'No one scheduled',
    nextWeek: 'Next week',
    prevWeek: 'Previous week',
  },
};

function fullName(employee) {
  return `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || employee?.email || '-';
}

function sortDays(days) {
  return [...new Set((days || []).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
}

function toTimeInput(value) {
  return String(value || '').slice(0, 5);
}

function normalizeShiftForm(form) {
  return {
    name: String(form.name || '').trim(),
    startTime: toTimeInput(form.startTime),
    endTime: toTimeInput(form.endTime),
    breakMinutes: String(form.breakMinutes || '0'),
    color: form.color || '#22c55e',
    daysOfWeek: sortDays(form.daysOfWeek),
  };
}

export default function AdminShifts() {
  const { lang } = useTheme();
  const copy = COPY[lang] || COPY.EN;

  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [draftAssignments, setDraftAssignments] = useState({});
  const [pageError, setPageError] = useState('');
  const [modalError, setModalError] = useState('');
  const [assignError, setAssignError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingShift, setSavingShift] = useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const labelsShort = lang === 'RO'
    ? ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const labelsLong = lang === 'RO'
    ? ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const assignedEmployeesCount = employees.filter((employee) => employee.shift?.id).length;
  const filteredEmployees = employees.filter((employee) => {
    const haystack = `${fullName(employee)} ${employee.email || ''}`.toLowerCase();
    return haystack.includes(employeeFilter.trim().toLowerCase());
  });

  const loadData = async () => {
    setLoading(true);
    setPageError('');

    try {
      const [employeesRes, shiftsRes] = await Promise.all([
        employeeService.getAll({ limit: 200 }),
        shiftService.getAll(),
      ]);

      const employeeList = employeesRes.data?.data?.employees
        ?? employeesRes.data?.employees
        ?? employeesRes.data?.data
        ?? [];
      const shiftList = shiftsRes.data?.data?.shifts
        ?? shiftsRes.data?.shifts
        ?? shiftsRes.data?.data
        ?? [];

      setEmployees(Array.isArray(employeeList) ? employeeList.filter((employee) => employee.status === 'active' || !employee.status) : []);
      setShifts(Array.isArray(shiftList) ? shiftList : []);
    } catch {
      setPageError(copy.loadError);
      setEmployees([]);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingShift(null);
    setForm(DEFAULT_FORM);
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name || '',
      startTime: toTimeInput(shift.startTime),
      endTime: toTimeInput(shift.endTime),
      breakMinutes: String(shift.breakMinutes ?? 30),
      color: shift.color || '#22c55e',
      daysOfWeek: sortDays(shift.daysOfWeek),
    });
    setModalError('');
    setModalOpen(true);
  };

  const toggleDay = (day) => {
    setForm((current) => {
      const exists = current.daysOfWeek.includes(day);
      return {
        ...current,
        daysOfWeek: exists
          ? current.daysOfWeek.filter((value) => value !== day)
          : sortDays([...current.daysOfWeek, day]),
      };
    });
  };

  const handleSaveShift = async () => {
    const payload = normalizeShiftForm(form);

    if (!payload.name) {
      setModalError(copy.validationName);
      return;
    }

    if (!payload.startTime || !payload.endTime) {
      setModalError(copy.validationTime);
      return;
    }

    if (payload.daysOfWeek.length === 0) {
      setModalError(copy.validationDays);
      return;
    }

    setSavingShift(true);
    setModalError('');

    try {
      if (editingShift?.id) {
        await shiftService.update(editingShift.id, {
          ...payload,
          breakMinutes: Number(payload.breakMinutes),
        });
      } else {
        await shiftService.create({
          ...payload,
          breakMinutes: Number(payload.breakMinutes),
        });
      }

      await loadData();
      setModalOpen(false);
      setEditingShift(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setModalError(error?.response?.data?.message || copy.saveError);
    } finally {
      setSavingShift(false);
    }
  };

  const handleDeleteShift = async (shift) => {
    if (!window.confirm(copy.deleteConfirm)) return;

    try {
      await shiftService.delete(shift.id);
      await loadData();
    } catch (error) {
      alert(error?.response?.data?.message || copy.deleteBlocked);
    }
  };

  const getDraftValue = (employee) => draftAssignments[employee.id] ?? employee.shift?.id ?? '__none__';

  const handleSaveAssignment = async (employee) => {
    const nextShiftId = getDraftValue(employee);
    const currentShiftId = employee.shift?.id ?? '__none__';

    if (nextShiftId === currentShiftId) return;

    setSavingEmployeeId(employee.id);
    setAssignError('');

    try {
      await shiftService.assign(employee.id, nextShiftId === '__none__' ? null : nextShiftId);
      await loadData();
      setDraftAssignments((current) => {
        const next = { ...current };
        delete next[employee.id];
        return next;
      });
    } catch (error) {
      setAssignError(error?.response?.data?.message || copy.assignError);
    } finally {
      setSavingEmployeeId('');
    }
  };

  return (
    <div className="space-y-6 max-w-[1320px]">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {copy.title}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="min-w-[140px] rounded-xl border border-border bg-background px-4 py-3">
              <div className="text-xs text-muted-foreground">{copy.summaryTemplates}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{shifts.length}</div>
            </div>
            <div className="min-w-[140px] rounded-xl border border-border bg-background px-4 py-3">
              <div className="text-xs text-muted-foreground">{copy.summaryAssigned}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{assignedEmployeesCount}</div>
            </div>
            <div className="min-w-[140px] rounded-xl border border-border bg-background px-4 py-3">
              <div className="text-xs text-muted-foreground">{copy.summaryUnassigned}</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{Math.max(0, employees.length - assignedEmployeesCount)}</div>
            </div>
          </div>
        </div>
      </section>

      {pageError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      {assignError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {assignError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{copy.templates}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.templatesHint}</p>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="size-4" />
              {copy.newShift}
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {copy.saving}
              </div>
            ) : shifts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">{copy.noTemplates}</p>
                <Button className="mt-4" onClick={openCreateModal}>{copy.createFirst}</Button>
              </div>
            ) : (
              shifts.map((shift) => {
                const employeeCount = Array.isArray(shift.employees) ? shift.employees.length : employees.filter((employee) => employee.shift?.id === shift.id).length;
                return (
                  <div key={shift.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-black/10"
                            style={{ backgroundColor: shift.color || '#22c55e' }}
                          />
                          <h3 className="text-base font-semibold text-foreground">{shift.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {toTimeInput(shift.startTime)} - {toTimeInput(shift.endTime)} • {shift.breakMinutes ?? 0} {copy.breakLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sortDays(shift.daysOfWeek).map((day) => (
                            <span key={`${shift.id}-${day}`} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {labelsLong[day]}
                            </span>
                          ))}
                        </div>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="size-3.5" />
                          {employeeCount} {copy.employeesOnShift}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditModal(shift)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteShift(shift)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{copy.assignments}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.assignmentsHint}</p>
              </div>
              <div className="w-full max-w-sm">
                <Input
                  value={employeeFilter}
                  onChange={(event) => setEmployeeFilter(event.target.value)}
                  placeholder={copy.searchEmployee}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {copy.saving}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  {copy.noEmployees}
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const draftValue = getDraftValue(employee);
                  const currentValue = employee.shift?.id ?? '__none__';
                  const hasChanges = draftValue !== currentValue;

                  return (
                    <div key={employee.id} className="grid gap-3 rounded-xl border border-border bg-background p-4 lg:grid-cols-[1.1fr_0.9fr_1fr_auto] lg:items-center">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{fullName(employee)}</div>
                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{copy.currentShift}</div>
                        <div className="mt-1 text-sm text-foreground">
                          {employee.shift?.name || copy.unassigned}
                        </div>
                      </div>

                      <Select
                        value={draftValue}
                        onValueChange={(value) => {
                          setDraftAssignments((current) => ({ ...current, [employee.id]: value }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={copy.assignShift} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{copy.noShift}</SelectItem>
                          {shifts.map((shift) => (
                            <SelectItem key={shift.id} value={shift.id}>
                              {shift.name} ({toTimeInput(shift.startTime)} - {toTimeInput(shift.endTime)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => handleSaveAssignment(employee)}
                        disabled={!hasChanges || savingEmployeeId === employee.id}
                      >
                        {savingEmployeeId === employee.id ? copy.saving : copy.saveAssignment}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CalendarDays className="size-5" />
                  {copy.weeklyPreview}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.weeklyPreviewHint}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} title={copy.prevWeek}>
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="min-w-[200px] text-center text-sm font-medium text-foreground">
                  {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                </div>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} title={copy.nextWeek}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {copy.employee}
                    </th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <div>{labelsShort[day.getDay()]}</div>
                        <div className="mt-1 font-normal normal-case">{format(day, 'MMM d')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={`preview-${employee.id}`} className="border-b border-border last:border-0">
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-foreground">{fullName(employee)}</div>
                        <div className="text-xs text-muted-foreground">{employee.shift?.name || copy.unassigned}</div>
                      </td>

                      {weekDays.map((day) => {
                        const isWorkingDay = Array.isArray(employee.shift?.daysOfWeek)
                          && employee.shift.daysOfWeek.includes(day.getDay());

                        return (
                          <td key={`${employee.id}-${day.toISOString()}`} className="px-2 py-3 text-center align-top">
                            {isWorkingDay ? (
                              <div
                                className="rounded-xl px-2 py-2 text-xs font-medium"
                                style={{
                                  backgroundColor: `${employee.shift?.color || '#22c55e'}20`,
                                  color: employee.shift?.color || '#166534',
                                }}
                              >
                                <div>{toTimeInput(employee.shift?.startTime)} - {toTimeInput(employee.shift?.endTime)}</div>
                              </div>
                            ) : (
                              <div className="rounded-xl bg-muted/60 px-2 py-2 text-xs text-muted-foreground">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredEmployees.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">{copy.noOneScheduled}</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingShift ? copy.editShift : copy.newShift}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-foreground">{copy.shiftName}</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={copy.shiftName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{copy.startTime}</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{copy.endTime}</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{copy.breakMinutes}</label>
              <Input
                type="number"
                min="0"
                max="720"
                value={form.breakMinutes}
                onChange={(event) => setForm((current) => ({ ...current, breakMinutes: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{copy.color}</label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  className="h-10 w-16 p-1"
                  value={form.color}
                  onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                />
                <Input
                  value={form.color}
                  onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">{copy.workDays}</label>
              <div className="flex flex-wrap gap-2">
                {DAY_ORDER.map((day) => {
                  const active = form.daysOfWeek.includes(day);
                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-accent'
                      }`}
                    >
                      {labelsLong[day]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {modalError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {modalError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {copy.cancel}
            </Button>
            <Button onClick={handleSaveShift} disabled={savingShift}>
              {savingShift ? copy.saving : editingShift ? copy.update : copy.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
