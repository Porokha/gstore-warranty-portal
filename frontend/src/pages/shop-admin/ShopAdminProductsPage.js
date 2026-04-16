import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Save } from '@mui/icons-material';
import { shopService } from '../../services/shopService';

const emptyForm = {
  title: '',
  slug: '',
  device_category: 'smartphones',
  part_category: 'screen',
  inventory_source: 'oem',
  issue_label: '',
  description: '',
  image_url: '',
  price: '0',
  sale_price: '',
  service_price: '',
  stock_quantity: '0',
  sort_order: '0',
  is_active: true,
};

const ShopAdminProductsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: products = [], isLoading } = useQuery(['shop-admin-products'], () =>
    shopService.getAdminProducts(),
  );

  const createMutation = useMutation((payload) => shopService.createProduct(payload), {
    onSuccess: async () => {
      setMessage('Product created.');
      setError('');
      setForm(emptyForm);
      setSelectedId(null);
      await queryClient.invalidateQueries(['shop-admin-products']);
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to create product.');
      setMessage('');
    },
  });

  const updateMutation = useMutation(
    ({ id, payload }) => shopService.updateProduct(id, payload),
    {
      onSuccess: async () => {
        setMessage('Product updated.');
        setError('');
        await queryClient.invalidateQueries(['shop-admin-products']);
      },
      onError: (mutationError) => {
        setError(mutationError.response?.data?.message || 'Failed to update product.');
        setMessage('');
      },
    },
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || null,
    [products, selectedId],
  );

  const applyProductToForm = (product) => {
    if (!product) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    setSelectedId(product.id);
    setForm({
      title: product.title || '',
      slug: product.slug || '',
      device_category: product.device_category || 'smartphones',
      part_category: product.part_category || 'screen',
      inventory_source: product.inventory_source || 'oem',
      issue_label: product.issue_label || '',
      description: product.description || '',
      image_url: product.image_url || '',
      price: String(product.price ?? '0'),
      sale_price: product.sale_price == null ? '' : String(product.sale_price),
      service_price: product.service_price == null ? '' : String(product.service_price),
      stock_quantity: String(product.stock_quantity ?? 0),
      sort_order: String(product.sort_order ?? 0),
      is_active: Boolean(product.is_active),
    });
  };

  const buildPayload = () => ({
    ...form,
    price: Number(form.price || 0),
    sale_price: form.sale_price === '' ? null : Number(form.sale_price),
    service_price: form.service_price === '' ? null : Number(form.service_price),
    stock_quantity: Number(form.stock_quantity || 0),
    sort_order: Number(form.sort_order || 0),
    is_active: Boolean(form.is_active),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, payload: buildPayload() });
      return;
    }

    createMutation.mutate(buildPayload());
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Paper
          elevation={0}
          sx={{ borderRadius: 4, border: '1px solid #dce4f0', overflow: 'hidden' }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#172033' }}>
              Products
            </Typography>
            <Typography sx={{ color: '#667085', mt: 0.75 }}>
              Manage the public shop catalog and prototype pricing.
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4}>Loading products...</TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  products.map((product) => (
                    <TableRow
                      hover
                      key={product.id}
                      onClick={() => applyProductToForm(product)}
                      selected={product.id === selectedId}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#172033' }}>
                          {product.title}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                          {product.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip size="small" label={product.device_category} />
                          <Chip size="small" variant="outlined" label={product.part_category} />
                        </Stack>
                      </TableCell>
                      <TableCell>₾{Number(product.sale_price ?? product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={product.is_active ? 'Active' : 'Hidden'}
                          color={product.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #dce4f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#172033' }}>
                {selectedProduct ? 'Edit Product' : 'New Product'}
              </Typography>
              <Typography sx={{ color: '#667085', mt: 0.5 }}>
                {selectedProduct
                  ? 'Update the selected product.'
                  : 'Create a new product for the public shop.'}
              </Typography>
            </Box>
            <Button
              onClick={() => applyProductToForm(null)}
              startIcon={<Add />}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Clear
            </Button>
          </Box>

          {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                  helperText="Optional. Leave blank to auto-generate."
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Device"
                  value={form.device_category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, device_category: event.target.value }))
                  }
                >
                  <MenuItem value="smartphones">smartphones</MenuItem>
                  <MenuItem value="laptops">laptops</MenuItem>
                  <MenuItem value="accessories">accessories</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Part"
                  value={form.part_category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, part_category: event.target.value }))
                  }
                >
                  {['board', 'screen', 'sensor', 'battery', 'camera', 'speaker', 'charging', 'accessory'].map(
                    (value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ),
                  )}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Source"
                  value={form.inventory_source}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, inventory_source: event.target.value }))
                  }
                >
                  <MenuItem value="oem">oem</MenuItem>
                  <MenuItem value="third-party">third-party</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Visibility"
                  value={form.is_active ? 'active' : 'hidden'}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_active: event.target.value === 'active' }))
                  }
                >
                  <MenuItem value="active">active</MenuItem>
                  <MenuItem value="hidden">hidden</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Issue Label"
                  value={form.issue_label}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, issue_label: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={form.image_url}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, image_url: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sale Price"
                  value={form.sale_price}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sale_price: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Service Price"
                  value={form.service_price}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, service_price: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Quantity"
                  value={form.stock_quantity}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, stock_quantity: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sort Order"
                  value={form.sort_order}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sort_order: event.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#172033',
                    '&:hover': { bgcolor: '#0f1726' },
                  }}
                >
                  {selectedProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ShopAdminProductsPage;
