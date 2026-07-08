import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import { DeleteOutlineRounded, EditRounded, RefreshRounded, SearchRounded } from '@mui/icons-material';
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

const ShopAdminTradeInPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('');
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
    ['trade-in-admin-products', search, productCategory],
    () => tradeInService.getAdminProducts({
      q: search || undefined,
      category: productCategory || undefined,
      limit: 100,
    }),
    { enabled: tab === 1, keepPreviousData: true },
  );
  const categoriesQuery = useQuery(
    ['trade-in-admin-categories'],
    tradeInService.getAdminCategories,
    { enabled: tab === 1 || tab === 2 },
  );

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
    { onSuccess: () => queryClient.invalidateQueries('trade-in-admin-products') },
  );
  const categoryMutation = useMutation(
    ({ id, payload }) => tradeInService.updateAdminCategory(id, payload),
    { onSuccess: () => queryClient.invalidateQueries('trade-in-admin-categories') },
  );

  const currentQuery = tab === 0 ? quotesQuery : tab === 1 ? productsQuery : categoriesQuery;
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2 }}>
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

      <Paper elevation={0} sx={{ border: '1px solid #dce4f0', borderRadius: '10px !important', overflow: 'hidden' }}>
        <Box sx={{ px: 2, borderBottom: '1px solid #e5eaf2' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Quotes" />
            <Tab label="Products" />
            <Tab label="Categories" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #e5eaf2' }}>
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
                onChange={(event) => setSearch(event.target.value)}
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
                  onChange={(event) => setProductCategory(event.target.value)}
                >
                  <MenuItem value="">All categories</MenuItem>
                  {(categoriesQuery.data || []).map((category) => (
                    <MenuItem key={category.slug} value={category.slug}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <Typography sx={{ ml: 'auto', color: '#667085', fontSize: 12 }}>
            {tab === 0 ? quotesQuery.data?.total || 0 : tab === 1 ? productsQuery.data?.total || 0 : categoriesQuery.data?.length || 0} records
          </Typography>
        </Box>

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
                      <Typography sx={{ fontSize: 14, fontWeight: 900 }}>₾{Number(quote.final_price).toFixed(0)}</Typography>
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
                <Box sx={{ minWidth: 860 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '64px 1.6fr 1fr 1fr 120px 100px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    {['Image', 'Product', 'Brand', 'Category', 'Max offer', 'Visible'].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {(productsQuery.data?.items || []).map((product) => (
                    <Box key={product.id} sx={{ display: 'grid', gridTemplateColumns: '64px 1.6fr 1fr 1fr 120px 100px', gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #edf0f5' }}>
                      <Box component="img" src={imageUrl(product.image_src)} alt="" sx={{ width: 46, height: 46, objectFit: 'contain' }} />
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{product.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#667085' }}>{product.slug}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13 }}>{product.brand || '—'}</Typography>
                      <Typography sx={{ fontSize: 13 }}>{product.category || '—'}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 800 }}>₾{Math.round(Number(product.max_price || 0))}</Typography>
                      <Switch
                        checked={Boolean(product.enabled)}
                        onChange={(event) => productMutation.mutate({ id: product.id, payload: { enabled: event.target.checked } })}
                      />
                    </Box>
                  ))}
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
          </>
        )}
      </Paper>

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
