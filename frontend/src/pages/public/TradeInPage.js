import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Modal,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  SearchRounded,
} from '@mui/icons-material';
import { useInfiniteQuery, useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { tradeInService } from '../../services/tradeInService';
import FigmaTradeInValuation from './TradeInValuation';

const palette = {
  purple: '#824cff',
  purpleDark: '#452386',
  lavender: '#f0e9ff',
  ink: '#18171d',
  muted: '#6e687a',
  border: '#e4ddf2',
  canvas: '#fbf9ff',
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
      borderRadius: '18px',
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
            boxShadow: '0 18px 42px rgba(81, 45, 156, 0.10)',
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
        className="zzv-trade-content-wrap"
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

const brandMarks = {
  apple: '/figma-home/trade-brand-apple.svg',
  samsung: '/trade-in/media/brands/samsung.jpg',
  asus: '/figma-home/trade-brand-asus.svg',
  motorola: '/figma-home/trade-brand-motorola.svg',
  sony: '/figma-home/trade-brand-sony.svg',
};
const featuredBrandOrder = ['apple', 'samsung', 'asus', 'motorola', 'sony'];
const brandFamilyLabels = {
  apple: 'iPhone',
  samsung: 'Galaxy',
  asus: 'Zenfone',
  motorola: 'Edge',
  sony: 'Xperia',
};

const TradeBrandOption = ({ item, selected, onClick, t }) => (
  <button
    type="button"
    className={`zzv-trade-brand-option${selected ? ' is-selected' : ''}`}
    onClick={onClick}
    aria-pressed={selected}
  >
    <span className={`zzv-trade-brand-logo${item.brand.toLowerCase() === 'samsung' ? ' zzv-trade-brand-logo--samsung' : ''}`}>
      <img src={brandMarks[item.brand.toLowerCase()] || imageUrl(item.image_src)} alt="" />
    </span>
    <span className="zzv-trade-brand-name">{item.brand}</span>
    {brandFamilyLabels[item.brand.toLowerCase()] && (
      <span className="zzv-trade-brand-family">{brandFamilyLabels[item.brand.toLowerCase()]}</span>
    )}
    <span className="zzv-trade-brand-count">{item.product_count} {t('public.tradeIn.models')}</span>
    <ArrowForwardRounded className="zzv-trade-option-arrow" aria-hidden="true" />
    <span className="zzv-trade-option-radio" aria-hidden="true" />
  </button>
);

const TradeModelOption = ({ item, selected, onClick, t }) => (
  <button
    type="button"
    className={`zzv-trade-model-option${selected ? ' is-selected' : ''}`}
    onClick={onClick}
    aria-pressed={selected}
  >
    <span className="zzv-trade-model-image">
      <img src={imageUrl(item.image_src)} alt="" loading="lazy" />
    </span>
    <span className="zzv-trade-model-name">{item.name}</span>
    <span className="zzv-trade-model-price"><span className="zzv-trade-model-price-prefix">{t('public.tradeIn.upTo')} </span>₾{Math.round(item.max_price || 0).toLocaleString()}</span>
    <ArrowForwardRounded className="zzv-trade-option-arrow" aria-hidden="true" />
    <span className="zzv-trade-option-radio" aria-hidden="true" />
  </button>
);

const TradeInValuation = ({ product, t, onProgressChange }) => {
  const [pointer, setPointer] = useState({ setIndex: 0, questionIndex: 0 });
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [price, setPrice] = useState(0);
  const [mode, setMode] = useState('question');
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '' });
  const [formError, setFormError] = useState('');
  const [quoteResult, setQuoteResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [quoteOpen, setQuoteOpen] = useState(false);

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
    setDisplayPrice(0);
    setQuoteOpen(false);
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

  useEffect(() => {
    onProgressChange(mode === 'question' ? Math.min(5, 3 + steps.length) : 5);
  }, [mode, steps.length, onProgressChange]);

  useEffect(() => {
    if (mode !== 'final') {
      setDisplayPrice(mode === 'no-offer' ? 0 : finalPrice);
      return undefined;
    }

    let frameId;
    const startedAt = performance.now();
    const duration = 1100;
    const tick = (time) => {
      const progress = Math.min(1, (time - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.round(finalPrice * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };
    setDisplayPrice(0);
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [finalPrice, mode]);

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
      setQuoteOpen(false);
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
      className="zzv-trade-valuation"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' },
        gap: 0,
        alignItems: 'stretch',
        overflow: 'hidden',
        border: `1px solid ${palette.border}`,
        borderRadius: { xs: '20px', md: '28px' },
        bgcolor: '#fff',
        boxShadow: '0 26px 80px rgba(73, 43, 130, .08)',
      }}
    >
      <Box
        className="zzv-trade-device-panel"
        sx={{
          minHeight: { xs: 'auto', md: 620 },
          p: { xs: 2, md: 4 },
          border: 0,
          borderRadius: 0,
          bgcolor: '#f8f8f9',
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
          {mode === 'final' || mode === 'success' ? (
            <>
              <Typography sx={{ color: palette.purpleDark, fontSize: 12, fontWeight: 900, letterSpacing: '.12em' }}>
                {t('public.tradeIn.yourOffer')}
              </Typography>
              <Typography sx={{ mt: 0.5, color: palette.purple, fontSize: 38, fontWeight: 900 }}>
                ₾{finalPrice.toLocaleString()}
              </Typography>
              {[1, 2, 3].map((item) => (
                <Typography key={item} sx={{ color: palette.muted, fontSize: 13, lineHeight: 1.75 }}>
                  <Box component="span" sx={{ color: palette.purple, fontWeight: 900, mr: 1.25 }}>
                    ✓
                  </Box>
                  {t(`public.tradeIn.offerSteps.${item}`)}
                </Typography>
              ))}
            </>
          ) : (
            <>
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
            </>
          )}
        </Box>
      </Box>

      <Box
        className="zzv-trade-question-panel"
        sx={{
          minHeight: { xs: 'auto', md: 620 },
          p: { xs: 2, md: 4 },
          border: 0,
          borderRadius: 0,
          bgcolor: '#fff',
          boxShadow: 'none',
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
                sx={{ py: 1.4, borderRadius: '12px', bgcolor: '#f1eff7', color: palette.ink }}
              >
                {t('public.tradeIn.previous')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={goNextQuestion}
                sx={{ py: 1.4, borderRadius: '12px', bgcolor: palette.purple }}
              >
                {t('public.tradeIn.next')}
              </Button>
            </Box>
          </>
        )}

        {(mode === 'final' || mode === 'no-offer') && (
          <Box
            sx={{
              minHeight: 460,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              animation: 'tradeOfferIn 420ms cubic-bezier(.2,.9,.2,1) both',
              '@keyframes tradeOfferIn': {
                from: { opacity: 0, transform: 'translateY(14px) scale(.985)' },
                to: { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 620 }}>
              <Typography sx={{ color: palette.muted, fontSize: 15, fontWeight: 800 }}>
                {t('public.tradeIn.offerLabel')}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  color: palette.purple,
                  fontSize: { xs: 64, md: 86 },
                  fontWeight: 900,
                  letterSpacing: '-.06em',
                  lineHeight: 1,
                }}
              >
                ₾{displayPrice.toLocaleString()}
              </Typography>
              <Typography sx={{ mt: 1.5, color: palette.muted, mb: 4 }}>
              {mode === 'no-offer' ? t('public.tradeIn.noOffer') : t('public.tradeIn.yourOffer')}
            </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  disableElevation
                  disabled={mode === 'no-offer'}
                  onClick={() => setQuoteOpen(true)}
                  sx={{ minWidth: 170, py: 1.5, borderRadius: '12px', bgcolor: palette.purple }}
                >
                  {t('public.tradeIn.getThisOffer')}
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={goPreviousQuestion}
                  sx={{ minWidth: 170, py: 1.5, borderRadius: '12px', bgcolor: '#f1eff7', color: palette.ink }}
                >
                  {t('public.tradeIn.changeAnswers')}
                </Button>
              </Box>
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

      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)}>
        <Box
          component="form"
          onSubmit={submitQuote}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(520px, calc(100vw - 28px))',
            maxHeight: 'calc(100vh - 28px)',
            overflow: 'auto',
            p: { xs: 2.4, md: 3.5 },
            borderRadius: '24px',
            bgcolor: '#fff',
            boxShadow: '0 28px 90px rgba(22, 17, 40, .28)',
            outline: 'none',
          }}
        >
          <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900 }}>
            {t('public.tradeIn.claimOffer')}
          </Typography>
          <Typography sx={{ mt: 0.5, color: palette.muted }}>{detail?.name}</Typography>
          <Typography sx={{ mt: 2, color: palette.purple, fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
            ₾{finalPrice.toLocaleString()}
          </Typography>
          <Typography sx={{ mt: 1, mb: 2.5, color: palette.muted }}>{t('public.tradeIn.claimHint')}</Typography>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mt: 2.4 }}>
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={saving}
              sx={{ py: 1.4, borderRadius: '12px', bgcolor: palette.purple }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : t('public.tradeIn.submitQuote')}
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={() => setQuoteOpen(false)}
              sx={{ py: 1.4, borderRadius: '12px', bgcolor: '#f1eff7', color: palette.ink }}
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

const TradeInPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSelectionApplied = useRef(false);
  const [stage, setStage] = useState('categories');
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [modelSeries, setModelSeries] = useState([]);
  const [search, setSearch] = useState('');
  const [product, setProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [valuationStep, setValuationStep] = useState(3);
  const valuationBackRef = useRef(null);
  const loadMoreRef = useRef(null);

  const categoriesQuery = useQuery(['trade-in-categories'], tradeInService.getCategories);
  useEffect(() => {
    const available = (categoriesQuery.data || []).filter((item) => !item.coming_soon);
    if (!initialSelectionApplied.current && available.length) {
      initialSelectionApplied.current = true;
      const { preselectedBrand, preselectedProduct } = location.state || {};
      const phoneCategory = available.find((item) => item.slug === 'phone');
      if (phoneCategory && (preselectedBrand || preselectedProduct)) {
        setCategory(phoneCategory);
        setBrand(preselectedBrand || '');
        if (preselectedProduct?.slug) {
          setProduct(preselectedProduct);
          setStage('valuation');
        } else {
          setStage(preselectedBrand ? 'products' : 'brands');
        }
        return;
      }
    }
    if (stage === 'categories' && !category && available.length === 1) {
      setCategory(available[0]);
      setStage('brands');
    }
  }, [categoriesQuery.data, category, stage, location.state]);
  const brandsQuery = useQuery(
    ['trade-in-brands', category?.slug],
    () => tradeInService.getBrands(category.slug),
    { enabled: Boolean(category?.slug && stage === 'brands') },
  );
  const orderedBrands = [...(brandsQuery.data || [])].sort((a, b) => {
    const aIndex = featuredBrandOrder.indexOf(a.brand.toLowerCase());
    const bIndex = featuredBrandOrder.indexOf(b.brand.toLowerCase());
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  useEffect(() => {
    if (stage === 'brands' && category?.slug === 'phone' && !brand && orderedBrands.some((item) => item.brand.toLowerCase() === 'apple')) {
      setBrand(orderedBrands.find((item) => item.brand.toLowerCase() === 'apple').brand);
    }
  }, [stage, category?.slug, brand, brandsQuery.data]);
  const seriesQuery = useQuery(
    ['trade-in-series', category?.slug, brand],
    () => tradeInService.getSeries(category.slug, brand),
    { enabled: Boolean(category?.slug && brand && stage === 'products') },
  );
  const productsQuery = useInfiniteQuery(
    ['trade-in-products', category?.slug, brand, series, search],
    ({ pageParam = 1 }) =>
      tradeInService.getProducts({
        category: category?.slug,
        brand: brand || undefined,
        series: series || undefined,
        q: search || undefined,
        page: pageParam,
        limit: 40,
      }),
    {
      enabled: stage === 'products',
      getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    },
  );
  const productPages = productsQuery.data?.pages || [];
  const listedProducts = productPages.flatMap((page) => page.items || []);
  useEffect(() => {
    if (stage !== 'products' || brand.toLowerCase() !== 'apple' || series || search || !listedProducts.length) return;
    const generations = [...new Set(listedProducts.map((item) => item.name.match(/iPhone\s+(\d+|SE|XS|XR|X|Air)/i)?.[1]).filter(Boolean))];
    generations.sort((a, b) => (Number(b) || -1) - (Number(a) || -1) || a.localeCompare(b));
    setModelSeries(generations);
  }, [stage, brand, series, search, listedProducts.length]);
  const seriesOptions = brand.toLowerCase() === 'apple'
    ? modelSeries
    : (seriesQuery.data || []).map((item) => item.series).filter((item) => item.toLowerCase() !== brand.toLowerCase());

  useEffect(() => {
    if (stage !== 'products' || !productsQuery.hasNextPage || !loadMoreRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !productsQuery.isFetchingNextPage) productsQuery.fetchNextPage();
    }, { rootMargin: '300px' });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [stage, productsQuery.hasNextPage, productsQuery.isFetchingNextPage, productsQuery.fetchNextPage, listedProducts.length]);
  const resetAfterCategory = (selected) => {
    setCategory(selected);
    setBrand('');
    setSeries('');
    setModelSeries([]);
    setSearch('');
    setStage(selected.coming_soon ? 'categories' : 'brands');
  };

  const chooseProduct = (selected) => {
    setProduct(selected);
    setSelectedProduct(null);
    setValuationStep(3);
    setStage('valuation');
  };

  const chooseBrand = (selected) => {
    setBrand(selected);
    setSeries('');
    setModelSeries([]);
    setSearch('');
    if (!window.matchMedia('(max-width: 920px)').matches) setStage('products');
  };

  const goBack = () => {
    if (stage === 'brands') {
      if ((categoriesQuery.data || []).filter((item) => !item.coming_soon).length === 1) navigate('/');
      else setStage('categories');
    }
    if (stage === 'products') {
      setSeries('');
      setSelectedProduct(null);
      setStage('brands');
    }
    if (stage === 'valuation') {
      if (valuationBackRef.current?.()) return;
      setSelectedProduct(product);
      setStage('products');
    }
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
    (stage === 'brands' && brandsQuery.isLoading);

  const wizardStep = stage === 'brands' ? 1 : stage === 'products' ? 2 : stage === 'valuation' ? valuationStep : 0;
  const showWizard = stage === 'brands' || stage === 'products' || stage === 'valuation';
  const showProgress = Number.isInteger(wizardStep) && wizardStep > 0;

  return (
    <Box className={`zzv-trade-page${showWizard ? ' zzv-trade-page--wizard' : ''}`} sx={{ minHeight: 'calc(100vh - 60px)', bgcolor: palette.canvas, color: palette.ink }}>
      {!showWizard && <Box
        className="zzv-trade-hero"
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
      </Box>}

      {(showProgress || wizardStep === 'contact') && (
        <div className="zzv-trade-progress-wrap">
          <div className="zzv-trade-progress-inner">
            <button type="button" className="zzv-trade-back" onClick={goBack} aria-label={t('public.tradeIn.back')}>
              <ArrowBackRounded fontSize="small" />
            </button>
            <div className="zzv-trade-progress">
              {showProgress ? <><span>{t('public.tradeIn.step', { current: wizardStep, total: 5 })}</span><div className="zzv-trade-progress-track"><span style={{ width: `${wizardStep * 20}%` }} /></div></> : <strong>{i18n.language === 'ka' ? 'საკონტაქტო' : 'Contact'}</strong>}
            </div>
          </div>
        </div>
      )}

      <Box
        sx={{
          maxWidth: stage === 'valuation' ? 1360 : 1200,
          mx: 'auto',
          px: { xs: stage === 'valuation' ? 1.25 : 2.5, md: stage === 'valuation' ? 4 : 0 },
          py: { xs: stage === 'valuation' ? 1.5 : 3, md: stage === 'valuation' ? 3 : 4 },
        }}
      >
        {stage !== 'categories' && !showWizard && (
          <Button
            onClick={goBack}
            startIcon={<ArrowBackRounded />}
            sx={{ mb: 2.5, color: palette.ink, borderRadius: '8px' }}
          >
            {t('public.tradeIn.back')}
          </Button>
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
          <div className="zzv-trade-step">
            <h1>{t('public.tradeIn.brandQuestion')}</h1>
            <div className="zzv-trade-brand-grid">
              {orderedBrands.map((item) => (
                <TradeBrandOption
                key={item.brand}
                  item={item}
                  selected={brand === item.brand}
                  onClick={() => chooseBrand(item.brand)}
                  t={t}
                />
              ))}
            </div>
            <button type="button" className="zzv-trade-continue" disabled={!brand} onClick={() => setStage('products')}>
              {t('public.tradeIn.continue')}
            </button>
          </div>
        )}

        {stage === 'products' && (
          <div className="zzv-trade-step">
            <h1>{t('public.tradeIn.modelQuestion')}</h1>
            <p className="zzv-trade-step-context">{brand}</p>
            <div className="zzv-trade-search">
              <SearchRounded aria-hidden="true" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setSelectedProduct(null); }} placeholder={t('public.tradeIn.searchModel')} aria-label={t('public.tradeIn.searchModel')} />
            </div>
            {seriesOptions.length > 0 && (
              <div className="zzv-trade-series" aria-label={t('public.tradeIn.chooseSeries')}>
                <button type="button" className={!series ? 'is-selected' : ''} onClick={() => { setSeries(''); setSelectedProduct(null); }}>{t('public.tradeIn.allModels')}</button>
                {seriesOptions.map((item) => (
                  <button key={item} type="button" className={series === item ? 'is-selected' : ''} onClick={() => { setSeries(item); setSelectedProduct(null); }}>{item}</button>
                ))}
              </div>
            )}
            <p className="zzv-trade-result-count">
              {productsQuery.isLoading ? t('public.tradeIn.loadingMore') : `${productPages[0]?.total || 0} ${t('public.tradeIn.models')}`}
            </p>
            <div className="zzv-trade-model-grid">
              {productsQuery.isLoading ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={220} sx={{ borderRadius: '16px' }} />
              )) : listedProducts.map((item) => (
                <TradeModelOption
                  key={item.id}
                  item={item}
                  selected={selectedProduct?.id === item.id}
                  onClick={() => {
                    if (window.matchMedia('(max-width: 920px)').matches) setSelectedProduct(item);
                    else chooseProduct(item);
                  }}
                  t={t}
                />
              ))}
            </div>
            {!productsQuery.isLoading && !listedProducts.length && <p className="zzv-trade-empty">{t('public.tradeIn.noModels')}</p>}
            {!productsQuery.isLoading && productsQuery.hasNextPage && <div ref={loadMoreRef} className="zzv-trade-load-more" aria-label={t('public.tradeIn.loadingMore')}><CircularProgress size={22} /></div>}
            <button type="button" className="zzv-trade-continue" disabled={!selectedProduct} onClick={() => chooseProduct(selectedProduct)}>
              {t('public.tradeIn.continue')}
            </button>
          </div>
        )}

        {!loading && stage === 'valuation' && product && <FigmaTradeInValuation key={product.slug} product={product} t={t} language={i18n.language} initialStorage={location.state?.preselectedStorage} initialCondition={location.state?.preselectedCondition} onProgressChange={setValuationStep} backActionRef={valuationBackRef} />}
      </Box>
    </Box>
  );
};

export default TradeInPage;
