import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import employeeService from '../../services/employeeService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const ITEMS_PER_PAGE = 8;

const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales'];

/** Safely extract department name whether it's a string or {id,name,color} object */
const deptName = (d) => (d && typeof d === 'object' ? d.name : d);

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const statusBadge = {
  active:   'bg-success/10 text-success border-transparent',
  inactive: 'bg-muted text-muted-foreground border-transparent',
};

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  department: '', position: '', salary: '', status: 'active',
};

// ── Employee Detail sidebar ───────────────────────────────────────────────
function EmployeeDetail({ employee, onClose, t }) {
  if (!employee) return null;
  const name = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">{t('employees.detail')}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-accent">
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
            {getInitials(name)}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{employee.position || employee.role || '–'}</p>
            <Badge className={statusBadge[employee.status] || statusBadge.active}>
              {employee.status || 'active'}
            </Badge>
          </div>
        </div>
        <Tabs defaultValue="personal">
          <TabsList className="w-full">
            <TabsTrigger value="personal">{t('employees.personal')}</TabsTrigger>
            <TabsTrigger value="work">{t('employees.work')}</TabsTrigger>
            <TabsTrigger value="salary">{t('employees.salaryTab')}</TabsTrigger>
            <TabsTrigger value="leave">{t('employees.leaveTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <div className="space-y-3 mt-4">
              {[
                { label: t('profile.email'),       value: employee.email },
                { label: t('profile.phone'),       value: employee.phone || '–' },
                { label: t('profile.department'),  value: deptName(employee.department) || '–' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="work">
            <div className="space-y-3 mt-4">
              {[
                { label: t('employees.position'),   value: employee.position || '–' },
                { label: t('employees.department'), value: deptName(employee.department) || '–' },
                { label: t('employees.startDate'), value: employee.startDate || employee.createdAt?.slice(0, 10) || '–' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="salary">
            <div className="space-y-3 mt-4">
              {[
                { label: t('employees.baseSalary'), value: employee.salary ? `${Number(employee.salary).toLocaleString('ro-RO')} RON` : '–' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="leave">
            <div className="mt-4 text-sm text-muted-foreground">{t('employees.leaveNA')}</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminEmployees() {
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]             = useState(1);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detail, setDetail]         = useState(null);
  const [saving, setSaving]         = useState(false);

  const { lang } = useTheme();
  const t = useT(lang);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll({ limit: 200 });
      const list = res.data?.data ?? res.data?.employees ?? res.data ?? [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtering
  const filtered = employees.filter((e) => {
    const name = (e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (e.email || '').toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === 'all' || deptName(e.department) === deptFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      firstName:  emp.firstName || emp.name?.split(' ')[0] || '',
      lastName:   emp.lastName  || emp.name?.split(' ').slice(1).join(' ') || '',
      email:      emp.email || '',
      phone:      emp.phone || '',
      department: deptName(emp.department) || '',
      position:   emp.position || emp.role || '',
      salary:     emp.salary || '',
      status:     emp.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) return;
    setSaving(true);
    try {
      const payload = {
        name:       `${form.firstName} ${form.lastName}`.trim(),
        email:      form.email,
        phone:      form.phone,
        department: form.department,
        position:   form.position,
        salary:     form.salary ? Number(form.salary) : undefined,
        status:     form.status,
      };
      if (editing) {
        await employeeService.update(editing.id, payload);
      } else {
        await employeeService.create(payload);
      }
      await load();
      setModalOpen(false);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await employeeService.delete(deleteTarget.id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await employeeService.update(emp.id, { status: newStatus });
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e)));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">{t('employees.title')}</h2>
        <Button onClick={openAdd}>
          <Plus className="size-4" /> {t('employees.add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('employees.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 w-56"
          />
        </div>
        <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t('employees.department')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('employees.allDepts')}</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('employees.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('employees.all')}</SelectItem>
            <SelectItem value="active">{t('employees.active')}</SelectItem>
            <SelectItem value="inactive">{t('employees.inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} {t('employees.count')}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.employee')}</TableHead>
              <TableHead>{t('employees.department')}</TableHead>
              <TableHead>{t('employees.position')}</TableHead>
              <TableHead>{t('employees.startDate')}</TableHead>
              <TableHead>{t('employees.status')}</TableHead>
              <TableHead className="text-right">{t('employees.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('employees.loading')}</TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('employees.noFound')}</TableCell>
              </TableRow>
            ) : (
              paginated.map((emp) => {
                const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <button
                        onClick={() => setDetail(emp)}
                        className="flex items-center gap-2 hover:underline text-left"
                      >
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                          {getInitials(name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{deptName(emp.department) || '–'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.position || emp.role || '–'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.startDate || emp.createdAt?.slice(0, 10) || '–'}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge[emp.status] || statusBadge.active}>
                        {emp.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="Edit">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(emp)} title="Toggle status">
                          {emp.status === 'active'
                            ? <ToggleRight className="size-4 text-success" />
                            : <ToggleLeft  className="size-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(emp)} title="Delete">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('employees.showing')} {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} {t('employees.of')} {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" onClick={() => setPage(i + 1)} className="w-8">
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('employees.editTitle') : t('employees.addTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('employees.firstName'), key: 'firstName', type: 'text' },
              { label: t('employees.lastName'),    key: 'lastName',  type: 'text' },
              { label: t('employees.email'),      key: 'email',     type: 'email' },
              { label: t('employees.phone'),        key: 'phone',     type: 'tel' },
              { label: t('employees.positionF'),     key: 'position',  type: 'text' },
              { label: t('employees.salary'), key: 'salary',   type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <Input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('employees.deptLabel')}</label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder={t('employees.selectDept')} /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('employees.statusLabel')}</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('employees.active')}</SelectItem>
                  <SelectItem value="inactive">{t('employees.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('employees.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t('employees.saving') : t('employees.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('employees.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('employees.deleteConfirm')}{' '}
            <strong>{deleteTarget?.name || `${deleteTarget?.firstName} ${deleteTarget?.lastName}`}</strong>?
            {t('employees.deleteWarn')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('employees.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('employees.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail panel */}
      {detail && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setDetail(null)} />
          <EmployeeDetail employee={detail} onClose={() => setDetail(null)} t={t} />
        </>
      )}
    </div>
  );
}
