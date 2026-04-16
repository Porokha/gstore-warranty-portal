import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { shopService } from '../../services/shopService';

const statusOptions = ['draft', 'new', 'processing', 'completed', 'cancelled'];

const ShopAdminOrdersPage = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: orders = [], isLoading } = useQuery(['shop-admin-orders'], () =>
    shopService.getOrders(),
  );

  const updateMutation = useMutation(
    ({ id, payload }) => shopService.updateOrder(id, payload),
    {
      onSuccess: async () => {
        setError('');
        await queryClient.invalidateQueries(['shop-admin-orders']);
      },
      onError: (mutationError) => {
        setError(mutationError.response?.data?.message || 'Failed to update order.');
      },
    },
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#172033' }}>
              Orders
            </Typography>
            <Typography sx={{ color: '#667085', mt: 0.75 }}>
              Prototype order pipeline for the future public checkout integration.
            </Typography>
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
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading orders...</TableCell>
                  </TableRow>
                )}
                {!isLoading && orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      No orders yet. This is expected until the checkout prototype is connected.
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
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
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
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ShopAdminOrdersPage;
