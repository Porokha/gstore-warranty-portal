import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
    .replace(/^sell\//, '/')
    .replace(/^media\//, '/media/')
    .replace(/^\/trade-in\//, '/');
  return `/trade-in${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
};

const decodeBase64Json = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    return fallback;
  }
};

const normalizePrice = (answer) => Number(answer?.value ?? answer?.value_current ?? 0) || 0;

const isAnswerAvailable = (answer) =>
  answer && String(answer.value_enabled ?? 1) !== '0' && answer.text;

const getQuestion = (tree, pointer) =>
  tree?.[pointer?.setIndex || 0]?.questions?.[pointer?.questionIndex || 0] || null;

const pointerFromGoTo = (goTo) => {
  const [setIndex, questionIndex] = String(goTo || '')
    .split(',')
    .map((item) => Number(item) - 1);
  if (Number.isNaN(setIndex) || Number.isNaN(questionIndex)) return null;
  return { setIndex, questionIndex };
};

const getAnswerMessage = (messages, answer) => {
  const attributes = Array.isArray(answer?.attributes) ? answer.attributes : [];
  const condition = attributes.find((item) => item.key === 'condition')?.value;
  return messages.find(
    (item) =>
      item.attribute_key === 'condition' &&
      condition &&
      String(item.attribute_value) === String(condition),
  );
};

const buildPricingPath = (steps) =>
  steps.map((step) => ({
    question: step.question?.text,
    label: step.question?.label,
    answers: step.answers.map((answer) => ({
      text: answer.text,
      value: normalizePrice(answer),
      attributes: answer.attributes || [],
    })),
  }));

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

const TradeInValuation = ({ product, t }) => {
  const [pointer, setPointer] = useState({ setIndex: 0, questionIndex: 0 });
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [price, setPrice] = useState(0);
  const [mode, setMode] = useState('question');
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '' });
  const [formError, setFormError] = useState('');
  const [quoteResult, setQuoteResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const productQuery = useQuery(
    ['trade-in-product', product?.slug],
    () => tradeInService.getProduct(product.slug),
    { enabled: Boolean(product?.slug) },
  );

  useEffect(() => {
    setPointer({ setIndex: 0, questionIndex: 0 });
    setSelectedIndexes([]);
    setSteps([]);
    setPrice(0);
    setMode('question');
    setForm({ customer_name: '', customer_phone: '', customer_email: '' });
    setFormError('');
    setQuoteResult(null);
    setSaving(false);
  }, [product?.slug]);

  const detail = productQuery.data || product;
  const tree = Array.isArray(detail?.tree) ? detail.tree : [];
  const activeQuestion = getQuestion(tree, pointer);
  const answerMessages = decodeBase64Json(detail?.answerMessages);
  const visibleAnswers = (activeQuestion?.answers || []).filter(isAnswerAvailable);
  const selectedAnswers = selectedIndexes
    .map((index) => visibleAnswers[index])
    .filter(Boolean);
  const currentMessage = getAnswerMessage(answerMessages, selectedAnswers[0]);
  const isMulti = Number(activeQuestion?.type || 0) > 0;
  const finalPrice = Math.max(0, Math.round(price));

  const selectAnswer = (index) => {
    setFormError('');
    if (isMulti) {
      setSelectedIndexes((current) =>
        current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
      );
      return;
    }
    setSelectedIndexes([index]);
  };

  const restoreStep = (step) => {
    setPointer(step.pointer);
    setSelectedIndexes(step.selectedIndexes);
    setPrice(step.priceBefore);
    setMode('question');
    setFormError('');
  };

  const goPreviousQuestion = () => {
    if (!steps.length) return;
    const previous = steps[steps.length - 1];
    setSteps((current) => current.slice(0, -1));
    restoreStep(previous);
  };

  const completeFlow = (nextPrice) => {
    setPrice(nextPrice);
    setSelectedIndexes([]);
    setMode(nextPrice > 0 ? 'final' : 'no-offer');
  };

  const goNextQuestion = () => {
    if (!activeQuestion) return;
    if (!selectedAnswers.length) {
      setFormError(t('public.tradeIn.answerRequired'));
      return;
    }

    const firstAnswer = selectedAnswers[0];
    const firstResult = Number(firstAnswer?.result ?? 1);
    const priceBefore = price;
    let nextPrice = price;

    selectedAnswers.forEach((answer) => {
      if (Number(answer?.result ?? 1) !== 4) {
        nextPrice += normalizePrice(answer);
      }
    });
    if (!isMulti && firstResult === 4) {
      nextPrice = normalizePrice(firstAnswer);
    }

    const step = {
      pointer,
      selectedIndexes,
      question: activeQuestion,
      answers: selectedAnswers,
      priceBefore,
      priceAfter: nextPrice,
    };
    setSteps((current) => [...current, step]);

    let nextPointer = null;
    if (isMulti || firstResult === 1) {
      nextPointer = { setIndex: pointer.setIndex, questionIndex: pointer.questionIndex + 1 };
    } else if (firstResult === 2) {
      nextPointer = pointerFromGoTo(firstAnswer.go_to);
    }

    if (firstResult === 0 || firstResult === 4 || !getQuestion(tree, nextPointer)) {
      completeFlow(nextPrice);
      return;
    }

    setPrice(nextPrice);
    setPointer(nextPointer);
    setSelectedIndexes([]);
    setFormError('');
  };

  const submitQuote = async (event) => {
    event.preventDefault();
    const email = form.customer_email.trim();
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      setFormError(t('public.tradeIn.requiredFields'));
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t('public.tradeIn.emailInvalid'));
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        product_slug: detail.slug,
        final_price: finalPrice,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        pricing_path: buildPricingPath(steps),
      };
      if (email) payload.customer_email = email;
      const response = await tradeInService.createQuote(payload);
      setQuoteResult(response);
      setMode('success');
    } catch (error) {
      setFormError(t('public.tradeIn.quoteError'));
    } finally {
      setSaving(false);
    }
  };

  if (productQuery.isLoading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' }, gap: 2 }}>
        <Skeleton variant="rounded" height={560} sx={{ borderRadius: '16px' }} />
        <Skeleton variant="rounded" height={560} sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' },
        gap: { xs: 1.5, md: 2 },
        alignItems: 'stretch',
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 'auto', md: 620 },
          p: { xs: 2, md: 4 },
          border: `1px solid ${palette.border}`,
          borderRadius: '16px',
          bgcolor: 'rgba(255,255,255,.76)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', md: 'center' },
        }}
      >
        <Box
          component="img"
          src={imageUrl(detail?.image_src)}
          alt={detail?.name || ''}
          sx={{
            width: { xs: 190, sm: 240, md: 340 },
            height: { xs: 190, sm: 240, md: 340 },
            objectFit: 'contain',
            mb: { xs: 2, md: 4 },
          }}
        />
        <Typography sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 900, textAlign: 'center' }}>
          {detail?.name}
        </Typography>
        <Typography sx={{ mt: 1, color: palette.muted, fontSize: 18 }}>{detail?.brand}</Typography>
        <Box
          sx={{
            mt: { xs: 2, md: 5 },
            width: '100%',
            maxWidth: 440,
            p: { xs: 2, md: 3 },
            border: `1px solid ${palette.border}`,
            borderRadius: '14px',
            bgcolor: '#fff',
          }}
        >
          <Typography sx={{ mb: 1.5, fontWeight: 900, letterSpacing: '.04em' }}>
            {t('public.tradeIn.whyZezva')}
          </Typography>
          {[1, 2, 3, 4].map((item) => (
            <Typography key={item} sx={{ color: palette.muted, fontSize: 14, lineHeight: 1.8 }}>
              <Box component="span" sx={{ color: palette.purple, fontWeight: 900, mr: 1.25 }}>
                ✓
              </Box>
              {t(`public.tradeIn.benefits.${item}`)}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: { xs: 'auto', md: 620 },
          p: { xs: 2, md: 4 },
          border: `1px solid ${palette.border}`,
          borderRadius: '16px',
          bgcolor: '#fff',
          boxShadow: '0 20px 70px rgba(85, 52, 160, .07)',
        }}
      >
        {mode === 'question' && activeQuestion && (
          <>
            <Typography component="h2" sx={{ fontSize: { xs: 27, md: 36 }, fontWeight: 900, mb: 3 }}>
              {activeQuestion.text}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  visibleAnswers.length > 3 ? { xs: '1fr 1fr', md: 'repeat(3,1fr)' } : '1fr',
                gap: 1.1,
                mb: 2.5,
              }}
            >
              {visibleAnswers.map((answer, index) => {
                const selected = selectedIndexes.includes(index);
                return (
                  <Box
                    key={`${answer.text}-${index}`}
                    component="button"
                    type="button"
                    onClick={() => selectAnswer(index)}
                    sx={{
                      border: `1px solid ${selected ? palette.purple : palette.border}`,
                      borderRadius: '12px',
                      p: { xs: 1.4, md: 1.75 },
                      bgcolor: selected ? palette.lavender : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: palette.ink,
                      boxShadow: selected ? '0 12px 30px rgba(124,77,255,.14)' : 'none',
                      transition: 'border-color 160ms ease, background 160ms ease',
                    }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: { xs: 14, md: 16 } }}>
                      {answer.text}
                    </Typography>
                    {normalizePrice(answer) !== 0 && (
                      <Typography sx={{ mt: 0.5, color: palette.muted, fontSize: 12 }}>
                        {normalizePrice(answer) > 0 ? '+' : ''}
                        ₾{Math.round(normalizePrice(answer)).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            {currentMessage?.message && (
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '12px',
                  color: palette.muted,
                  '& strong, & b': { color: palette.ink },
                  '& ul': { m: 0, pl: 2.4 },
                  '& li': { mb: 0.75 },
                }}
                dangerouslySetInnerHTML={{ __html: currentMessage.message }}
              />
            )}

            {formError && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: '10px' }}>
                {formError}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr' }, gap: 1.5 }}>
              <Button
                variant="contained"
                disableElevation
                disabled={!steps.length}
                onClick={goPreviousQuestion}
                sx={{ py: 1.4, borderRadius: '10px', bgcolor: '#f1eff7', color: palette.ink }}
              >
                {t('public.tradeIn.previous')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={goNextQuestion}
                sx={{ py: 1.4, borderRadius: '10px', bgcolor: palette.purple }}
              >
                {t('public.tradeIn.next')}
              </Button>
            </Box>
          </>
        )}

        {(mode === 'final' || mode === 'no-offer') && (
          <Box component="form" onSubmit={submitQuote}>
            <Typography sx={{ color: palette.purpleDark, fontSize: 12, fontWeight: 900, letterSpacing: '.12em' }}>
              {t('public.tradeIn.offerReady')}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: 40, md: 54 }, fontWeight: 900 }}>
              ₾{finalPrice.toLocaleString()}
            </Typography>
            <Typography sx={{ color: palette.muted, mb: 3 }}>
              {mode === 'no-offer' ? t('public.tradeIn.noOffer') : t('public.tradeIn.yourOffer')}
            </Typography>
            {formError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                value={form.customer_name}
                onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
                label={t('public.tradeIn.fullName')}
                fullWidth
              />
              <TextField
                value={form.customer_phone}
                onChange={(event) => setForm((current) => ({ ...current, customer_phone: event.target.value }))}
                label={t('public.tradeIn.phone')}
                fullWidth
              />
              <TextField
                value={form.customer_email}
                onChange={(event) => setForm((current) => ({ ...current, customer_email: event.target.value }))}
                label={t('public.tradeIn.email')}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2.5 }}>
              <Button
                variant="contained"
                disableElevation
                onClick={goPreviousQuestion}
                sx={{ py: 1.4, borderRadius: '10px', bgcolor: '#f1eff7', color: palette.ink }}
              >
                {t('public.tradeIn.previous')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disableElevation
                disabled={saving || mode === 'no-offer'}
                sx={{ py: 1.4, borderRadius: '10px', bgcolor: palette.purple }}
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : t('public.tradeIn.submitQuote')}
              </Button>
            </Box>
          </Box>
        )}

        {mode === 'success' && (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 440, textAlign: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 900 }}>
                {t('public.tradeIn.quoteSaved')}
              </Typography>
              <Typography sx={{ mt: 1, color: palette.muted }}>{t('public.tradeIn.quoteSavedText')}</Typography>
              {quoteResult?.quote_number && (
                <Typography sx={{ mt: 3, color: palette.purpleDark, fontWeight: 900 }}>
                  {t('public.tradeIn.quoteNumber')}: {quoteResult.quote_number}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const TradeInPage = () => {
  const { t } = useTranslation();
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

      <Box
        sx={{
          maxWidth: stage === 'valuation' ? 1360 : 1180,
          mx: 'auto',
          px: { xs: stage === 'valuation' ? 1.25 : 2, md: stage === 'valuation' ? 4 : 5 },
          py: { xs: stage === 'valuation' ? 1.5 : 3, md: stage === 'valuation' ? 3 : 5 },
        }}
      >
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
                image={imageUrl(item.image_src)}
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
                image={imageUrl(item.image_src)}
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

        {!loading && stage === 'valuation' && product && <TradeInValuation product={product} t={t} />}
      </Box>
    </Box>
  );
};

export default TradeInPage;
