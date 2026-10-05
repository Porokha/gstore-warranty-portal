import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { Alert, Button, CircularProgress, Dialog, IconButton } from '@mui/material';
import { casesService } from '../../services/casesService';

const Field = ({ label, value, wide = false }) => (
  <div className={`zzv-case-quick-view__field${wide ? ' zzv-case-quick-view__field--wide' : ''}`}>
    <span>{label}</span>
    <div className={!value ? 'is-empty' : ''}>{value || '—'}</div>
  </div>
);

const Section = ({ title, columns, children }) => (
  <section className="zzv-case-quick-view__section">
    <h3>{title}</h3>
    <div className={`zzv-case-quick-view__fields zzv-case-quick-view__fields--${columns}`}>{children}</div>
  </section>
);

const CaseQuickViewDialog = ({ caseId, onClose, detailPath }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: caseData, isLoading, isError, refetch } = useQuery(
    ['case', caseId],
    () => casesService.getById(caseId),
    { enabled: Boolean(caseId) },
  );
  const fullName = [caseData?.customer_name, caseData?.customer_last_name].filter(Boolean).join(' ');
  const technician = [caseData?.assigned_technician?.name, caseData?.assigned_technician?.last_name].filter(Boolean).join(' ');
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date).replaceAll('/', '.');
  };

  return (
    <Dialog className="zzv-case-quick-view" open={Boolean(caseId)} onClose={onClose} fullWidth maxWidth={false} aria-labelledby="case-quick-view-title">
      <header className="zzv-case-quick-view__header">
        <div>
          <h2 id="case-quick-view-title">{caseData?.case_number || t('case.detailsPreview')}</h2>
          {caseData && <p>{fullName || caseData.partner?.name || t('case.notAvailable')} · {caseData.product_title || t('case.notAvailable')}</p>}
        </div>
        <IconButton onClick={onClose} aria-label={t('common.close')}><img src="/figma-staff/warranty-form-close.svg" width="16" height="16" alt="" /></IconButton>
      </header>
      <div className="zzv-case-quick-view__body">
        {isLoading && <div className="zzv-case-quick-view__state"><CircularProgress size={26} /></div>}
        {isError && <div className="zzv-case-quick-view__state"><Alert severity="error" action={<Button onClick={() => refetch()}>{t('case.retry')}</Button>}>{t('case.quickViewLoadError')}</Alert></div>}
        {caseData && <>
          <Section title={t('case.listCase')} columns={3}>
            <Field label={t('case.caseNumber')} value={caseData.case_number} />
            <Field label={t('case.warrantyId')} value={caseData.warranty?.warranty_id} />
            <Field label={t('case.orderId')} value={caseData.order_id} />
          </Section>
          <Section title={t('case.listDevice')} columns={2}>
            <Field label={t('case.productTitle')} value={caseData.product_title} />
            <Field label={t('case.sku')} value={caseData.sku} />
            <Field label={t('case.serialNumber')} value={caseData.serial_number} />
            <Field label="IMEI" value={caseData.imei} />
            <Field label={t('case.deviceType')} value={caseData.device_type} />
            <Field label={t('case.productId')} value={caseData.product_id} />
          </Section>
          <Section title={t('case.listCustomer')} columns={2}>
            <Field label={t('case.customerName')} value={caseData.customer_name} />
            <Field label={t('case.customerLastName')} value={caseData.customer_last_name} />
            <Field label={t('case.phone')} value={caseData.customer_phone} />
            <Field label={t('case.email')} value={caseData.customer_email} />
            <Field label={t('case.customerInitialNote')} value={caseData.customer_initial_note} wide />
          </Section>
          <Section title={t('case.management')} columns={2}>
            <Field label={t('case.openDate')} value={formatDate(caseData.opened_at)} />
            <Field label={t('case.deadline')} value={formatDate(caseData.deadline_at)} />
            <Field label={t('common.priority')} value={t(`dashboard.priority.${String(caseData.priority || 'normal').toLowerCase()}`)} />
            <Field label={t('case.technician')} value={technician} />
            <Field label={t('common.tags')} value={Array.isArray(caseData.tags) ? caseData.tags.join(', ') : caseData.tags} wide />
          </Section>
        </>}
      </div>
      <footer className="zzv-case-quick-view__footer">
        <Button startIcon={<img src="/figma-staff/warranty-form-close.svg" width="16" height="16" alt="" />} onClick={onClose}>{t('common.close')}</Button>
        <Button startIcon={<img src="/figma-staff/dashboard-case-details.svg" width="16" height="16" alt="" />} variant="contained" onClick={() => { onClose(); navigate(detailPath || `/staff/cases/${caseId}`); }} disabled={!caseData}>{t('case.viewFullDetails')}</Button>
      </footer>
    </Dialog>
  );
};

export default CaseQuickViewDialog;
