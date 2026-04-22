import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Skeleton,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DeleteOutline, RestoreFromTrash } from '@mui/icons-material';
import { shopService } from '../../services/shopService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const statusOptions = ['draft', 'new', 'processing', 'completed', 'cancelled'];
const orderScopes = [
  { value: 'active', label: 'Orders' },
  { value: 'trash', label: 'Trash' },
];

const ShopAdminOrdersPage = () => {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('active');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
    onSuccess: async () => {
      setError('');
      setMessage('Order updated.');
      await invalidateOrders();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to update order.');
      setMessage('');
    },
  });

  const deleteMutation = useMutation((id) => shopService.deleteOrder(id), {
    onSuccess: async () => {
      setError('');
      setMessage('Order moved to trash.');
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
      await invalidateOrders();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to delete order permanently.');
      setMessage('');
    },
  });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#172033' }}>
              Orders
            </Typography>
            <Typography sx={{ color: '#667085', mt: 0.75 }}>
              Prototype order pipeline with soft delete, trash recovery, and automatic cleanup after 30 days.
            </Typography>

            <Tabs
              value={scope}
              onChange={(event, value) => setScope(value)}
              sx={{ mt: 2, minHeight: 40 }}
            >
              {orderScopes.map((item) => (
                <Tab
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  sx={{ textTransform: 'none', minHeight: 40, fontWeight: 700 }}
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

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>{scope === 'trash' ? 'Deleted' : 'Status'}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`orders-loading-${index}`}>
                      <TableCell>
                        <Skeleton variant="text" width={110} height={24} />
                        <Skeleton variant="text" width={140} height={18} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={150} height={24} />
                        <Skeleton variant="text" width={120} height={18} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={70} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={72} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width="100%" height={40} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      {scope === 'trash'
                        ? 'Deleted orders will appear here.'
                        : 'No orders yet. This is expected until checkout is connected.'}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#172033' }}>
                          {order.order_number}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                          {new Date(order.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          {order.customer_name} {order.customer_last_name || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                          {order.customer_phone}
                        </Typography>
                      </TableCell>
                      <TableCell>₾{Number(order.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${Array.isArray(order.items_json) ? order.items_json.length : 0} items`}
                          sx={{ borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        {scope === 'trash' ? (
                          <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                            {order.deleted_at ? new Date(order.deleted_at).toLocaleString() : 'Unknown'}
                          </Typography>
                        ) : (
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={order.status}
                            onChange={(event) =>
                              updateMutation.mutate({
                                id: order.id,
                                payload: { status: event.target.value },
                              })
                            }
                          >
                            {statusOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {scope === 'trash' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              onClick={() => restoreMutation.mutate(order.id)}
                              color="primary"
                            >
                              <RestoreFromTrash />
                            </IconButton>
                            <IconButton
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
                              color="error"
                            >
                              <DeleteOutline />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                title: 'Move Order To Trash',
                                message: 'This order will be moved to trash and hidden from the active list.',
                                confirmText: 'Delete',
                                severity: 'warning',
                                onConfirm: () => deleteMutation.mutate(order.id),
                              })
                            }
                            color="error"
                          >
                            <DeleteOutline />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
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
