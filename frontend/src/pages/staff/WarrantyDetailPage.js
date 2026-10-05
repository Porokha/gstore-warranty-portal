import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'react-query';
import { Alert, CircularProgress, Snackbar } from '@mui/material';
import { warrantiesService } from '../../services/warrantiesService';
import { useAuth } from '../../contexts/AuthContext';
import { isManagementRole } from '../../utils/roles';

const ASSET = '/figma-staff/';
const fmtDate = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleDateString('en-GB') : '—';
const Field = ({ label, value, children }) => <div className="zzv-warranty-detail__field">
  <span>{label}</span><strong>{children || value || '—'}</strong>
</div>;
const Section = ({ title, children, className = '' }) => <section className={`zzv-warranty-detail__section ${className}`}>
  <h2>{title}</h2><div className="zzv-warranty-detail__section-body">{children}</div>
</section>;

const WarrantyDetailPage = () => {
  const { t, i18n } = useTranslation();
  const ka = i18n.language?.startsWith('ka');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageWarranties = isManagementRole(user?.role);
  const [notification, setNotification] = useState(null);
  const { data: warranty, isLoading, error } = useQuery(
    ['warranty', id], () => warrantiesService.getById(id), { enabled: !!id },
  );
  const resendSmsMutation = useMutation(
    () => warrantiesService.resendCreatedSms(id),
    {
      onSuccess: (result) => setNotification({
        message: result?.message || t('warranty.resendWarrantySmsSuccess'),
        severity: result?.success === false ? 'warning' : 'success',
      }),
      onError: (err) => setNotification({
        message: err.response?.data?.message || t('warranty.resendWarrantySmsError'),
        severity: 'error',
      }),
    },
  );

  if (isLoading) return <div className="zzv-warranty-detail__loading"><CircularProgress /></div>;
  if (error || !warranty) return <div className="zzv-warranty-detail">
    <button type="button" className="zzv-warranty-detail__back" onClick={() => navigate('/staff/warranties')}>
      <img src={`${ASSET}warranty-imgIconChevronLeft.svg`} alt="" />{t('common.warranties')}
    </button>
    <Alert severity={error?.response?.status === 404 || !warranty ? 'warning' : 'error'}>
      {error?.response?.status === 404 || !warranty ? t('warranty.warrantyNotFound') : t('common.errorLoading')}
    </Alert>
  </div>;

  const endDate = new Date(warranty.warranty_end);
  const isActive = !Number.isNaN(endDate.getTime()) && endDate >= new Date();
  const daysLeft = Math.ceil((endDate - new Date()) / 86400000);
  const name = `${warranty.customer_name || ''} ${warranty.customer_last_name || ''}`.trim();
  const price = Number(warranty.price);
  const hasExtra = warranty.brand || warranty.model || warranty.condition || warranty.personal_identification_number || warranty.imei;

  return <main className="zzv-warranty-detail">
    <button type="button" className="zzv-warranty-detail__back" onClick={() => navigate('/staff/warranties')}>
      <img src={`${ASSET}warranty-imgIconChevronLeft.svg`} alt="" />{t('common.warranties')}
    </button>
    <div className="zzv-warranty-detail__card">
      <header className="zzv-warranty-detail__head">
        <div className="zzv-warranty-detail__identity">
          <div><h1>{warranty.warranty_id}</h1><span className={`zzv-warranty-detail__status ${isActive ? 'is-active' : ''}`}>{isActive ? t('common.active') : t('common.expired')}</span></div>
          <p>{ka ? 'შეძენილია' : 'Purchased'} {fmtDate(warranty.purchase_date)} · {isActive ? `${ka ? 'დარჩა' : 'Remaining'} ${daysLeft} ${ka ? 'დღე' : 'days'}` : (ka ? 'ვადა გასულია' : 'Expired')}</p>
        </div>
        <div className="zzv-warranty-detail__actions">
          {canManageWarranties && <button type="button" className="zzv-warranty-detail__secondary" disabled={resendSmsMutation.isLoading || !warranty.customer_phone} onClick={() => resendSmsMutation.mutate()}>
            {resendSmsMutation.isLoading ? <CircularProgress size={16} /> : <img src={`${ASSET}warranty-imgIconLeft.svg`} alt="" />}{t('warranty.resendSmsAction')}
          </button>}
          <button type="button" className="zzv-warranty-detail__secondary" onClick={() => navigate(`/staff/cases/new?warranty_id=${id}`)}>
            <img src={`${ASSET}warranty-imgIconLeft1.svg`} alt="" />{t('warranty.newCaseAction')}
          </button>
          {canManageWarranties && <button type="button" className="zzv-warranty-detail__primary" onClick={() => navigate(`/staff/warranties/${id}/edit`)}>
            <img src={`${ASSET}warranty-imgIconLeft2.svg`} alt="" />{t('warranty.editAction')}
          </button>}
        </div>
      </header>

      <div className="zzv-warranty-detail__sections">
        <Section title={ka ? 'პროდუქტი' : 'Product'}>
          <div className="zzv-warranty-detail__grid zzv-warranty-detail__grid--two">
            <Field label={t('warranty.product')} value={warranty.title} />
            <Field label={t('warranty.sku')} value={warranty.sku} />
            <Field label={t('warranty.serialNumber')} value={warranty.serial_number} />
            <Field label={t('warranty.deviceType')} value={warranty.device_type} />
            <Field label={t('warranty.price')} value={Number.isFinite(price) ? `₾${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'} />
          </div>
        </Section>
        <Section title={ka ? 'კლიენტი' : 'Customer'}>
          <div className="zzv-warranty-detail__grid zzv-warranty-detail__grid--two">
            <Field label={t('warranty.customerName')} value={name} />
            <Field label={t('warranty.customerPhone')} value={warranty.customer_phone} />
            {warranty.customer_email && <Field label={t('warranty.customerEmail')} value={warranty.customer_email} />}
          </div>
        </Section>
        <Section title={ka ? 'ვადები' : 'Dates'}>
          <div className="zzv-warranty-detail__grid zzv-warranty-detail__grid--three">
            <Field label={t('warranty.purchaseDate')} value={fmtDate(warranty.purchase_date)} />
            <Field label={t('warranty.warrantyStart')} value={fmtDate(warranty.warranty_start)} />
            <Field label={t('warranty.warrantyEnd')}>
              {fmtDate(warranty.warranty_end)} {isActive && <small>· {ka ? 'დარჩა' : 'Remaining'} {daysLeft} {ka ? 'დღე' : 'days'}</small>}
            </Field>
          </div>
        </Section>
        {canManageWarranties && hasExtra && <Section title={t('warranty.adminOnlyInfo')}>
          <div className="zzv-warranty-detail__grid zzv-warranty-detail__grid--three">
            {warranty.brand && <Field label={t('warranty.brand')} value={warranty.brand} />}
            {warranty.model && <Field label={t('warranty.model')} value={warranty.model} />}
            {warranty.condition && <Field label={t('warranty.condition')} value={warranty.condition} />}
            {warranty.personal_identification_number && <Field label={t('warranty.personalIdentificationNumber')} value={warranty.personal_identification_number} />}
            {warranty.imei && <Field label="IMEI" value={warranty.imei} />}
          </div>
        </Section>}
        {canManageWarranties && warranty.admin_notes && <Section title={warranty.created_source === 'auto_woo' ? t('warranty.importData') : t('warranty.adminNotes')} className="zzv-warranty-detail__section--notes">
          <pre>{warranty.admin_notes.split('\n').map((line, index) => {
            const separator = line.indexOf(':');
            if (separator < 0) return <span key={index} className="zzv-warranty-detail__note-line">{line || '\u00a0'}</span>;
            const label = line.slice(0, separator + 1);
            const value = line.slice(separator + 1);
            return <span key={index} className="zzv-warranty-detail__note-line"><span className="zzv-warranty-detail__note-key">{label}</span><span className={/source|rule|status/i.test(label) ? 'zzv-warranty-detail__note-value--success' : 'zzv-warranty-detail__note-value'}>{value}</span></span>;
          })}</pre>
        </Section>}
      </div>
    </div>
    <Snackbar open={Boolean(notification)} autoHideDuration={5000} onClose={() => setNotification(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity={notification?.severity || 'success'} onClose={() => setNotification(null)}>{notification?.message}</Alert>
    </Snackbar>
  </main>;
};

export default WarrantyDetailPage;
