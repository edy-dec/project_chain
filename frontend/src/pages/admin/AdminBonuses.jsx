import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import employeeService from '../../services/employeeService';
import bonusService from '../../services/bonusService';
import settingsService from '../../services/settingsService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';
import { getDepartmentKey, getDepartmentLabel } from '../../utils/departmentLabel';

const LEGAL_DEDUCTIONS = [
  { id: 'health', nameKey: 'bonuses.deduction.healthInsurance', type: 'Fixed', amount: 150, appliesTo: 'All' },
  { id: 'cas', nameKey: 'bonuses.deduction.pensionCAS', type: 'Percentage', amount: 25, appliesTo: 'All' },
  { id: 'cass', nameKey: 'bonuses.deduction.cass', type: 'Percentage', amount: 10, appliesTo: 'All' },
];

const emptyBonusForm = { name: '', type: 'Fixed', value: 0, appliesTo: 'All' };

export default function AdminBonuses() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [bonuses, setBonuses] = useState([]);
  const [bonusModal, setBonusModal] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [form, setForm] = useState(emptyBonusForm);
  const [employees, setEmployees] = useState([]);
  const [employeeBonusOverrides, setEmployeeBonusOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const emptyBonusesText = lang === 'RO' ? 'Nu exista reguli de bonus configurate.' : 'No bonus rules configured yet.';
  const overrideSaveError = lang === 'RO' ? 'Nu am putut salva exceptia pentru angajat.' : 'Unable to save the employee override.';
  const deleteConfirm = lang === 'RO' ? 'Sigur vrei sa stergi acest bonus?' : 'Are you sure you want to delete this bonus?';

  const displayType = (type, value) => (
    (type === 'Fixed' || type === 'fixed') ? `${value} RON` : `${value}%`
  );

  const normalizeOverrides = (raw) => {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    Object.entries(raw).forEach(([employeeId, bonusMap]) => {
      if (!bonusMap || typeof bonusMap !== 'object') return;
      normalized[employeeId] = {};
      Object.entries(bonusMap).forEach(([bonusId, value]) => {
        if (value === 'inherit' || value === 'enabled' || value === 'disabled') {
          normalized[employeeId][bonusId] = value;
        }
      });
    });
    return normalized;
  };

  const loadBonuses = () => {
    setLoading(true);
    bonusService.getAll()
      .then((res) => {
        const list = res.data?.data?.bonuses ?? [];
        setBonuses(Array.isArray(list) ? list : []);
      })
      .catch(() => setBonuses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    employeeService.getAll({ limit: 200 })
      .then((res) => {
        const list = res.data?.data ?? res.data?.employees ?? res.data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((employee) => ({
          id: employee.id,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
          department: employee.department?.name || 'N/A',
        }));
        setEmployees(normalized);
      })
      .catch(() => setEmployees([]));

    loadBonuses();
  }, []);

  useEffect(() => {
    settingsService.get()
      .then((res) => {
        const saved = res.data?.data?.settings?.bonusOverrides;
        setEmployeeBonusOverrides(normalizeOverrides(saved));
      })
      .catch(() => setEmployeeBonusOverrides({}));
  }, []);

  const departments = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => {
      const raw = employee.department;
      const key = getDepartmentKey(raw);
      if (!key || key === 'all') return;
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: getDepartmentLabel(raw, t, { fallback: raw }),
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, lang === 'RO' ? 'ro' : 'en'));
  }, [employees, t, lang]);

  const filteredEmp = employees.filter((employee) =>
    employee.name.toLowerCase().includes(empSearch.toLowerCase())
  );

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmpId) || null;

  const getOverrideValue = (employeeId, bonusId) =>
    employeeBonusOverrides[employeeId]?.[bonusId] || 'inherit';

  const setOverrideValue = async (employeeId, bonusId, value) => {
    const previous = employeeBonusOverrides;
    const next = {
      ...previous,
      [employeeId]: {
        ...(previous[employeeId] || {}),
        [bonusId]: value,
      },
    };

    setEmployeeBonusOverrides(next);

    try {
      await settingsService.update({ bonusOverrides: next });
    } catch (error) {
      setEmployeeBonusOverrides(previous);
      alert(error?.response?.data?.message || overrideSaveError);
    }
  };

  const isBonusEnabledForEmployee = (bonus, employeeId) => {
    const override = getOverrideValue(employeeId, bonus.id);
    if (override === 'enabled') return true;
    if (override === 'disabled') return false;
    return Boolean(bonus.isActive);
  };

  const isBonusApplicableToEmployee = (bonus, employee) => {
    if (!employee) return false;
    if (!bonus?.appliesTo || bonus.appliesTo === 'All') return true;
    const bonusDept = getDepartmentKey(bonus.appliesTo);
    const employeeDept = getDepartmentKey(employee.department);
    if (!bonusDept || !employeeDept) return false;
    return bonusDept === employeeDept;
  };

  const openAdd = () => {
    setEditingBonus(null);
    setForm(emptyBonusForm);
    setBonusModal(true);
  };

  const openEdit = (bonus) => {
    setEditingBonus(bonus);
    setForm({
      name: bonus.name,
      type: bonus.type === 'percentage' ? 'Percentage' : 'Fixed',
      value: Number(bonus.amount || 0),
      appliesTo: bonus.appliesTo || 'All',
    });
    setBonusModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert(t('bonuses.validationNameRequired'));
      return;
    }

    if (!Number.isFinite(Number(form.value)) || Number(form.value) < 0) {
      alert(lang === 'RO' ? 'Valoarea bonusului trebuie sa fie un numar pozitiv sau zero.' : 'Bonus value must be a non-negative number.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type === 'Percentage' ? 'percentage' : 'fixed',
      amount: Number(form.value),
      appliesTo: form.appliesTo || 'All',
      applicableFrom: editingBonus?.applicableFrom || new Date().toISOString().slice(0, 10),
      applicableTo: editingBonus?.applicableTo || null,
      isActive: editingBonus?.isActive ?? true,
      userId: editingBonus?.userId ?? null,
    };

    try {
      if (editingBonus) {
        await bonusService.update(editingBonus.id, payload);
      } else {
        await bonusService.create(payload);
      }
      loadBonuses();
      setBonusModal(false);
    } catch (error) {
      alert(error?.response?.data?.message || t('employees.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (bonus, isActive) => {
    try {
      await bonusService.update(bonus.id, { isActive });
      setBonuses((prev) => prev.map((item) => (item.id === bonus.id ? { ...item, isActive } : item)));
    } catch (error) {
      alert(error?.response?.data?.message || t('employees.saveFailed'));
    }
  };

  const handleDelete = async (bonusId) => {
    if (!window.confirm(deleteConfirm)) return;

    try {
      await bonusService.delete(bonusId);
      setBonuses((prev) => prev.filter((item) => item.id !== bonusId));
    } catch (error) {
      alert(error?.response?.data?.message || t('employees.saveFailed'));
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <h2 className="text-xl font-semibold">{t('bonuses.title')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t('bonuses.config')}</h3>
            <Button size="sm" onClick={openAdd}>
              <Plus className="size-3.5" /> {t('bonuses.addRule')}
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('bonuses.bonusType')}</TableHead>
                  <TableHead>{t('bonuses.amount')}</TableHead>
                  <TableHead>{t('bonuses.appliesTo')}</TableHead>
                  <TableHead>{t('bonuses.active')}</TableHead>
                  <TableHead className="text-right">{t('bonuses.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell>
                  </TableRow>
                ) : bonuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{emptyBonusesText}</TableCell>
                  </TableRow>
                ) : bonuses.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell className="text-sm font-medium">{bonus.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {displayType(bonus.type, bonus.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getDepartmentLabel(bonus.appliesTo, t, { allKey: 'bonuses.allDept', fallback: bonus.appliesTo })}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(bonus, !bonus.isActive)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${bonus.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
                      >
                        {bonus.isActive ? t('bonuses.active') : t('employees.inactive')}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(bonus)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(bonus.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-medium">{t('bonuses.overrides')}</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('bonuses.searchEmp')}
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {filteredEmp.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmpId(employee.id === selectedEmpId ? null : employee.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedEmpId === employee.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                >
                  {employee.name}
                </button>
              ))}
            </div>
            {selectedEmpId && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('bonuses.activeBonuses')} {selectedEmployee ? `(${selectedEmployee.name})` : ''}
                </p>
                {bonuses
                  .filter((bonus) => isBonusApplicableToEmployee(bonus, selectedEmployee))
                  .map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between py-1 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{bonus.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {displayType(bonus.type, bonus.amount)} · {isBonusEnabledForEmployee(bonus, selectedEmpId) ? t('bonuses.active') : t('employees.inactive')}
                        </p>
                      </div>
                      <div className="w-32 shrink-0">
                        <Select
                          value={getOverrideValue(selectedEmpId, bonus.id)}
                          onValueChange={(value) => setOverrideValue(selectedEmpId, bonus.id, value)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">{t('bonuses.default')}</SelectItem>
                            <SelectItem value="enabled">{t('bonuses.enable')}</SelectItem>
                            <SelectItem value="disabled">{t('bonuses.disable')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t('bonuses.deductions')}</h3>
        <div className="bg-card border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('bonuses.deductionType')}</TableHead>
                <TableHead>{t('bonuses.amount')}</TableHead>
                <TableHead>{t('bonuses.appliesTo')}</TableHead>
                <TableHead>{t('bonuses.active')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEGAL_DEDUCTIONS.map((deduction) => (
                <TableRow key={deduction.id}>
                  <TableCell className="text-sm font-medium">{t(deduction.nameKey)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{displayType(deduction.type, deduction.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getDepartmentLabel(deduction.appliesTo, t, { allKey: 'bonuses.allDept', fallback: deduction.appliesTo })}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t('bonuses.active')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={bonusModal} onOpenChange={setBonusModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingBonus ? t('bonuses.editRule') : t('bonuses.addRule')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('bonuses.name')}</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('bonuses.type')}</label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">{t('bonuses.fixedRON')}</SelectItem>
                  <SelectItem value="Percentage">{t('bonuses.percentage')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('bonuses.value')}</label>
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('bonuses.appliesTo')}</label>
              <Select value={form.appliesTo} onValueChange={(value) => setForm({ ...form, appliesTo: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t('bonuses.allDept')}</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.value} value={department.value}>{department.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusModal(false)}>{t('bonuses.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('employees.saving') : t('bonuses.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
