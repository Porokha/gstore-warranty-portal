import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DeleteOutline, RestoreFromTrash } from '@mui/icons-material';
import { shopService } from '../../services/shopService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const statusOptions = ['draft', 'new', 'processing', 'completed', 'cancelled'];
const orderScopes = [
  { value: 'active', label: 'Inbox' },
  { value: 'trash', label: 'Trash' },
];

const statusChipColor = {
  draft: 'default',
  new: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'default',
};

const formatMoney = (value) => `₾${Number(value || 0).toFixed(2)}`;

const ShopAdminOrdersPage = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('active');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('unread');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    severity: 'warning',
    onConfirm: null,
  });

  const { data: orders = [], isLoading } = useQuery(['shop-admin-orders', scope], () =>
    shopService.getOrders(scope),
  );

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries(['shop-admin-orders']);
    await queryClient.invalidateQueries(['shop-admin-orders-badge']);
  };

  const updateMutation = useMutation(({ id, payload }) => shopService.updateOrder(id, payload), {
    onSuccess: async (_, variables) => {
      setError('');
      setMessage(variables?.silent ? '' : 'Order updated.');
      await invalidateOrders();
    },
    onError: (mutationError, variables) => {
      setError(mutationError.response?.data?.message || 'Failed to update order.');
      setMessage(variables?.silent ? '' : '');
    },
  });

  const deleteMutation = useMutation((id) => shopService.deleteOrder(id), {
    onSuccess: async () => {
      setError('');
      setMessage('Order moved to trash.');
      setSelectedOrderId(null);
      await invalidateOrders();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to move order to trash.');
      setMessage('');
    },
  });

  const restoreMutation = useMutation((id) => shopService.restoreOrder(id), {
    onSuccess: async () => {
      setError('');
      setMessage('Order restored.');
      await invalidateOrders();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to restore order.');
      setMessage('');
    },
  });

  const permanentDeleteMutation = useMutation((id) => shopService.permanentlyDeleteOrder(id), {
    onSuccess: async () => {
      setError('');
      setMessage('Order deleted permanently.');
      setSelectedOrderId(null);
      await invalidateOrders();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to delete order permanently.');
      setMessage('');
    },
  });

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (scope === 'active' && search.trim()) {
      const query = search.trim().toLocaleLowerCase();
      result = result.filter((order) => [order.order_number, order.customer_name, order.customer_last_name, order.customer_phone]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query)));
    }

    if (scope === 'active' && statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (scope === 'active' && unreadOnly) {
      result = result.filter((order) => !order.viewed_at);
    }

    if (scope === 'active') {
      result.sort((left, right) => {
        if (sortMode === 'unread') {
          const leftUnread = left.viewed_at ? 1 : 0;
          const rightUnread = right.viewed_at ? 1 : 0;
          if (leftUnread !== rightUnread) {
            return leftUnread - rightUnread;
          }
        }

        if (sortMode === 'oldest') {
          return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
    }

    return result;
  }, [orders, scope, search, sortMode, statusFilter, unreadOnly]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) || null,
    [filteredOrders, selectedOrderId],
  );

  useEffect(() => {
    if (scope !== 'active') {
      setSelectedOrderId(null);
      return;
    }

    setSelectedOrderId((current) =>
      current && filteredOrders.some((order) => order.id === current) ? current : null,
    );
  }, [filteredOrders, scope]);

  useEffect(() => {
    if (!selectedOrder || scope !== 'active' || selectedOrder.viewed_at) {
      return;
    }

    updateMutation.mutate({
      id: selectedOrder.id,
      payload: { viewed: true },
      silent: true,
    });
  }, [scope, selectedOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = useMemo(
    () => orders.filter((order) => !order.viewed_at && !order.deleted_at).length,
    [orders],
  );

  const activeCountByStatus = useMemo(
    () =>
      statusOptions.reduce((acc, status) => {
        acc[status] = orders.filter((order) => order.status === status && !order.deleted_at).length;
        return acc;
      }, {}),
    [orders],
  );

  const renderInboxSkeleton = () =>
    Array.from({ length: 7 }).map((_, index) => (
      <Paper
        key={`order-skeleton-${index}`}
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: '1px solid #e5ebf3', mb: 1.25 }}
      >
        <Skeleton variant="text" width={130} height={28} />
        <Skeleton variant="text" width={180} height={22} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Skeleton variant="rounded" width={70} height={24} />
          <Skeleton variant="rounded" width={58} height={24} />
        </Stack>
      </Paper>
    ));

  return (
    <Grid className="zzv-admin-page zzv-admin-page--shop-orders zzv-shop-orders" container spacing={0}>
      <Grid item xs={12}>
        <Paper className="zzv-admin-table-card zzv-shop-orders-panel" elevation={0} sx={{ overflow: 'hidden' }}>
          <Box className="zzv-admin-filter-card" sx={{ p: 3, borderBottom: '1px solid #e6edf7', background: 'linear-gradient(180deg, #fbfcff 0%, #f6f8fc 100%)' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography sx={{ fontSize: '26px', fontWeight: 900, color: '#172033' }}>
                  {t('shopOrders.title')}
                </Typography>
                <Typography sx={{ color: '#667085', mt: 0.75 }}>
                  {t('shopOrders.description')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={t('shopOrders.unreadCount', { count: unreadCount })}
                  sx={{
                    borderRadius: 999,
                    bgcolor: unreadCount ? '#efe7ff' : '#eef3f8',
                    color: unreadCount ? '#6941c6' : '#667085',
                    fontWeight: 800,
                  }}
                />
                <Chip
                  label={t('shopOrders.totalCount', { count: orders.length })}
                  sx={{ borderRadius: 999, bgcolor: '#eef3f8', color: '#344054', fontWeight: 800 }}
                />
              </Stack>
            </Stack>

            <Tabs value={scope} onChange={(event, value) => setScope(value)} sx={{ mt: 2, minHeight: 42 }}>
              {orderScopes.map((item) => (
                <Tab
                  key={item.value}
                  value={item.value}
                  label={t(`shopOrders.${item.value === 'active' ? 'inbox' : 'trash'}`)}
                  sx={{ textTransform: 'none', minHeight: 42, fontWeight: 800 }}
                />
              ))}
            </Tabs>

            {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>

          {scope === 'active' ? (
            <Grid container className="zzv-shop-orders__split" sx={{ minHeight: 640 }}>
              <Grid item xs={12} lg={4.5} className="zzv-shop-orders__list-column" sx={{ borderRight: { lg: '1px solid #e6edf7' } }}>
                <Box className="zzv-shop-orders__toolbar">
                  <TextField
                    size="small"
                    fullWidth
                    placeholder={t('shopOrders.search')}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    inputProps={{ 'aria-label': t('shopOrders.search') }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label={t('shopOrders.status')}
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <MenuItem value="all">{t('shopOrders.allStatuses')}</MenuItem>
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {t(`shopOrders.statuses.${status}`)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label={t('shopOrders.sort')}
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value)}
                    >
                      <MenuItem value="unread">{t('shopOrders.unreadFirst')}</MenuItem>
                      <MenuItem value="newest">{t('shopOrders.newestFirst')}</MenuItem>
                      <MenuItem value="oldest">{t('shopOrders.oldestFirst')}</MenuItem>
                    </TextField>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <Chip
                      label={t('shopOrders.allCount', { count: orders.length })}
                      clickable
                      onClick={() => { setUnreadOnly(false); setStatusFilter('all'); }}
                      sx={{
                        borderRadius: 999,
                        bgcolor: !unreadOnly && statusFilter === 'all' ? '#172033' : '#eef3f8',
                        color: !unreadOnly && statusFilter === 'all' ? '#fff' : '#344054',
                        fontWeight: 800,
                      }}
                    />
                    <Chip label={t('shopOrders.unreadCount', { count: unreadCount })} clickable onClick={() => { setUnreadOnly(true); setStatusFilter('all'); }} sx={{ bgcolor: unreadOnly ? '#efe7ff' : '#f6f8fc', color: unreadOnly ? '#6941c6' : '#475467', fontWeight: 700 }} />
                    {statusOptions.map((status) => (
                      <Chip
                        key={status}
                        label={`${t(`shopOrders.statuses.${status}`)} ${activeCountByStatus[status] || 0}`}
                        clickable
                        onClick={() => { setUnreadOnly(false); setStatusFilter((current) => (current === status ? 'all' : status)); }}
                        sx={{
                          borderRadius: 999,
                          bgcolor: statusFilter === status ? '#efe7ff' : '#f6f8fc',
                          color: statusFilter === status ? '#6941c6' : '#475467',
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box className="zzv-shop-orders__list">
                  {isLoading && renderInboxSkeleton()}
                  {!isLoading && filteredOrders.length === 0 && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px dashed #dce4f0', textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 800, color: '#172033' }}>{t('shopOrders.noMatches')}</Typography>
                      <Typography sx={{ color: '#667085', mt: 0.5 }}>
                        {t('shopOrders.noMatchesDescription')}
                      </Typography>
                    </Paper>
                  )}

                  {!isLoading &&
                    filteredOrders.map((order) => {
                      const unread = !order.viewed_at;
                      const selected = order.id === selectedOrderId;
                      return (
                        <Paper
                          key={order.id}
                          className={`zzv-shop-orders__item ${selected ? 'is-selected' : ''} ${unread ? 'is-unread' : ''}`}
                          elevation={0}
                          onClick={() => setSelectedOrderId(order.id)}
                          sx={{
                            p: 2,
                            mb: 1.25,
                            borderRadius: 3,
                            border: selected ? '1px solid #c7b9ff' : '1px solid #e6edf7',
                            bgcolor: selected ? '#faf7ff' : unread ? '#f7f3ff' : '#ffffff',
                            cursor: 'pointer',
                            boxShadow: selected ? '0 10px 24px rgba(105, 65, 198, 0.08)' : 'none',
                            transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              borderColor: '#d4c5ff',
                            },
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography sx={{ fontWeight: 900, color: '#172033' }}>
                                  {order.order_number}
                                </Typography>
                                {unread && <span className="zzv-shop-orders__unread-dot" title={t('shopOrders.unread')} />}
                              </Stack>
                              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#172033', mt: 0.5 }}>
                                {order.customer_name} {order.customer_last_name || ''}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: '#667085', mt: 0.35 }}>
                                {order.customer_phone}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 900, color: '#172033', whiteSpace: 'nowrap' }}>
                              {formatMoney(order.total_amount)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }}>
                            <Chip
                              size="small"
                              label={t(`shopOrders.statuses.${order.status}`, { defaultValue: order.status })}
                              color={statusChipColor[order.status] || 'default'}
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                            <Chip
                              size="small"
                              label={t('shopOrders.itemsCount', { count: Array.isArray(order.items_json) ? order.items_json.length : 0 })}
                              sx={{ borderRadius: 999, bgcolor: '#eef3f8', color: '#344054', fontWeight: 700 }}
                            />
                            <Typography sx={{ fontSize: '11px', color: '#98a2b3', ml: 'auto' }}>
                              {new Date(order.created_at).toLocaleString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB')}
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                </Box>
              </Grid>

              <Grid item xs={12} lg={7.5} className="zzv-shop-orders__detail-column">
                <Box className="zzv-shop-orders__detail">
                  {selectedOrder ? (
                    <Stack spacing={2.5} className="zzv-shop-orders__detail-content">
                      <Stack className="zzv-shop-orders__detail-heading" direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography sx={{ fontSize: '28px', fontWeight: 900, color: '#172033' }}>
                            {selectedOrder.order_number}
                          </Typography>
                          <Typography sx={{ color: '#667085', mt: 0.5 }}>
                            {t('shopOrders.created')} {new Date(selectedOrder.created_at).toLocaleString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB')}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {!selectedOrder.viewed_at && (
                            <Chip label="Unread" sx={{ borderRadius: 999, bgcolor: '#6941c6', color: '#fff', fontWeight: 800 }} />
                          )}
                          <Chip label={formatMoney(selectedOrder.total_amount)} sx={{ borderRadius: 999, bgcolor: '#edf7f1', color: '#067647', fontWeight: 900 }} />
                        </Stack>
                      </Stack>

                      <Grid container spacing={2} className="zzv-shop-orders__info-grid">
                        <Grid item xs={12} md={6}>
                          <Paper elevation={0} className="zzv-shop-orders__info-card" sx={{ height: '100%' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {t('shopOrders.customer')}
                            </Typography>
                            <Typography sx={{ fontSize: '20px', fontWeight: 900, color: '#172033', mt: 1 }}>
                              {selectedOrder.customer_name} {selectedOrder.customer_last_name || ''}
                            </Typography>
                            <Typography sx={{ color: '#475467', mt: 0.75 }}>{selectedOrder.customer_phone}</Typography>
                            <Typography sx={{ color: '#475467', mt: 0.35 }}>{selectedOrder.customer_email || 'No email'}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper elevation={0} className="zzv-shop-orders__info-card" sx={{ height: '100%' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {t('shopOrders.orderMeta')}
                            </Typography>
                            <Stack spacing={0.9} sx={{ mt: 1 }}>
                              <Typography sx={{ color: '#344054' }}>
                                {t('shopOrders.heardAbout')}: <strong>{selectedOrder.heard_about || t('shopOrders.notProvided')}</strong>
                              </Typography>
                              <Typography sx={{ color: '#344054' }}>
                                {t('shopOrders.partnerWarranty')}: <strong>{selectedOrder.has_partner_warranty ? t('shopOrders.yes') : t('shopOrders.no')}</strong>
                              </Typography>
                              {selectedOrder.has_partner_warranty && (
                                <Typography sx={{ color: '#344054' }}>
                                  {t('shopOrders.warrantyId')}: <strong>{selectedOrder.partner_warranty_id || t('shopOrders.missing')}</strong>
                                </Typography>
                              )}
                              <Typography sx={{ color: '#344054' }}>
                                {t('shopOrders.payment')}: <strong>{selectedOrder.payment_method || 'onsite'}</strong>
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Paper elevation={0} className="zzv-shop-orders__workflow">
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {t('shopOrders.workflow')}
                            </Typography>
                            <Typography sx={{ fontSize: '18px', fontWeight: 900, color: '#172033', mt: 1 }}>
                              {t('shopOrders.workflowDescription')}
                            </Typography>
                          </Box>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                            <TextField
                              select
                              size="small"
                              value={selectedOrder.status}
                              onChange={(event) =>
                                updateMutation.mutate({
                                  id: selectedOrder.id,
                                  payload: { status: event.target.value },
                                })
                              }
                              sx={{ minWidth: 180 }}
                            >
                              {statusOptions.map((status) => (
                                <MenuItem key={status} value={status}>
                                  {t(`shopOrders.statuses.${status}`)}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Stack
                              direction="row"
                              spacing={1.25}
                              sx={{
                                flexWrap: 'wrap',
                                rowGap: 1.25,
                                justifyContent: { xs: 'stretch', sm: 'flex-end' },
                                '& > *': {
                                  flexShrink: 0,
                                },
                              }}
                            >
                              <Button
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutline />}
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    title: 'Move Order To Trash',
                                    message: 'This order will be moved to trash and hidden from the active inbox.',
                                    confirmText: 'Delete',
                                    severity: 'warning',
                                    onConfirm: () => deleteMutation.mutate(selectedOrder.id),
                                  })
                                }
                                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                              >
                                {t('shopOrders.moveToTrash')}
                              </Button>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>

                      <Paper elevation={0} className="zzv-shop-orders__items-card">
                        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {t('shopOrders.items')}
                        </Typography>
                        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                          {(selectedOrder.items_json || []).map((item, index) => (
                            <Box
                              key={`${selectedOrder.id}-item-${index}`}
                              className="zzv-shop-orders__product"
                              sx={{
                                p: 1.5,
                                borderRadius: 3,
                                border: '1px solid #eef2f6',
                                bgcolor: '#fbfcfe',
                              }}
                            >
                              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                                <Box>
                                  <Typography sx={{ fontWeight: 800, color: '#172033' }}>
                                    {item.title}
                                  </Typography>
                                  <Typography sx={{ fontSize: '12px', color: '#667085', mt: 0.35 }}>
                                    {item.mode} • {t('shopOrders.quantity')} {item.quantity}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 900, color: '#172033', whiteSpace: 'nowrap' }}>
                                  {formatMoney(item.line_total)}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: '#667085' }}>{t('shopOrders.subtotal')}</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{formatMoney(selectedOrder.subtotal_amount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: '#667085' }}>{t('shopOrders.service')}</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{formatMoney(selectedOrder.service_amount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: '#172033', fontWeight: 900 }}>{t('shopOrders.total')}</Typography>
                            <Typography sx={{ color: '#172033', fontWeight: 900 }}>{formatMoney(selectedOrder.total_amount)}</Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Stack>
                  ) : (
                    <Paper elevation={0} className="zzv-shop-orders__empty">
                      <img src="/figma-shop-admin/orders-empty.svg" alt="" width="48" height="48" />
                      <Typography sx={{ fontWeight: 900, color: '#172033' }}>{t('shopOrders.selectOrder')}</Typography>
                      <Typography sx={{ color: '#667085', mt: 0.75 }}>
                        {t('shopOrders.selectOrderDescription')}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box className="zzv-shop-orders__trash">
              {isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <Paper key={`trash-skeleton-${index}`} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5ebf3', mb: 1.5 }}>
                    <Skeleton variant="text" width={150} height={24} />
                    <Skeleton variant="text" width={200} height={20} />
                  </Paper>
                ))}
              {!isLoading && orders.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px dashed #dce4f0', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 900, color: '#172033' }}>{t('shopOrders.trashEmpty')}</Typography>
                  <Typography sx={{ color: '#667085', mt: 0.75 }}>
                    {t('shopOrders.trashEmptyDescription')}
                  </Typography>
                </Paper>
              )}
              {!isLoading &&
                orders.map((order) => (
                  <Paper key={order.id} className="zzv-shop-orders__trash-item" elevation={0} sx={{ mb: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 900, color: '#172033' }}>{order.order_number}</Typography>
                        <Typography sx={{ color: '#475467', mt: 0.5 }}>
                          {order.customer_name} {order.customer_last_name || ''} • {order.customer_phone}
                        </Typography>
                        <Typography sx={{ color: '#98a2b3', fontSize: '12px', mt: 0.5 }}>
                          {t('shopOrders.deleted')} {order.deleted_at ? new Date(order.deleted_at).toLocaleString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB') : t('shopOrders.unknown')}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          color="primary"
                          variant="outlined"
                          startIcon={<RestoreFromTrash />}
                          onClick={() => restoreMutation.mutate(order.id)}
                          sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                        >
                          {t('shopOrders.restore')}
                        </Button>
                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteOutline />}
                          onClick={() =>
                            setConfirmState({
                              open: true,
                              title: 'Delete Order Permanently',
                              message: 'This order will be removed permanently.',
                              confirmText: 'Delete Permanently',
                              severity: 'error',
                              onConfirm: () => permanentDeleteMutation.mutate(order.id),
                            })
                          }
                          sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                        >
                          {t('shopOrders.deletePermanently')}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
            </Box>
          )}
        </Paper>
      </Grid>
      <ConfirmDialog
        open={confirmState.open}
        onClose={() =>
          setConfirmState((prev) => ({
            ...prev,
            open: false,
            onConfirm: null,
          }))
        }
        onConfirm={async () => {
          if (!confirmState.onConfirm) {
            return;
          }
          await confirmState.onConfirm();
          setConfirmState((prev) => ({
            ...prev,
            open: false,
            onConfirm: null,
          }));
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        severity={confirmState.severity}
      />
    </Grid>
  );
};

export default ShopAdminOrdersPage;
