import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
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
import {
  Add,
  DeleteOutline,
  FileUpload,
  RestoreFromTrash,
  Save,
  UploadFile,
} from '@mui/icons-material';
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

const productScopes = [
  { value: 'active', label: 'Catalog' },
  { value: 'trash', label: 'Trash' },
];

const ShopAdminProductsPage = () => {
  const queryClient = useQueryClient();
  const csvInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [scope, setScope] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: products = [], isLoading } = useQuery(['shop-admin-products', scope], () =>
    shopService.getAdminProducts(scope),
  );

  useEffect(() => {
    setSelectedId(null);
    setForm(emptyForm);
  }, [scope]);

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries(['shop-admin-products']);
  };

  const createMutation = useMutation((payload) => shopService.createProduct(payload), {
    onSuccess: async () => {
      setMessage('Product created.');
      setError('');
      setForm(emptyForm);
      setSelectedId(null);
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to create product.');
      setMessage('');
    },
  });

  const updateMutation = useMutation(({ id, payload }) => shopService.updateProduct(id, payload), {
    onSuccess: async () => {
      setMessage('Product updated.');
      setError('');
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to update product.');
      setMessage('');
    },
  });

  const deleteMutation = useMutation((id) => shopService.deleteProduct(id), {
    onSuccess: async () => {
      setMessage('Product moved to trash.');
      setError('');
      setSelectedId(null);
      setForm(emptyForm);
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to move product to trash.');
      setMessage('');
    },
  });

  const restoreMutation = useMutation((id) => shopService.restoreProduct(id), {
    onSuccess: async () => {
      setMessage('Product restored.');
      setError('');
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to restore product.');
      setMessage('');
    },
  });

  const permanentDeleteMutation = useMutation((id) => shopService.permanentlyDeleteProduct(id), {
    onSuccess: async () => {
      setMessage('Product deleted permanently.');
      setError('');
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to delete product permanently.');
      setMessage('');
    },
  });

  const importMutation = useMutation((file) => shopService.importProductsCsv(file), {
    onSuccess: async (result) => {
      const summary = `${result.created || 0} created, ${result.updated || 0} updated, ${result.errors?.length || 0} errors.`;
      setMessage(`CSV import finished. ${summary}`);
      setError(
        result.errors?.length
          ? result.errors.slice(0, 5).map((item) => `Row ${item.row}: ${item.message}`).join(' ')
          : '',
      );
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to import CSV.');
      setMessage('');
    },
  });

  const uploadImageMutation = useMutation((file) => shopService.uploadProductImage(file), {
    onSuccess: (result) => {
      setForm((prev) => ({ ...prev, image_url: result.image_url }));
      setMessage('Image uploaded.');
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to upload image.');
      setMessage('');
    },
  });

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

  const handleSoftDelete = (productId) => {
    if (!window.confirm('Move this product to trash?')) {
      return;
    }
    deleteMutation.mutate(productId);
  };

  const handlePermanentDelete = (productId) => {
    if (!window.confirm('Delete this product permanently?')) {
      return;
    }
    permanentDeleteMutation.mutate(productId);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#172033' }}>
                  Products
                </Typography>
                <Typography sx={{ color: '#667085', mt: 0.75 }}>
                  Catalog management, CSV import, image handling, and trash recovery.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<UploadFile />}
                  onClick={() => csvInputRef.current?.click()}
                  disabled={importMutation.isLoading}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                >
                  {importMutation.isLoading ? 'Importing...' : 'Import CSV'}
                </Button>
                <Button
                  onClick={() => applyProductToForm(null)}
                  startIcon={<Add />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                >
                  New Product
                </Button>
              </Stack>
            </Stack>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  importMutation.mutate(file);
                }
                event.target.value = '';
              }}
            />

            <Tabs
              value={scope}
              onChange={(event, value) => setScope(value)}
              sx={{ mt: 2, minHeight: 40 }}
            >
              {productScopes.map((item) => (
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
                  <TableCell>Title</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>{scope === 'trash' ? 'Deleted' : 'Status'}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading products...</TableCell>
                  </TableRow>
                )}
                {!isLoading && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      {scope === 'trash' ? 'Trash is empty.' : 'No products found.'}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  products.map((product) => (
                    <TableRow
                      hover
                      key={product.id}
                      onClick={() => scope === 'active' && applyProductToForm(product)}
                      selected={scope === 'active' && product.id === selectedId}
                      sx={{ cursor: scope === 'active' ? 'pointer' : 'default' }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {product.image_url ? (
                            <Box
                              component="img"
                              src={product.image_url}
                              alt={product.title}
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                objectFit: 'cover',
                                border: '1px solid #dce4f0',
                              }}
                            />
                          ) : null}
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: '#172033' }}>
                              {product.title}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                              {product.slug}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip size="small" label={product.device_category} sx={{ borderRadius: 2 }} />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={product.part_category}
                            sx={{ borderRadius: 2 }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>₾{Number(product.sale_price ?? product.price).toFixed(2)}</TableCell>
                      <TableCell>
                        {scope === 'trash' ? (
                          <Typography sx={{ fontSize: '12px', color: '#667085' }}>
                            {product.deleted_at ? new Date(product.deleted_at).toLocaleString() : 'Unknown'}
                          </Typography>
                        ) : (
                          <Chip
                            size="small"
                            label={product.is_active ? 'Active' : 'Hidden'}
                            color={product.is_active ? 'success' : 'default'}
                            sx={{ borderRadius: 2 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {scope === 'trash' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              onClick={(event) => {
                                event.stopPropagation();
                                restoreMutation.mutate(product.id);
                              }}
                              color="primary"
                            >
                              <RestoreFromTrash />
                            </IconButton>
                            <IconButton
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePermanentDelete(product.id);
                              }}
                              color="error"
                            >
                              <DeleteOutline />
                            </IconButton>
                          </Stack>
                        ) : (
                          <IconButton
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSoftDelete(product.id);
                            }}
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

      <Grid item xs={12} lg={5}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #dce4f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#172033' }}>
                {selectedProduct ? 'Edit Product' : 'New Product'}
              </Typography>
              <Typography sx={{ color: '#667085', mt: 0.5 }}>
                Upload an image directly, or paste an image URL and it will be downloaded on save.
              </Typography>
            </Box>
            <Button
              onClick={() => applyProductToForm(null)}
              startIcon={<Add />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
            >
              Clear
            </Button>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            {form.image_url ? (
              <Box
                component="img"
                src={form.image_url}
                alt="Product preview"
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 3,
                  border: '1px solid #dce4f0',
                  mb: 1.5,
                }}
              />
            ) : null}
            <Stack direction="row" spacing={1.25}>
              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadImageMutation.isLoading}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
              >
                {uploadImageMutation.isLoading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    uploadImageMutation.mutate(file);
                  }
                  event.target.value = '';
                }}
              />
            </Stack>
          </Box>

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
                  helperText="If this is an external URL, the backend downloads and stores it locally when you save."
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
                  disabled={
                    createMutation.isLoading || updateMutation.isLoading || uploadImageMutation.isLoading
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 3,
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
