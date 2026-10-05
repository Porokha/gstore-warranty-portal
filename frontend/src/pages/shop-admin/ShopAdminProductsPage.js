import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
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
  Menu,
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
  CloseRounded,
  Edit,
  Download,
  DeleteOutline,
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

const productSources = [
  { value: 'manual', label: 'Zezva Products' },
  { value: 'mobilesentrix', label: 'MobileSentrix' },
];

const productOnlyStatusLabelKa = 'ხელმისაწვდომია, მხოლოდ სერვისთან ერთად';
const serviceUnavailableLabelKa = 'სერვისი არ არის ხელმისაწვდომი';

const formatAdminProductPrice = (product, unavailable = 'Unavailable') => {
  if (product.sale_price != null) {
    return `₾${Number(product.sale_price).toFixed(2)}`;
  }

  if (product.price != null) {
    return `₾${Number(product.price).toFixed(2)}`;
  }

  if (product.service_price != null) {
    return productOnlyStatusLabelKa;
  }

  return unavailable;
};

const formatAdminCount = (value) => Number(value || 0).toLocaleString('en-US').replaceAll(',', ' ');
const formatAdminTimestamp = (value) => new Date(value).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}).replaceAll('/', '.');

const ShopAdminProductsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const csvInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [productSource, setProductSource] = useState('manual');
  const [scope, setScope] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [mobileSentrixResult, setMobileSentrixResult] = useState(null);
  const [mobileSentrixMappingOpen, setMobileSentrixMappingOpen] = useState(false);
  const [mobileSentrixJobId, setMobileSentrixJobId] = useState(null);
  const [mobileSentrixSearch, setMobileSentrixSearch] = useState('');
  const [mobileSentrixStockFilter, setMobileSentrixStockFilter] = useState('all');
  const [mobileSentrixQuickFilter, setMobileSentrixQuickFilter] = useState('all');
  const [mobileSentrixSyncFilter, setMobileSentrixSyncFilter] = useState('all');
  const [syncMenuAnchor, setSyncMenuAnchor] = useState(null);
  const [manualSearch, setManualSearch] = useState('');
  const [manualStockFilter, setManualStockFilter] = useState('all');
  const [manualDeviceFilter, setManualDeviceFilter] = useState('all');
  const [manualPartFilter, setManualPartFilter] = useState('all');
  const [adminProductPage, setAdminProductPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
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
  const previewRateEntry = Object.entries(mobileSentrixResult?.exchange_rates || {})[0] || null;

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
    setPreviewProduct(null);
    setAdminProductPage(1);
    setMobileSentrixSearch('');
    setMobileSentrixResult(null);
    setMobileSentrixMappingOpen(false);
    setMobileSentrixStockFilter('all');
    setMobileSentrixQuickFilter('all');
    setMobileSentrixSyncFilter('all');
    setSyncMenuAnchor(null);
    setManualSearch('');
    setManualStockFilter('all');
    setManualDeviceFilter('all');
    setManualPartFilter('all');
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
        setMobileSentrixResult({ ...result, previewed_at: new Date().toISOString() });
        setMessage('');
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
        setMobileSentrixResult(null);
        const job = result.job;
        if (job?.id) {
          setMobileSentrixJobId(job.id);
        }
        setMessage('');
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
      setMobileSentrixResult(null);
      const job = result.job;
      if (job?.id) {
        setMobileSentrixJobId(job.id);
      }
      setMessage('');
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
  const displayedProducts = useMemo(() => {
    if (productSource !== 'mobilesentrix') {
      const search = manualSearch.trim().toLocaleLowerCase();
      return products.filter((product) => {
        const quantity = Number(product.stock_quantity || 0);
        const matchesSearch = !search || [product.title, product.slug, product.brand, product.device_model, product.part_category]
          .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(search));
        const matchesStock = manualStockFilter === 'all'
          || (manualStockFilter === 'available' && quantity >= 10)
          || (manualStockFilter === 'low' && quantity > 0 && quantity < 10)
          || (manualStockFilter === 'none' && quantity <= 0);
        return matchesSearch && matchesStock
          && (manualDeviceFilter === 'all' || product.device_category === manualDeviceFilter)
          && (manualPartFilter === 'all' || product.part_category === manualPartFilter);
      });
    }

    const search = mobileSentrixSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        [
          product.title,
          product.brand,
          product.device_model,
          product.supplier_sku,
          product.supplier_product_id,
          product.part_category,
          product.device_category,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      const matchesStock =
        mobileSentrixStockFilter === 'all' ||
        (mobileSentrixStockFilter === 'in_stock' && Number(product.stock_quantity || 0) > 0) ||
        (mobileSentrixStockFilter === 'out_of_stock' && Number(product.stock_quantity || 0) <= 0);
      const matchesQuick = mobileSentrixQuickFilter === 'all'
        || (mobileSentrixQuickFilter === 'visible' && product.is_active)
        || (mobileSentrixQuickFilter === 'hidden' && !product.is_active)
        || (mobileSentrixQuickFilter === 'low' && Number(product.stock_quantity || 0) > 0 && Number(product.stock_quantity || 0) < 10);
      const matchesSync = mobileSentrixSyncFilter === 'all'
        || (mobileSentrixSyncFilter === 'synced' && Boolean(product.supplier_synced_at))
        || (mobileSentrixSyncFilter === 'not_synced' && !product.supplier_synced_at);

      return matchesSearch && matchesStock && matchesQuick && matchesSync;
    });
  }, [manualSearch, manualStockFilter, manualDeviceFilter, manualPartFilter, mobileSentrixSearch, mobileSentrixStockFilter, mobileSentrixQuickFilter, mobileSentrixSyncFilter, productSource, products]);
  const manualCounts = useMemo(() => products.reduce((counts, product) => {
    const quantity = Number(product.stock_quantity || 0);
    counts[quantity <= 0 ? 'none' : quantity < 10 ? 'low' : 'available'] += 1;
    return counts;
  }, { available: 0, low: 0, none: 0 }), [products]);
  const manualDevices = useMemo(() => [...new Set(products.map((product) => product.device_category).filter(Boolean))].sort(), [products]);
  const manualParts = useMemo(() => [...new Set(products.map((product) => product.part_category).filter(Boolean))].sort(), [products]);
  const manualHasFilters = Boolean(manualSearch.trim() || manualStockFilter !== 'all' || manualDeviceFilter !== 'all' || manualPartFilter !== 'all');
  const mobileSentrixCounts = useMemo(() => ({
    visible: products.filter((product) => product.is_active).length,
    hidden: products.filter((product) => !product.is_active).length,
    low: products.filter((product) => Number(product.stock_quantity || 0) > 0 && Number(product.stock_quantity || 0) < 10).length,
  }), [products]);
  const allSelected =
    displayedProducts.length > 0 &&
    displayedProducts.every((product) => selectedIds.includes(product.id));

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
    const visibleIds = displayedProducts.map((product) => product.id);
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, ...visibleIds])]
        : current.filter((id) => !visibleIds.includes(id)),
    );
  };

  const exportSelectedManualProducts = () => {
    const selected = products.filter((product) => selectedIds.includes(product.id));
    if (!selected.length) return;
    const cell = (value) => {
      const raw = String(value ?? '');
      const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const fields = ['id', 'title', 'brand', 'slug', 'device_category', 'part_category', 'price', 'service_price', 'stock_quantity', 'is_active'];
    const csv = [fields.join(','), ...selected.map((product) => fields.map((field) => cell(product[field])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `zezva-products-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFullMobileSentrixSync = () => {
    setConfirmState({
      open: true,
      title: 'Sync Fully',
      message: 'Are you sure? Full MobileSentrix catalog sync may take more than 1 hour to complete.',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      severity: 'warning',
      onConfirm: () => mobileSentrixSyncMutation.mutate(),
    });
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
        className="zzv-shop-sentrix__visibility"
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
    <Box component="form" id="shop-admin-product-form" onSubmit={handleSubmit} className="zzv-shop-product-modal__form">
      <section className="zzv-shop-product-modal__group">
        <h3>{t('shopProducts.basicDetails', 'Basic details')}</h3>
        <div className="zzv-shop-product-modal__fields">
          <label htmlFor="shop-product-title">{t('shopProducts.productName', 'Product name')}</label>
          <TextField id="shop-product-title" size="small" fullWidth required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          <label htmlFor="shop-product-slug">{t('shopProducts.address', 'Address')}</label>
          <TextField id="shop-product-slug" size="small" fullWidth value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} helperText={t('shopProducts.slugHint', 'Leave blank to generate automatically.')} />
          <div className="zzv-shop-product-modal__grid">
            <div><label htmlFor="shop-product-brand">{t('shopProducts.manufacturer', 'Manufacturer')}</label><TextField id="shop-product-brand" size="small" fullWidth value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} /></div>
            <div><label htmlFor="shop-product-source">{t('shopProducts.type', 'Type')}</label><TextField id="shop-product-source" select size="small" fullWidth value={form.inventory_source} onChange={(event) => setForm((prev) => ({ ...prev, inventory_source: event.target.value }))}><MenuItem value="oem">OEM</MenuItem><MenuItem value="third-party">Third party</MenuItem></TextField></div>
          </div>
          <div className="zzv-shop-product-modal__upload" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file?.type.startsWith('image/') && !uploadImageMutation.isLoading) uploadImageMutation.mutate(file); }}>
            {form.image_url ? <img src={form.image_url} alt="" /> : <img src="/figma-shop-admin/new-product-upload.svg" alt="" />}
            <div><strong>{t('shopProducts.uploadImage', 'Upload image')}</strong><span>{t('shopProducts.orDropHere', 'or drop it here')}</span></div>
            <Button type="button" variant="contained" onClick={() => imageInputRef.current?.click()} disabled={uploadImageMutation.isLoading}>{uploadImageMutation.isLoading ? t('shopProducts.uploading', 'Uploading...') : t('shopProducts.chooseImage', 'Choose image')}</Button>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImageMutation.mutate(file); event.target.value = ''; }} />
          </div>
        </div>
      </section>

      <section className="zzv-shop-product-modal__group">
        <h3>{t('shopProducts.classification', 'Classification')}</h3>
        <div className="zzv-shop-product-modal__fields zzv-shop-product-modal__grid">
          <div><label htmlFor="shop-product-device">{t('shopProducts.device', 'Device')}</label><TextField id="shop-product-device" select size="small" fullWidth value={form.device_category} onChange={(event) => setForm((prev) => ({ ...prev, device_category: event.target.value }))}><MenuItem value="smartphones">{t('shopProducts.smartphones', 'Smartphones')}</MenuItem><MenuItem value="laptops">{t('shopProducts.laptops', 'Laptops')}</MenuItem><MenuItem value="accessories">{t('shopProducts.accessories', 'Accessories')}</MenuItem></TextField></div>
          <div><label htmlFor="shop-product-issue">{t('shopProducts.issueLabel', 'Issue label')}</label><TextField id="shop-product-issue" size="small" fullWidth value={form.issue_label} onChange={(event) => setForm((prev) => ({ ...prev, issue_label: event.target.value }))} /></div>
          <div><label htmlFor="shop-product-part">{t('shopProducts.part', 'Part')}</label><TextField id="shop-product-part" select size="small" fullWidth value={form.part_category} onChange={(event) => setForm((prev) => ({ ...prev, part_category: event.target.value }))}>{['board', 'screen', 'sensor', 'battery', 'camera', 'speaker', 'charging', 'accessory'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField></div>
          <div><label htmlFor="shop-product-sort">{t('shopProducts.sortOrder', 'Sort order')}</label><TextField id="shop-product-sort" size="small" fullWidth type="number" value={form.sort_order} onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))} /></div>
        </div>
      </section>

      <section className="zzv-shop-product-modal__group">
        <h3>{t('shopProducts.priceAndStock', 'Price and stock')}</h3>
        <div className="zzv-shop-product-modal__fields zzv-shop-product-modal__grid">
          <div><label htmlFor="shop-product-price">{t('shopProducts.priceGel', 'Price ₾')}</label><TextField id="shop-product-price" size="small" fullWidth type="number" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} helperText={form.price === '' && form.service_price !== '' ? productOnlyStatusLabelKa : t('shopProducts.priceHint', 'Leave empty for service only.')} /></div>
          <div><label htmlFor="shop-product-service-price">{t('shopProducts.servicePriceGel', 'Service price ₾')}</label><TextField id="shop-product-service-price" size="small" fullWidth type="number" value={form.service_price} onChange={(event) => setForm((prev) => ({ ...prev, service_price: event.target.value }))} helperText={form.service_price === '' ? serviceUnavailableLabelKa : t('shopProducts.servicePriceHint', 'Leave empty to disable service bundle.')} /></div>
          <div><label htmlFor="shop-product-stock">{t('shopProducts.stock', 'Stock')}</label><TextField id="shop-product-stock" size="small" fullWidth type="number" value={form.stock_quantity} onChange={(event) => setForm((prev) => ({ ...prev, stock_quantity: event.target.value }))} inputProps={{ min: 0 }} /></div>
          <div className="zzv-shop-product-modal__visibility"><span>{t('shopProducts.visibility', 'Visibility')}</span><Switch className="zzv-tradein-edit__switch" checked={Boolean(form.is_active)} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} inputProps={{ 'aria-label': t('shopProducts.visibility', 'Visibility') }} /></div>
        </div>
      </section>

      <details className="zzv-shop-product-modal__more">
        <summary>{t('shopProducts.additionalDetails', 'Additional details')}</summary>
        <div className="zzv-shop-product-modal__fields">
          <label htmlFor="shop-product-image-url">{t('shopProducts.imageUrl', 'Image URL')}</label>
          <TextField id="shop-product-image-url" size="small" fullWidth value={form.image_url} onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))} helperText={t('shopProducts.imageUrlHint', 'External images are downloaded when saved.')} />
          <label htmlFor="shop-product-sale-price">{t('shopProducts.salePrice', 'Sale price')}</label>
          <TextField id="shop-product-sale-price" size="small" fullWidth type="number" value={form.sale_price} onChange={(event) => setForm((prev) => ({ ...prev, sale_price: event.target.value }))} />
          <label htmlFor="shop-product-description">{t('shopProducts.description', 'Description')}</label>
          <TextField id="shop-product-description" size="small" fullWidth multiline minRows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        </div>
      </details>
    </Box>
  );

  return (
    <Grid className="zzv-admin-page zzv-admin-page--shop-products" container spacing={3}>
      <Grid item xs={12}>
        <Paper className="zzv-admin-table-card zzv-shop-products-panel" elevation={0} sx={{ borderRadius: 3, border: '1px solid #dce4f0', overflow: 'hidden' }}>
          <Box className="zzv-admin-filter-card" sx={{ p: 3, borderBottom: '1px solid #e6edf7' }}>
            <Stack
              className="zzv-shop-catalog__heading"
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography component="h1" sx={{ fontSize: '20px', fontWeight: 600, color: '#14121c' }}>
                  {t('shopProducts.title')}
                </Typography>
                <Typography sx={{ color: '#5b5670', mt: 0.5, fontSize: '12px' }}>
                  {t('shopProducts.subtitle')}
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
                    {importMutation.isLoading ? t('shopProducts.importing') : t('shopProducts.importCsv')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadTemplateMutation.mutate()}
                    disabled={downloadTemplateMutation.isLoading}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {downloadTemplateMutation.isLoading ? t('shopProducts.preparing') : t('shopProducts.downloadTemplate')}
                  </Button>
                  <Button
                    onClick={() => applyProductToForm(null)}
                    startIcon={<Add />}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
                  >
                    {t('shopProducts.newProduct')}
                  </Button>
                </Stack>
              ) : (
                <>
                  <Button className="zzv-shop-sentrix__sync-button" variant="outlined" startIcon={<Sync />} onClick={(event) => setSyncMenuAnchor(event.currentTarget)}
                    aria-haspopup="menu" aria-expanded={Boolean(syncMenuAnchor)}>
                    {t('shopProducts.sync')}
                  </Button>
                  <Menu anchorEl={syncMenuAnchor} open={Boolean(syncMenuAnchor)} onClose={() => setSyncMenuAnchor(null)}
                    className="zzv-shop-sentrix__sync-menu" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <div className="zzv-shop-sentrix__menu-label">{t('shopProducts.check')}</div>
                    <MenuItem disabled={mobileSentrixPreviewMutation.isLoading} onClick={() => { setSyncMenuAnchor(null); mobileSentrixPreviewMutation.mutate(); }}>
                      <Search fontSize="small" /><span><strong>{t('shopProducts.previewCatalog')}</strong><small>{t('shopProducts.previewCatalogHint')}</small></span>
                    </MenuItem>
                    <div className="zzv-shop-sentrix__menu-label">{t('shopProducts.sync')}</div>
                    <MenuItem disabled={mobileSentrixSyncMutation.isLoading || mobileSentrixJobRunning} onClick={() => { setSyncMenuAnchor(null); handleFullMobileSentrixSync(); }}>
                      <Sync fontSize="small" /><span><strong>{t('shopProducts.syncFully')}</strong><small>{t('shopProducts.syncFullyHint')}</small></span>
                    </MenuItem>
                    <MenuItem disabled={mobileSentrixRefreshMutation.isLoading || mobileSentrixJobRunning} onClick={() => { setSyncMenuAnchor(null); mobileSentrixRefreshMutation.mutate(); }}>
                      <RestoreFromTrash fontSize="small" /><span><strong>{t('shopProducts.refreshExisting')}</strong><small>{t('shopProducts.refreshExistingHint')}</small></span>
                    </MenuItem>
                    <MenuItem disabled><Sync fontSize="small" /><span><strong>{t('shopProducts.rerunMapping')}</strong><small>{t('shopProducts.rerunMappingHint')}</small></span></MenuItem>
                  </Menu>
                </>
              )}
            </Stack>

            <div className="zzv-shop-catalog__tabs">
              <Tabs value={productSource} onChange={(event, value) => {
                setProductSource(value);
                setScope('active');
              }}>
                {productSources.map((item) => (
                  <Tab key={item.value} value={item.value}
                    label={`${t(item.value === 'manual' ? 'shopProducts.zezvaTab' : 'shopProducts.sentrixTab')}${item.value === productSource ? ` ${productsTotal}` : ''}`}
                  />
                ))}
              </Tabs>
              <button type="button" className={scope === 'trash' ? 'is-active' : ''}
                onClick={() => setScope(scope === 'trash' ? 'active' : 'trash')}>
                {t('shopProducts.trash')}
              </button>
            </div>

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

            {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {productSource === 'manual' && <div className="zzv-shop-catalog__filters">
              <TextField size="small" fullWidth value={manualSearch} onChange={(event) => setManualSearch(event.target.value)}
                placeholder={t('shopProducts.searchPlaceholder')} inputProps={{ 'aria-label': t('shopProducts.searchLabel') }}
                InputProps={{ startAdornment: <Search fontSize="small" /> }} />
              <div className="zzv-shop-catalog__filter-row">
                <div className="zzv-shop-catalog__stock-tabs" role="group" aria-label={t('shopProducts.stockFilter')}>
                  {[
                    ['all', t('shopProducts.all'), products.length],
                    ['available', t('shopProducts.inStock'), manualCounts.available],
                    ['low', t('shopProducts.lowStock'), manualCounts.low],
                    ['none', t('shopProducts.outOfStock'), manualCounts.none],
                  ].map(([value, label, count]) => <button key={value} type="button" className={manualStockFilter === value ? 'is-active' : ''}
                    onClick={() => setManualStockFilter(value)} aria-pressed={manualStockFilter === value}>{label} <span>{count}</span></button>)}
                </div>
                <div className="zzv-shop-catalog__selects">
                  <TextField select size="small" value={manualDeviceFilter} onChange={(event) => setManualDeviceFilter(event.target.value)}
                    inputProps={{ 'aria-label': t('shopProducts.device') }}>
                    <MenuItem value="all">{t('shopProducts.allDevices')}</MenuItem>
                    {manualDevices.map((device) => <MenuItem key={device} value={device}>{device}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" value={manualPartFilter} onChange={(event) => setManualPartFilter(event.target.value)}
                    inputProps={{ 'aria-label': t('shopProducts.part') }}>
                    <MenuItem value="all">{t('shopProducts.allParts')}</MenuItem>
                    {manualParts.map((part) => <MenuItem key={part} value={part}>{part}</MenuItem>)}
                  </TextField>
                </div>
              </div>
              {productsTotal > products.length && manualHasFilters && <p className="zzv-shop-catalog__page-note">{t('shopProducts.pageOnly')}</p>}
            </div>}
            {productSource === 'mobilesentrix' && mobileSentrixResult && <section className="zzv-shop-sentrix__result" aria-label={t('shopProducts.previewComplete')}>
              <div className="zzv-shop-sentrix__result-head">
                <span className="zzv-shop-sentrix__result-check"><img src="/figma-shop-admin/sentrix-check.svg" alt="" /></span>
                <strong>{t('shopProducts.previewComplete')}</strong>
                <span className="zzv-shop-sentrix__divider" />
                <time dateTime={mobileSentrixResult.previewed_at}>{formatAdminTimestamp(mobileSentrixResult.previewed_at)}</time>
              </div>
              <div className="zzv-shop-sentrix__result-metrics">
                <div><strong>{formatAdminCount(mobileSentrixResult.total_items)}</strong><span>{t('shopProducts.supplierTotal')}</span></div>
                <div><strong>{mobileSentrixResult.items?.length || 0}</strong><span>{t('shopProducts.mappedSample')}</span></div>
                <div><strong>{formatAdminCount(mobileSentrixResult.total_pages)}</strong><span>{t('shopProducts.supplierPages')}</span></div>
                <div><strong>{previewRateEntry ? `${previewRateEntry[0]} ${Number(previewRateEntry[1]).toFixed(4)}` : '—'}</strong><span>{t('shopProducts.officialRate')}</span></div>
              </div>
              <div className="zzv-shop-sentrix__result-footer">
                <p>{t('shopProducts.previewSampleNote')}</p>
                <div>
                  <button type="button" disabled={!mobileSentrixResult.items?.length} onClick={() => setMobileSentrixMappingOpen(true)}><img src="/figma-shop-admin/sentrix-mapping.svg" alt="" />{t('shopProducts.viewMapping')}</button>
                  <button type="button" className="is-primary" disabled={mobileSentrixJobRunning} onClick={handleFullMobileSentrixSync}><img src="/figma-shop-admin/sentrix-full-sync.svg" alt="" />{t('shopProducts.syncFully')}</button>
                </div>
              </div>
            </section>}
            {productSource === 'mobilesentrix' && mobileSentrixJob && (!mobileSentrixResult || mobileSentrixJobRunning) && <section className={`zzv-shop-sentrix__progress zzv-shop-sentrix__progress--${mobileSentrixJob.status}`} aria-label={t('shopProducts.syncProgress')}>
              <div className="zzv-shop-sentrix__progress-head">
                <strong>{t(mobileSentrixJob.status === 'completed' ? 'shopProducts.syncComplete' : mobileSentrixJob.status === 'failed' ? 'shopProducts.syncFailed' : mobileSentrixJob.mode === 'refresh-existing' ? 'shopProducts.refreshRunning' : 'shopProducts.fullSyncRunning')}</strong>
                <span className="zzv-shop-sentrix__divider" />
                <span>{formatAdminCount(mobileSentrixJob.scanned)} / {mobileSentrixJob.total_items ? formatAdminCount(mobileSentrixJob.total_items) : '—'}</span>
                {mobileSentrixJobRunning && <button type="button" disabled title={t('shopProducts.stopUnavailable')}><img src="/figma-shop-admin/sentrix-stop.svg" alt="" />{t('shopProducts.stop')}</button>}
              </div>
              <LinearProgress variant={mobileSentrixJob.total_pages ? 'determinate' : 'indeterminate'}
                value={Math.max(0, Math.min(100, Number(mobileSentrixJob.progress || 0)))} />
              <p>{mobileSentrixJob.error_message || (mobileSentrixJob.status === 'completed'
                ? t('shopProducts.syncCompleteSummary', { created: mobileSentrixJob.created || 0, updated: mobileSentrixJob.updated || 0, failed: mobileSentrixJob.failed || 0 })
                : t('shopProducts.syncProgressNote'))}</p>
            </section>}
          </Box>

          {productSource === 'manual' && selectedIds.length > 0 && <div className="zzv-shop-catalog__selection-bar">
            <strong>{t('shopProducts.selected', { count: selectedIds.length })}</strong>
            <div>
              {scope === 'active' ? <>
                <button type="button" onClick={() => handleBulkVisibility(true)}><Visibility fontSize="small" />{t('shopProducts.showSelected')}</button>
                <button type="button" onClick={() => handleBulkVisibility(false)}><VisibilityOff fontSize="small" />{t('shopProducts.hideSelected')}</button>
                <button type="button" onClick={exportSelectedManualProducts}><Download fontSize="small" />{t('shopProducts.exportSelected')}</button>
                <button type="button" className="is-danger" onClick={handleBulkDelete}><DeleteOutline fontSize="small" />{t('shopProducts.deleteSelected')}</button>
              </> : <>
                <button type="button" onClick={handleBulkRestore}><RestoreFromTrash fontSize="small" />{t('shopProducts.restoreSelected')}</button>
                <button type="button" className="is-danger" onClick={handleBulkPermanentDelete}><DeleteOutline fontSize="small" />{t('shopProducts.deletePermanently')}</button>
              </>}
              <button type="button" className="zzv-shop-catalog__clear-selection" onClick={() => setSelectedIds([])} aria-label={t('shopProducts.clearSelection')}>×</button>
            </div>
          </div>}
          {productSource === 'mobilesentrix' && selectedIds.length > 0 && <div className="zzv-shop-catalog__selection-bar">
            <strong>{t('shopProducts.selected', { count: selectedIds.length })}</strong>
            <div>
              {scope === 'active' ? <>
                <button type="button" disabled={mobileSentrixSelectedRefreshMutation.isLoading} onClick={handleRefreshSelectedMobileSentrix}><Sync fontSize="small" />{t('shopProducts.refreshSelected')}</button>
                <button type="button" onClick={() => handleBulkVisibility(true)}><Visibility fontSize="small" />{t('shopProducts.showSelected')}</button>
                <button type="button" onClick={() => handleBulkVisibility(false)}><VisibilityOff fontSize="small" />{t('shopProducts.hideSelected')}</button>
                <button type="button" className="is-danger" onClick={handleBulkDelete}><DeleteOutline fontSize="small" />{t('shopProducts.deleteSelected')}</button>
              </> : <>
                <button type="button" onClick={handleBulkRestore}><RestoreFromTrash fontSize="small" />{t('shopProducts.restoreSelected')}</button>
                <button type="button" className="is-danger" onClick={handleBulkPermanentDelete}><DeleteOutline fontSize="small" />{t('shopProducts.deletePermanently')}</button>
              </>}
              <button type="button" className="zzv-shop-catalog__clear-selection" onClick={() => setSelectedIds([])} aria-label={t('shopProducts.clearSelection')}>×</button>
            </div>
          </div>}

          {productSource === 'manual' ? (
            <Box className="zzv-shop-catalog__table-wrap" sx={{ overflowX: 'auto' }}>
              <Table className="zzv-shop-catalog__table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedIds.length > 0 && !allSelected}
                      onChange={(event) => handleSelectAll(event.target.checked)}
                    />
                  </TableCell>
                  <TableCell>{t('shopProducts.product')}</TableCell>
                  <TableCell>{t('shopProducts.manufacturer')}</TableCell>
                  <TableCell>{t('shopProducts.device')}</TableCell>
                  <TableCell>{t('shopProducts.part')}</TableCell>
                  <TableCell>{t('shopProducts.price')}</TableCell>
                  <TableCell>{t('shopProducts.servicePrice')}</TableCell>
                  <TableCell>{scope === 'trash' ? t('shopProducts.deleted') : t('shopProducts.stock')}</TableCell>
                  <TableCell align="right">{t('shopProducts.actions')}</TableCell>
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
                      {Array.from({ length: 6 }).map((__, cellIndex) => <TableCell key={cellIndex}><Skeleton variant="text" width={cellIndex === 5 ? 36 : 90} height={22} /></TableCell>)}
                      <TableCell align="right"><Skeleton variant="rounded" width={80} height={28} sx={{ ml: 'auto' }} /></TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && displayedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      {scope === 'trash' ? t('shopProducts.emptyTrash') : manualHasFilters ? t('shopProducts.noMatches') : t('shopProducts.emptyCatalog')}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  displayedProducts.map((product) => (
                    <TableRow
                      hover
                      key={product.id}
                      onClick={() => scope === 'active' && applyProductToForm(product)}
                      selected={selectedIds.includes(product.id)}
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
                        <Stack className="zzv-shop-catalog__product-cell" direction="row" spacing={1.5} alignItems="center">
                          {product.image_url ? (
                            <Box
                              component="img"
                              src={product.image_url}
                              alt={product.title}
                              className="zzv-shop-catalog__thumbnail"
                            />
                          ) : <span className="zzv-shop-catalog__thumbnail zzv-shop-catalog__thumbnail--empty"><img src="/figma-shop-admin/product-placeholder.svg" alt="" /></span>}
                          <Box className="zzv-shop-catalog__cell-copy">
                            <strong>{product.title}</strong>
                            <small>{[product.brand, product.inventory_source].filter(Boolean).join(' · ') || product.slug}</small>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><span className="zzv-shop-catalog__cell-copy"><strong>{product.brand || '—'}</strong><small>{product.inventory_source || '—'}</small></span></TableCell>
                      <TableCell><span className="zzv-shop-catalog__cell-copy"><strong>{product.device_model || product.device_category || '—'}</strong><small>{product.device_model ? product.device_category : product.slug}</small></span></TableCell>
                      <TableCell><span className="zzv-shop-catalog__cell-copy"><strong>{product.part_category || '—'}</strong><small>{product.issue_label || '—'}</small></span></TableCell>
                      <TableCell className="zzv-shop-catalog__money">{formatAdminProductPrice(product, t('shopProducts.unavailable'))}</TableCell>
                      <TableCell className="zzv-shop-catalog__money">{product.service_price == null ? '—' : `₾${Number(product.service_price).toFixed(2)}`}</TableCell>
                      <TableCell>{scope === 'trash'
                        ? <span className="zzv-shop-catalog__deleted-date">{product.deleted_at ? new Date(product.deleted_at).toLocaleDateString() : '—'}</span>
                        : <span className={`zzv-shop-catalog__stock zzv-shop-catalog__stock--${Number(product.stock_quantity || 0) <= 0 ? 'none' : Number(product.stock_quantity || 0) < 10 ? 'low' : 'available'}`}>{product.stock_quantity ?? 0}</span>}
                      </TableCell>
                      <TableCell align="right">
                        {scope === 'trash' ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              className="zzv-shop-catalog__action"
                              aria-label={t('shopProducts.restore')}
                              title={t('shopProducts.restore')}
                              onClick={(event) => {
                                event.stopPropagation();
                                restoreMutation.mutate(product.id);
                              }}
                              color="primary"
                            >
                              <RestoreFromTrash />
                            </IconButton>
                            <IconButton
                              className="zzv-shop-catalog__action zzv-shop-catalog__action--delete"
                              aria-label={t('shopProducts.deletePermanently')}
                              title={t('shopProducts.deletePermanently')}
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
                              className="zzv-shop-catalog__action"
                              aria-label={t('shopProducts.edit')}
                              title={t('shopProducts.edit')}
                              onClick={(event) => {
                                event.stopPropagation();
                                applyProductToForm(product);
                              }}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton className="zzv-shop-catalog__action"
                              aria-label={product.is_active ? t('shopProducts.hide') : t('shopProducts.show')}
                              title={product.is_active ? t('shopProducts.hide') : t('shopProducts.show')}
                              disabled={toggleVisibilityMutation.isLoading}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleVisibilityMutation.mutate({ id: product.id, isActive: !product.is_active });
                              }}>
                              {product.is_active ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                            <IconButton
                              className="zzv-shop-catalog__action zzv-shop-catalog__action--delete"
                              aria-label={t('shopProducts.delete')}
                              title={t('shopProducts.delete')}
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
            <>
            <div className="zzv-shop-sentrix__filters">
              <TextField size="small" fullWidth value={mobileSentrixSearch} onChange={(event) => setMobileSentrixSearch(event.target.value)}
                placeholder={t('shopProducts.sentrixSearchPlaceholder')} inputProps={{ 'aria-label': t('shopProducts.searchLabel') }}
                InputProps={{ startAdornment: <Search fontSize="small" /> }} />
              <div className="zzv-shop-sentrix__filter-row">
                <div className="zzv-shop-catalog__stock-tabs" role="group" aria-label={t('shopProducts.catalogFilter')}>
                  {[
                    ['all', t('shopProducts.all'), products.length],
                    ['visible', t('shopProducts.inCatalog'), mobileSentrixCounts.visible],
                    ['hidden', t('shopProducts.hidden'), mobileSentrixCounts.hidden],
                    ['low', t('shopProducts.lowStock'), mobileSentrixCounts.low],
                  ].map(([value, label, count]) => <button key={value} type="button" className={mobileSentrixQuickFilter === value ? 'is-active' : ''}
                    onClick={() => setMobileSentrixQuickFilter(value)} aria-pressed={mobileSentrixQuickFilter === value}>{label} <span>{count}</span></button>)}
                </div>
                <div className="zzv-shop-catalog__selects">
                  <TextField select size="small" value={mobileSentrixStockFilter} onChange={(event) => setMobileSentrixStockFilter(event.target.value)}
                    inputProps={{ 'aria-label': t('shopProducts.stockFilter') }}>
                    <MenuItem value="all">{t('shopProducts.allStock')}</MenuItem>
                    <MenuItem value="in_stock">{t('shopProducts.inStock')}</MenuItem>
                    <MenuItem value="out_of_stock">{t('shopProducts.outOfStock')}</MenuItem>
                  </TextField>
                  <TextField select size="small" value={mobileSentrixSyncFilter} onChange={(event) => setMobileSentrixSyncFilter(event.target.value)}
                    inputProps={{ 'aria-label': t('shopProducts.syncFilter') }}>
                    <MenuItem value="all">{t('shopProducts.allSync')}</MenuItem>
                    <MenuItem value="synced">{t('shopProducts.synced')}</MenuItem>
                    <MenuItem value="not_synced">{t('shopProducts.notSynced')}</MenuItem>
                  </TextField>
                </div>
              </div>
              {productsTotal > products.length && (mobileSentrixSearch || mobileSentrixQuickFilter !== 'all' || mobileSentrixStockFilter !== 'all' || mobileSentrixSyncFilter !== 'all') && <p className="zzv-shop-catalog__page-note">{t('shopProducts.pageOnly')}</p>}
            </div>
            <Box className="zzv-shop-sentrix__table-wrap" sx={{ overflowX: 'auto' }}>
              <Table
                className="zzv-shop-sentrix__table"
                size="small"
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
                    <TableCell>{t('shopProducts.product')}</TableCell>
                    <TableCell>{t('shopProducts.skuId')}</TableCell>
                    <TableCell>{t('shopProducts.mapping')}</TableCell>
                    <TableCell>{t('shopProducts.supplierPrice')}</TableCell>
                    <TableCell align="right">Zezva</TableCell>
                    <TableCell>{t('shopProducts.stock')}</TableCell>
                    <TableCell>{scope === 'trash' ? t('shopProducts.deleted') : t('shopProducts.catalog')}</TableCell>
                    <TableCell>{t('shopProducts.sync')}</TableCell>
                    <TableCell align="right">{t('shopProducts.actions')}</TableCell>
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
                  {!isLoading && displayedProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10}>
                        {products.length === 0
                          ? scope === 'trash' ? t('shopProducts.emptyTrash') : t('shopProducts.noSentrixProducts')
                          : t('shopProducts.noMatches')}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    displayedProducts.map((product) => (
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
                        <TableCell>
                          <Stack className="zzv-shop-sentrix__product" direction="row" spacing={1.5} alignItems="center">
                            {product.image_url ? (
                              <Box
                                component="img"
                                src={product.image_url}
                                alt={product.title}
                                className="zzv-shop-sentrix__thumbnail"
                              />
                            ) : (
                              <span className="zzv-shop-sentrix__thumbnail zzv-shop-sentrix__thumbnail--empty"><img src="/figma-shop-admin/sentrix-placeholder.svg" alt="" /></span>
                            )}
                            <span className="zzv-shop-catalog__cell-copy"><strong>{product.title}</strong><small>{product.quality_line || product.inventory_source || product.brand || 'MobileSentrix'}</small></span>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <span className="zzv-shop-catalog__cell-copy"><strong>{product.supplier_sku || '—'}</strong><small>{product.sku || product.supplier_product_id || '—'}</small></span>
                        </TableCell>
                        <TableCell>
                          <span className="zzv-shop-sentrix__mapping">{[product.part_category, product.device_model || product.device_category].filter(Boolean).join(' — ') || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="zzv-shop-catalog__cell-copy"><strong>{product.supplier_currency || 'EUR'} {Number(product.supplier_price_usd || 0).toFixed(2)}</strong><small>{t('shopProducts.exchangeRate')} {Number(product.supplier_exchange_rate || 0).toFixed(4)}</small></span>
                        </TableCell>
                        <TableCell align="right" className="zzv-shop-sentrix__price">
                          {formatAdminProductPrice(product, '—')}
                        </TableCell>
                        <TableCell>
                          <span className={`zzv-shop-catalog__stock zzv-shop-catalog__stock--${Number(product.stock_quantity || 0) <= 0 ? 'none' : Number(product.stock_quantity || 0) < 10 ? 'low' : 'available'}`}>{product.stock_quantity ?? 0}</span>
                        </TableCell>
                        <TableCell>{scope === 'trash'
                          ? <span className="zzv-shop-catalog__deleted-date">{product.deleted_at ? new Date(product.deleted_at).toLocaleDateString() : '—'}</span>
                          : renderVisibilitySwitch(product)}</TableCell>
                        <TableCell>
                          <span className="zzv-shop-catalog__cell-copy"><strong>{product.supplier_synced_at ? new Date(product.supplier_synced_at).toLocaleDateString() : '—'}</strong><small>{product.supplier_synced_at ? t('shopProducts.automatic') : t('shopProducts.notSynced')}</small></span>
                        </TableCell>
                        <TableCell align="right">
                          <Stack className="zzv-shop-sentrix__actions" direction="row" spacing={0.5} justifyContent="flex-end">
                            {scope === 'trash' ? <>
                              <IconButton size="small" title={t('shopProducts.restore')} aria-label={t('shopProducts.restore')} onClick={() => restoreMutation.mutate(product.id)}><RestoreFromTrash fontSize="small" /></IconButton>
                              <IconButton size="small" title={t('shopProducts.deletePermanently')} aria-label={t('shopProducts.deletePermanently')} onClick={() => handlePermanentDelete(product.id)}><img src="/figma-shop-admin/sentrix-delete.svg" alt="" /></IconButton>
                            </> : <>
                              <IconButton size="small" title={t('shopProducts.edit')} aria-label={t('shopProducts.edit')} onClick={() => applyProductToForm(product)}><img src="/figma-shop-admin/sentrix-edit.svg" alt="" /></IconButton>
                              <IconButton size="small" title={t('shopProducts.view')} aria-label={t('shopProducts.view')} onClick={() => setPreviewProduct(product)}><img src="/figma-shop-admin/sentrix-view.svg" alt="" /></IconButton>
                              <IconButton size="small" title={t('shopProducts.refreshProduct')} aria-label={t('shopProducts.refreshProduct')} disabled={mobileSentrixSelectedRefreshMutation.isLoading} onClick={() => refreshMobileSentrixProduct(product.id)}><Sync fontSize="small" /></IconButton>
                              <IconButton size="small" title={t('shopProducts.delete')} aria-label={t('shopProducts.delete')} onClick={() => handleSoftDelete(product.id)}><img src="/figma-shop-admin/sentrix-delete.svg" alt="" /></IconButton>
                            </>}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
            </>
          )}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            sx={{ p: 2, borderTop: '1px solid #e6edf7' }}
          >
            <Typography sx={{ fontSize: '13px', color: '#667085', fontWeight: 700 }}>
              {t('shopProducts.showingPage', { page: adminProductPage, pages: productsTotalPages, total: productsTotal })}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={adminProductPage <= 1 || isLoading}
                onClick={() => { setSelectedIds([]); setAdminProductPage((current) => Math.max(1, current - 1)); }}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
              >
                {t('shopProducts.previous')}
              </Button>
              <Button
                variant="outlined"
                disabled={adminProductPage >= productsTotalPages || isLoading}
                onClick={() => { setSelectedIds([]); setAdminProductPage((current) => current + 1); }}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3 }}
              >
                {t('shopProducts.next')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Grid>

      <Dialog open={mobileSentrixMappingOpen} onClose={() => setMobileSentrixMappingOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ className: 'zzv-shop-sentrix__mapping-dialog' }}>
        <DialogTitle>{t('shopProducts.previewMappingsTitle')}</DialogTitle>
        <DialogContent dividers>
          <p>{t('shopProducts.previewSampleNote')}</p>
          <ul>
            {(mobileSentrixResult?.items || []).map((item, index) => <li key={item.supplier_product_id || item.supplier_sku || index}>
              <strong>{item.title}</strong>
              <span>{[item.device_category, item.part_category, item.device_model].filter(Boolean).join(' / ') || '—'}</span>
            </li>)}
          </ul>
        </DialogContent>
        <DialogActions><Button onClick={() => setMobileSentrixMappingOpen(false)}>{t('common.close')}</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(previewProduct)} onClose={() => setPreviewProduct(null)} maxWidth="sm" fullWidth
        PaperProps={{ className: 'zzv-shop-sentrix__preview' }}>
        <DialogTitle>{previewProduct?.title}</DialogTitle>
        <DialogContent dividers>
          {previewProduct && <div className="zzv-shop-sentrix__preview-body">
            {previewProduct.image_url ? <img src={previewProduct.image_url} alt={previewProduct.title} />
              : <span className="zzv-shop-sentrix__thumbnail zzv-shop-sentrix__thumbnail--empty"><img src="/figma-shop-admin/sentrix-placeholder.svg" alt="" /></span>}
            <dl>
              <div><dt>{t('shopProducts.skuId')}</dt><dd>{previewProduct.supplier_sku || previewProduct.supplier_product_id || '—'}</dd></div>
              <div><dt>{t('shopProducts.mapping')}</dt><dd>{[previewProduct.part_category, previewProduct.device_model || previewProduct.device_category].filter(Boolean).join(' — ') || '—'}</dd></div>
              <div><dt>{t('shopProducts.supplierPrice')}</dt><dd>{previewProduct.supplier_currency || 'EUR'} {Number(previewProduct.supplier_price_usd || 0).toFixed(2)}</dd></div>
              <div><dt>{t('shopProducts.price')}</dt><dd>{formatAdminProductPrice(previewProduct, '—')}</dd></div>
              <div><dt>{t('shopProducts.stock')}</dt><dd>{previewProduct.stock_quantity ?? 0}</dd></div>
              <div><dt>{t('shopProducts.sync')}</dt><dd>{previewProduct.supplier_synced_at ? new Date(previewProduct.supplier_synced_at).toLocaleString() : t('shopProducts.notSynced')}</dd></div>
            </dl>
          </div>}
        </DialogContent>
        <DialogActions><Button onClick={() => setPreviewProduct(null)}>{t('common.close')}</Button></DialogActions>
      </Dialog>

      <Dialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        maxWidth="md"
        fullWidth
        className="zzv-shop-product-modal"
        PaperProps={{ sx: { borderRadius: '16px !important' } }}
      >
        <DialogTitle className="zzv-shop-product-modal__header">
          <div className="zzv-shop-product-modal__thumbnail">
            {form.image_url ? <img src={form.image_url} alt="" /> : <img src="/figma-shop-admin/trade-in-modal-placeholder.svg" alt="" />}
          </div>
          <div className="zzv-shop-product-modal__heading">
            <Typography component="h2">{selectedProduct ? t('shopProducts.editProduct', 'Edit product') : t('shopProducts.newProduct', 'New product')}</Typography>
            <Typography>{t('shopProducts.zezvaCatalog', 'Zezva catalogue')}</Typography>
          </div>
          <IconButton size="small" aria-label={t('shopProducts.close', 'Close')} onClick={() => setProductModalOpen(false)}><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent className="zzv-shop-product-modal__content">
          {renderProductEditor()}
        </DialogContent>
        <DialogActions className="zzv-shop-product-modal__footer">
          {selectedProduct && scope === 'active' ? (
            <Button
              className="zzv-shop-product-modal__delete"
              color="warning"
              startIcon={<DeleteOutline />}
              onClick={() => handleSoftDelete(selectedProduct.id)}
            >
              {t('shopProducts.delete', 'Delete')}
            </Button>
          ) : null}
          <Button
            onClick={() => setProductModalOpen(false)}
          >
            {t('shopProducts.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            form="shop-admin-product-form"
            variant="contained"
            startIcon={<Save />}
            disabled={createMutation.isLoading || updateMutation.isLoading || uploadImageMutation.isLoading}
          >
            {selectedProduct ? t('shopProducts.save', 'Save') : t('shopProducts.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmState.open}
        onClose={() =>
          setConfirmState((prev) => ({
            ...prev,
            open: false,
            cancelText: 'Cancel',
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
            cancelText: 'Cancel',
            onConfirm: null,
          }));
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        severity={confirmState.severity}
      />
    </Grid>
  );
};

export default ShopAdminProductsPage;
