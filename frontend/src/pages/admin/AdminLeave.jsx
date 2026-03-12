import { useState, useEffect, useCallback } from 'react';
import { Check, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import leaveService from '../../services/leaveService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

const ITEMS_PER_PAGE = 8;

const statusStyles = {
  pending:  'bg-warning/10 text-warning border-transparent',
  approved: 'bg-success/10 text-success border-transparent',
  rejected: 'bg-error/10 text-error border-transparent',
};

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getEmployeeName(req) {
  if (req.User?.name) return req.User.name;
  if (req.employee?.name) return req.employee.name;
  if (req.employeeName) return req.employeeName;
  return '–';
}

export default function AdminLeave() {
  const { lang } = useTheme();
  const t = useT(lang);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail]     = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAll({ limit: 200 });
      const list = res.data?.data ?? res.data?.leaves ?? res.data ?? [];
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((r) => r.id)));
    }
  };

  const approve = async (id) => {
    try {
      await leaveService.approve(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
    } catch { /* ignore */ }
  };

  const reject = async (id, reason = '') => {
    try {
      await leaveService.reject(id, reason);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
    } catch { /* ignore */ }
  };

  const bulkApprove = async () => {
    await Promise.allSettled([...selected].map(approve));
    setSelected(new Set());
  };

  const bulkReject = async () => {
    await Promise.allSettled([...selected].map((id) => reject(id)));
    setSelected(new Set());
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <h2 className="text-xl font-semibold">{t('adminLeave.title')}</h2>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); setPage(1); setSelected(new Set()); }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === tab ? 'bg-card shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`adminLeave.${tab}`)}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <span className="text-sm">{selected.size} {t('adminLeave.selected')}</span>
          <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={bulkApprove}>
            {t('adminLeave.approveSelected')}
          </Button>
          <Button size="sm" variant="destructive" onClick={bulkReject}>
            {t('adminLeave.rejectSelected')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={paginated.length > 0 && selected.size === paginated.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>{t('adminLeave.employee')}</TableHead>
              <TableHead>{t('adminLeave.type')}</TableHead>
              <TableHead>{t('adminLeave.start')}</TableHead>
              <TableHead>{t('adminLeave.end')}</TableHead>
              <TableHead>{t('adminLeave.days')}</TableHead>
              <TableHead>{t('adminLeave.submitted')}</TableHead>
              <TableHead>{t('adminLeave.status')}</TableHead>
              <TableHead className="text-right">{t('adminLeave.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t('adminLeave.loading')}</TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t('adminLeave.noFound')}</TableCell>
              </TableRow>
            ) : (
              paginated.map((req) => {
                const name = getEmployeeName(req);
                return (
                  <TableRow key={req.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(req.id)} onCheckedChange={() => toggleSelect(req.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                          {getInitials(name)}
                        </div>
                        <span className="text-sm">{name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">{req.type || req.leaveType || '–'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.startDate?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.endDate?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{req.duration ?? req.days ?? '–'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.createdAt?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Badge className={statusStyles[req.status] || statusStyles.pending}>
                        {req.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {req.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => approve(req.id)} className="text-success hover:text-success" title="Approve">
                              <Check className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => reject(req.id)} className="text-destructive hover:text-destructive" title="Reject">
                              <X className="size-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setDetail(req); setRejectNote(''); }} title="View">
                          <Eye className="size-4" />
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
            {t('adminLeave.showing')} {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} {t('adminLeave.of')} {filtered.length}
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

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        {detail && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{t('adminLeave.details')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {getInitials(getEmployeeName(detail))}
                </div>
                <div>
                  <p className="text-sm font-medium">{getEmployeeName(detail)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{detail.type || detail.leaveType} {t('adminLeave.leaveLabel')}</p>
                </div>
                <Badge className={`ml-auto ${statusStyles[detail.status] || ''}`}>
                  {detail.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  [t('adminLeave.startDate'),  detail.startDate?.slice(0, 10)],
                  [t('adminLeave.endDate'),    detail.endDate?.slice(0, 10)],
                  [t('adminLeave.duration'),   `${detail.duration ?? detail.days ?? '–'} ${t('adminLeave.dayUnit')}`],
                  [t('adminLeave.submitted'),  detail.createdAt?.slice(0, 10)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p>{val}</p>
                  </div>
                ))}
              </div>
              {detail.reason && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('adminLeave.reason')}</p>
                  <p className="text-sm bg-muted/50 rounded-md p-2">{detail.reason}</p>
                </div>
              )}
              {detail.status === 'pending' && (
                <div>
                  <label className="text-sm font-medium">{t('adminLeave.noteOpt')}</label>
                  <Input
                    className="mt-1"
                    placeholder={t('adminLeave.addNote')}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </div>
              )}
            </div>
            {detail.status === 'pending' && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => { reject(detail.id, rejectNote); setDetail(null); }}>
                  {t('adminLeave.reject')}
                </Button>
                <Button className="bg-success hover:bg-success/90 text-white" onClick={() => { approve(detail.id); setDetail(null); }}>
                  {t('adminLeave.approve')}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
