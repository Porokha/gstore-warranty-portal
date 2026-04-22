import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  Download,
  DeleteOutline,
  FileUpload,
  RestoreFromTrash,
  Save,
  UploadFile,
} from '@mui/icons-material';
import { shopService } from '../../services/shopService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const emptyForm = {
  title: '',
  brand: '',
  slug: '',
  device_category: 'smartphones',
  part_category: 'screen',
  inventory_source: 'oem',
  issue_label: '',
  description: '',
  image_url: '',
  price: '',
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

const productOnlyStatusLabelKa = 'ხელმისაწვდომია, მხოლოდ სერვისთან ერთად';
const serviceUnavailableLabelKa = 'სერვისი არ არის ხელმისაწვდომი';

const formatAdminProductPrice = (product) => {
  if (product.sale_price != null) {
    return `₾${Number(product.sale_price).toFixed(2)}`;
  }

  if (product.price != null) {
    return `₾${Number(product.price).toFixed(2)}`;
  }

  if (product.service_price != null) {
    return productOnlyStatusLabelKa;
  }

  return 'Unavailable';
};

const ShopAdminProductsPage = () => {
  const queryClient = useQueryClient();
  const csvInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [scope, setScope] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    severity: 'warning',
    onConfirm: null,
  });

  const { data: products = [], isLoading } = useQuery(['shop-admin-products', scope], () =>
    shopService.getAdminProducts(scope),
  );

  useEffect(() => {
    setSelectedId(null);
    setSelectedIds([]);
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

  const downloadTemplateMutation = useMutation(() => shopService.downloadProductsCsvTemplate(), {
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shop-products-template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('CSV template downloaded.');
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to download CSV template.');
      setMessage('');
    },
  });

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || null,
    [products, selectedId],
  );
  const allSelected =
    products.length > 0 && selectedIds.length > 0 && selectedIds.length === products.length;

  const applyProductToForm = (product) => {
    if (!product) {
      setSelectedId(null);
      setForm(emptyForm);
      return;
    }

    setSelectedId(product.id);
    setSelectedIds([product.id]);
    setForm({
      title: product.title || '',
      brand: product.brand || '',
      slug: product.slug || '',
      device_category: product.device_category || 'smartphones',
      part_category: product.part_category || 'screen',
      inventory_source: product.inventory_source || 'oem',
      issue_label: product.issue_label || '',
      description: product.description || '',
      image_url: product.image_url || '',
      price: product.price == null ? '' : String(product.price),
      sale_price: product.sale_price == null ? '' : String(product.sale_price),
      service_price: product.service_price == null ? '' : String(product.service_price),
      stock_quantity: String(product.stock_quantity ?? 0),
      sort_order: String(product.sort_order ?? 0),
      is_active: Boolean(product.is_active),
    });
  };

  const buildPayload = () => ({
    ...form,
    price: form.price === '' ? null : Number(form.price),
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
    setConfirmState({
      open: true,
      title: 'Move Product To Trash',
      message: 'This product will be hidden from the catalog and moved to trash.',
      confirmText: 'Delete',
      severity: 'warning',
      onConfirm: () => deleteMutation.mutate(productId),
    });
  };

  const handlePermanentDelete = (productId) => {
    setConfirmState({
      open: true,
      title: 'Delete Product Permanently',
      message: 'This action cannot be undone. The product will be removed completely.',
      confirmText: 'Delete Permanently',
      severity: 'error',
      onConfirm: () => permanentDeleteMutation.mutate(productId),
    });
  };

  const handleSelectProduct = (productId, checked) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, productId])] : current.filter((id) => id !== productId),
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? products.map((product) => product.id) : []);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setConfirmState({
      open: true,
      title: 'Move Selected Products To Trash',
      message: `${selectedIds.length} selected products will be moved to trash.`,
      confirmText: 'Delete Selected',
      severity: 'warning',
      onConfirm: async () => {
        await Promise.all(selectedIds.map((id) => shopService.deleteProduct(id)));
        setSelectedIds([]);
        setSelectedId(null);
        setForm(emptyForm);
        setMessage(`${selectedIds.length} products moved to trash.`);
        setError('');
        await invalidateProducts();
      },
    });
  };

  const handleBulkRestore = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setConfirmState({
      open: true,
      title: 'Restore Selected Products',
      message: `${selectedIds.length} selected products will be restored to the catalog.`,
      confirmText: 'Restore Selected',
      severity: 'warning',
      onConfirm: async () => {
        await Promise.all(selectedIds.map((id) => shopService.restoreProduct(id)));
        setSelectedIds([]);
        setMessage(`${selectedIds.length} products restored.`);
        setError('');
        await invalidateProducts();
      },
    });
  };

  const handleBulkPermanentDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setConfirmState({
      open: true,
      title: 'Delete Selected Products Permanently',
      message: `${selectedIds.length} selected products will be removed permanently.`,
      confirmText: 'Delete Permanently',
      severity: 'error',
      onConfirm: async () => {
        await Promise.all(selectedIds.map((id) => shopService.permanentlyDeleteProduct(id)));
        setSelectedIds([]);
        setMessage(`${selectedIds.length} products deleted permanently.`);
        setError('');
        await invalidateProducts();
      },
    });
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
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplateMutation.mutate()}
                  disabled={downloadTemplateMutation.isLoading}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                >
                  {downloadTemplateMutation.isLoading ? 'Preparing...' : 'Download Template'}
                </Button>
                <Button
                  onClick={() => applyProductToForm(null)}
                  startIcon={<Add />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                >
                  New Product
                </Button>
                {scope === 'active' ? (
                  <Button
                    color="warning"
                    variant="outlined"
                    disabled={selectedIds.length === 0}
                    onClick={handleBulkDelete}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    Delete Selected
                  </Button>
                ) : (
                  <>
                    <Button
                      color="primary"
                      variant="outlined"
                      disabled={selectedIds.length === 0}
                      onClick={handleBulkRestore}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                    >
                      Restore Selected
                    </Button>
                    <Button
                      color="error"
                      variant="outlined"
                      disabled={selectedIds.length === 0}
                      onClick={handleBulkPermanentDelete}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                    >
                      Delete Permanently
                    </Button>
                  </>
                )}
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
            {selectedIds.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {selectedIds.length} product{selectedIds.length === 1 ? '' : 's'} selected.
              </Alert>
            )}
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedIds.length > 0 && !allSelected}
                      onChange={(event) => handleSelectAll(event.target.checked)}
                    />
                  </TableCell>
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
                    <TableCell colSpan={6}>Loading products...</TableCell>
                  </TableRow>
                )}
                {!isLoading && products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
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
                      <TableCell
                        padding="checkbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.includes(product.id)}
                          onChange={(event) =>
                            handleSelectProduct(product.id, event.target.checked)
                          }
                        />
                      </TableCell>
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
                              {[product.brand, product.slug].filter(Boolean).join(' • ')}
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
                      <TableCell>{formatAdminProductPrice(product)}</TableCell>
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
                  label="Brand"
                  value={form.brand}
                  onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
                  helperText="Used in the public shop brand filter and CSV imports."
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
                  helperText={
                    form.price === '' && form.service_price !== ''
                      ? productOnlyStatusLabelKa
                      : 'Leave empty to make this product available only with service.'
                  }
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
                  helperText={
                    form.service_price === ''
                      ? serviceUnavailableLabelKa
                      : 'Leave empty to disable the service-bundle option.'
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
                    color: '#ffffff',
                    '& .MuiButton-startIcon': {
                      color: 'inherit',
                    },
                    '&:hover': { bgcolor: '#0f1726' },
                  }}
                >
                  {selectedProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </Grid>
              {selectedProduct && scope === 'active' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      startIcon={<DeleteOutline />}
                      onClick={() => handleSoftDelete(selectedProduct.id)}
                      sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                    >
                      Delete
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutline />}
                      onClick={() => handlePermanentDelete(selectedProduct.id)}
                      sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                    >
                      Delete Permanently
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
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

export default ShopAdminProductsPage;
