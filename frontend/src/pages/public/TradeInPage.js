import React, { useState } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  SearchRounded,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { tradeInService } from '../../services/tradeInService';

const palette = {
  purple: '#7c4dff',
  purpleDark: '#4f2ab8',
  lavender: '#eee8ff',
  ink: '#18171d',
  muted: '#6e687a',
  border: '#e4ddf2',
  canvas: '#f7f4fc',
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

const SelectionCard = ({ title, subtitle, image, icon, onClick, disabled }) => (
  <Box
    component="button"
    type="button"
    disabled={disabled}
    onClick={onClick}
    sx={{
      minHeight: 170,
      p: 2.25,
      border: `1px solid ${palette.border}`,
      borderRadius: '12px',
      bgcolor: '#fff',
      color: palette.ink,
      textAlign: 'left',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': disabled
        ? {}
        : {
            transform: 'translateY(-3px)',
            borderColor: '#bca8f7',
            boxShadow: '0 16px 34px rgba(81, 45, 156, 0.10)',
          },
    }}
  >
    {image ? (
      <Box
        component="img"
        src={image}
        alt=""
        loading="lazy"
        sx={{ width: '100%', height: 100, objectFit: 'contain', mb: 1.5 }}
      />
    ) : (
      <Box
        sx={{
          width: 54,
          height: 54,
          color: palette.purple,
          mb: 3,
          '& svg': { width: '100%', height: '100%', fill: 'currentColor' },
        }}
        dangerouslySetInnerHTML={icon ? { __html: icon } : undefined}
      />
    )}
    <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
    {subtitle && (
      <Typography sx={{ mt: 0.5, color: palette.muted, fontSize: 12 }}>{subtitle}</Typography>
    )}
    <ArrowForwardRounded
      sx={{ position: 'absolute', right: 16, bottom: 14, color: palette.purple, fontSize: 20 }}
    />
  </Box>
);

const TradeInPage = () => {
  const { t, i18n } = useTranslation();
  const [stage, setStage] = useState('categories');
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);

  const categoriesQuery = useQuery(['trade-in-categories'], tradeInService.getCategories);
  const brandsQuery = useQuery(
    ['trade-in-brands', category?.slug],
    () => tradeInService.getBrands(category.slug),
    { enabled: Boolean(category?.slug && stage === 'brands') },
  );
  const seriesQuery = useQuery(
    ['trade-in-series', category?.slug, brand],
    () => tradeInService.getSeries(category.slug, brand),
    { enabled: Boolean(category?.slug && brand && stage === 'series') },
  );
  const productsQuery = useQuery(
    ['trade-in-products', category?.slug, brand, series, search],
    () =>
      tradeInService.getProducts({
        category: category?.slug,
        brand: brand || undefined,
        series: series || undefined,
        q: search || undefined,
        limit: 60,
      }),
    { enabled: stage === 'products', keepPreviousData: true },
  );
  const resetAfterCategory = (selected) => {
    setCategory(selected);
    setBrand('');
    setSeries('');
    setSearch('');
    setStage(selected.coming_soon ? 'categories' : 'brands');
  };

  const chooseProduct = (selected) => {
    setProduct(selected);
    setStage('valuation');
  };

  const goBack = () => {
    if (stage === 'brands') setStage('categories');
    if (stage === 'series') setStage('brands');
    if (stage === 'products') setStage(series ? 'series' : 'brands');
    if (stage === 'valuation') setStage('products');
  };

  const titleByStage = {
    categories: t('public.tradeIn.heading'),
    brands: t('public.tradeIn.chooseBrand'),
    series: t('public.tradeIn.chooseSeries'),
    products: t('public.tradeIn.chooseDevice'),
    valuation: product?.name || t('public.tradeIn.valuation'),
  };

  const loading =
    categoriesQuery.isLoading ||
    brandsQuery.isLoading ||
    seriesQuery.isLoading ||
    productsQuery.isLoading;

  return (
    <Box sx={{ minHeight: 'calc(100vh - 60px)', bgcolor: palette.canvas, color: palette.ink }}>
      <Box
        sx={{
          px: { xs: 2, md: 5 },
          py: { xs: 4, md: 6 },
          background:
            'radial-gradient(circle at 12% 15%, rgba(165,118,255,.20), transparent 34%), linear-gradient(135deg,#fbf9ff,#f0ebfb)',
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
          <Typography sx={{ color: palette.purpleDark, fontSize: 11, fontWeight: 800, letterSpacing: '.14em' }}>
            {t('public.tradeIn.eyebrow')}
          </Typography>
          <Typography component="h1" sx={{ mt: 1, fontSize: { xs: 34, md: 50 }, fontWeight: 900 }}>
            {titleByStage[stage]}
          </Typography>
          <Typography sx={{ mt: 1, color: palette.muted, maxWidth: 660 }}>
            {t('public.tradeIn.subtitle')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 } }}>
        {stage !== 'categories' && (
          <Button
            onClick={goBack}
            startIcon={<ArrowBackRounded />}
            sx={{ mb: 2.5, color: palette.ink, borderRadius: '8px' }}
          >
            {t('public.tradeIn.back')}
          </Button>
        )}

        {stage === 'products' && (
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('public.tradeIn.search')}
            fullWidth
            sx={{ mb: 2.5, maxWidth: 560, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
            }}
          />
        )}

        {loading && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 1.5 }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={180} sx={{ borderRadius: '12px' }} />
            ))}
          </Box>
        )}

        {!loading && stage === 'categories' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 1.5 }}>
            {(categoriesQuery.data || []).map((item) => (
              <SelectionCard
                key={item.slug}
                title={item.label}
                subtitle={item.coming_soon ? t('public.tradeIn.comingSoon') : t('public.tradeIn.start')}
                icon={item.icon_svg}
                disabled={item.coming_soon}
                onClick={() => resetAfterCategory(item)}
              />
            ))}
          </Box>
        )}

        {!loading && stage === 'brands' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 1.5 }}>
            {(brandsQuery.data || []).map((item) => (
              <SelectionCard
                key={item.brand}
                title={item.brand}
                subtitle={`${item.product_count} ${t('public.tradeIn.models')}`}
                onClick={() => {
                  setBrand(item.brand);
                  setStage('series');
                }}
              />
            ))}
          </Box>
        )}

        {!loading && stage === 'series' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 1.5 }}>
            <SelectionCard
              title={t('public.tradeIn.allModels')}
              subtitle={brand}
              onClick={() => setStage('products')}
            />
            {(seriesQuery.data || []).map((item) => (
              <SelectionCard
                key={item.series}
                title={item.series}
                subtitle={`${item.product_count} ${t('public.tradeIn.models')}`}
                onClick={() => {
                  setSeries(item.series);
                  setStage('products');
                }}
              />
            ))}
          </Box>
        )}

        {!loading && stage === 'products' && (
          <>
            <Typography sx={{ mb: 2, color: palette.muted, fontSize: 13 }}>
              {productsQuery.data?.total || 0} {t('public.tradeIn.devicesFound')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 1.5 }}>
              {(productsQuery.data?.items || []).map((item) => (
                <SelectionCard
                  key={item.id}
                  title={item.name}
                  subtitle={`${t('public.tradeIn.upTo')} ₾${Math.round(item.max_price || 0)}`}
                  image={imageUrl(item.image_src)}
                  onClick={() => chooseProduct(item)}
                />
              ))}
            </Box>
          </>
        )}

        {!loading && stage === 'valuation' && product && (
          <Box
            sx={{
              bgcolor: '#fff',
              border: `1px solid ${palette.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
              minHeight: { xs: 760, md: 720 },
            }}
          >
            <Box
              component="iframe"
              title={`${product.name} trade-in valuation`}
              src={`/trade-in/widget/index.html?slug=${encodeURIComponent(product.slug)}&lang=${
                i18n.language?.startsWith('ka') ? 'ka' : 'en'
              }`}
              sx={{
                display: 'block',
                width: '100%',
                minHeight: { xs: 900, md: 760 },
                border: 0,
                bgcolor: '#fff',
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TradeInPage;
