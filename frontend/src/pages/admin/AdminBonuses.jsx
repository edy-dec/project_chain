import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales'];

const initialBonuses = [
  { id: '1', name: 'Performance Bonus',   type: 'Percentage', value: 10,   appliesTo: 'All',         active: true  },
  { id: '2', name: 'Holiday Bonus',       type: 'Fixed',      value: 500,  appliesTo: 'All',         active: true  },
  { id: '3', name: 'Engineering Extra',   type: 'Fixed',      value: 300,  appliesTo: 'Engineering', active: true  },
  { id: '4', name: 'Sales Commission',    type: 'Percentage', value: 5,    appliesTo: 'Sales',       active: false },
  { id: '5', name: 'Loyalty Bonus 2yr',   type: 'Fixed',      value: 200,  appliesTo: 'All',         active: true  },
];

const initialDeductions = [
  { id: '1', name: 'Health Insurance',  type: 'Fixed',      amount: 150,  appliesTo: 'All', active: true  },
  { id: '2', name: 'Pension (CAS)',     type: 'Percentage', amount: 25,   appliesTo: 'All', active: true  },
  { id: '3', name: 'CASS',             type: 'Percentage', amount: 10,   appliesTo: 'All', active: true  },
];

const emptyBonusForm = { name: '', type: 'Fixed', value: 0, appliesTo: 'All' };

export default function AdminBonuses() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [bonuses,       setBonuses]       = useState(initialBonuses);
  const [deductions,    setDeductions]    = useState(initialDeductions);
  const [bonusModal,    setBonusModal]    = useState(false);
  const [editingBonus,  setEditingBonus]  = useState(null);
  const [empSearch,     setEmpSearch]     = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [form,          setForm]          = useState(emptyBonusForm);

  // Mock employee list for override panel
  const mockEmployees = [
    { id: '1', name: 'Ion Ionescu'  },
    { id: '2', name: 'Maria Pop'    },
    { id: '3', name: 'Andrei Popa'  },
    { id: '4', name: 'Elena Marin'  },
    { id: '5', name: 'Radu Dima'    },
  ];

  const filteredEmp = mockEmployees.filter((e) =>
    e.name.toLowerCase().includes(empSearch.toLowerCase())
  );

  const openAdd = () => {
    setEditingBonus(null);
    setForm(emptyBonusForm);
    setBonusModal(true);
  };

  const openEdit = (b) => {
    setEditingBonus(b);
    setForm({ name: b.name, type: b.type, value: b.value, appliesTo: b.appliesTo });
    setBonusModal(true);
  };

  const handleSave = () => {
    if (!form.name) return alert('Please provide a bonus name.');
    if (editingBonus) {
      setBonuses((prev) => prev.map((b) => b.id === editingBonus.id ? { ...b, ...form } : b));
    } else {
      setBonuses((prev) => [...prev, { id: String(Date.now()), ...form, active: true }]);
    }
    setBonusModal(false);
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <h2 className="text-xl font-semibold">{t('bonuses.title')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Bonus rules table */}
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
                {bonuses.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-medium">{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.type === 'Fixed' ? `${b.value} RON` : `${b.value}%`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.appliesTo}</TableCell>
                    <TableCell>
                      <Switch
                        checked={b.active}
                        onCheckedChange={() =>
                          setBonuses((prev) => prev.map((x) => x.id === b.id ? { ...x, active: !x.active } : x))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setBonuses((prev) => prev.filter((x) => x.id !== b.id))}
                        >
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

        {/* Right: Individual overrides */}
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
              {filteredEmp.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmpId(emp.id === selectedEmpId ? null : emp.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedEmpId === emp.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  }`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
            {selectedEmpId && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t('bonuses.activeBonuses')}</p>
                {bonuses.filter((b) => b.active).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-1">
                    <span className="text-sm">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {b.type === 'Fixed' ? `${b.value} RON` : `${b.value}%`}
                      </span>
                      <Button variant="ghost" size="icon" className="size-6 text-destructive">
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deductions */}
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
              {deductions.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm font-medium">{d.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.type === 'Fixed' ? `${d.amount} RON` : `${d.amount}%`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.appliesTo}</TableCell>
                  <TableCell>
                    <Switch
                      checked={d.active}
                      onCheckedChange={() =>
                        setDeductions((prev) => prev.map((x) => x.id === d.id ? { ...x, active: !x.active } : x))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit modal */}
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
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
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
              <Select value={form.appliesTo} onValueChange={(v) => setForm({ ...form, appliesTo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t('bonuses.allDept')}</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusModal(false)}>{t('bonuses.cancel')}</Button>
            <Button onClick={handleSave}>{t('bonuses.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
