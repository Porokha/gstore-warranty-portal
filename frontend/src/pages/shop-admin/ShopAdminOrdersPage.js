import React, { useEffect, useMemo, useState } from 'react';
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
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('active');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('unread');
  const [unreadOnly, setUnreadOnly] = useState(false);
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
  }, [orders, scope, sortMode, statusFilter, unreadOnly]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) || null,
    [filteredOrders, selectedOrderId],
  );

  useEffect(() => {
    if (scope !== 'active') {
      setSelectedOrderId(null);
      return;
    }

    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    setSelectedOrderId((current) =>
      current && filteredOrders.some((order) => order.id === current) ? current : filteredOrders[0].id,
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
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7', background: 'linear-gradient(180deg, #fbfcff 0%, #f6f8fc 100%)' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography sx={{ fontSize: '26px', fontWeight: 900, color: '#172033' }}>
                  Shop Orders
                </Typography>
                <Typography sx={{ color: '#667085', mt: 0.75 }}>
                  Inbox-style order workflow with unread tracking, quick filters, and trash recovery.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${unreadCount} unread`}
                  sx={{
                    borderRadius: 999,
                    bgcolor: unreadCount ? '#efe7ff' : '#eef3f8',
                    color: unreadCount ? '#6941c6' : '#667085',
                    fontWeight: 800,
                  }}
                />
                <Chip
                  label={`${orders.length} total`}
                  sx={{ borderRadius: 999, bgcolor: '#eef3f8', color: '#344054', fontWeight: 800 }}
                />
              </Stack>
            </Stack>

            <Tabs value={scope} onChange={(event, value) => setScope(value)} sx={{ mt: 2, minHeight: 42 }}>
              {orderScopes.map((item) => (
                <Tab
                  key={item.value}
                  value={item.value}
                  label={item.label}
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
            <Grid container sx={{ minHeight: 640 }}>
              <Grid item xs={12} lg={4.5} sx={{ borderRight: { lg: '1px solid #e6edf7' } }}>
                <Box sx={{ p: 2.5, borderBottom: '1px solid #e6edf7' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Status"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <MenuItem value="all">All statuses</MenuItem>
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Sort"
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value)}
                    >
                      <MenuItem value="unread">Unread first</MenuItem>
                      <MenuItem value="newest">Newest first</MenuItem>
                      <MenuItem value="oldest">Oldest first</MenuItem>
                    </TextField>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <Chip
                      label="Unread only"
                      clickable
                      onClick={() => setUnreadOnly((current) => !current)}
                      sx={{
                        borderRadius: 999,
                        bgcolor: unreadOnly ? '#172033' : '#eef3f8',
                        color: unreadOnly ? '#fff' : '#344054',
                        fontWeight: 800,
                      }}
                    />
                    {statusOptions.map((status) => (
                      <Chip
                        key={status}
                        label={`${status} ${activeCountByStatus[status] || 0}`}
                        clickable
                        onClick={() => setStatusFilter((current) => (current === status ? 'all' : status))}
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

                <Box sx={{ p: 2, maxHeight: 680, overflowY: 'auto', bgcolor: '#fcfdff' }}>
                  {isLoading && renderInboxSkeleton()}
                  {!isLoading && filteredOrders.length === 0 && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px dashed #dce4f0', textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 800, color: '#172033' }}>No matching orders</Typography>
                      <Typography sx={{ color: '#667085', mt: 0.5 }}>
                        Change the filters or wait for new shop orders to arrive.
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
                                {unread && (
                                  <Chip
                                    size="small"
                                    label="Unread"
                                    sx={{ borderRadius: 999, bgcolor: '#6941c6', color: '#fff', fontWeight: 800 }}
                                  />
                                )}
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
                              label={order.status}
                              color={statusChipColor[order.status] || 'default'}
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                            <Chip
                              size="small"
                              label={`${Array.isArray(order.items_json) ? order.items_json.length : 0} items`}
                              sx={{ borderRadius: 999, bgcolor: '#eef3f8', color: '#344054', fontWeight: 700 }}
                            />
                            <Typography sx={{ fontSize: '11px', color: '#98a2b3', ml: 'auto' }}>
                              {new Date(order.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })}
                </Box>
              </Grid>

              <Grid item xs={12} lg={7.5}>
                <Box sx={{ p: 3 }}>
                  {selectedOrder ? (
                    <Stack spacing={2.5}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography sx={{ fontSize: '28px', fontWeight: 900, color: '#172033' }}>
                            {selectedOrder.order_number}
                          </Typography>
                          <Typography sx={{ color: '#667085', mt: 0.5 }}>
                            Created {new Date(selectedOrder.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {!selectedOrder.viewed_at && (
                            <Chip label="Unread" sx={{ borderRadius: 999, bgcolor: '#6941c6', color: '#fff', fontWeight: 800 }} />
                          )}
                          <Chip label={formatMoney(selectedOrder.total_amount)} sx={{ borderRadius: 999, bgcolor: '#edf7f1', color: '#067647', fontWeight: 900 }} />
                        </Stack>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Paper elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid #e6edf7', height: '100%' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Customer
                            </Typography>
                            <Typography sx={{ fontSize: '20px', fontWeight: 900, color: '#172033', mt: 1 }}>
                              {selectedOrder.customer_name} {selectedOrder.customer_last_name || ''}
                            </Typography>
                            <Typography sx={{ color: '#475467', mt: 0.75 }}>{selectedOrder.customer_phone}</Typography>
                            <Typography sx={{ color: '#475467', mt: 0.35 }}>{selectedOrder.customer_email || 'No email'}</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid #e6edf7', height: '100%' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Order Meta
                            </Typography>
                            <Stack spacing={0.9} sx={{ mt: 1 }}>
                              <Typography sx={{ color: '#344054' }}>
                                Heard about us: <strong>{selectedOrder.heard_about || 'Not provided'}</strong>
                              </Typography>
                              <Typography sx={{ color: '#344054' }}>
                                Partner warranty: <strong>{selectedOrder.has_partner_warranty ? 'Yes' : 'No'}</strong>
                              </Typography>
                              {selectedOrder.has_partner_warranty && (
                                <Typography sx={{ color: '#344054' }}>
                                  Warranty ID: <strong>{selectedOrder.partner_warranty_id || 'Missing'}</strong>
                                </Typography>
                              )}
                              <Typography sx={{ color: '#344054' }}>
                                Payment: <strong>{selectedOrder.payment_method || 'onsite'}</strong>
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Paper elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid #e6edf7' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                          <Box>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Workflow
                            </Typography>
                            <Typography sx={{ fontSize: '18px', fontWeight: 900, color: '#172033', mt: 1 }}>
                              Update status and keep the inbox clean
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
                                  {status}
                                </MenuItem>
                              ))}
                            </TextField>
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
                              Move to Trash
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>

                      <Paper elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid #e6edf7' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Items
                        </Typography>
                        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                          {(selectedOrder.items_json || []).map((item, index) => (
                            <Box
                              key={`${selectedOrder.id}-item-${index}`}
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
                                    {item.mode} • qty {item.quantity}
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
                            <Typography sx={{ color: '#667085' }}>Subtotal</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{formatMoney(selectedOrder.subtotal_amount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: '#667085' }}>Service</Typography>
                            <Typography sx={{ fontWeight: 800 }}>{formatMoney(selectedOrder.service_amount)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: '#172033', fontWeight: 900 }}>Total</Typography>
                            <Typography sx={{ color: '#172033', fontWeight: 900 }}>{formatMoney(selectedOrder.total_amount)}</Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Stack>
                  ) : (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px dashed #dce4f0', textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 900, color: '#172033' }}>Select an order</Typography>
                      <Typography sx={{ color: '#667085', mt: 0.75 }}>
                        Choose an order from the inbox to view customer details, items, and workflow controls.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ p: 3 }}>
              {isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <Paper key={`trash-skeleton-${index}`} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e5ebf3', mb: 1.5 }}>
                    <Skeleton variant="text" width={150} height={24} />
                    <Skeleton variant="text" width={200} height={20} />
                  </Paper>
                ))}
              {!isLoading && orders.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px dashed #dce4f0', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 900, color: '#172033' }}>Trash is empty</Typography>
                  <Typography sx={{ color: '#667085', mt: 0.75 }}>
                    Deleted shop orders will appear here for restore or permanent delete.
                  </Typography>
                </Paper>
              )}
              {!isLoading &&
                orders.map((order) => (
                  <Paper key={order.id} elevation={0} sx={{ p: 2.25, borderRadius: 3, border: '1px solid #e6edf7', mb: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 900, color: '#172033' }}>{order.order_number}</Typography>
                        <Typography sx={{ color: '#475467', mt: 0.5 }}>
                          {order.customer_name} {order.customer_last_name || ''} • {order.customer_phone}
                        </Typography>
                        <Typography sx={{ color: '#98a2b3', fontSize: '12px', mt: 0.5 }}>
                          Deleted {order.deleted_at ? new Date(order.deleted_at).toLocaleString() : 'Unknown'}
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
                          Restore
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
                          Delete Permanently
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
