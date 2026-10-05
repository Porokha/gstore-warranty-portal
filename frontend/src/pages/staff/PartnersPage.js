import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
} from '@mui/material';
import { partnersService } from '../../services/partnersService';
import StaffDeleteDialog from '../../components/common/StaffDeleteDialog';
import { useAuth } from '../../contexts/AuthContext';
import { ArchiveOutlined, RestoreOutlined } from '@mui/icons-material';

const emptyPartnerForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  notes: '',
  active: true,
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB').replace(/\//g, '.');
};

const PartnersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState('current');
  const [partnerToRemove, setPartnerToRemove] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [pageNotice, setPageNotice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState(emptyPartnerForm);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');

  const { data: partners = [], isLoading, isError, refetch } = useQuery(
    ['partners', view],
    () => partnersService.getAll(view === 'archived' ? { archived: true } : {}),
  );

  const closeDialog = () => {
    if (createMutation.isLoading || updateMutation.isLoading) return;
    setDialogOpen(false);
    setEditingPartner(null);
    setFormData(emptyPartnerForm);
    setError('');
  };

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries(['partners']);
    setDialogOpen(false);
    setEditingPartner(null);
    setFormData(emptyPartnerForm);
    setError('');
    setPageError('');
  };

  const createMutation = useMutation((payload) => partnersService.create(payload), {
    onSuccess: handleMutationSuccess,
    onError: (err) => setError(err.response?.data?.message || t('partners.createFailed')),
  });

  const updateMutation = useMutation(({ id, payload }) => partnersService.update(id, payload), {
    onSuccess: handleMutationSuccess,
    onError: (err) => setError(err.response?.data?.message || t('partners.updateFailed')),
  });

  const toggleMutation = useMutation(({ id, active }) => partnersService.update(id, { active }), {
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
      setPageError('');
    },
    onError: (err) => setPageError(err.response?.data?.message || t('partners.updateFailed')),
  });

  const removeMutation = useMutation((partnerId) => partnersService.archiveOrDelete(partnerId), {
    onSuccess: (result) => {
      queryClient.invalidateQueries(['partners']);
      setPartnerToRemove(null);
      setRemoveError('');
      setPageNotice(t(result.action === 'archived' ? 'partners.archiveSuccess' : 'partners.deleteSuccess'));
    },
    onError: (err) => setRemoveError(err.response?.data?.message || t('partners.removeFailed')),
  });

  const restoreMutation = useMutation((partnerId) => partnersService.restore(partnerId), {
    onSuccess: () => {
      queryClient.invalidateQueries(['partners']);
      setPageError('');
      setPageNotice(t('partners.restoreSuccess'));
    },
    onError: (err) => setPageError(err.response?.data?.message || t('partners.restoreFailed')),
  });

  const openCreate = () => {
    setEditingPartner(null);
    setFormData(emptyPartnerForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      contact_person: partner.contact_person || '',
      phone: partner.phone || '',
      email: partner.email || '',
      notes: partner.notes || '',
      active: Boolean(partner.active),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError(t('partners.nameRequired'));
      return;
    }
    const payload = {
      name: formData.name.trim(),
      contact_person: formData.contact_person.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      notes: formData.notes.trim() || null,
      active: formData.active,
    };
    if (editingPartner) updateMutation.mutate({ id: editingPartner.id, payload });
    else createMutation.mutate(payload);
  };

  const totals = partners.reduce((acc, partner) => {
    acc.total += Number(partner.total_cases || 0);
    acc.active += Number(partner.active_cases || 0);
    acc.completed += Number(partner.completed_cases || 0);
    return acc;
  }, { total: 0, active: 0, completed: 0 });
  const query = search.trim().toLocaleLowerCase();
  const visiblePartners = query
    ? partners.filter((partner) => [partner.name, partner.contact_person, partner.phone, partner.email]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query)))
    : partners;
  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <main className="zzv-partners">
      <header className="zzv-partners__head">
        <div>
          <h1>{t('partners.title')}</h1>
          <p>{t('partners.subtitle')}</p>
        </div>
        <button type="button" className="zzv-partners__new" onClick={openCreate}>
          <img src="/figma-staff/partner-add.svg" alt="" />{t('partners.newPartner')}
        </button>
      </header>

      <section className="zzv-partners__metrics" aria-label={t('partners.title')}>
        {[
          { label: t('partners.partnerCount'), value: partners.length, icon: 'partner', tone: 'purple' },
          { label: t('partners.totalCases'), value: totals.total, icon: 'case', tone: 'neutral' },
          { label: t('partners.activeCases'), value: totals.active, icon: 'active', tone: 'blue' },
          { label: t('partners.completedCases'), value: totals.completed, icon: 'completed', tone: 'green' },
        ].map((metric) => (
          <div className="zzv-partners__metric" key={metric.icon}>
            <div className="zzv-partners__metric-label">
              <span className={`zzv-partners__metric-icon zzv-partners__metric-icon--${metric.tone}`}>
                <img src={`/figma-staff/partner-stat-${metric.icon}.svg`} alt="" />
              </span>
              <span>{metric.label}</span>
            </div>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <section className="zzv-partners__list">
        {isAdmin && <div className="zzv-partners__tabs" role="tablist" aria-label={t('partners.title')}>
          <button type="button" role="tab" aria-selected={view === 'current'} className={view === 'current' ? 'is-active' : ''} onClick={() => { setView('current'); setSearch(''); }}>{t('partners.currentPartners')}</button>
          <button type="button" role="tab" aria-selected={view === 'archived'} className={view === 'archived' ? 'is-active' : ''} onClick={() => { setView('archived'); setSearch(''); }}>{t('partners.archivedPartners')}</button>
        </div>}
        <label className="zzv-partners__search">
          <img src="/figma-staff/partner-search.svg" alt="" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('partners.searchPlaceholder')} aria-label={t('partners.search')} />
        </label>
        {pageError && <Alert severity="error" onClose={() => setPageError('')}>{Array.isArray(pageError) ? pageError.join(', ') : pageError}</Alert>}
        {pageNotice && <Alert severity="success" onClose={() => setPageNotice('')}>{pageNotice}</Alert>}
        {isError && <Alert severity="error" action={<button type="button" onClick={() => refetch()}>{t('common.retry')}</button>}>{t('partners.loadFailed')}</Alert>}
        <div className="zzv-partners__table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('partners.partner')}</th>
                <th>{t('partners.contactPerson')}</th>
                <th>{t('partners.totalCases')}</th>
                <th>{t('partners.lastCase')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="zzv-partners__empty"><CircularProgress size={24} /></td></tr>
              ) : visiblePartners.length ? visiblePartners.map((partner) => (
                <tr key={partner.id} className={partner.active && view === 'current' ? '' : 'is-inactive'}>
                  <td><strong>{partner.name}</strong><small>{partner.email || '-'}</small></td>
                  <td><strong>{partner.contact_person || '-'}</strong><small>{partner.phone || '-'}</small></td>
                  <td><strong>{Number(partner.total_cases || 0)}</strong><small>{t('partners.caseBreakdown', { active: Number(partner.active_cases || 0), completed: Number(partner.completed_cases || 0) })}</small></td>
                  <td>{formatDate(partner.last_case_at)}</td>
                  <td>
                    {view === 'archived' ? <span className="zzv-partners__archived">{t('partners.archived')}</span> : <div className="zzv-partners__status">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(partner.active)}
                        aria-label={t('partners.toggleStatus', { name: partner.name })}
                        disabled={toggleMutation.isLoading}
                        onClick={() => toggleMutation.mutate({ id: partner.id, active: !partner.active })}
                      ><span /></button>
                      <span>{partner.active ? t('common.active') : t('common.inactive')}</span>
                    </div>}
                  </td>
                  <td>
                    <div className="zzv-partners__actions">
                      {view === 'archived' ? isAdmin && <button type="button" onClick={() => restoreMutation.mutate(partner.id)} disabled={restoreMutation.isLoading} title={t('partners.restore')} aria-label={t('partners.restorePartner', { name: partner.name })}><RestoreOutlined fontSize="small" /></button> : <>
                        {isAdmin && <button type="button" onClick={() => { setRemoveError(''); setPartnerToRemove(partner); }} title={t(Number(partner.total_cases || 0) > 0 ? 'partners.archive' : 'common.delete')} aria-label={t(Number(partner.total_cases || 0) > 0 ? 'partners.archivePartner' : 'partners.deletePartner', { name: partner.name })}>
                          {Number(partner.total_cases || 0) > 0 ? <ArchiveOutlined fontSize="small" /> : <img src="/figma-staff/partner-delete.svg" alt="" />}
                        </button>}
                        <button type="button" onClick={() => openEdit(partner)} title={t('common.edit')} aria-label={t('partners.editPartner', { name: partner.name })}>
                          <img src="/figma-staff/partner-edit.svg" alt="" />
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="zzv-partners__empty">{t(query ? 'partners.noSearchMatches' : 'partners.noPartners')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth className="zzv-partner-dialog">
        <DialogTitle>
          <span>{editingPartner ? t('partners.editTitle') : t('partners.newPartner')}</span>
          <button type="button" onClick={closeDialog} aria-label={t('common.close')} disabled={isSaving}>
            <img src="/figma-staff/partner-close.svg" alt="" />
          </button>
        </DialogTitle>
        <DialogContent>
          <form id="partner-form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{Array.isArray(error) ? error.join(', ') : error}</Alert>}
            <TextField fullWidth required name="name" label={t('partners.name')} value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
            <TextField fullWidth name="contact_person" label={t('partners.contactPerson')} value={formData.contact_person} onChange={(event) => setFormData((prev) => ({ ...prev, contact_person: event.target.value }))} />
            <div className="zzv-partner-dialog__row">
              <TextField fullWidth type="tel" name="phone" label={t('partners.phone')} value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
              <TextField fullWidth type="email" name="email" label={t('partners.email')} value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <TextField fullWidth multiline minRows={3} name="notes" label={t('partners.notes')} value={formData.notes} onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))} />
            <label className="zzv-partner-dialog__active"><Switch checked={formData.active} onChange={(event) => setFormData((prev) => ({ ...prev, active: event.target.checked }))} />{t('common.active')}</label>
          </form>
        </DialogContent>
        <DialogActions>
          <button type="button" onClick={closeDialog} disabled={isSaving}>{t('common.cancel')}</button>
          <button type="submit" form="partner-form" disabled={isSaving}>{!editingPartner && !isSaving && <img className="zzv-partner-dialog__submit-icon" src="/figma-staff/partner-add.svg" alt="" />}{isSaving ? t('common.saving') : editingPartner ? t('common.save') : t('common.create')}</button>
        </DialogActions>
      </Dialog>
      <StaffDeleteDialog
        open={Boolean(partnerToRemove)}
        title={t(Number(partnerToRemove?.total_cases || 0) > 0 ? 'partners.archiveTitle' : 'partners.deleteTitle')}
        description={t(Number(partnerToRemove?.total_cases || 0) > 0 ? 'partners.archiveWarning' : 'partners.deleteWarning', { name: partnerToRemove?.name || '' })}
        detail={t(Number(partnerToRemove?.total_cases || 0) > 0 ? 'partners.archiveCasesNote' : 'partners.deleteNoCasesNote', { count: Number(partnerToRemove?.total_cases || 0) })}
        error={removeError}
        loading={removeMutation.isLoading}
        confirmLabel={t(Number(partnerToRemove?.total_cases || 0) > 0 ? 'partners.archive' : 'common.delete')}
        tone={Number(partnerToRemove?.total_cases || 0) > 0 ? 'primary' : 'danger'}
        onClose={() => { setPartnerToRemove(null); setRemoveError(''); }}
        onConfirm={() => { if (partnerToRemove) removeMutation.mutate(partnerToRemove.id); }}
      />
    </main>
  );
};

export default PartnersPage;
