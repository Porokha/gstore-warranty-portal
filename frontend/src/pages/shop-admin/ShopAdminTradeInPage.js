import React, { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
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
import { RefreshRounded, SearchRounded } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { tradeInService } from '../../services/tradeInService';

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
  const [quoteStatus, setQuoteStatus] = useState('');

  const quotesQuery = useQuery(
    ['trade-in-admin-quotes', quoteStatus],
    () => tradeInService.getAdminQuotes({ status: quoteStatus || undefined }),
    { enabled: tab === 0 },
  );
  const productsQuery = useQuery(
    ['trade-in-admin-products', search],
    () => tradeInService.getAdminProducts({ q: search || undefined, limit: 100 }),
    { enabled: tab === 1, keepPreviousData: true },
  );
  const categoriesQuery = useQuery(
    ['trade-in-admin-categories'],
    tradeInService.getAdminCategories,
    { enabled: tab === 2 },
  );

  const quoteMutation = useMutation(
    ({ id, payload }) => tradeInService.updateAdminQuote(id, payload),
    { onSuccess: () => queryClient.invalidateQueries('trade-in-admin-quotes') },
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1fr 140px 150px 180px', gap: 2, px: 2, py: 1.25, bgcolor: '#f8f9fc' }}>
                    {['Quote', 'Device / customer', 'Phone', 'Offer', 'Created', 'Status'].map((label) => <Typography key={label} sx={headerCell}>{label}</Typography>)}
                  </Box>
                  {(quotesQuery.data?.items || []).map((quote) => (
                    <Box key={quote.id} sx={{ display: 'grid', gridTemplateColumns: '140px 1.5fr 1fr 140px 150px 180px', gap: 2, alignItems: 'center', px: 2, py: 1.4, borderTop: '1px solid #edf0f5' }}>
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
    </Box>
  );
};

export default ShopAdminTradeInPage;
