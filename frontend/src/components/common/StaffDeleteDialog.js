import React from 'react';
import { CircularProgress, Dialog } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StaffDeleteDialog = ({ open, title, description, detail, error, loading = false, confirmLabel, tone = 'danger', onClose, onConfirm }) => {
  const { t } = useTranslation();

  return <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    disableEscapeKeyDown={loading}
    maxWidth={false}
    aria-label={title}
    className="zzv-staff-delete-dialog"
    PaperProps={{ className: 'zzv-staff-delete-dialog__paper' }}
  >
    <div className="zzv-staff-delete">
      <header>
        <h2>{title}</h2>
        <button type="button" aria-label={t('common.close')} onClick={onClose} disabled={loading}>
          <img src="/figma-staff/partner-close.svg" alt="" />
        </button>
      </header>
      <div className="zzv-staff-delete__body">
        <p>{description}</p>
        {detail && <p className="zzv-staff-delete__detail">{detail}</p>}
        {error && <p role="alert" className="zzv-staff-delete__error">{Array.isArray(error) ? error.join(', ') : error}</p>}
      </div>
      <footer>
        <button type="button" className="zzv-staff-delete__cancel" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
        <button type="button" className={`zzv-staff-delete__confirm zzv-staff-delete__confirm--${tone}`} onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={16} color="inherit" /> : tone === 'danger' && <img src="/figma-staff/detail-delete.svg" alt="" />}
          {confirmLabel || t('common.delete')}
        </button>
      </footer>
    </div>
  </Dialog>;
};

export default StaffDeleteDialog;
