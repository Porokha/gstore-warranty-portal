import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
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
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Edit,
  Download,
  DeleteOutline,
  FileUpload,
  RestoreFromTrash,
  Save,
  Search,
  Sync,
  UploadFile,
  VisibilityOff,
  Visibility,
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

const productSources = [
  { value: 'manual', label: 'Zezva Products' },
  { value: 'mobilesentrix', label: 'MobileSentrix' },
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
  const [productSource, setProductSource] = useState('manual');
  const [scope, setScope] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [mobileSentrixResult, setMobileSentrixResult] = useState(null);
  const [mobileSentrixJobId, setMobileSentrixJobId] = useState(null);
  const [adminProductPage, setAdminProductPage] = useState(1);
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

  const productSupplier = productSource === 'mobilesentrix' ? 'mobilesentrix' : 'manual';
  const adminProductLimit = productSource === 'mobilesentrix' ? 100 : 200;
  const { data: productsResult, isLoading } = useQuery(['shop-admin-products', scope, productSupplier, adminProductPage, adminProductLimit], () =>
    shopService.getAdminProducts(scope, productSupplier, {
      page: adminProductPage,
      limit: adminProductLimit,
    }),
  );
  const products = productsResult?.items || [];
  const productsTotal = productsResult?.total || products.length;
  const productsTotalPages = productsResult?.total_pages || 1;
  const { data: latestMobileSentrixJobResult } = useQuery(
    ['mobilesentrix-sync-latest'],
    () => shopService.getLatestMobileSentrixSyncJob(),
    {
      enabled: productSource === 'mobilesentrix',
      refetchOnWindowFocus: false,
    },
  );
  const latestMobileSentrixJob = latestMobileSentrixJobResult?.job || null;

  useEffect(() => {
    if (
      productSource === 'mobilesentrix' &&
      latestMobileSentrixJob &&
      ['queued', 'running'].includes(latestMobileSentrixJob.status)
    ) {
      setMobileSentrixJobId(latestMobileSentrixJob.id);
    }
  }, [latestMobileSentrixJob, productSource]);

  const { data: mobileSentrixJobResult } = useQuery(
    ['mobilesentrix-sync-job', mobileSentrixJobId],
    () => shopService.getMobileSentrixSyncJob(mobileSentrixJobId),
    {
      enabled: Boolean(mobileSentrixJobId),
      refetchInterval: (result) => {
        const status = result?.job?.status;
        return status === 'queued' || status === 'running' ? 3000 : false;
      },
      refetchOnWindowFocus: false,
    },
  );
  const mobileSentrixJob = mobileSentrixJobResult?.job || latestMobileSentrixJob;
  const mobileSentrixJobRunning = ['queued', 'running'].includes(mobileSentrixJob?.status);

  useEffect(() => {
    if (mobileSentrixJob?.status === 'completed') {
      queryClient.invalidateQueries(['shop-admin-products']);
      queryClient.invalidateQueries(['mobilesentrix-sync-latest']);
    }
  }, [mobileSentrixJob?.id, mobileSentrixJob?.status, queryClient]);

  useEffect(() => {
    setSelectedId(null);
    setSelectedIds([]);
    setForm(emptyForm);
    setAdminProductPage(1);
  }, [scope, productSource]);

  const invalidateProducts = async () => {
    await queryClient.invalidateQueries(['shop-admin-products']);
  };

  const createMutation = useMutation((payload) => shopService.createProduct(payload), {
    onSuccess: async () => {
      setMessage('Product created.');
      setError('');
      setForm(emptyForm);
      setSelectedId(null);
      setProductModalOpen(false);
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
      setProductModalOpen(false);
      await invalidateProducts();
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Failed to update product.');
      setMessage('');
    },
  });

  const toggleVisibilityMutation = useMutation(
    ({ id, isActive }) => shopService.updateProduct(id, { is_active: isActive }),
    {
      onSuccess: async () => {
        setMessage('Product visibility updated.');
        setError('');
        await invalidateProducts();
      },
      onError: (mutationError) => {
        setError(mutationError.response?.data?.message || 'Failed to update visibility.');
        setMessage('');
      },
    },
  );

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

  const formatIntegrationError = (mutationError, fallback) => {
    const data = mutationError.response?.data;
    const providerMessage =
      data?.provider_response?.messages?.error?.[0]?.message ||
      data?.provider_response?.message ||
      data?.provider_response?.error;
    return [
      data?.message || mutationError.message || fallback,
      data?.provider_status ? `Provider status: ${data.provider_status}` : '',
      providerMessage ? `Provider response: ${providerMessage}` : '',
    ]
      .filter(Boolean)
      .join(' • ');
  };

  const mobileSentrixPreviewMutation = useMutation(
    () =>
      shopService.previewMobileSentrixProducts({
        limit: 10,
        page: 1,
      }),
    {
      onSuccess: (result) => {
        setMobileSentrixResult(result);
        setMessage(
          `MobileSentrix preview loaded. ${result.items?.length || 0} mapped items, ${result.total_items || 0} total matches.`,
        );
        setError('');
      },
      onError: (mutationError) => {
        setMobileSentrixResult(null);
        setError(formatIntegrationError(mutationError, 'Failed to preview MobileSentrix products.'));
        setMessage('');
      },
    },
  );

  const mobileSentrixSyncMutation = useMutation(
    () =>
      shopService.syncMobileSentrixProducts({
        limit: 100,
      }),
    {
      onSuccess: async (result) => {
        const job = result.job;
        if (job?.id) {
          setMobileSentrixJobId(job.id);
        }
        setMessage(
          result.already_running
            ? 'MobileSentrix full catalog sync is already running. Progress is shown below.'
            : 'MobileSentrix full catalog sync started in the background. Progress is shown below.',
        );
        setError('');
        await queryClient.invalidateQueries(['mobilesentrix-sync-latest']);
      },
      onError: (mutationError) => {
        setError(formatIntegrationError(mutationError, 'Failed to sync MobileSentrix products.'));
        setMessage('');
      },
    },
  );

  const mobileSentrixRefreshMutation = useMutation(() => shopService.refreshMobileSentrixProducts(), {
    onSuccess: async (result) => {
      const job = result.job;
      if (job?.id) {
        setMobileSentrixJobId(job.id);
      }
      setMessage(
        result.already_running
          ? 'MobileSentrix sync is already running. Progress is shown below.'
          : 'MobileSentrix stock and price refresh started in the background. Progress is shown below.',
      );
      setError('');
      await queryClient.invalidateQueries(['mobilesentrix-sync-latest']);
    },
    onError: (mutationError) => {
      setError(formatIntegrationError(mutationError, 'Failed to refresh MobileSentrix products.'));
      setMessage('');
    },
  });

  const mobileSentrixSelectedRefreshMutation = useMutation(
    (ids) => shopService.refreshSelectedMobileSentrixProducts(ids),
    {
      onSuccess: async (result) => {
        setMessage(
          `Selected MobileSentrix refresh finished. ${result.updated || 0} updated, ${result.skipped || 0} skipped, ${result.failed || 0} failed.`,
        );
        setError('');
        setSelectedIds([]);
        await invalidateProducts();
      },
      onError: (mutationError) => {
        setError(formatIntegrationError(mutationError, 'Failed to refresh selected MobileSentrix products.'));
        setMessage('');
      },
    },
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) || null,
    [products, selectedId],
  );
  const allSelected =
    products.length > 0 && selectedIds.length > 0 && selectedIds.length === products.length;

  const applyProductToForm = (product, openModal = true) => {
    if (!product) {
      setSelectedId(null);
      setForm(emptyForm);
      if (openModal) {
        setProductModalOpen(true);
      }
      return;
    }

    setSelectedId(product.id);
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
    if (openModal) {
      setProductModalOpen(true);
    }
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

  const handleBulkVisibility = (isActive) => {
    if (selectedIds.length === 0) {
      return;
    }

    setConfirmState({
      open: true,
      title: isActive ? 'Show Selected Products' : 'Hide Selected Products',
      message: `${selectedIds.length} selected products will be ${isActive ? 'shown in' : 'hidden from'} the public catalog.`,
      confirmText: isActive ? 'Show Selected' : 'Hide Selected',
      severity: 'warning',
      onConfirm: async () => {
        await Promise.all(
          selectedIds.map((id) => shopService.updateProduct(id, { is_active: isActive })),
        );
        setSelectedIds([]);
        setMessage(`${selectedIds.length} products ${isActive ? 'shown' : 'hidden'}.`);
        setError('');
        await invalidateProducts();
      },
    });
  };

  const handleRefreshSelectedMobileSentrix = () => {
    if (selectedIds.length === 0) {
      return;
    }

    mobileSentrixSelectedRefreshMutation.mutate(selectedIds);
  };

  const refreshMobileSentrixProduct = (productId) => {
    mobileSentrixSelectedRefreshMutation.mutate([productId]);
  };

  const renderVisibilitySwitch = (product) => (
    <Tooltip title={product.is_active ? 'Visible in public shop' : 'Hidden from public shop'}>
      <Switch
        size="small"
        checked={Boolean(product.is_active)}
        disabled={scope === 'trash' || toggleVisibilityMutation.isLoading}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) =>
          toggleVisibilityMutation.mutate({
            id: product.id,
            isActive: event.target.checked,
          })
        }
      />
    </Tooltip>
  );

  const renderProductEditor = () => (
    <>
      <Box sx={{ mb: 2.5 }}>
        {form.image_url ? (
          <Box
            component="img"
            src={form.image_url}
            alt="Product preview"
            sx={{
              width: '100%',
              maxHeight: 220,
              objectFit: 'contain',
              borderRadius: 3,
              border: '1px solid #dce4f0',
              background: '#f8fbff',
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

      <Box component="form" id="shop-admin-product-form" onSubmit={handleSubmit}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Brand"
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              helperText="Used in the public shop brand filter and CSV imports."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              helperText="Optional. Leave blank to auto-generate."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
        </Grid>
      </Box>
    </>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Tabs
              value={productSource}
              onChange={(event, value) => setProductSource(value)}
              sx={{ mb: 2, minHeight: 40 }}
            >
              {productSources.map((item) => (
                <Tab
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  sx={{ textTransform: 'none', minHeight: 40, fontWeight: 700 }}
                />
              ))}
            </Tabs>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#172033' }}>
                  {productSource === 'manual' ? 'Products' : 'MobileSentrix Products'}
                </Typography>
                <Typography sx={{ color: '#667085', mt: 0.75 }}>
                  {productSource === 'manual'
                    ? 'Catalog management, CSV import, image handling, and trash recovery.'
                    : 'Preview the supplier catalog, apply Zezva pricing, and sync all MobileSentrix products into the shop catalog.'}
                </Typography>
              </Box>
              {productSource === 'manual' ? (
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
              ) : (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} flexWrap="wrap" sx={{ minWidth: { md: 420 } }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => applyProductToForm(null)}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
                  >
                    New Product
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={() => mobileSentrixPreviewMutation.mutate()}
                    disabled={mobileSentrixPreviewMutation.isLoading}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {mobileSentrixPreviewMutation.isLoading ? 'Loading...' : 'Preview Catalog'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Sync />}
                    onClick={() => mobileSentrixSyncMutation.mutate()}
                    disabled={mobileSentrixSyncMutation.isLoading || mobileSentrixJobRunning}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {mobileSentrixSyncMutation.isLoading || mobileSentrixJobRunning
                      ? 'Sync Running...'
                      : 'Sync Full Catalog'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Sync />}
                    onClick={() => mobileSentrixRefreshMutation.mutate()}
                    disabled={mobileSentrixRefreshMutation.isLoading || mobileSentrixJobRunning}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {mobileSentrixRefreshMutation.isLoading || mobileSentrixJobRunning
                      ? 'Refresh Running...'
                      : 'Refresh Existing'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Sync />}
                    onClick={handleRefreshSelectedMobileSentrix}
                    disabled={selectedIds.length === 0 || mobileSentrixSelectedRefreshMutation.isLoading}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {mobileSentrixSelectedRefreshMutation.isLoading ? 'Refreshing...' : 'Refresh Selected'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityOff />}
                    disabled={selectedIds.length === 0}
                    onClick={() => handleBulkVisibility(false)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    Hide Selected
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    disabled={selectedIds.length === 0}
                    onClick={() => handleBulkVisibility(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    Show Selected
                  </Button>
                  <Button
                    color="warning"
                    variant="outlined"
                    startIcon={<DeleteOutline />}
                    disabled={selectedIds.length === 0}
                    onClick={handleBulkDelete}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    Delete Selected
                  </Button>
                </Stack>
              )}
            </Stack>

            {productSource === 'manual' ? (
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
            ) : null}

            {productSource === 'manual' ? (
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
            ) : null}

            {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {productSource === 'manual' && selectedIds.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {selectedIds.length} product{selectedIds.length === 1 ? '' : 's'} selected.
              </Alert>
            )}
            {productSource === 'mobilesentrix' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Pricing formula: supplier currency price + 18% VAT, converted by official NBG rate, plus ₾5 handling, then +50% Zezva margin. Existing MobileSentrix products auto-refresh every 12 hours.
              </Alert>
            )}
            {productSource === 'mobilesentrix' && mobileSentrixJob && (
              <Paper
                elevation={0}
                sx={{ mt: 2, p: 2, borderRadius: 3, border: '1px solid #dce4f0', background: '#fbfcff' }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#172033' }}>
                      Full catalog sync: {mobileSentrixJob.status}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#667085', mt: 0.5 }}>
                      {mobileSentrixJob.last_message || 'Waiting for progress...'}
                    </Typography>
                    {mobileSentrixJob.error_message && (
                      <Typography sx={{ fontSize: '13px', color: '#b42318', mt: 0.5 }}>
                        {mobileSentrixJob.error_message}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 900, color: '#6f4ef6' }}>
                    {mobileSentrixJob.progress || 0}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant={mobileSentrixJob.total_pages ? 'determinate' : 'indeterminate'}
                  value={mobileSentrixJob.progress || 0}
                  sx={{ mt: 1.5, height: 8, borderRadius: 999 }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  <Chip
                    size="small"
                    label={`Page ${mobileSentrixJob.current_page || 0}/${mobileSentrixJob.total_pages || '?'}`}
                    sx={{ borderRadius: 2 }}
                  />
                  <Chip size="small" label={`${mobileSentrixJob.scanned || 0} scanned`} sx={{ borderRadius: 2 }} />
                  <Chip color="success" size="small" label={`${mobileSentrixJob.created || 0} created`} sx={{ borderRadius: 2 }} />
                  <Chip color="primary" size="small" label={`${mobileSentrixJob.updated || 0} updated`} sx={{ borderRadius: 2 }} />
                  <Chip size="small" label={`${mobileSentrixJob.skipped || 0} skipped`} sx={{ borderRadius: 2 }} />
                  <Chip color={mobileSentrixJob.failed ? 'error' : 'default'} size="small" label={`${mobileSentrixJob.failed || 0} failed`} sx={{ borderRadius: 2 }} />
                </Stack>
              </Paper>
            )}
          </Box>

          {productSource === 'manual' ? (
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
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`products-loading-${index}`}>
                      <TableCell padding="checkbox">
                        <Skeleton variant="rounded" width={20} height={20} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Skeleton variant="rounded" width={44} height={44} />
                          <Box>
                            <Skeleton variant="text" width={180} height={24} />
                            <Skeleton variant="text" width={120} height={18} />
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Skeleton variant="rounded" width={84} height={24} />
                          <Skeleton variant="rounded" width={74} height={24} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={110} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rounded" width={76} height={24} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton variant="circular" width={32} height={32} sx={{ ml: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))
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
                          <Stack direction="row" spacing={1} alignItems="center">
                            {renderVisibilitySwitch(product)}
                            <Chip
                              size="small"
                              icon={product.is_active ? <Visibility /> : <VisibilityOff />}
                              label={product.is_active ? 'Visible' : 'Hidden'}
                              color={product.is_active ? 'success' : 'default'}
                              sx={{ borderRadius: 2 }}
                            />
                          </Stack>
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
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton
                              onClick={(event) => {
                                event.stopPropagation();
                                applyProductToForm(product);
                              }}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSoftDelete(product.id);
                              }}
                              color="error"
                            >
                              <DeleteOutline />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              </Table>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table
                size="small"
                sx={{
                  '& th': {
                    bgcolor: '#f8fbff',
                    color: '#667085',
                    fontSize: '11px',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  },
                  '& td': {
                    borderColor: '#e6edf7',
                    py: 1.25,
                    verticalAlign: 'middle',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={selectedIds.length > 0 && !allSelected}
                        onChange={(event) => handleSelectAll(event.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU / Supplier ID</TableCell>
                    <TableCell>Mapping</TableCell>
                    <TableCell>Supplier Price</TableCell>
                    <TableCell>Zezva Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Catalog</TableCell>
                    <TableCell>Synced</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 8 }).map((_, index) => (
                      <TableRow key={`mobilesentrix-loading-${index}`}>
                        <TableCell padding="checkbox">
                          <Skeleton variant="rounded" width={20} height={20} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Skeleton variant="rounded" width={52} height={52} />
                            <Box>
                              <Skeleton variant="text" width={260} height={24} />
                              <Skeleton variant="text" width={180} height={18} />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={170} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={86} height={24} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={58} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width={120} /></TableCell>
                        <TableCell align="right"><Skeleton variant="text" width={140} sx={{ ml: 'auto' }} /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10}>
                        No MobileSentrix products synced yet. Click Sync Full Catalog to import supplier products.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    products.map((product) => (
                      <TableRow
                        hover
                        key={product.id}
                        selected={selectedIds.includes(product.id)}
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: '#fbf8ff',
                          },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(product.id)}
                            onChange={(event) =>
                              handleSelectProduct(product.id, event.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 340 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {product.image_url ? (
                              <Box
                                component="img"
                                src={product.image_url}
                                alt={product.title}
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 2,
                                  objectFit: 'contain',
                                  border: '1px solid #dce4f0',
                                  background: '#f8fbff',
                                  p: 0.75,
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 2,
                                  border: '1px solid #dce4f0',
                                  background: '#f8fbff',
                                  display: 'grid',
                                  placeItems: 'center',
                                  color: '#667085',
                                  fontWeight: 900,
                                  flexShrink: 0,
                                }}
                              >
                                MS
                              </Box>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, color: '#172033', lineHeight: 1.25 }}>
                                {product.title}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: '#667085', mt: 0.4 }}>
                                {[product.brand, product.device_model].filter(Boolean).join(' • ') || 'MobileSentrix product'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, color: '#172033', fontSize: '13px' }}>
                            {product.supplier_sku || 'No SKU'}
                          </Typography>
                          <Typography sx={{ color: '#667085', fontSize: '12px' }}>
                            ID {product.supplier_product_id || product.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap">
                            <Chip size="small" label={product.device_category} sx={{ borderRadius: 2 }} />
                            <Chip size="small" variant="outlined" label={product.part_category} sx={{ borderRadius: 2 }} />
                            <Chip size="small" variant="outlined" label={product.quality_line || product.inventory_source} sx={{ borderRadius: 2 }} />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, color: '#172033' }}>
                            {product.supplier_currency || 'EUR'} {Number(product.supplier_price_usd || 0).toFixed(2)}
                          </Typography>
                          <Typography sx={{ color: '#667085', fontSize: '12px' }}>
                            rate {Number(product.supplier_exchange_rate || 0).toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 900, color: '#172033' }}>
                            {formatAdminProductPrice(product)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={product.stock_quantity > 0 ? 'success' : 'default'}
                            label={product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                            sx={{ borderRadius: 2, fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell>{renderVisibilitySwitch(product)}</TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#667085', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {product.supplier_synced_at
                              ? new Date(product.supplier_synced_at).toLocaleString()
                              : 'Not synced'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Refresh product">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled={mobileSentrixSelectedRefreshMutation.isLoading}
                                  onClick={() => refreshMobileSentrixProduct(product.id)}
                                >
                                  <Sync fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Edit product">
                              <IconButton size="small" color="primary" onClick={() => applyProductToForm(product)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move to trash">
                              <IconButton size="small" color="error" onClick={() => handleSoftDelete(product.id)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          )}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            sx={{ p: 2, borderTop: '1px solid #e6edf7' }}
          >
            <Typography sx={{ fontSize: '13px', color: '#667085', fontWeight: 700 }}>
              Showing page {adminProductPage} of {productsTotalPages} • {productsTotal} products
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={adminProductPage <= 1 || isLoading}
                onClick={() => setAdminProductPage((current) => Math.max(1, current - 1))}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                disabled={adminProductPage >= productsTotalPages || isLoading}
                onClick={() => setAdminProductPage((current) => current + 1)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      <Dialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid #dce4f0',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 900, color: '#172033' }}>
            {selectedProduct ? 'Edit Product' : 'New Product'}
          </Typography>
          <Typography sx={{ color: '#667085', mt: 0.5, fontSize: '14px' }}>
            Upload an image directly, or paste an image URL and it will be downloaded on save.
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          {renderProductEditor()}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          {selectedProduct && scope === 'active' ? (
            <Button
              color="warning"
              variant="outlined"
              startIcon={<DeleteOutline />}
              onClick={() => handleSoftDelete(selectedProduct.id)}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3, mr: 'auto' }}
            >
              Delete
            </Button>
          ) : null}
          <Button
            variant="outlined"
            onClick={() => setProductModalOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="shop-admin-product-form"
            variant="contained"
            startIcon={<Save />}
            disabled={createMutation.isLoading || updateMutation.isLoading || uploadImageMutation.isLoading}
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
        </DialogActions>
      </Dialog>
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
