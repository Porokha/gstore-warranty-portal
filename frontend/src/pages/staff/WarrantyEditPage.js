import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import WarrantiesPage from './WarrantiesPage';
import WarrantyFormDialog from '../../components/common/WarrantyFormDialog';
import { warrantiesService } from '../../services/warrantiesService';

const WarrantyEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { data: warranty, isLoading, error: loadError } = useQuery(
    ['warranty', id], () => warrantiesService.getById(id), { enabled: Boolean(id) },
  );
  const updateMutation = useMutation((payload) => warrantiesService.update(id, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(['warranty', id]);
      queryClient.invalidateQueries('warranties');
      setSuccess(true);
      setTimeout(() => navigate(`/staff/warranties/${id}`), 1000);
    },
    onError: (err) => setError(err.response?.data?.message || t('common.errorLoading')),
  });

  return <>
    <WarrantiesPage />
    <WarrantyFormDialog mode="edit" warranty={warranty} loading={isLoading}
      error={error || (loadError && (loadError.response?.data?.message || t('warranty.warrantyNotFound')))}
      success={success} saving={updateMutation.isLoading}
      onSubmit={(payload) => { setError(''); updateMutation.mutate(payload); }}
      onClose={() => navigate(`/staff/warranties/${id}`)} />
  </>;
};

export default WarrantyEditPage;
