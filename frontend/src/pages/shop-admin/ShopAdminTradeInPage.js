import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  Stack,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DeleteOutlineRounded,
  CloseRounded,
  DownloadRounded,
  EditRounded,
  ExpandMoreRounded,
  PriceChangeRounded,
  RefreshRounded,
  SearchRounded,
  UploadFileRounded,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { tradeInService } from '../../services/tradeInService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GstoreOfferProducts from './GstoreOfferProducts';

const headerCell = {
  color: '#667085',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
};

const imageUrl = (value) => {
  if (!value || String(value).includes('image-not-found')) return '/brand-logotype-original.svg';
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = String(value)
    .replace(/^(\.\.\/)+/, '/')
    .replace(/^\/sell\/media\//, '/media/')
    .replace(/^media\//, '/media/');
  return `/trade-in${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
};

const cloneTree = (tree) => JSON.parse(JSON.stringify(Array.isArray(tree) ? tree : []));

const downloadJson = (filename, data) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const pricingPackage = (products) => ({
  format: 'zezva-trade-in-pricing',
  version: 1,
  exported_at: new Date().toISOString(),
  products,
});

const isManualReviewTree = (tree) => tree?.[0]?.questions?.[0]?.label === 'pricing_status'
  && tree[0].questions[0].answers?.some((answer) => answer.attributes?.some((attribute) => attribute.key === 'pricing_status' && attribute.value === '[manual-review]'));

const sectionLabel = (section, index) => section?.name || section?.breadcrumb || `Section ${index + 1}`;

const ShopAdminTradeInPage = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSubcategory, setProductSubcategory] = useState('');
  const [expandedBrandCategory, setExpandedBrandCategory] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [pricingImport, setPricingImport] = useState(null);
  const [pricingImportProgress, setPricingImportProgress] = useState(0);
  const [pricingTransferError, setPricingTransferError] = useState('');
  const [pricingTransferBusy, setPricingTransferBusy] = useState(false);
  const [bulkSourceId, setBulkSourceId] = useState('');
  const [bulkPricingOpen, setBulkPricingOpen] = useState(false);
  const [bulkPricingProgress, setBulkPricingProgress] = useState(0);
  const [quoteStatus, setQuoteStatus] = useState('');
  const [quotePage, setQuotePage] = useState(1);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [offerPolicy, setOfferPolicy] = useState({ bonus_percent: 0, bonus_fixed: 0 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: '',
    category2: '',
    image_src: '',
    enabled: true,
  });
  const [pricingProduct, setPricingProduct] = useState(null);
  const [pricingTree, setPricingTree] = useState([]);
  const [pricingRaw, setPricingRaw] = useState('');
  const [pricingRawMode, setPricingRawMode] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [activePricingSection, setActivePricingSection] = useState(0);
  const [editingQuote, setEditingQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    status: 'pending',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_name: '',
    final_price: '',
    notes: '',
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const quotesQuery = useQuery(
    ['trade-in-admin-quotes', quoteStatus, quotePage],
    () => tradeInService.getAdminQuotes({ status: quoteStatus || undefined, page: quotePage, limit: 25 }),
    { enabled: tab === 0, keepPreviousData: true },
  );
  const visibleQuotes = (quotesQuery.data?.items || []).filter((quote) => {
    const needle = quoteSearch.trim().toLocaleLowerCase();
    return !needle || [quote.quote_number, quote.product_name, quote.customer_name, quote.customer_phone]
      .some((value) => String(value || '').toLocaleLowerCase().includes(needle));
  });
  const productsQuery = useQuery(
    ['trade-in-admin-products', search, productCategory, productSubcategory, productPage],
    () => tradeInService.getAdminProducts({
      q: search || undefined,
      category: productCategory || undefined,
      subcategory: productSubcategory || undefined,
      page: productPage,
      limit: 100,
    }),
    { enabled: tab === 1, keepPreviousData: true },
  );
  const subcategoriesQuery = useQuery(
    ['trade-in-admin-product-subcategories', productCategory],
    () => tradeInService.getAdminProductSubcategories(productCategory || undefined),
    {
      enabled: tab === 1,
      keepPreviousData: true,
    },
  );
  const categoriesQuery = useQuery(
    ['trade-in-admin-categories'],
    tradeInService.getAdminCategories,
    { enabled: tab === 1 || tab === 2 },
  );
  const brandsQuery = useQuery(['trade-in-admin-brands'], tradeInService.getAdminBrands, {
    enabled: tab === 2,
  });
  const policyQuery = useQuery(['trade-in-admin-offer-policy'], tradeInService.getAdminOfferPolicy, {
    enabled: tab === 3,
    onSuccess: (data) => setOfferPolicy(data),
    retry: false,
  });
  const policyMutation = useMutation(tradeInService.updateAdminOfferPolicy, {
    onSuccess: (data) => {
      setOfferPolicy(data);
      queryClient.invalidateQueries('trade-in-admin-offer-policy');
      queryClient.invalidateQueries('trade-in-offer-policy');
    },
  });

  const quoteMutation = useMutation(
    ({ id, payload }) => tradeInService.updateAdminQuote(id, payload),
    {
      onSuccess: () => {
        setEditingQuote(null);
        queryClient.invalidateQueries('trade-in-admin-quotes');
        queryClient.invalidateQueries('shop-admin-trade-in-badge');
      },
    },
  );
  const deleteQuoteMutation = useMutation(
    (id) => tradeInService.deleteAdminQuote(id),
    {
      onSuccess: () => {
        setEditingQuote(null);
        setConfirmState({ open: false, title: '', message: '', onConfirm: null });
        queryClient.invalidateQueries('trade-in-admin-quotes');
        queryClient.invalidateQueries('shop-admin-trade-in-badge');
      },
    },
  );
  const productMutation = useMutation(
    ({ id, payload }) => tradeInService.updateAdminProduct(id, payload),
    {
      onSuccess: () => {
        setEditingProduct(null);
        queryClient.invalidateQueries('trade-in-admin-products');
        queryClient.invalidateQueries('trade-in-admin-product-subcategories');
      },
    },
  );
  const pricingMutation = useMutation(
    ({ id, treeJson }) => tradeInService.updateAdminProductPricing(id, treeJson),
    {
      onSuccess: () => {
        setPricingProduct(null);
        setPricingTree([]);
        setPricingRaw('');
        setPricingRawMode(false);
        setPricingError('');
        queryClient.invalidateQueries('trade-in-admin-products');
      },
    },
  );
  const categoryMutation = useMutation(
    ({ id, payload }) => tradeInService.updateAdminCategory(id, payload),
    { onSuccess: () => queryClient.invalidateQueries('trade-in-admin-categories') },
  );
  const brandAvailabilityMutation = useMutation(tradeInService.updateAdminBrandAvailability, {
    onSuccess: () => {
      queryClient.invalidateQueries('trade-in-admin-brands');
      queryClient.invalidateQueries('trade-in-brands');
    },
  });

  const currentQuery = tab === 0 ? quotesQuery : tab === 1 ? productsQuery : tab === 2 ? categoriesQuery : policyQuery;
  const pageProducts = productsQuery.data?.items || [];
  const pageProductIds = pageProducts.map((product) => product.id);
  const allPageSelected = pageProductIds.length > 0 && pageProductIds.every((id) => selectedProductIds.includes(id));

  const exportAllPricing = async () => {
    if (selectedProductIds.length) return;
    setPricingTransferBusy(true);
    setPricingTransferError('');
    try {
      const data = await tradeInService.getAdminPricingExport();
      downloadJson('zezva-trade-in-pricing.json', data);
    } catch (error) {
      setPricingTransferError(error.response?.data?.message || 'Pricing export failed.');
    } finally {
      setPricingTransferBusy(false);
    }
  };

  const exportSelectedPricing = async () => {
    if (!selectedProductIds.length) return;
    setPricingTransferBusy(true);
    setPricingTransferError('');
    try {
      const data = await tradeInService.getAdminSelectedPricingExport(selectedProductIds);
      downloadJson(`zezva-trade-in-pricing-selected-${selectedProductIds.length}.json`, data);
    } catch (error) {
      setPricingTransferError(error.response?.data?.message || 'Selected pricing export failed.');
    } finally {
      setPricingTransferBusy(false);
    }
  };

  const readPricingImport = async (file) => {
    if (!file) return;
    setPricingTransferError('');
    try {
      const data = JSON.parse(await file.text());
      if (data.format !== 'zezva-trade-in-pricing') {
        throw new Error('This is not a Zezva trade-in pricing export.');
      }
      if (![1, 2].includes(data.version)) {
        throw new Error(`Unsupported pricing export version: ${String(data.version)}. Use version 1 or 2.`);
      }
      if (!Array.isArray(data.products) || !data.products.length) {
        throw new Error('The pricing export has no products.');
      }
      if (data.version === 2 && (data.currency && data.currency !== 'GEL'
        || data.products.some((item) => item.pricing_currency && item.pricing_currency !== 'GEL'))) {
        throw new Error('Only GEL pricing can be imported.');
      }
      const ids = data.products.map((item) => item.id);
      if (new Set(ids).size !== ids.length || data.products.some((item) => !Number.isInteger(item.id) || !item.slug || !Array.isArray(item.tree_json))) {
        throw new Error('Each product needs a unique ID, slug, and pricing tree.');
      }
      setPricingImport(data.products.map(({ id, slug, tree_json }) => ({ id, slug, tree_json })));
      setPricingImportProgress(0);
    } catch (error) {
      setPricingTransferError(error.message);
    }
  };

  const applyPricingImport = async () => {
    if (!pricingImport) return;
    setPricingTransferBusy(true);
    setPricingTransferError('');
    try {
      let batch = [];
      let size = 0;
      const batches = [];
      pricingImport.forEach((product) => {
        const itemSize = JSON.stringify(product).length;
        if (batch.length && (batch.length >= 10 || size + itemSize > 700000)) {
          batches.push(batch);
          batch = [];
          size = 0;
        }
        batch.push(product);
        size += itemSize;
      });
      if (batch.length) batches.push(batch);
      let completed = 0;
      for (const items of batches) {
        await tradeInService.importAdminPricing(items);
        completed += items.length;
        setPricingImportProgress(completed);
      }
      setPricingImport(null);
      queryClient.invalidateQueries('trade-in-admin-products');
    } catch (error) {
      setPricingTransferError(error.response?.data?.message || error.message || 'Import stopped. Earlier batches were saved; reimport to resume.');
    } finally {
      setPricingTransferBusy(false);
    }
  };

  const applyBulkPricing = async () => {
    setPricingTransferBusy(true);
    setPricingTransferError('');
    setBulkPricingProgress(0);
    try {
      const source = await tradeInService.getAdminProduct(Number(bulkSourceId));
      for (let index = 0; index < selectedProductIds.length; index += 100) {
        const ids = selectedProductIds.slice(index, index + 100);
        await tradeInService.replaceAdminPricing(ids, source.pricing_tree);
        setBulkPricingProgress(index + ids.length);
      }
      setBulkPricingOpen(false);
      setSelectedProductIds([]);
      queryClient.invalidateQueries('trade-in-admin-products');
    } catch (error) {
      setPricingTransferError(error.response?.data?.message || 'Bulk pricing update failed.');
    } finally {
      setPricingTransferBusy(false);
    }
  };
  const openProductEditor = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      category2: product.category2 || '',
      image_src: product.image_src || '',
      enabled: Boolean(product.enabled),
    });
  };

  const saveProduct = () => {
    if (!editingProduct) return;
    productMutation.mutate({
      id: editingProduct.id,
      payload: productForm,
    });
  };

  const openPricingEditor = async (product) => {
    setPricingError('');
    setPricingRawMode(false);
    setActivePricingSection(0);
    const detailed = await tradeInService.getAdminProduct(product.id);
    const tree = cloneTree(detailed.pricing_tree);
    setPricingProduct(detailed);
    setPricingTree(tree);
    setPricingRaw(JSON.stringify(tree, null, 2));
  };

  const updateAnswerValue = (sectionIndex, questionIndex, answerIndex, value) => {
    const next = cloneTree(pricingTree);
    const answer = next?.[sectionIndex]?.questions?.[questionIndex]?.answers?.[answerIndex];
    if (!answer) return;
    const parsed = Number(value);
    answer.value = Number.isFinite(parsed) ? parsed : 0;
    setPricingTree(next);
    setPricingRaw(JSON.stringify(next, null, 2));
  };

  const editTree = (change) => {
    const next = cloneTree(pricingTree);
    change(next);
    setPricingTree(next);
    setPricingError('');
  };

  const editSection = (sectionIndex, field, value) => editTree((tree) => {
    tree[sectionIndex][field] = value;
  });

  const editQuestion = (sectionIndex, questionIndex, field, value) => editTree((tree) => {
    tree[sectionIndex].questions[questionIndex][field] = value;
  });

  const editAnswer = (sectionIndex, questionIndex, answerIndex, field, value) => editTree((tree) => {
    tree[sectionIndex].questions[questionIndex].answers[answerIndex][field] = value;
  });

  const addQuestion = () => editTree((tree) => {
    tree[activePricingSection].questions.push({
      text: 'New question', text_ka: '', label: '', type: 0, enabled: true,
      answers: [{ text: 'New answer', text_ka: '', value: 0, result: 1, go_to: '', value_enabled: 1 }],
    });
  });

  const addSection = () => {
    const nextIndex = pricingTree.length;
    editTree((tree) => tree.push({
      name: `Section ${nextIndex + 1}`, enabled: true,
      questions: [{ text: 'New question', text_ka: '', label: '', type: 0, enabled: true,
        answers: [{ text: 'New answer', text_ka: '', value: 0, result: 0, go_to: '', value_enabled: 1 }] }],
    }));
    setActivePricingSection(nextIndex);
  };

  const togglePricingRawMode = () => {
    setPricingError('');
    if (pricingRawMode) {
      try {
        const parsed = JSON.parse(pricingRaw || '[]');
        if (!Array.isArray(parsed)) {
          throw new Error('Root value must be an array.');
        }
        setPricingTree(parsed);
        setPricingRawMode(false);
      } catch (error) {
        setPricingError(error.message);
      }
      return;
    }
    setPricingRaw(JSON.stringify(pricingTree, null, 2));
    setPricingRawMode(true);
  };

  const savePricing = () => {
    if (!pricingProduct) return;
    try {
      const treeJson = pricingRawMode ? JSON.parse(pricingRaw || '[]') : pricingTree;
      if (!Array.isArray(treeJson)) {
        throw new Error('Root value must be an array.');
      }
      if (!treeJson[0]?.questions?.some((question) => question.enabled !== false)) {
        throw new Error('The first section needs an enabled question.');
      }
      pricingMutation.mutate({ id: pricingProduct.id, treeJson });
    } catch (error) {
      setPricingError(error.message);
    }
  };

  const openQuoteEditor = (quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      status: quote.status || 'pending',
      customer_name: quote.customer_name || '',
      customer_phone: quote.customer_phone || '',
      customer_email: quote.customer_email || '',
      product_name: quote.product_name || '',
      final_price: quote.final_price || '',
      notes: quote.notes || '',
    });
  };

  const saveQuote = () => {
    if (!editingQuote) return;
    quoteMutation.mutate({
      id: editingQuote.id,
      payload: {
        ...quoteForm,
        final_price: Number(quoteForm.final_price || 0),
      },
    });
  };

  const confirmDeleteQuote = (quote) => {
    setConfirmState({
      open: true,
      title: t('shopTradeIn.deleteQuote'),
      message: t('shopTradeIn.deleteQuoteConfirmation', { number: quote.quote_number }),
      onConfirm: () => deleteQuoteMutation.mutate(quote.id),
    });
  };

  return (
    <Box className="zzv-admin-page zzv-admin-page--shop-tradein">
      <Box className="zzv-admin-page-head" sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: 28, fontWeight: 900, color: '#172033' }}>
            Trade-in
          </Typography>
          <Typography sx={{ color: '#667085', fontSize: 13 }}>
            {t('shopTradeIn.description')}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={() => currentQuery.refetch()}
            sx={{ border: '1px solid #dce4f0', borderRadius: '8px' }}
          >
            <RefreshRounded />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper className="zzv-admin-table-card zzv-shop-tradein-panel" elevation={0} sx={{ border: '1px solid #dce4f0', borderRadius: '10px !important', overflow: 'hidden' }}>
        <Box className="zzv-admin-filter-card" sx={{ px: 2, borderBottom: '1px solid #e5eaf2' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label={t('shopTradeIn.quotes')} />
            <Tab label={t('shopTradeIn.products')} />
            <Tab label={t('shopTradeIn.categories')} />
            <Tab label={t('shopTradeIn.gstoreOffers')} />
          </Tabs>
        </Box>

        <Box className="zzv-shop-tradein-toolbar" sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #e5eaf2' }}>
          {tab === 0 && (
            <>
              <TextField
                size="small"
                fullWidth
                value={quoteSearch}
                onChange={(event) => setQuoteSearch(event.target.value)}
                placeholder={t('shopTradeIn.searchQuotes')}
                inputProps={{ 'aria-label': t('shopTradeIn.searchQuotes') }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select value={quoteStatus} displayEmpty onChange={(event) => { setQuoteStatus(event.target.value); setQuotePage(1); }}>
                  <MenuItem value="">{t('shopTradeIn.allStatuses')}</MenuItem>
                  {['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => (
                    <MenuItem key={status} value={status}>{t(`shopTradeIn.statuses.${status}`)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          {tab === 1 && (
            <>
              <TextField
                size="small"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setProductPage(1); }}
                placeholder="Search product, brand, or slug"
                sx={{ width: 380 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <Select
                  value={productCategory}
                  displayEmpty
                  onChange={(event) => {
                    setProductCategory(event.target.value);
                    setProductSubcategory('');
                    setProductPage(1);
                  }}
                >
                  <MenuItem value="">All categories</MenuItem>
                  {(categoriesQuery.data || []).map((category) => (
                    <MenuItem key={category.slug} value={category.slug}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 210 }}>
                <Select
                  value={productSubcategory}
                  displayEmpty
                  onChange={(event) => { setProductSubcategory(event.target.value); setProductPage(1); }}
                >
                  <MenuItem value="">All subcategories</MenuItem>
                  {(subcategoriesQuery.data || []).map((subcategory) => (
                    <MenuItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <Typography sx={{ ml: 'auto', color: '#667085', fontSize: 12 }}>
            {tab === 0 ? t('shopTradeIn.records', { count: quotesQuery.data?.total || 0 }) : tab === 1 ? t('shopTradeIn.records', { count: productsQuery.data?.total || 0 }) : tab === 2 ? t('shopTradeIn.records', { count: categoriesQuery.data?.length || 0 }) : t('shopTradeIn.offerPolicy')}
          </Typography>
        </Box>

        {tab === 0 && (
          <Box className="zzv-shop-tradein__quote-filters">
            {['', 'pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => (
              <button key={status || 'all'} type="button" className={quoteStatus === status ? 'is-active' : ''} onClick={() => { setQuoteStatus(status); setQuotePage(1); }}>
                {status ? t(`shopTradeIn.statuses.${status}`) : t('shopTradeIn.all')}
              </button>
            ))}
            {quoteSearch && <span>{t('shopTradeIn.pageSearchNote')}</span>}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, borderBottom: '1px solid #e5eaf2' }}>
            <Button size="small" startIcon={<DownloadRounded />} onClick={exportAllPricing} disabled={pricingTransferBusy || selectedProductIds.length > 0}>Export all pricing JSON</Button>
            <Button size="small" startIcon={<DownloadRounded />} onClick={exportSelectedPricing} disabled={pricingTransferBusy || selectedProductIds.length === 0}>Export selected ({selectedProductIds.length})</Button>
            <Button size="small" component="label" startIcon={<UploadFileRounded />} disabled={pricingTransferBusy}>
              Import pricing JSON
              <input hidden type="file" accept="application/json,.json" onChange={(event) => { readPricingImport(event.target.files?.[0]); event.target.value = ''; }} />
            </Button>
            <Button size="small" variant="outlined" disabled={!selectedProductIds.length || pricingTransferBusy} onClick={() => { setPricingTransferError(''); setBulkPricingOpen(true); }}>
              Replace selected rules ({selectedProductIds.length})
            </Button>
            <Typography sx={{ color: '#667085', fontSize: 11 }}>Select products across pages. Replacing rules copies one product’s full tree to every selected product.</Typography>
            {pricingTransferError && <Alert severity="error" sx={{ width: '100%' }}>{String(pricingTransferError)}</Alert>}
          </Box>
        )}

        {currentQuery.isError && <Alert severity="error">Trade-in data could not be loaded.</Alert>}
        {currentQuery.isLoading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} height={48} />)}
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <>
              <Box className="zzv-shop-tradein__quotes-scroll">
                <Box sx={{ minWidth: 900 }}>
                  <Box className="zzv-shop-tradein__quote-row zzv-shop-tradein__quote-row--head" sx={{ display: 'grid', gridTemplateColumns: '140px 1.4fr 1fr 120px 140px 170px 96px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    {[t('shopTradeIn.number'), t('shopTradeIn.deviceCustomer'), t('shopTradeIn.phone'), t('shopTradeIn.offer'), t('shopTradeIn.created'), t('shopTradeIn.status'), t('shopTradeIn.actions')].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {visibleQuotes.map((quote) => (
                    <Box key={quote.id} className="zzv-shop-tradein__quote-row" sx={{ display: 'grid', gridTemplateColumns: '140px 1.4fr 1fr 120px 140px 170px 96px', gap: 2, alignItems: 'center', px: 2, py: 1.4, borderTop: '1px solid #edf0f5' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{quote.quote_number}</Typography>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{quote.product_name}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#667085' }}>{quote.customer_name}</Typography>
                        {quote.pricing_path?.find((entry) => entry.label === 'gstore_product')?.answers?.[0]?.text && <Typography sx={{ fontSize: 11, color: '#5d3bd0' }}>Gstore: {quote.pricing_path.find((entry) => entry.label === 'gstore_product').answers[0].text}</Typography>}
                      </Box>
                      <Typography sx={{ fontSize: 13 }}>{quote.customer_phone}</Typography>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>₾{Number(quote.final_price).toFixed(0)}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#667085' }}>
                          {quote.pricing_path?.find((entry) => entry.label === 'fulfillment_method')?.answers?.[0]?.text === 'gstore'
                            ? `Gstore credit: ₾${Math.round(Number(quote.final_price) + Number(quote.pricing_path.find((entry) => entry.label === 'fulfillment_method').answers[0].value || 0))}`
                            : 'Cash'}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: '#667085' }}>{new Date(quote.created_at).toLocaleDateString()}</Typography>
                      <Select
                        className={`zzv-shop-tradein__status zzv-shop-tradein__status--${quote.status}`}
                        size="small"
                        value={quote.status}
                        onChange={(event) => quoteMutation.mutate({ id: quote.id, payload: { status: event.target.value } })}
                        sx={{ borderRadius: '7px !important', fontSize: 12 }}
                      >
                        {['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => <MenuItem key={status} value={status}>{t(`shopTradeIn.statuses.${status}`)}</MenuItem>)}
                      </Select>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit quote">
                          <IconButton size="small" onClick={() => openQuoteEditor(quote)}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete quote">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDeleteQuote(quote)}
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                  {!visibleQuotes.length && <Box className="zzv-shop-tradein__empty">{t('shopTradeIn.noQuotes')}</Box>}
                </Box>
              </Box>
              <Box className="zzv-shop-tradein__pagination">
                <span>{t('shopTradeIn.pageOf', { page: quotePage, total: quotesQuery.data?.total_pages || 1 })}</span>
                <div>
                  <Button size="small" disabled={quotePage <= 1} onClick={() => setQuotePage((page) => page - 1)}>{t('shopTradeIn.previous')}</Button>
                  <Button size="small" disabled={quotePage >= (quotesQuery.data?.total_pages || 1)} onClick={() => setQuotePage((page) => page + 1)}>{t('shopTradeIn.next')}</Button>
                </div>
              </Box>
              </>
            )}

            {tab === 1 && (
              <Box className="zzv-shop-tradein__products-scroll">
                <Box sx={{ minWidth: 940 }}>
                  <Box className="zzv-shop-tradein__product-row zzv-shop-tradein__product-row--head" sx={{ display: 'grid', gridTemplateColumns: '40px minmax(220px,1.6fr) .8fr .8fr .9fr 110px 94px 140px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    <Checkbox size="small" checked={allPageSelected} indeterminate={!allPageSelected && pageProductIds.some((id) => selectedProductIds.includes(id))} onChange={(event) => setSelectedProductIds((current) => event.target.checked ? [...new Set([...current, ...pageProductIds])] : current.filter((id) => !pageProductIds.includes(id)))} inputProps={{ 'aria-label': 'Select this page' }} />
                    {[t('shopTradeIn.product'), t('shopTradeIn.brand'), t('shopTradeIn.category'), t('shopTradeIn.subcategory'), t('shopTradeIn.maxOffer'), t('shopTradeIn.visible'), t('shopTradeIn.actions')].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {(productsQuery.data?.items || []).map((product) => (
                    <Box key={product.id} className="zzv-shop-tradein__product-row" sx={{ display: 'grid', gridTemplateColumns: '40px minmax(220px,1.6fr) .8fr .8fr .9fr 110px 94px 140px', gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #edf0f5' }}>
                      <Checkbox size="small" checked={selectedProductIds.includes(product.id)} onChange={(event) => setSelectedProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} inputProps={{ 'aria-label': `Select ${product.name}` }} />
                      <Box className="zzv-shop-tradein__product-name">
                        <Box component="img" src={imageUrl(product.image_src)} alt="" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{product.name}</Typography>
                          <Typography sx={{ fontSize: 10, color: '#667085' }}>{product.slug}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 13 }}>{product.brand || '—'}</Typography>
                      <Typography sx={{ fontSize: 13 }}>{product.category || '—'}</Typography>
                      <Typography sx={{ fontSize: 13 }}>{product.category2 || '—'}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>₾{Math.round(Number(product.max_price || 0))}</Typography>
                      <Switch
                        checked={Boolean(product.enabled)}
                        onChange={(event) => productMutation.mutate({ id: product.id, payload: { enabled: event.target.checked } })}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" className="zzv-shop-tradein__pricing-action" startIcon={<PriceChangeRounded fontSize="small" />} onClick={() => openPricingEditor(product)}>{t('shopTradeIn.pricing')}</Button>
                        <Tooltip title="Edit product">
                          <IconButton size="small" onClick={() => openProductEditor(product)}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Box>
                <Box className="zzv-shop-tradein__pagination">
                  <span>{t('shopTradeIn.pageOf', { page: productPage, total: productsQuery.data?.total_pages || 1 })}</span>
                  <div>
                    <Button size="small" disabled={productPage <= 1} onClick={() => setProductPage((page) => page - 1)}>{t('shopTradeIn.previous')}</Button>
                    <Button size="small" disabled={productPage >= (productsQuery.data?.total_pages || 1)} onClick={() => setProductPage((page) => page + 1)}>{t('shopTradeIn.next')}</Button>
                  </div>
                </Box>
              </Box>
            )}

            {tab === 2 && (
              <Box className="zzv-shop-tradein__categories">
                {brandAvailabilityMutation.isError && <Alert severity="error">Could not update brand availability.</Alert>}
                {categoryMutation.isError && <Alert severity="error">{t('shopTradeIn.categoryUpdateFailed')}</Alert>}
                <Box className="zzv-shop-tradein__category-head"><span>{t('shopTradeIn.category')}</span><span>{t('shopTradeIn.availability')}</span></Box>
                {(categoriesQuery.data || []).map((category) => (
                  <Box key={category.id} className="zzv-shop-tradein__category">
                    <Box className="zzv-shop-tradein__category-row">
                      <Box className="zzv-shop-tradein__category-name">
                        <IconButton size="small" aria-label={t('shopTradeIn.brandSubcategories')} onClick={() => setExpandedBrandCategory((current) => current === category.slug ? '' : category.slug)}>
                          <ExpandMoreRounded sx={{ transform: expandedBrandCategory === category.slug ? 'rotate(180deg)' : 'rotate(-90deg)' }} />
                        </IconButton>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{category.label}</Typography>
                          <Typography sx={{ color: '#667085', fontSize: 11 }}>{category.slug}</Typography>
                        </Box>
                      </Box>
                      <Box className="zzv-shop-tradein__availability" role="group" aria-label={`${category.label} ${t('shopTradeIn.availability')}`}>
                        {['hidden', 'soon', 'active'].map((availability) => {
                          const active = availability === 'hidden' ? !category.enabled : availability === 'soon' ? category.enabled && category.coming_soon : category.enabled && !category.coming_soon;
                          return <button key={availability} type="button" className={active ? `is-active is-${availability}` : ''} disabled={categoryMutation.isLoading} onClick={() => categoryMutation.mutate({ id: category.id, payload: { enabled: availability !== 'hidden', coming_soon: availability === 'soon' } })}>{t(`shopTradeIn.availabilityStates.${availability}`)}</button>;
                        })}
                      </Box>
                    </Box>
                    <Collapse in={expandedBrandCategory === category.slug} unmountOnExit>
                      <Box sx={{ px: 2, pb: 2, bgcolor: '#fafbff' }}>
                        {brandsQuery.isLoading && <Skeleton height={48} />}
                        {brandsQuery.isError && <Alert severity="error">Brand subcategories could not be loaded.</Alert>}
                        {!brandsQuery.isLoading && !(brandsQuery.data || []).find((group) => group.category === category.slug)?.brands?.length && <Typography sx={{ py: 1, fontSize: 12, color: '#667085' }}>No active products in this category.</Typography>}
                        {((brandsQuery.data || []).find((group) => group.category === category.slug)?.brands || []).map((item) => (
                          <Box key={item.brand} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: '1px solid #edf0f5' }}>
                            <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{item.brand}</Typography>
                            <Typography sx={{ color: '#667085', fontSize: 12 }}>{item.product_count} products</Typography>
                            <Typography sx={{ fontSize: 12 }}>Coming soon</Typography>
                            <Switch size="small" checked={Boolean(item.coming_soon)} disabled={brandAvailabilityMutation.isLoading} onChange={(event) => brandAvailabilityMutation.mutate({ category: category.slug, brand: item.brand, coming_soon: event.target.checked })} inputProps={{ 'aria-label': `${item.brand} coming soon` }} />
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </Box>
            )}
            {tab === 3 && (
              <><Box sx={{ display: 'grid', gap: 2, maxWidth: 600, p: 3 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Gstore trade-in credit</Typography>
                <Typography sx={{ color: '#667085', fontSize: 13 }}>Credit = cash offer + percentage bonus + fixed bonus. Both bonuses are zero by default.</Typography>
                {policyQuery.isError && <Alert severity="warning">Bonus settings are unavailable until the trade-in API update is deployed. No bonus is shown to customers.</Alert>}
                <TextField type="number" label="Bonus percentage" value={offerPolicy.bonus_percent} onChange={(event) => setOfferPolicy((current) => ({ ...current, bonus_percent: event.target.value }))} inputProps={{ min: 0, max: 100, step: 0.1 }} disabled={policyQuery.isError} />
                <TextField type="number" label="Fixed bonus (GEL)" value={offerPolicy.bonus_fixed} onChange={(event) => setOfferPolicy((current) => ({ ...current, bonus_fixed: event.target.value }))} inputProps={{ min: 0, max: 100000, step: 1 }} disabled={policyQuery.isError} />
                {policyMutation.isError && <Alert severity="error">Could not save bonus settings.</Alert>}
                {policyMutation.isSuccess && <Alert severity="success">Bonus settings saved.</Alert>}
                <Button variant="contained" disabled={policyQuery.isError || policyMutation.isLoading || Number(offerPolicy.bonus_percent) < 0 || Number(offerPolicy.bonus_percent) > 100 || Number(offerPolicy.bonus_fixed) < 0 || Number(offerPolicy.bonus_fixed) > 100000} onClick={() => policyMutation.mutate({ bonus_percent: Number(offerPolicy.bonus_percent), bonus_fixed: Number(offerPolicy.bonus_fixed) })}>Save bonus</Button>
              </Box><GstoreOfferProducts /></>
            )}
          </>
        )}
      </Paper>

      <Dialog
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        fullWidth
        maxWidth="md"
        className="zzv-tradein-edit"
        PaperProps={{ sx: { borderRadius: '16px !important' } }}
      >
        <DialogTitle className="zzv-tradein-edit__header">
          <Box className="zzv-tradein-edit__thumbnail">
            {productForm.image_src ? (
              <img src={imageUrl(productForm.image_src)} alt="" onError={(event) => { event.currentTarget.src = '/figma-shop-admin/trade-in-modal-placeholder.svg'; }} />
            ) : <img src="/figma-shop-admin/trade-in-modal-placeholder.svg" alt="" />}
          </Box>
          <Box className="zzv-tradein-edit__heading">
            <Typography component="h2">{t('shopTradeIn.editProduct', 'Edit product')}</Typography>
            <Typography>{[editingProduct?.name, editingProduct?.brand, editingProduct?.category].filter(Boolean).join(' · ')}</Typography>
          </Box>
          <IconButton size="small" aria-label={t('shopTradeIn.close', 'Close')} onClick={() => setEditingProduct(null)}><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent className="zzv-tradein-edit__content">
          {productMutation.isError && <Alert severity="error">{String(productMutation.error?.response?.data?.message || t('shopTradeIn.productSaveFailed', 'Product could not be saved.'))}</Alert>}
          <section className="zzv-tradein-edit__group">
            <h3>{t('shopTradeIn.basicDetails', 'Basic details')}</h3>
            <div className="zzv-tradein-edit__fields">
              <label htmlFor="tradein-edit-name">{t('shopTradeIn.productName', 'Product name')}</label>
              <TextField id="tradein-edit-name" size="small" value={productForm.name} onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))} fullWidth />
              <label htmlFor="tradein-edit-slug">{t('shopTradeIn.productAddress', 'Address')}</label>
              <TextField id="tradein-edit-slug" size="small" value={editingProduct?.slug || ''} fullWidth inputProps={{ readOnly: true }} />
              <label htmlFor="tradein-edit-brand">{t('shopTradeIn.brand', 'Brand')}</label>
              <TextField id="tradein-edit-brand" size="small" value={productForm.brand} onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))} fullWidth />
              <label htmlFor="tradein-edit-image">{t('shopTradeIn.imageAddress', 'Image address')}</label>
              <TextField id="tradein-edit-image" size="small" value={productForm.image_src} onChange={(event) => setProductForm((prev) => ({ ...prev, image_src: event.target.value }))} fullWidth />
            </div>
          </section>
          <section className="zzv-tradein-edit__group">
            <h3>{t('shopTradeIn.classification', 'Classification')}</h3>
            <div className="zzv-tradein-edit__fields zzv-tradein-edit__fields--grid">
              <div><label htmlFor="tradein-edit-category">{t('shopTradeIn.category', 'Category')}</label><TextField id="tradein-edit-category" size="small" value={productForm.category} onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))} fullWidth /></div>
              <div><label htmlFor="tradein-edit-subcategory">{t('shopTradeIn.subcategory', 'Subcategory')}</label><TextField id="tradein-edit-subcategory" size="small" value={productForm.category2} onChange={(event) => setProductForm((prev) => ({ ...prev, category2: event.target.value }))} fullWidth /></div>
            </div>
          </section>
          <section className="zzv-tradein-edit__group">
            <h3>{t('shopTradeIn.priceAndVisibility', 'Price and visibility')}</h3>
            <div className="zzv-tradein-edit__fields zzv-tradein-edit__fields--grid">
              <div><label htmlFor="tradein-edit-max-price">{t('shopTradeIn.maxOfferGel', 'Maximum offer ₾')}</label><TextField id="tradein-edit-max-price" size="small" value={editingProduct?.max_price ?? 0} fullWidth inputProps={{ readOnly: true }} helperText={t('shopTradeIn.editInPricingRules', 'Edit this value in pricing rules')} /></div>
              <div className="zzv-tradein-edit__visibility"><span>{t('shopTradeIn.visible', 'Visible')}</span><Switch className="zzv-tradein-edit__switch" checked={Boolean(productForm.enabled)} onChange={(event) => setProductForm((prev) => ({ ...prev, enabled: event.target.checked }))} inputProps={{ 'aria-label': t('shopTradeIn.visible', 'Visible') }} /></div>
            </div>
          </section>
        </DialogContent>
        <DialogActions className="zzv-tradein-edit__footer">
          <Button onClick={() => setEditingProduct(null)}>{t('shopTradeIn.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={saveProduct} disabled={productMutation.isLoading}>
            {t('shopTradeIn.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pricingProduct)}
        onClose={() => setPricingProduct(null)}
        fullWidth
        maxWidth="lg"
        className="zzv-pricing-dialog"
        PaperProps={{ sx: { borderRadius: '20px !important' } }}
      >
        <DialogTitle className="zzv-pricing-dialog__header">
          <Box>
            <Typography component="h2">{t('shopTradeIn.pricingRules', 'Pricing rules')}</Typography>
            <Typography className="zzv-pricing-dialog__subtitle">{pricingProduct?.name}</Typography>
          </Box>
          <IconButton aria-label={t('common.close', 'Close')} onClick={() => setPricingProduct(null)} size="small"><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent className="zzv-pricing-dialog__content">
          <Box>
            {pricingError && <Alert severity="error">{pricingError}</Alert>}
            {pricingMutation.isError && <Alert severity="error">{String(pricingMutation.error?.response?.data?.message || 'Pricing rules could not be saved.')}</Alert>}
            {pricingRawMode ? (
              <TextField
                value={pricingRaw}
                onChange={(event) => setPricingRaw(event.target.value)}
                multiline
                minRows={18}
                fullWidth
                inputProps={{ spellCheck: false }}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }}
              />
            ) : (
              <Box className="zzv-pricing-dialog__layout">
                <Box className="zzv-pricing-dialog__rail">
                  <Typography className="zzv-pricing-dialog__rail-label">{t('shopTradeIn.basePrice', 'Base price')}</Typography>
                  <Stack spacing={0.5}>
                    {pricingTree.length === 0 && (
                      <Typography sx={{ color: '#667085', fontSize: 13 }}>No pricing sections.</Typography>
                    )}
                    {pricingTree.map((section, index) => (
                      <React.Fragment key={`${sectionLabel(section, index)}-${index}`}>
                        {index === 1 && <Typography className="zzv-pricing-dialog__rail-label">{t('shopTradeIn.adjustments', 'Adjustments')}</Typography>}
                        <button
                          type="button"
                          className={`zzv-pricing-dialog__section ${activePricingSection === index ? 'is-active' : ''}`}
                          onClick={() => setActivePricingSection(index)}
                        >
                          <span className="zzv-pricing-dialog__section-number">{index + 1}</span>
                          <span className="zzv-pricing-dialog__section-name">{sectionLabel(section, index)} {section.enabled === false ? `(${t('shopTradeIn.disabled', 'disabled')})` : ''}</span>
                          <span className="zzv-pricing-dialog__section-count">{(section.questions || []).reduce((count, question) => count + (question.answers || []).length, 0)}</span>
                        </button>
                      </React.Fragment>
                    ))}
                    <Button size="small" variant="text" onClick={addSection}>{t('shopTradeIn.addSection', '+ Add section')}</Button>
                  </Stack>
                </Box>
                <Box className="zzv-pricing-dialog__rules">
                  <Box className="zzv-pricing-dialog__notice">
                    {activePricingSection === 0
                      ? t('shopTradeIn.basePriceHint', 'Amounts in this section are base offers. Later sections adjust them.')
                      : t('shopTradeIn.adjustmentHint', 'Amounts in this section adjust the base offer. Navigation uses section and question numbers.')}
                  </Box>
                  {pricingTree[activePricingSection] && (
                    <Paper elevation={0} className="zzv-pricing-dialog__section-settings">
                      <TextField size="small" label={t('shopTradeIn.sectionName', 'Section name')} value={pricingTree[activePricingSection].name || ''} onChange={(event) => editSection(activePricingSection, 'name', event.target.value)} sx={{ flex: 1, minWidth: 220 }} />
                      <Typography sx={{ fontSize: 12 }}>{t('shopTradeIn.enabled', 'Enabled')}</Typography>
                      <Switch checked={pricingTree[activePricingSection].enabled !== false} disabled={activePricingSection === 0} onChange={(event) => editSection(activePricingSection, 'enabled', event.target.checked)} />
                    </Paper>
                  )}
                  {(pricingTree[activePricingSection]?.questions || []).map((question, questionIndex) => (
                    <Paper key={questionIndex} elevation={0} className="zzv-pricing-dialog__question">
                      <Box className="zzv-pricing-dialog__question-header">
                        <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{question.text_ka || question.text || `Question ${activePricingSection + 1},${questionIndex + 1}`}</Typography>
                        <Chip size="small" label={question.type === 2 || question.type === 'multi' ? t('shopTradeIn.multipleAnswers', 'Multiple answers') : t('shopTradeIn.singleAnswer', 'Single answer')} />
                      </Box>
                      <Box className="zzv-pricing-dialog__answer-head">
                        <span />
                        <span>{activePricingSection === 0 && questionIndex === 0 ? t('shopTradeIn.baseGel', 'Base ₾') : t('shopTradeIn.deltaGel', 'Change ₾')}</span>
                        <span>{t('shopTradeIn.nextStep', 'Next')}</span>
                      </Box>
                      <Box>
                        {(question.answers || []).map((answer, answerIndex) => {
                          const value = Number(answer.value || 0);
                          return (
                            <Box key={`${answer.text}-${answerIndex}`} className="zzv-pricing-dialog__answer">
                              <Box className="zzv-pricing-dialog__answer-label">
                                <Typography>{answer.text_ka || answer.text || `Answer ${answerIndex + 1}`}</Typography>
                                {answer.tooltip_ka || answer.tooltip ? <Typography>{answer.tooltip_ka || answer.tooltip}</Typography> : null}
                              </Box>
                              <TextField
                                size="small"
                                type="number"
                                aria-label={`${answer.text_ka || answer.text} ${activePricingSection === 0 && questionIndex === 0 ? 'base price' : 'price adjustment'}`}
                                value={value}
                                onChange={(event) =>
                                  updateAnswerValue(activePricingSection, questionIndex, answerIndex, event.target.value)
                                }
                              />
                              <Typography className="zzv-pricing-dialog__answer-route">{Number(answer.result ?? 1) === 2 ? `→ ${answer.go_to || '—'}` : Number(answer.result ?? 1) === 0 ? '✓' : Number(answer.result ?? 1) === 3 ? '…' : '→'}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                      <details className="zzv-pricing-dialog__advanced">
                        <summary>{t('shopTradeIn.editQuestionDetails', 'Edit question, answers and navigation')}</summary>
                        <Box className="zzv-pricing-dialog__advanced-fields">
                          <TextField size="small" label={t('shopTradeIn.questionEnglish', 'Question (English)')} value={question.text || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'text', event.target.value)} />
                          <TextField size="small" label={t('shopTradeIn.questionGeorgian', 'Question (Georgian)')} value={question.text_ka || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'text_ka', event.target.value)} />
                          <TextField size="small" label={t('shopTradeIn.flowKey', 'Key / label')} value={question.label || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'label', event.target.value)} />
                          <TextField select size="small" label={t('shopTradeIn.selection', 'Selection')} value={question.type === 'multi' || Number(question.type || 0) > 0 ? 1 : 0} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'type', Number(event.target.value))}><MenuItem value={0}>{t('shopTradeIn.singleAnswer', 'Single answer')}</MenuItem><MenuItem value={1}>{t('shopTradeIn.multipleAnswers', 'Multiple answers')}</MenuItem></TextField>
                          <Box className="zzv-pricing-dialog__enabled"><Typography>{t('shopTradeIn.enabled', 'Enabled')}</Typography><Switch size="small" checked={question.enabled !== false} disabled={activePricingSection === 0 && questionIndex === 0 && !(pricingTree[0].questions || []).slice(1).some((item) => item.enabled !== false)} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'enabled', event.target.checked)} /></Box>
                        </Box>
                        {(question.answers || []).map((answer, answerIndex) => (
                          <Box className="zzv-pricing-dialog__advanced-answer" key={answerIndex}>
                            <Typography>{answerIndex + 1}. {answer.text_ka || answer.text}</Typography>
                            <Box className="zzv-pricing-dialog__advanced-fields">
                              <TextField size="small" label={t('shopTradeIn.answerEnglish', 'Answer (EN)')} value={answer.text || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'text', event.target.value)} />
                              <TextField size="small" label={t('shopTradeIn.answerGeorgian', 'Answer (KA)')} value={answer.text_ka || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'text_ka', event.target.value)} />
                              <TextField select size="small" label={t('shopTradeIn.action', 'Action')} value={Number(answer.result ?? 1)} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'result', Number(event.target.value))}><MenuItem value={0}>{t('shopTradeIn.finish', 'Finish')}</MenuItem><MenuItem value={1}>{t('shopTradeIn.next', 'Next')}</MenuItem><MenuItem value={2}>{t('shopTradeIn.goTo', 'Go to')}</MenuItem><MenuItem value={3}>{t('shopTradeIn.manual', 'Manual')}</MenuItem><MenuItem value={4}>{t('shopTradeIn.setPrice', 'Set price')}</MenuItem></TextField>
                              <TextField size="small" label={t('shopTradeIn.goTo', 'Go to')} value={answer.go_to || ''} disabled={Number(answer.result ?? 1) !== 2} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'go_to', event.target.value)} placeholder="2,3" />
                              <TextField size="small" label={t('shopTradeIn.helpEnglish', 'Help (EN)')} value={answer.tooltip || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'tooltip', event.target.value)} />
                              <TextField size="small" label={t('shopTradeIn.helpGeorgian', 'Help (KA)')} value={answer.tooltip_ka || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'tooltip_ka', event.target.value)} />
                              <Box className="zzv-pricing-dialog__enabled"><Typography>{t('shopTradeIn.priceEnabled', 'Price enabled')}</Typography><Switch size="small" checked={String(answer.value_enabled ?? 1) !== '0'} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'value_enabled', event.target.checked ? 1 : 0)} /></Box>
                            </Box>
                          </Box>
                        ))}
                        <Button size="small" onClick={() => editTree((tree) => tree[activePricingSection].questions[questionIndex].answers.push({ text: 'New answer', text_ka: '', value: 0, result: 1, go_to: '', value_enabled: 1 }))}>{t('shopTradeIn.addAnswer', '+ Add answer')}</Button>
                      </details>
                    </Paper>
                  ))}
                  {pricingTree[activePricingSection] && <Button variant="outlined" onClick={addQuestion}>{t('shopTradeIn.addQuestion', '+ Add question')}</Button>}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="zzv-pricing-dialog__footer">
          <Box className="zzv-pricing-dialog__footer-left">
            <Button size="small" onClick={togglePricingRawMode}>{pricingRawMode ? t('shopTradeIn.visualEditor', 'Visual editor') : t('shopTradeIn.rawJson', 'Raw JSON')}</Button>
            <Button size="small" startIcon={<DownloadRounded />} onClick={() => {
              try {
                const treeJson = pricingRawMode ? JSON.parse(pricingRaw) : pricingTree;
                downloadJson(`trade-in-pricing-${pricingProduct.id}.json`, pricingPackage([{ id: pricingProduct.id, slug: pricingProduct.slug, name: pricingProduct.name, tree_json: treeJson }]));
              } catch (error) { setPricingError(error.message); }
            }}>{t('shopTradeIn.exportJson', 'Export JSON')}</Button>
          </Box>
          <Button onClick={() => setPricingProduct(null)}>{t('shopTradeIn.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={savePricing} disabled={pricingMutation.isLoading}>
            {t('shopTradeIn.savePricing', 'Save pricing')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pricingImport)} onClose={() => { if (!pricingTransferBusy) setPricingImport(null); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px !important' } }}>
        <DialogTitle>Import pricing rules</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>Update {pricingImport?.length || 0} matching trade-in products from this JSON file?</Typography>
          {pricingImport?.some((item) => isManualReviewTree(item.tree_json)) && <Alert severity="info" sx={{ mb: 1 }}>{pricingImport.filter((item) => isManualReviewTree(item.tree_json)).length} models have no agreed price and will request manual assessment instead of showing ₾0.</Alert>}
          <Typography sx={{ fontSize: 12, color: '#667085' }}>Products are matched by both ID and slug. Import only changes pricing trees, not product details. Each batch is saved atomically; if a later batch fails, reimporting the file is safe.</Typography>
          {pricingTransferBusy && <Typography sx={{ mt: 2 }}>Updated {pricingImportProgress} of {pricingImport?.length || 0} products...</Typography>}
          {pricingTransferError && <Alert severity="error" sx={{ mt: 2 }}>{String(pricingTransferError)}</Alert>}
        </DialogContent>
        <DialogActions><Button disabled={pricingTransferBusy} onClick={() => setPricingImport(null)}>Cancel</Button><Button variant="contained" disabled={pricingTransferBusy} onClick={applyPricingImport}>Import</Button></DialogActions>
      </Dialog>

      <Dialog open={bulkPricingOpen} onClose={() => { if (!pricingTransferBusy) setBulkPricingOpen(false); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px !important' } }}>
        <DialogTitle>Replace selected pricing rules</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>This replaces the entire pricing tree for {selectedProductIds.length} selected products, including prices, questions, and navigation. Export a backup first.</Alert>
          <TextField select fullWidth label="Copy rules from" value={bulkSourceId} onChange={(event) => setBulkSourceId(event.target.value)} helperText="Choose a product on the current page as the source. Its rule structure will be copied exactly.">
            {pageProducts.map((product) => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
          </TextField>
          {pricingTransferBusy && <Typography sx={{ mt: 2 }}>Updated {bulkPricingProgress} of {selectedProductIds.length} products...</Typography>}
          {pricingTransferError && <Alert severity="error" sx={{ mt: 2 }}>{String(pricingTransferError)}</Alert>}
        </DialogContent>
        <DialogActions><Button disabled={pricingTransferBusy} onClick={() => setBulkPricingOpen(false)}>Cancel</Button><Button color="error" variant="contained" disabled={!bulkSourceId || pricingTransferBusy} onClick={applyBulkPricing}>Replace rules</Button></DialogActions>
      </Dialog>

      <Dialog
        className="zzv-tradein-quote-edit"
        open={Boolean(editingQuote)}
        onClose={() => setEditingQuote(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="zzv-tradein-quote-edit__header">
          <Box className="zzv-tradein-quote-edit__heading">
            <Typography component="h2">{t('shopTradeIn.editQuote')}</Typography>
            <Typography>{editingQuote?.quote_number}</Typography>
          </Box>
          <IconButton aria-label={t('shopTradeIn.close')} size="small" onClick={() => setEditingQuote(null)}><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent className="zzv-tradein-quote-edit__content">
          <section className="zzv-tradein-quote-edit__group">
            <h3>{t('shopTradeIn.customer')}</h3>
            <div className="zzv-tradein-quote-edit__fields">
              <div><label htmlFor="tradein-quote-customer">{t('shopTradeIn.customerName')}</label><TextField id="tradein-quote-customer" size="small" fullWidth value={quoteForm.customer_name} onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_name: event.target.value }))} /></div>
              <div><label htmlFor="tradein-quote-phone">{t('shopTradeIn.phone')}</label><TextField id="tradein-quote-phone" size="small" fullWidth value={quoteForm.customer_phone} onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_phone: event.target.value }))} /></div>
            </div>
          </section>
          <section className="zzv-tradein-quote-edit__group">
            <h3>{t('shopTradeIn.deviceAndOffer')}</h3>
            <div className="zzv-tradein-quote-edit__fields">
              <div><label htmlFor="tradein-quote-product">{t('shopTradeIn.product')}</label><TextField id="tradein-quote-product" size="small" fullWidth value={quoteForm.product_name} onChange={(event) => setQuoteForm((prev) => ({ ...prev, product_name: event.target.value }))} /></div>
              <div><label htmlFor="tradein-quote-offer">{t('shopTradeIn.finalOfferGel')}</label><TextField id="tradein-quote-offer" size="small" fullWidth type="number" inputProps={{ min: 0, step: 0.01 }} value={quoteForm.final_price} onChange={(event) => setQuoteForm((prev) => ({ ...prev, final_price: event.target.value }))} /></div>
              <div><label htmlFor="tradein-quote-status">{t('shopTradeIn.status')}</label><TextField id="tradein-quote-status" select size="small" fullWidth value={quoteForm.status} onChange={(event) => setQuoteForm((prev) => ({ ...prev, status: event.target.value }))}>{['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => <MenuItem key={status} value={status}>{t(`shopTradeIn.statuses.${status}`)}</MenuItem>)}</TextField></div>
              <div><label htmlFor="tradein-quote-date">{t('shopTradeIn.created')}</label><TextField id="tradein-quote-date" size="small" fullWidth value={editingQuote?.created_at ? new Date(editingQuote.created_at).toLocaleDateString(i18n.language === 'ka' ? 'ka-GE' : 'en-GB') : ''} InputProps={{ readOnly: true }} /></div>
            </div>
          </section>
          <details className="zzv-tradein-quote-edit__more">
            <summary>{t('shopTradeIn.additionalDetails')}</summary>
            <div className="zzv-tradein-quote-edit__extra-fields">
              <div><label htmlFor="tradein-quote-email">{t('shopTradeIn.customerEmail')}</label><TextField id="tradein-quote-email" size="small" type="email" fullWidth value={quoteForm.customer_email} onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_email: event.target.value }))} /></div>
              <div><label htmlFor="tradein-quote-notes">{t('shopTradeIn.notes')}</label><TextField id="tradein-quote-notes" size="small" multiline minRows={3} fullWidth value={quoteForm.notes} onChange={(event) => setQuoteForm((prev) => ({ ...prev, notes: event.target.value }))} /></div>
            </div>
          </details>
          {quoteMutation.isError && <Alert severity="error">{t('shopTradeIn.quoteSaveFailed')}</Alert>}
        </DialogContent>
        <DialogActions className="zzv-tradein-quote-edit__footer">
          <Button color="error" startIcon={<DeleteOutlineRounded />} onClick={() => confirmDeleteQuote(editingQuote)} disabled={quoteMutation.isLoading}>{t('shopTradeIn.delete')}</Button>
          <span className="zzv-tradein-quote-edit__footer-spacer" />
          <Button onClick={() => setEditingQuote(null)}>{t('shopTradeIn.cancel')}</Button>
          <Button variant="contained" onClick={saveQuote} disabled={quoteMutation.isLoading || !Number.isFinite(Number(quoteForm.final_price)) || Number(quoteForm.final_price) < 0}>{t('shopTradeIn.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Delete"
        severity="error"
        loading={deleteQuoteMutation.isLoading}
        onClose={() => setConfirmState({ open: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmState.onConfirm}
      />
    </Box>
  );
};

export default ShopAdminTradeInPage;
