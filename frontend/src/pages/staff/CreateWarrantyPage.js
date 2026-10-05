import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import WarrantiesPage from './WarrantiesPage';
import WarrantyFormDialog from '../../components/common/WarrantyFormDialog';
import { warrantiesService } from '../../services/warrantiesService';

const CreateWarrantyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const createMutation = useMutation(warrantiesService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('warranties');
      navigate('/staff/warranties');
    },
    onError: (err) => setError(err.response?.data?.message || t('warranty.createFailed')),
  });

  return <>
    <WarrantiesPage />
    <WarrantyFormDialog mode="create" error={error} saving={createMutation.isLoading}
      onSubmit={(payload) => { setError(''); createMutation.mutate(payload); }}
      onClose={() => navigate('/staff/warranties')} />
  </>;
};

export default CreateWarrantyPage;
