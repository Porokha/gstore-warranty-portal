import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { CircularProgress, Dialog } from '@mui/material';
import { warrantiesService } from '../../services/warrantiesService';

const ASSET = '/figma-staff/';

const WarrantyDeleteDialog = ({ open, warranties = [], onClose, onConfirm, loading }) => {
  const { t } = useTranslation();
  const single = warranties.length === 1;
  const selected = single ? warranties[0] : null;
  const { data: detail, isLoading, error } = useQuery(
    ['warranty', selected?.id], () => warrantiesService.getById(selected.id),
    { enabled: open && Boolean(selected?.id), staleTime: 30 * 1000 },
  );
  const casesChecked = Array.isArray(detail?.service_cases);
  const linkedCases = Array.isArray(detail?.service_cases) ? detail.service_cases.length : 0;
  const blocked = single && (isLoading || Boolean(error) || !casesChecked || linkedCases > 0);

  return <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth={false}
    className="zzv-warranty-delete-dialog" aria-labelledby="zzv-warranty-delete-title"
    PaperProps={{ className: 'zzv-warranty-delete-dialog__paper' }}>
    <div className="zzv-warranty-delete">
      <header>
        <h2 id="zzv-warranty-delete-title">{t('warranty.deleteWarranty')}</h2>
        <button type="button" aria-label={t('common.close')} onClick={onClose} disabled={loading}>
          <img src={`${ASSET}warranty-delete-close.svg`} alt="" />
        </button>
      </header>
      <div className="zzv-warranty-delete__body">
        {single ? <>
          <p>{t('warranty.deleteSingleWarning', { id: selected.warranty_id })}</p>
          {isLoading && <p className="zzv-warranty-delete__muted"><CircularProgress size={16} /> {t('warranty.checkingLinkedCases')}</p>}
          {!isLoading && (error || !casesChecked) && <p className="zzv-warranty-delete__blocked">{t('warranty.couldNotCheckLinkedCases')}</p>}
          {!isLoading && !error && casesChecked && <p className={linkedCases ? 'zzv-warranty-delete__blocked' : 'zzv-warranty-delete__muted'}>
            {linkedCases ? t('warranty.linkedCasesBlockDelete', { count: linkedCases }) : t('warranty.linkedCasesNote')}
          </p>}
        </> : <>
          <p>{t('warranty.deleteBulkWarning', { count: warranties.length })}</p>
          <p className="zzv-warranty-delete__muted">{t('warranty.bulkLinkedCasesNote')}</p>
        </>}
      </div>
      <footer>
        <button type="button" className="zzv-warranty-delete__cancel" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
        <button type="button" className="zzv-warranty-delete__confirm" onClick={onConfirm} disabled={loading || blocked || !warranties.length}>
          {loading ? <CircularProgress size={16} color="inherit" /> : <img src={`${ASSET}warranty-delete-trash.svg`} alt="" />}{t('common.delete')}
        </button>
      </footer>
    </div>
  </Dialog>;
};

export default WarrantyDeleteDialog;
