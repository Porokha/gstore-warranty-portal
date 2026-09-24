import React, { useState } from 'react';
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
  DownloadRounded,
  EditRounded,
  PriceChangeRounded,
  RefreshRounded,
  SearchRounded,
  UploadFileRounded,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { tradeInService } from '../../services/tradeInService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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

const sectionLabel = (section, index) => section?.name || section?.breadcrumb || `Section ${index + 1}`;

const questionTypeLabel = (type) => {
  if (type === 2 || type === 'multi') return 'Multi';
  return 'Single';
};

const ShopAdminTradeInPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSubcategory, setProductSubcategory] = useState('');
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
    ['trade-in-admin-quotes', quoteStatus],
    () => tradeInService.getAdminQuotes({ status: quoteStatus || undefined }),
    { enabled: tab === 0 },
  );
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

  const currentQuery = tab === 0 ? quotesQuery : tab === 1 ? productsQuery : tab === 2 ? categoriesQuery : policyQuery;
  const pageProducts = productsQuery.data?.items || [];
  const pageProductIds = pageProducts.map((product) => product.id);
  const allPageSelected = pageProductIds.length > 0 && pageProductIds.every((id) => selectedProductIds.includes(id));

  const exportAllPricing = async () => {
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

  const readPricingImport = async (file) => {
    if (!file) return;
    setPricingTransferError('');
    try {
      const data = JSON.parse(await file.text());
      if (data.format !== 'zezva-trade-in-pricing' || data.version !== 1 || !Array.isArray(data.products) || !data.products.length) {
        throw new Error('Choose a Zezva pricing export (version 1).');
      }
      const ids = data.products.map((item) => item.id);
      if (new Set(ids).size !== ids.length || data.products.some((item) => !Number.isInteger(item.id) || !item.slug || !Array.isArray(item.tree_json))) {
        throw new Error('Each product needs a unique ID, slug, and pricing tree.');
      }
      setPricingImport(data.products);
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

  return (
    <Box className="zzv-admin-page zzv-admin-page--shop-tradein">
      <Box className="zzv-admin-page-head" sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography component="h1" sx={{ fontSize: 28, fontWeight: 900, color: '#172033' }}>
            Trade-in
          </Typography>
          <Typography sx={{ color: '#667085', fontSize: 13 }}>
            Quotes, device catalogue, and category availability
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
            <Tab label="Quotes" />
            <Tab label="Products" />
            <Tab label="Categories" />
            <Tab label="Gstore bonus" />
          </Tabs>
        </Box>

        <Box className="zzv-shop-tradein-toolbar" sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #e5eaf2' }}>
          {tab === 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select value={quoteStatus} displayEmpty onChange={(event) => setQuoteStatus(event.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                {['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            {tab === 0 ? `${quotesQuery.data?.total || 0} records` : tab === 1 ? `${productsQuery.data?.total || 0} records` : tab === 2 ? `${categoriesQuery.data?.length || 0} records` : 'Offer policy'}
          </Typography>
        </Box>

        {tab === 1 && (
          <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, borderBottom: '1px solid #e5eaf2' }}>
            <Button size="small" startIcon={<DownloadRounded />} onClick={exportAllPricing} disabled={pricingTransferBusy}>Export all pricing JSON</Button>
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
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 900 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1.4fr 1fr 120px 140px 170px 96px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    {['Quote', 'Device / customer', 'Phone', 'Offer', 'Created', 'Status', 'Actions'].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {(quotesQuery.data?.items || []).map((quote) => (
                    <Box key={quote.id} sx={{ display: 'grid', gridTemplateColumns: '140px 1.4fr 1fr 120px 140px 170px 96px', gap: 2, alignItems: 'center', px: 2, py: 1.4, borderTop: '1px solid #edf0f5' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{quote.quote_number}</Typography>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{quote.product_name}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#667085' }}>{quote.customer_name}</Typography>
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
                        size="small"
                        value={quote.status}
                        onChange={(event) => quoteMutation.mutate({ id: quote.id, payload: { status: event.target.value } })}
                        sx={{ borderRadius: '7px !important', fontSize: 12 }}
                      >
                        {['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
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
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                title: 'Delete trade-in quote',
                                message: `Delete ${quote.quote_number}? This cannot be undone.`,
                                onConfirm: () => deleteQuoteMutation.mutate(quote.id),
                              })
                            }
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 940 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '40px 64px 1.6fr .8fr .8fr .9fr 110px 94px 100px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    <Checkbox size="small" checked={allPageSelected} indeterminate={!allPageSelected && pageProductIds.some((id) => selectedProductIds.includes(id))} onChange={(event) => setSelectedProductIds((current) => event.target.checked ? [...new Set([...current, ...pageProductIds])] : current.filter((id) => !pageProductIds.includes(id)))} inputProps={{ 'aria-label': 'Select this page' }} />
                    {['Image', 'Product', 'Brand', 'Category', 'Subcategory', 'Max offer', 'Visible', 'Actions'].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {(productsQuery.data?.items || []).map((product) => (
                    <Box key={product.id} sx={{ display: 'grid', gridTemplateColumns: '40px 64px 1.6fr .8fr .8fr .9fr 110px 94px 100px', gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #edf0f5' }}>
                      <Checkbox size="small" checked={selectedProductIds.includes(product.id)} onChange={(event) => setSelectedProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} inputProps={{ 'aria-label': `Select ${product.name}` }} />
                      <Box component="img" src={imageUrl(product.image_src)} alt="" sx={{ width: 46, height: 46, objectFit: 'contain' }} />
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{product.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#667085' }}>{product.slug}</Typography>
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
                        <Tooltip title="Edit product">
                          <IconButton size="small" onClick={() => openProductEditor(product)}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit pricing">
                          <IconButton size="small" onClick={() => openPricingEditor(product)}>
                            <PriceChangeRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, p: 2, borderTop: '1px solid #e5eaf2' }}>
                  <Button size="small" disabled={productPage <= 1} onClick={() => setProductPage((page) => page - 1)}>Previous</Button>
                  <Typography sx={{ fontSize: 12 }}>Page {productPage} of {productsQuery.data?.total_pages || 1}</Typography>
                  <Button size="small" disabled={productPage >= (productsQuery.data?.total_pages || 1)} onClick={() => setProductPage((page) => page + 1)}>Next</Button>
                </Box>
              </Box>
            )}

            {tab === 2 && (
              <Box>
                {(categoriesQuery.data || []).map((category) => (
                  <Box key={category.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 130px', gap: 2, alignItems: 'center', px: 2, py: 1.3, borderTop: '1px solid #edf0f5' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{category.label}</Typography>
                      <Typography sx={{ color: '#667085', fontSize: 11 }}>{category.slug}</Typography>
                    </Box>
                    <Chip size="small" label={`Order ${category.sort_order}`} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={Boolean(category.coming_soon)}
                        onChange={(event) => categoryMutation.mutate({ id: category.id, payload: { coming_soon: event.target.checked } })}
                      />
                      <Typography sx={{ fontSize: 12 }}>Coming soon</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={Boolean(category.enabled)}
                        onChange={(event) => categoryMutation.mutate({ id: category.id, payload: { enabled: event.target.checked } })}
                      />
                      <Typography sx={{ fontSize: 12 }}>Enabled</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {tab === 3 && (
              <Box sx={{ display: 'grid', gap: 2, maxWidth: 600, p: 3 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Gstore trade-in credit</Typography>
                <Typography sx={{ color: '#667085', fontSize: 13 }}>Credit = cash offer + percentage bonus + fixed bonus. Both bonuses are zero by default.</Typography>
                {policyQuery.isError && <Alert severity="warning">Bonus settings are unavailable until the trade-in API update is deployed. No bonus is shown to customers.</Alert>}
                <TextField type="number" label="Bonus percentage" value={offerPolicy.bonus_percent} onChange={(event) => setOfferPolicy((current) => ({ ...current, bonus_percent: event.target.value }))} inputProps={{ min: 0, max: 100, step: 0.1 }} disabled={policyQuery.isError} />
                <TextField type="number" label="Fixed bonus (GEL)" value={offerPolicy.bonus_fixed} onChange={(event) => setOfferPolicy((current) => ({ ...current, bonus_fixed: event.target.value }))} inputProps={{ min: 0, max: 100000, step: 1 }} disabled={policyQuery.isError} />
                {policyMutation.isError && <Alert severity="error">Could not save bonus settings.</Alert>}
                {policyMutation.isSuccess && <Alert severity="success">Bonus settings saved.</Alert>}
                <Button variant="contained" disabled={policyQuery.isError || policyMutation.isLoading || Number(offerPolicy.bonus_percent) < 0 || Number(offerPolicy.bonus_percent) > 100 || Number(offerPolicy.bonus_fixed) < 0 || Number(offerPolicy.bonus_fixed) > 100000} onClick={() => policyMutation.mutate({ bonus_percent: Number(offerPolicy.bonus_percent), bonus_fixed: Number(offerPolicy.bonus_fixed) })}>Save bonus</Button>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Dialog
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '18px !important' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Edit trade-in product</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Product name"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Brand"
                value={productForm.brand}
                onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Category"
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Subcategory"
              value={productForm.category2}
              onChange={(event) => setProductForm((prev) => ({ ...prev, category2: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Image path"
              value={productForm.image_src}
              onChange={(event) => setProductForm((prev) => ({ ...prev, image_src: event.target.value }))}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={Boolean(productForm.enabled)}
                onChange={(event) => setProductForm((prev) => ({ ...prev, enabled: event.target.checked }))}
              />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Visible in catalogue</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingProduct(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveProduct} disabled={productMutation.isLoading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pricingProduct)}
        onClose={() => setPricingProduct(null)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: '18px !important' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Edit pricing rules
          <Typography sx={{ color: '#667085', fontSize: 12, mt: 0.5 }}>
            {pricingProduct?.name}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 12, color: '#667085' }}>
                First section values are base offers. Keep section and question positions stable: navigation uses 1-based references such as 2,3.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<DownloadRounded />} onClick={() => {
                  try {
                    const treeJson = pricingRawMode ? JSON.parse(pricingRaw) : pricingTree;
                    downloadJson(`trade-in-pricing-${pricingProduct.id}.json`, pricingPackage([{ id: pricingProduct.id, slug: pricingProduct.slug, name: pricingProduct.name, tree_json: treeJson }]));
                  } catch (error) { setPricingError(error.message); }
                }}>Export JSON</Button>
                <Button size="small" variant="outlined" onClick={togglePricingRawMode}>
                  {pricingRawMode ? 'Visual editor' : 'Raw JSON'}
                </Button>
              </Stack>
            </Box>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px 1fr' }, gap: 2, minHeight: 460 }}>
                <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1 }}>
                  <Typography sx={headerCell}>Sections / steps</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {pricingTree.length === 0 && (
                      <Typography sx={{ color: '#667085', fontSize: 13 }}>No pricing sections.</Typography>
                    )}
                    {pricingTree.map((section, index) => (
                      <Button
                        key={`${sectionLabel(section, index)}-${index}`}
                        variant={activePricingSection === index ? 'contained' : 'outlined'}
                        onClick={() => setActivePricingSection(index)}
                        sx={{ justifyContent: 'flex-start', borderRadius: '9px !important', textTransform: 'none' }}
                      >
                        {index + 1}. {sectionLabel(section, index)} {section.enabled === false ? '(disabled)' : ''}
                      </Button>
                    ))}
                    <Button size="small" variant="text" onClick={addSection}>+ Add section</Button>
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {pricingTree[activePricingSection] && (
                    <Paper elevation={0} sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                      <TextField size="small" label="Section name" value={pricingTree[activePricingSection].name || ''} onChange={(event) => editSection(activePricingSection, 'name', event.target.value)} sx={{ flex: 1, minWidth: 220 }} />
                      <Typography sx={{ fontSize: 12 }}>Enabled</Typography>
                      <Switch checked={pricingTree[activePricingSection].enabled !== false} disabled={activePricingSection === 0} onChange={(event) => editSection(activePricingSection, 'enabled', event.target.checked)} />
                    </Paper>
                  )}
                  {(pricingTree[activePricingSection]?.questions || []).map((question, questionIndex) => (
                    <Paper key={questionIndex} elevation={0} sx={{ border: '1px solid #e5eaf2', borderRadius: '8px !important', p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 900 }}>Question {activePricingSection + 1},{questionIndex + 1}</Typography>
                        <Chip size="small" label={questionTypeLabel(question.type)} />
                        <Typography sx={{ fontSize: 12 }}>Enabled</Typography>
                        <Switch size="small" checked={question.enabled !== false} disabled={activePricingSection === 0 && questionIndex === 0 && !(pricingTree[0].questions || []).slice(1).some((item) => item.enabled !== false)} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'enabled', event.target.checked)} />
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 120px' }, gap: 1, mb: 1 }}>
                        <TextField size="small" label="Question (English)" value={question.text || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'text', event.target.value)} />
                        <TextField size="small" label="Question (Georgian, optional)" value={question.text_ka || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'text_ka', event.target.value)} />
                        <TextField size="small" label="Key / label" value={question.label || ''} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'label', event.target.value)} helperText="Used by flow" />
                      </Box>
                      <TextField select size="small" label="Selection" value={question.type === 'multi' || Number(question.type || 0) > 0 ? 1 : 0} onChange={(event) => editQuestion(activePricingSection, questionIndex, 'type', Number(event.target.value))} sx={{ minWidth: 140, mb: 1 }}>
                        <MenuItem value={0}>Single answer</MenuItem>
                        <MenuItem value={1}>Multiple answers</MenuItem>
                      </TextField>
                      <Stack spacing={1}>
                        {(question.answers || []).map((answer, answerIndex) => {
                          const isBase = activePricingSection === 0 && questionIndex === 0;
                          const value = Number(answer.value || 0);
                          return (
                            <Box
                              key={`${answer.text}-${answerIndex}`}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 105px 125px 95px 75px' },
                                gap: 1,
                                alignItems: 'center',
                                border: '1px solid #eef2f7',
                                borderRadius: '8px',
                                p: 1,
                              }}
                            >
                              <TextField size="small" label="Answer (EN)" value={answer.text || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'text', event.target.value)} />
                              <TextField size="small" label="Answer (KA)" value={answer.text_ka || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'text_ka', event.target.value)} />
                              <TextField
                                size="small"
                                type="number"
                                label={isBase ? 'Base ₾' : 'Delta ₾'}
                                value={value}
                                onChange={(event) =>
                                  updateAnswerValue(activePricingSection, questionIndex, answerIndex, event.target.value)
                                }
                              />
                              <TextField select size="small" label="Action" value={Number(answer.result ?? 1)} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'result', Number(event.target.value))}>
                                <MenuItem value={0}>Finish</MenuItem><MenuItem value={1}>Next</MenuItem><MenuItem value={2}>Go to</MenuItem><MenuItem value={3}>Manual</MenuItem><MenuItem value={4}>Set price</MenuItem>
                              </TextField>
                              <TextField size="small" label="Go to" value={answer.go_to || ''} disabled={Number(answer.result ?? 1) !== 2} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'go_to', event.target.value)} placeholder="2,3" />
                              <Switch size="small" checked={String(answer.value_enabled ?? 1) !== '0'} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'value_enabled', event.target.checked ? 1 : 0)} inputProps={{ 'aria-label': `Enable answer ${answerIndex + 1}` }} />
                              <TextField size="small" label="Help text (EN)" value={answer.tooltip || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'tooltip', event.target.value)} sx={{ gridColumn: { md: '1 / 4' } }} />
                              <TextField size="small" label="Help text (KA)" value={answer.tooltip_ka || ''} onChange={(event) => editAnswer(activePricingSection, questionIndex, answerIndex, 'tooltip_ka', event.target.value)} sx={{ gridColumn: { md: '4 / 7' } }} />
                            </Box>
                          );
                        })}
                        <Button size="small" onClick={() => editTree((tree) => tree[activePricingSection].questions[questionIndex].answers.push({ text: 'New answer', text_ka: '', value: 0, result: 1, go_to: '', value_enabled: 1 }))}>+ Add answer</Button>
                      </Stack>
                    </Paper>
                  ))}
                  {pricingTree[activePricingSection] && <Button variant="outlined" onClick={addQuestion}>+ Add question</Button>}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPricingProduct(null)}>Cancel</Button>
          <Button variant="contained" onClick={savePricing} disabled={pricingMutation.isLoading}>
            Save pricing
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pricingImport)} onClose={() => { if (!pricingTransferBusy) setPricingImport(null); }} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px !important' } }}>
        <DialogTitle>Import pricing rules</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>Update {pricingImport?.length || 0} matching trade-in products from this JSON file?</Typography>
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
        open={Boolean(editingQuote)}
        onClose={() => setEditingQuote(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '18px !important' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Edit trade-in quote</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Status"
              value={quoteForm.status}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, status: event.target.value }))}
              fullWidth
            >
              {['pending', 'contacted', 'accepted', 'completed', 'cancelled'].map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Product"
              value={quoteForm.product_name}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, product_name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Customer name"
              value={quoteForm.customer_name}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_name: event.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Phone"
                value={quoteForm.customer_phone}
                onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_phone: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Email"
                value={quoteForm.customer_email}
                onChange={(event) => setQuoteForm((prev) => ({ ...prev, customer_email: event.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Final offer"
              type="number"
              value={quoteForm.final_price}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, final_price: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Notes"
              value={quoteForm.notes}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, notes: event.target.value }))}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingQuote(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveQuote} disabled={quoteMutation.isLoading}>
            Save
          </Button>
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
