import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { CircularProgress, Dialog } from '@mui/material';
import { warrantiesService } from '../../services/warrantiesService';

const ASSET = '/figma-staff/';
const fmtDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleDateString('en-GB') : '—';

const WarrantyHistoryDialog = ({ warrantyId, onClose, onOpenWarranty, onOpenCase }) => {
  const { t } = useTranslation();
  const { data: warranty, isLoading, error } = useQuery(
    ['warranty', warrantyId], () => warrantiesService.getById(warrantyId),
    { enabled: Boolean(warrantyId), staleTime: 30 * 1000 },
  );
  const cases = Array.isArray(warranty?.service_cases) ? warranty.service_cases : [];
  const end = new Date(warranty?.warranty_end);
  const active = !Number.isNaN(end.getTime()) && end >= new Date();
  const days = Math.ceil((end - new Date()) / 86400000);
  const events = warranty ? [
    { type: 'warranty', id: warranty.id, number: warranty.warranty_id, date: warranty.purchase_date,
      detail: active ? `${t('common.active')} · ${t('warranty.daysRemaining', { count: days })}` : t('common.expired') },
    ...cases.map((item) => ({ type: 'case', id: item.id, number: item.case_number, date: item.opened_at,
      detail: [t(`warranty.caseStatus${item.status_level}`, t('warranty.serviceCase')), item.closed_at ? fmtDate(item.closed_at) : null].filter(Boolean).join(' · '),
      status: item.status_level })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  const firstDate = events.length ? [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date : null;

  return <Dialog open={Boolean(warrantyId)} onClose={onClose} maxWidth={false}
    className="zzv-warranty-history-dialog" aria-labelledby="zzv-warranty-history-title"
    PaperProps={{ className: 'zzv-warranty-history-dialog__paper' }}>
    <div className="zzv-warranty-history">
      <header>
        <div><h2 id="zzv-warranty-history-title">{t('warranty.deviceHistory')}</h2>
          {warranty && <p>{warranty.title} · {warranty.serial_number || warranty.imei || '—'}</p>}</div>
        <button type="button" aria-label={t('common.close')} onClick={onClose}><img src={`${ASSET}warranty-history-close.svg`} alt="" /></button>
      </header>
      <div className="zzv-warranty-history__body">
        {isLoading && <div className="zzv-warranty-history__state"><CircularProgress size={24} /></div>}
        {error && <div className="zzv-warranty-history__state">{t('common.errorLoading')}</div>}
        {warranty && <>
          <div className="zzv-warranty-history__summary">
            <span>{t('warranty.serviceCount', { count: cases.length })}</span>
            <span>{t('warranty.warrantyCount', { count: 1 })}</span>
            <span>{t('warranty.firstRecord', { date: fmtDate(firstDate) })}</span>
          </div>
          <ol className="zzv-warranty-history__timeline">
            {events.map((event) => <li key={`${event.type}-${event.id}`} className={event.type === 'warranty' ? 'is-warranty' : event.status === 4 ? 'is-completed' : ''}>
              <span className="zzv-warranty-history__dot" aria-hidden="true" />
              <div className="zzv-warranty-history__event-head"><span>{event.type === 'warranty' ? t('warranty.historyWarranty') : t('warranty.serviceCase')}</span>
                <button type="button" onClick={() => event.type === 'warranty' ? onOpenWarranty(warranty.id) : onOpenCase(event.id)}>{event.number}</button>
              </div>
              <p>{fmtDate(event.date)} · {event.detail}</p>
            </li>)}
          </ol>
        </>}
      </div>
      <footer>
        <button type="button" className="zzv-warranty-history__close" onClick={onClose}>{t('common.close')}</button>
        {warranty && <button type="button" className="zzv-warranty-history__open" onClick={() => onOpenWarranty(warranty.id)}>
          <img src={`${ASSET}warranty-history-open.svg`} alt="" />{t('warranty.openWarranty')}
        </button>}
      </footer>
    </div>
  </Dialog>;
};

export default WarrantyHistoryDialog;
