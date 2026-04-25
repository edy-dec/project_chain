import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Mail, Phone, RefreshCw, UserRound } from 'lucide-react';
import demoRequestsAdminService from '../../services/demoRequestsAdminService';
import { useTheme } from './AdminLayout';
import { useT } from '../../i18n/useT';

function formatDate(value, lang) {
  if (!value) return '-';
  return new Date(value).toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadgeClass(status) {
  if (status === 'contacted') return 'bg-primary/10 text-primary';
  if (status === 'closed') return 'bg-muted text-muted-foreground';
  return 'bg-warning/10 text-warning';
}

export default function AdminDemoRequests() {
  const { lang } = useTheme();
  const t = useT(lang);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const response = await demoRequestsAdminService.getAll(params);
      setRequests(response.data?.data?.demoRequests ?? []);
    } catch (err) {
      setRequests([]);
      setError(err.message || t('demoRequests.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    setSavingId(id);
    setError('');
    try {
      const response = await demoRequestsAdminService.updateStatus(id, status);
      const updated = response.data?.data?.demoRequest;
      setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err.message || t('demoRequests.updateFailed'));
    } finally {
      setSavingId('');
    }
  };

  const counts = useMemo(() => ({
    total: requests.length,
    fresh: requests.filter((item) => item.status === 'new').length,
    contacted: requests.filter((item) => item.status === 'contacted').length,
  }), [requests]);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('demoRequests.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('demoRequests.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadRequests}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
          >
            <RefreshCw className="size-4" />
            {t('demoRequests.refresh')}
          </button>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="all">{t('demoRequests.filterAll')}</option>
            <option value="new">{t('demoRequests.status_new')}</option>
            <option value="contacted">{t('demoRequests.status_contacted')}</option>
            <option value="closed">{t('demoRequests.status_closed')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('demoRequests.total')}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('demoRequests.newRequests')}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.fresh}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t('demoRequests.contacted')}</p>
          <p className="mt-2 text-2xl font-semibold">{counts.contacted}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            {t('demoRequests.loading')}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            {t('demoRequests.empty')}
          </div>
        ) : (
          requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">{request.fullName}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(request.status)}`}>
                      {t(`demoRequests.status_${request.status}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="size-4" />
                      <span>{request.company}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BriefcaseBusiness className="size-4" />
                      <span>{request.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-4" />
                      <span>{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="size-4" />
                      <span>{request.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UserRound className="size-4" />
                      <span>{request.teamSize}</span>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">{t('demoRequests.submitted')}:</span>{' '}
                      {formatDate(request.createdAt, lang)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      {t('demoRequests.focus')}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{request.focus}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  <button
                    onClick={() => handleStatusChange(request.id, 'new')}
                    disabled={savingId === request.id}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
                  >
                    {t('demoRequests.markNew')}
                  </button>
                  <button
                    onClick={() => handleStatusChange(request.id, 'contacted')}
                    disabled={savingId === request.id}
                    className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    {t('demoRequests.markContacted')}
                  </button>
                  <button
                    onClick={() => handleStatusChange(request.id, 'closed')}
                    disabled={savingId === request.id}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
                  >
                    {t('demoRequests.markClosed')}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
