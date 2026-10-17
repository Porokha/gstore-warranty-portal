import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { casesService } from '../../services/casesService';

const PickupPanel = ({ case_ }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [error, setError] = useState('');
  const [confirmCollect, setConfirmCollect] = useState(false);
  const { data: pickup, isLoading, isError } = useQuery(['case-pickup', case_.id], () => casesService.getPickup(case_.id));
  const issue = useMutation(() => casesService.issuePickupPin(case_.id), {
    onSuccess: (result) => {
      setIssuedCode(result.code);
      setCode('');
      setError('');
      queryClient.invalidateQueries(['case-pickup', case_.id]);
    },
    onError: (requestError) => setError(requestError.response?.data?.message || t('case.pickupIssueFailed')),
  });
  const verify = useMutation(() => casesService.verifyPickupPin(case_.id, code), {
    onSuccess: () => {
      setCode('');
      setIssuedCode('');
      setError('');
      queryClient.invalidateQueries(['case-pickup', case_.id]);
      queryClient.invalidateQueries(['case', String(case_.id)]);
    },
    onError: (requestError) => setError(requestError.response?.data?.message || t('case.pickupVerifyFailed')),
  });
  const collect = useMutation(() => casesService.collectWithoutPin(case_.id), {
    onSuccess: () => {
      setConfirmCollect(false);
      setError('');
      queryClient.invalidateQueries(['case-pickup', case_.id]);
      queryClient.invalidateQueries(['case', String(case_.id)]);
    },
    onError: (requestError) => setError(requestError.response?.data?.message || t('case.pickupVerifyFailed')),
  });

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: '6px' }}>
      <Typography variant="h6" component="h2">{t('case.pickupTitle')}</Typography>
      {isLoading ? <Typography variant="body2">{t('common.loading')}</Typography> : isError || !pickup ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>{t('case.pickupVerifyFailed')}</Alert>
      ) : pickup.collected_at ? (
        <Alert severity="success" sx={{ mt: 1.5 }}>
          {t('case.pickupCollected', {
            date: new Date(pickup.collected_at).toLocaleString(),
            staff: pickup.collected_by_name || `#${pickup.collected_by_user_id}`,
          })}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" sx={{ mt: 1, mb: 1.5 }}>
            {pickup?.pin_required ? t('case.pickupHelp') : t('case.pickupNoPinHelp')}
          </Typography>
          {pickup?.pin_required && pickup?.has_active_pin && <Typography variant="body2" sx={{ mb: 1.5 }}>
            {t('case.pickupRegenerateHelp')}
          </Typography>}
          {issuedCode && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              {t('case.pickupShareCode')}: <strong>{issuedCode}</strong>
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
          {pickup?.pin_required ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Button variant="outlined" disabled={issue.isLoading || verify.isLoading}
              onClick={() => issue.mutate()} sx={{ borderRadius: '6px' }}>
              {pickup?.has_active_pin ? t('case.pickupRegenerate') : t('case.pickupGenerate')}
            </Button>
            <TextField size="small" label={t('case.pickupEnterCode')} value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code' }}
              sx={{ width: 180 }} />
            <Button variant="contained" disabled={!pickup?.has_active_pin || code.length !== 6 || verify.isLoading}
              onClick={() => verify.mutate()} sx={{ borderRadius: '6px' }}>
              {t('case.pickupConfirm')}
            </Button>
          </Box> : <Button variant="contained" onClick={() => setConfirmCollect(true)} sx={{ borderRadius: '6px' }}>
            {t('case.markCollected')}
          </Button>}
        </>
      )}
      <Dialog open={confirmCollect} onClose={() => setConfirmCollect(false)} maxWidth="xs" fullWidth className="zzv-staff-form-dialog">
        <DialogTitle>{t('case.markCollected')}</DialogTitle>
        <DialogContent>{t('case.confirmCollectNoPin')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCollect(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={collect.isLoading} onClick={() => collect.mutate()}>{t('case.markCollected')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PickupPanel;
