import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import '../../styles/shop.css';
import { shopService } from '../../services/shopService';

const partOptions = [
  ['all', 'common.all'],
  ['board', 'shop.partLabels.board'],
  ['screen', 'shop.partLabels.screen'],
  ['sensor', 'shop.partLabels.sensor'],
  ['battery', 'shop.partLabels.battery'],
  ['camera', 'shop.partLabels.camera'],
  ['speaker', 'shop.partLabels.speaker'],
  ['charging', 'shop.partLabels.charging'],
];

const deviceTitles = {
  all: 'shop.deviceTitles.all',
  smartphones: 'shop.deviceTitles.smartphones',
  laptops: 'shop.deviceTitles.laptops',
  accessories: 'shop.deviceTitles.accessories',
};

const labelForDevice = {
  smartphones: 'shop.deviceLabels.smartphones',
  laptops: 'shop.deviceLabels.laptops',
  accessories: 'shop.deviceLabels.accessories',
};

const labelForPart = {
  board: 'shop.partLabels.board',
  screen: 'shop.partLabels.screen',
  sensor: 'shop.partLabels.sensor',
  battery: 'shop.partLabels.battery',
  camera: 'shop.partLabels.camera',
  speaker: 'shop.partLabels.speaker',
  charging: 'shop.partLabels.charging',
  accessory: 'shop.partLabels.accessory',
};

const labelForSource = {
  oem: 'shop.sourceLabels.oem',
  'third-party': 'shop.sourceLabels.thirdParty',
};

const formatMoney = (value) => `₾${Number(value || 0).toFixed(2)}`;

const getProductOnlyPrice = (product) => product.sale_price ?? product.price;
const getServicePrice = (product) => product.service_price;
const getDisplayPrice = (product) => getProductOnlyPrice(product) ?? getServicePrice(product);
const canBuyProductOnly = (product) => getProductOnlyPrice(product) != null;
const canBuyWithService = (product) => getServicePrice(product) != null;
const GRID_TRANSITION_MS = 180;
const MODAL_CLOSE_MS = 260;
const CART_REMOVE_MS = 220;
const ORDER_MODAL_CLOSE_MS = 260;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createInitialOrderForm = () => ({
  customer_name: '',
  customer_last_name: '',
  customer_phone: '',
  customer_email: '',
  heard_about: '',
  has_partner_warranty: null,
  partner_warranty_id: '',
  payment_method: 'onsite',
});

const ShopPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('all');
  const [brands, setBrands] = useState([]);
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sources, setSources] = useState(['oem', 'third-party']);
  const [cart, setCart] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalState, setModalState] = useState('closed');
  const [gridProducts, setGridProducts] = useState([]);
  const [gridStage, setGridStage] = useState('idle');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});
  const [removingCartIds, setRemovingCartIds] = useState([]);
  const [orderModalState, setOrderModalState] = useState('closed');
  const [orderStep, setOrderStep] = useState(1);
  const [orderForm, setOrderForm] = useState(createInitialOrderForm);
  const [orderErrors, setOrderErrors] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);
  const tabsRef = useRef(null);
  const gridRenderTokenRef = useRef(0);
  const didInitGridRef = useRef(false);
  const modalCloseTimerRef = useRef(null);
  const orderModalCloseTimerRef = useRef(null);
  const cartRemoveTimersRef = useRef(new Map());
  const cartItemRefs = useRef(new Map());
  const cartPositionsRef = useRef(new Map());

  const { data: products = [], isLoading: isProductsLoading } = useQuery(['shop-public-products'], () =>
    shopService.getPublicProducts(),
  );
  const orderMutation = useMutation((payload) => shopService.createPublicOrder(payload), {
    onSuccess: (result) => {
      setCreatedOrder(result);
      setOrderStep(4);
      setOrderErrors({});
      setCart([]);
      setRemovingCartIds([]);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || t('shop.orderFlow.errors.createFailed');
      setOrderErrors((current) => ({
        ...current,
        submit: Array.isArray(message) ? message.join(' ') : message,
      }));
    },
  });

  useEffect(() => {
    document.body.classList.add('zpos-fullscreen');
    return () => {
      document.body.classList.remove('zpos-fullscreen');
      window.clearTimeout(modalCloseTimerRef.current);
      window.clearTimeout(orderModalCloseTimerRef.current);
      cartRemoveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      cartRemoveTimersRef.current.clear();
    };
  }, []);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const tabsNode = tabsRef.current;
      if (!tabsNode) {
        return;
      }

      const activeTab = tabsNode.querySelector('.zpos-tab.is-active');
      if (!activeTab) {
        return;
      }

      const tabsRect = tabsNode.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      const inset = 4;

      setTabIndicatorStyle({
        width: `${activeRect.width}px`,
        transform: `translateX(${activeRect.left - tabsRect.left - inset}px)`,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [tab]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 920) {
        setFiltersOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (orderModalState !== 'closed') {
          closeOrderModal();
        } else {
          closeModal();
        }
        setFiltersOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isProductsLoading) {
      return undefined;
    }

    const token = ++gridRenderTokenRef.current;
    if (!didInitGridRef.current) {
      didInitGridRef.current = true;
      setGridProducts(visibleProducts);
      setGridStage('enter');
      const frame = window.requestAnimationFrame(() => {
        if (token === gridRenderTokenRef.current) {
          setGridStage('idle');
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setGridStage('leave');
    const timeout = window.setTimeout(() => {
      if (token !== gridRenderTokenRef.current) {
        return;
      }

      setGridProducts(visibleProducts);
      setGridStage('enter');
      window.requestAnimationFrame(() => {
        if (token === gridRenderTokenRef.current) {
          setGridStage('idle');
        }
      });
    }, GRID_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [isProductsLoading, visibleProducts]);

  const heardAboutOptions = useMemo(
    () => ['facebook', 'instagram', 'tiktok', 'friend', 'google', 'ai'],
    [],
  );

  const stepOneValid =
    orderForm.customer_name.trim() &&
    orderForm.customer_last_name.trim() &&
    orderForm.customer_phone.trim() &&
    EMAIL_RE.test(orderForm.customer_email.trim());

  const stepTwoValid =
    orderForm.heard_about &&
    orderForm.has_partner_warranty !== null &&
    (!orderForm.has_partner_warranty || orderForm.partner_warranty_id.trim());

  useLayoutEffect(() => {
    const nextPositions = new Map();
    const entries = Array.from(cartItemRefs.current.entries());

    entries.forEach(([id, node], index) => {
      const previous = cartPositionsRef.current.get(id);
      const current = node.getBoundingClientRect();
      node.style.transition = 'none';

      if (previous) {
        const deltaY = previous.top - current.top;
        if (deltaY) {
          node.style.transform = `translateY(${deltaY}px)`;
        }
      } else {
        node.style.opacity = '0';
        node.style.transform = 'translateY(14px) scale(0.985)';
        node.style.transitionDelay = `${index * 26}ms`;
      }

      nextPositions.set(id, current);
    });

    if (entries.length > 0) {
      window.requestAnimationFrame(() => {
        entries.forEach(([, node]) => {
          node.style.transition = '';
          node.style.transform = '';
          node.style.opacity = '';
          node.style.transitionDelay = '';
        });
      });
    }

    cartPositionsRef.current = nextPositions;
  }, [cart]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const activePrice = getDisplayPrice(product);
      const haystack = `${product.title} ${product.brand || ''} ${product.issue_label || ''} ${product.part_category} ${product.device_category}`.toLowerCase();
      const numericMin = priceMin === '' ? null : Number(priceMin);
      const numericMax = priceMax === '' ? null : Number(priceMax);

      if (tab !== 'all' && product.device_category !== tab) return false;
      if (brands.length > 0 && !brands.includes(product.brand || '')) return false;
      if (parts.length > 0 && !parts.includes(product.part_category)) return false;
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (!sources.includes(product.inventory_source)) return false;
      if (numericMin !== null && activePrice !== null && activePrice < numericMin) return false;
      if (numericMin !== null && activePrice === null) return false;
      if (numericMax !== null && activePrice !== null && activePrice > numericMax) return false;
      return true;
    });
  }, [brands, parts, priceMax, priceMin, products, search, sources, tab]);

  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => String(product.brand || '').trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [products],
  );

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const serviceTotal = total - subtotal;
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    return { subtotal, total, serviceTotal, count };
  }, [cart]);

  const togglePart = (part) => {
    if (part === 'all') {
      setParts([]);
      return;
    }

    setParts((current) =>
      current.includes(part) ? current.filter((value) => value !== part) : [...current, part],
    );
  };

  const toggleBrand = (brand) => {
    if (brand === 'all') {
      setBrands([]);
      return;
    }

    setBrands((current) =>
      current.includes(brand) ? current.filter((value) => value !== brand) : [...current, brand],
    );
  };

  const resetFilters = () => {
    setTab('all');
    setBrands([]);
    setParts([]);
    setSearch('');
    setPriceMin('');
    setPriceMax('');
    setSources(['oem', 'third-party']);
    setFiltersOpen(false);
  };

  const addToCart = (product, mode) => {
    const activePrice = mode === 'service' ? getServicePrice(product) : getProductOnlyPrice(product);
    if (activePrice == null) {
      return;
    }

    const basePrice = getProductOnlyPrice(product) ?? 0;
    const itemId = `${product.id}:${mode}`;

    setCart((current) => {
      const existing = current.find((item) => item.id === itemId);
      if (existing) {
        return current.map((item) =>
          item.id === itemId ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [
        ...current,
        {
          id: itemId,
          productId: product.id,
          title: product.title,
          mode,
          qty: 1,
          price: activePrice,
          basePrice,
          image_url: product.image_url,
          subtitle: `${t(labelForDevice[product.device_category])} • ${t(labelForPart[product.part_category])}`,
        },
      ];
    });

    closeModal();
  };

  function openModal(product) {
    window.clearTimeout(modalCloseTimerRef.current);
    setModalProduct(product);
    setModalState('closing');
    window.requestAnimationFrame(() => {
      setModalState('open');
    });
  }

  function closeModal() {
    if (!modalProduct) {
      return;
    }

    setModalState('closing');
    window.clearTimeout(modalCloseTimerRef.current);
    modalCloseTimerRef.current = window.setTimeout(() => {
      setModalProduct(null);
      setModalState('closed');
    }, MODAL_CLOSE_MS);
  }

  function openOrderModal() {
    window.clearTimeout(orderModalCloseTimerRef.current);
    setCreatedOrder(null);
    setOrderErrors({});
    setOrderStep(1);
    setOrderForm((current) => ({
      ...createInitialOrderForm(),
      customer_name: current.customer_name,
      customer_last_name: current.customer_last_name,
      customer_phone: current.customer_phone,
      customer_email: current.customer_email,
    }));
    setOrderModalState('closing');
    window.requestAnimationFrame(() => {
      setOrderModalState('open');
    });
  }

  function closeOrderModal() {
    if (orderModalState === 'closed') {
      return;
    }

    setOrderModalState('closing');
    window.clearTimeout(orderModalCloseTimerRef.current);
    orderModalCloseTimerRef.current = window.setTimeout(() => {
      setOrderModalState('closed');
      setOrderStep(1);
      setOrderErrors({});
      setCreatedOrder(null);
      if (!orderMutation.isLoading) {
        setOrderForm(createInitialOrderForm());
      }
    }, ORDER_MODAL_CLOSE_MS);
  }

  const updateOrderForm = (field, value) => {
    setOrderForm((current) => ({ ...current, [field]: value }));
    setOrderErrors((current) => ({ ...current, [field]: '', submit: '' }));
  };

  const goToStepTwo = () => {
    const nextErrors = {};
    if (!orderForm.customer_name.trim()) nextErrors.customer_name = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_last_name.trim()) nextErrors.customer_last_name = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_phone.trim()) nextErrors.customer_phone = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_email.trim()) {
      nextErrors.customer_email = t('shop.orderFlow.errors.required');
    } else if (!EMAIL_RE.test(orderForm.customer_email.trim())) {
      nextErrors.customer_email = t('shop.orderFlow.errors.email');
    }
    setOrderErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length === 0) {
      setOrderStep(2);
    }
  };

  const goToStepThree = () => {
    const nextErrors = {};
    if (!orderForm.heard_about) nextErrors.heard_about = t('shop.orderFlow.errors.required');
    if (orderForm.has_partner_warranty === null) {
      nextErrors.has_partner_warranty = t('shop.orderFlow.errors.required');
    }
    if (orderForm.has_partner_warranty && !orderForm.partner_warranty_id.trim()) {
      nextErrors.partner_warranty_id = t('shop.orderFlow.errors.required');
    }
    setOrderErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length === 0) {
      setOrderStep(3);
    }
  };

  const submitOnsiteOrder = () => {
    if (cart.length === 0 || orderMutation.isLoading) {
      return;
    }

    setOrderErrors({});
    orderMutation.mutate({
      ...orderForm,
      payment_method: 'onsite',
      items: cart.map((item) => ({
        product_id: item.productId,
        mode: item.mode,
        quantity: item.qty,
      })),
    });
  };

  const removeCartItem = (itemId) => {
    if (removingCartIds.includes(itemId)) {
      return;
    }

    setRemovingCartIds((current) => [...current, itemId]);
    const timer = window.setTimeout(() => {
      setCart((current) => current.filter((item) => item.id !== itemId));
      setRemovingCartIds((current) => current.filter((id) => id !== itemId));
      cartRemoveTimersRef.current.delete(itemId);
    }, CART_REMOVE_MS);
    cartRemoveTimersRef.current.set(itemId, timer);
  };

  const updateCart = (itemId, action) => {
    const currentItem = cart.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    if (action === 'remove') {
      removeCartItem(itemId);
      return;
    }

    if (action === 'decrease' && currentItem.qty === 1) {
      removeCartItem(itemId);
      return;
    }

    setCart((current) => {
      return current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return { ...item, qty: action === 'increase' ? item.qty + 1 : item.qty - 1 };
      });
    });
  };

  return (
    <div
      id="zpos-root"
      className={`zpos-root ${filtersOpen ? 'zpos-filters-open' : ''}`}
      aria-label={t('shop.ariaLabel')}
    >
      <div className="zpos-shop-banner">
        <div className="zpos-shop-banner-trust" aria-label={t('shop.aria.highlights')}>
          <span>{t('shop.banner.trust.0')}</span>
          <span>{t('shop.banner.trust.1')}</span>
          <span>{t('shop.banner.trust.2')}</span>
        </div>
      </div>

      <div className="zpos-shell">
        <aside className="zpos-sidebar" aria-label={t('shop.aria.filters')}>
          <div className="zpos-sidebar-head">
            <div>
              <p>{t('shop.filters.kicker')}</p>
              <h2>{t('shop.filters.title')}</h2>
            </div>
            <button className="zpos-reset-btn" type="button" onClick={resetFilters}>
              {t('shop.filters.reset')}
            </button>
          </div>

          <div className="zpos-sidebar-scroll">
            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.brandKicker')}</p>
                <h3>{t('shop.filters.brandTitle')}</h3>
              </div>
              <div className="zpos-filter-list">
                <button
                  type="button"
                  className={`zpos-filter-pill ${brands.length === 0 ? 'is-active' : ''}`}
                  onClick={() => toggleBrand('all')}
                >
                  <span>{t('shop.filters.allBrands')}</span>
                </button>
                {brandOptions.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className={`zpos-filter-pill ${brands.includes(brand) ? 'is-active' : ''}`}
                    onClick={() => toggleBrand(brand)}
                  >
                    <span>{brand}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.partTypeKicker')}</p>
                <h3>{t('shop.filters.partTypeTitle')}</h3>
              </div>
              <div className="zpos-filter-list">
                {partOptions.map(([value, label]) => {
                  const active = value === 'all' ? parts.length === 0 : parts.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`zpos-filter-pill ${active ? 'is-active' : ''}`}
                      onClick={() => togglePart(value)}
                    >
                      <span>{t(label)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.sourceKicker')}</p>
                <h3>{t('shop.filters.sourceTitle')}</h3>
              </div>
              {['oem', 'third-party'].map((value) => (
                <label className="zpos-check" key={value}>
                  <input
                    type="checkbox"
                    checked={sources.includes(value)}
                    onChange={() =>
                      setSources((current) =>
                        current.includes(value)
                          ? current.filter((source) => source !== value)
                          : [...current, value],
                      )
                    }
                  />
                  <span className="zpos-checkmark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12.5l4.2 4.2L19 7.5"></path>
                    </svg>
                  </span>
                  <span className="zpos-check-label">{t(labelForSource[value])}</span>
                </label>
              ))}
            </section>

            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.priceKicker')}</p>
                <h3>{t('shop.filters.priceTitle')}</h3>
              </div>
              <div className="zpos-price-grid">
                <label>
                  <span>{t('shop.filters.min')}</span>
                  <input
                    id="zpos-price-min"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t('shop.filters.minPlaceholder')}
                    value={priceMin}
                    onChange={(event) => setPriceMin(event.target.value)}
                  />
                </label>
                <label>
                  <span>{t('shop.filters.max')}</span>
                  <input
                    id="zpos-price-max"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={t('shop.filters.maxPlaceholder')}
                    value={priceMax}
                    onChange={(event) => setPriceMax(event.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>
        </aside>

        <main className="zpos-main">
          <div className="zpos-main-sticky">
            <div className="zpos-toolbar">
              <button
                type="button"
                className="zpos-filter-toggle"
                onClick={() => setFiltersOpen(true)}
                aria-label={t('shop.filters.open')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16"></path>
                  <path d="M7 12h10"></path>
                  <path d="M10 17h4"></path>
                </svg>
                <span>{t('shop.filters.title')}</span>
              </button>

              <div className="zpos-tabs" role="tablist" aria-label={t('shop.tabs.ariaLabel')} ref={tabsRef}>
                {['all', 'smartphones', 'laptops'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`zpos-tab ${tab === value ? 'is-active' : ''}`}
                    onClick={() => setTab(value)}
                  >
                    <span>{value === 'all' ? t('common.all') : t(labelForDevice[value])}</span>
                  </button>
                ))}
                <span
                  className="zpos-tab-indicator"
                  aria-hidden="true"
                  style={tabIndicatorStyle}
                />
              </div>

              <label className="zpos-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="M20 20l-3.5-3.5"></path>
                </svg>
                <input
                  id="zpos-search"
                  type="search"
                  placeholder={t('shop.searchPlaceholder')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <div className="zpos-results-meta">
                <span className="zpos-results-label" id="zpos-results-title">
                  {t(deviceTitles[tab] || deviceTitles.all)}
                </span>
                <strong id="zpos-results-count">{isProductsLoading ? '...' : visibleProducts.length}</strong>
                <span>{t('shop.visible')}</span>
              </div>
            </div>
          </div>

          <div className="zpos-grid-scroll">
            <div
              id="zpos-grid"
              className={`zpos-grid ${gridStage === 'leave' ? 'is-switching' : ''}`}
              aria-live="polite"
            >
              {isProductsLoading &&
                Array.from({ length: 12 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="zpos-card zpos-card--skeleton is-visible">
                    <div className="zpos-thumb zpos-skeleton zpos-skeleton--thumb" />
                    <div className="zpos-card-body">
                      <div className="zpos-skeleton zpos-skeleton--meta" />
                      <div className="zpos-skeleton zpos-skeleton--title" />
                      <div className="zpos-skeleton zpos-skeleton--issue" />
                      <div className="zpos-card-footer">
                        <div className="zpos-price">
                          <div className="zpos-skeleton zpos-skeleton--price" />
                        </div>
                        <div className="zpos-skeleton zpos-skeleton--button" />
                      </div>
                    </div>
                  </div>
                ))}

              {!isProductsLoading && gridProducts.length === 0 && (
                <div className={`zpos-empty zpos-empty--grid ${gridStage === 'leave' ? '' : 'is-visible'}`}>
                  <strong>{t('shop.empty.title')}</strong>
                  <p>{t('shop.empty.description')}</p>
                </div>
              )}

              {!isProductsLoading && gridProducts.map((product, index) => {
                const displayPrice = getDisplayPrice(product);
                const productOnlyAvailable = canBuyProductOnly(product);
                const serviceAvailable = canBuyWithService(product);
                return (
                  <article
                    key={product.id}
                    className={`zpos-card ${gridStage === 'leave' ? 'is-leaving' : 'is-visible'}`}
                    style={{ '--zpos-stagger': index }}
                    tabIndex="0"
                    onClick={() => openModal(product)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openModal(product);
                      }
                    }}
                  >
                    <div className="zpos-thumb">
                      {product.sale_price != null && product.price != null && (
                        <span className="zpos-badge">{t('shop.badges.sale')}</span>
                      )}
                      <img
                        src={product.image_url}
                        alt={t('shop.imageAlt.thumbnail', { title: product.title })}
                        loading="lazy"
                      />
                    </div>
                    <div className="zpos-card-body">
                      <p className="zpos-meta">
                        {[product.brand, t(labelForDevice[product.device_category]), t(labelForPart[product.part_category]), t(labelForSource[product.inventory_source])]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      <h3>{product.title}</h3>
                      <p className="zpos-issue">{product.issue_label}</p>
                      <div className="zpos-card-footer">
                        <div className="zpos-price">
                          {product.sale_price != null && product.price != null && (
                            <span className="zpos-old-price">{formatMoney(product.price)}</span>
                          )}
                          {displayPrice != null ? (
                            <strong>{formatMoney(displayPrice)}</strong>
                          ) : (
                            <span className="zpos-price-note">{t('shop.availability.unavailable')}</span>
                          )}
                          {!productOnlyAvailable && serviceAvailable ? (
                            <span className="zpos-price-note">
                              {t('shop.availability.productOnlyWithService')}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="zpos-add"
                          onClick={(event) => {
                            event.stopPropagation();
                            openModal(product);
                          }}
                        >
                          {t('shop.actions.add')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="zpos-cart" aria-label={t('shop.aria.cart')}>
          <div className="zpos-cart-head">
            <div>
              <p>{t('shop.cart.kicker')}</p>
              <h2>{t('shop.cart.title')}</h2>
            </div>
            <span id="zpos-cart-count" className="zpos-cart-count">
              {cartSummary.count}
            </span>
          </div>

          <div id="zpos-cart-items" className="zpos-cart-items">
            {cart.length === 0 && (
              <div className="zpos-empty">
                <strong>{t('shop.cart.emptyTitle')}</strong>
                <p>{t('shop.cart.emptyDescription')}</p>
              </div>
            )}

            {cart.map((item) => (
              <div
                key={item.id}
                className={`zpos-cart-item ${removingCartIds.includes(item.id) ? 'is-removing' : ''}`}
                ref={(node) => {
                  if (node) {
                    cartItemRefs.current.set(item.id, node);
                  } else {
                    cartItemRefs.current.delete(item.id);
                  }
                }}
              >
                <div className="zpos-cart-item-thumb">
                  <img
                    src={item.image_url}
                    alt={t('shop.imageAlt.thumbnail', { title: item.title })}
                    loading="lazy"
                  />
                </div>
                <div className="zpos-cart-item-main">
                  <p className="zpos-cart-mode">
                    {item.mode === 'service'
                      ? t('shop.choiceLabels.withService')
                      : t('shop.choiceLabels.productOnly')}
                  </p>
                  <h3 title={item.title}>{item.title}</h3>
                  <p className="zpos-cart-item-sub">{item.subtitle}</p>
                </div>
                <div className="zpos-cart-item-footer">
                  <div className="zpos-cart-item-price">{formatMoney(item.price)}</div>
                  <div className="zpos-cart-item-actions">
                    <div className="zpos-qty">
                      <button type="button" onClick={() => updateCart(item.id, 'decrease')}>
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateCart(item.id, 'increase')}>
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="zpos-cart-remove"
                      onClick={() => updateCart(item.id, 'remove')}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="zpos-summary">
            <div className="zpos-summary-row">
              <span>{t('shop.summary.subtotal')}</span>
              <strong id="zpos-subtotal">{formatMoney(cartSummary.subtotal)}</strong>
            </div>
            <div className="zpos-summary-row">
              <span>{t('shop.summary.serviceUplift')}</span>
              <strong id="zpos-service-total">{formatMoney(cartSummary.serviceTotal)}</strong>
            </div>
            <div className="zpos-summary-row is-total">
              <span>{t('shop.summary.prototypeTotal')}</span>
              <strong id="zpos-total">{formatMoney(cartSummary.total)}</strong>
            </div>
            <button
              className="zpos-checkout"
              type="button"
              onClick={openOrderModal}
              disabled={cart.length === 0}
            >
              {t('shop.summary.checkoutDisabled')}
            </button>
          </div>
        </aside>
      </div>

      {modalProduct && (
        <div
          id="zpos-modal-backdrop"
          className={`zpos-modal-backdrop ${modalState === 'open' ? 'is-open' : ''} ${modalState === 'closing' ? 'is-closing' : ''}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="zpos-modal" role="dialog" aria-modal="true" aria-labelledby="zpos-modal-title">
            <button
              type="button"
              className="zpos-modal-close"
              onClick={closeModal}
              aria-label={t('common.close')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>

            <div id="zpos-modal-visual" className="zpos-modal-visual">
              <img
                src={modalProduct.image_url}
                alt={t('shop.imageAlt.preview', { title: modalProduct.title })}
              />
            </div>

            <div className="zpos-modal-content">
              <p id="zpos-modal-kicker" className="zpos-modal-kicker">
                {[modalProduct.brand, t(labelForDevice[modalProduct.device_category]), t(labelForPart[modalProduct.part_category]), t(labelForSource[modalProduct.inventory_source])]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              <h2 id="zpos-modal-title">{modalProduct.title}</h2>
              <p id="zpos-modal-desc" className="zpos-modal-desc">
                {modalProduct.description}
              </p>

              <div className="zpos-modal-prices">
                <button
                  type="button"
                  className={`zpos-choice is-primary ${canBuyProductOnly(modalProduct) ? '' : 'is-disabled'}`}
                  onClick={() => addToCart(modalProduct, 'product')}
                  disabled={!canBuyProductOnly(modalProduct)}
                >
                  <span className="zpos-choice-label">{t('shop.choiceLabels.productOnly')}</span>
                  <strong>
                    {canBuyProductOnly(modalProduct)
                      ? formatMoney(getProductOnlyPrice(modalProduct))
                      : t('shop.availability.productOnlyWithService')}
                  </strong>
                  <small>
                    {canBuyProductOnly(modalProduct)
                      ? t('shop.choiceDescriptions.productOnly')
                      : t('shop.choiceDescriptions.productOnlyUnavailable')}
                  </small>
                </button>

                <button
                  type="button"
                  className={`zpos-choice ${canBuyWithService(modalProduct) ? '' : 'is-disabled'}`}
                  onClick={() => addToCart(modalProduct, 'service')}
                  disabled={!canBuyWithService(modalProduct)}
                >
                  <span className="zpos-choice-label">{t('shop.choiceLabels.withService')}</span>
                  <strong>
                    {canBuyWithService(modalProduct)
                      ? formatMoney(getServicePrice(modalProduct))
                      : t('shop.availability.serviceUnavailable')}
                  </strong>
                  <small>
                    {canBuyWithService(modalProduct)
                      ? t('shop.choiceDescriptions.withService')
                      : t('shop.choiceDescriptions.serviceUnavailable')}
                  </small>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {orderModalState !== 'closed' && (
        <div
          className={`zpos-modal-backdrop ${orderModalState === 'open' ? 'is-open' : ''} ${orderModalState === 'closing' ? 'is-closing' : ''}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderModal();
            }
          }}
        >
          <div className="zpos-modal zpos-order-modal" role="dialog" aria-modal="true" aria-labelledby="zpos-order-title">
            <button
              type="button"
              className="zpos-modal-close"
              onClick={closeOrderModal}
              aria-label={t('common.close')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>

            <div className="zpos-order-modal-body">
              {orderStep !== 4 && (
                <div className="zpos-order-steps">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className={`zpos-order-step ${orderStep >= step ? 'is-active' : ''}`}>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {orderStep === 1 && (
                <div className="zpos-order-panel">
                  <p className="zpos-modal-kicker">{t('shop.orderFlow.stepLabels.1')}</p>
                  <h2 id="zpos-order-title">{t('shop.orderFlow.stepOne.title')}</h2>
                  <div className="zpos-order-grid">
                    <label className="zpos-order-field">
                      <span>{t('shop.orderFlow.stepOne.fields.firstName')}</span>
                      <input
                        type="text"
                        value={orderForm.customer_name}
                        onChange={(event) => updateOrderForm('customer_name', event.target.value)}
                      />
                      {orderErrors.customer_name ? <small>{orderErrors.customer_name}</small> : null}
                    </label>
                    <label className="zpos-order-field">
                      <span>{t('shop.orderFlow.stepOne.fields.lastName')}</span>
                      <input
                        type="text"
                        value={orderForm.customer_last_name}
                        onChange={(event) => updateOrderForm('customer_last_name', event.target.value)}
                      />
                      {orderErrors.customer_last_name ? <small>{orderErrors.customer_last_name}</small> : null}
                    </label>
                    <label className="zpos-order-field">
                      <span>{t('shop.orderFlow.stepOne.fields.phone')}</span>
                      <input
                        type="tel"
                        value={orderForm.customer_phone}
                        onChange={(event) => updateOrderForm('customer_phone', event.target.value)}
                      />
                      {orderErrors.customer_phone ? <small>{orderErrors.customer_phone}</small> : null}
                    </label>
                    <label className="zpos-order-field">
                      <span>{t('shop.orderFlow.stepOne.fields.email')}</span>
                      <input
                        type="email"
                        value={orderForm.customer_email}
                        onChange={(event) => updateOrderForm('customer_email', event.target.value)}
                      />
                      {orderErrors.customer_email ? <small>{orderErrors.customer_email}</small> : null}
                    </label>
                  </div>
                  <div className="zpos-order-actions">
                    <button type="button" className="zpos-order-next" disabled={!stepOneValid} onClick={goToStepTwo}>
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              )}

              {orderStep === 2 && (
                <div className="zpos-order-panel">
                  <p className="zpos-modal-kicker">{t('shop.orderFlow.stepLabels.2')}</p>
                  <h2 id="zpos-order-title">{t('shop.orderFlow.stepTwo.title')}</h2>
                  <label className="zpos-order-field">
                    <span>{t('shop.orderFlow.stepTwo.heardAbout')}</span>
                    <select
                      value={orderForm.heard_about}
                      onChange={(event) => updateOrderForm('heard_about', event.target.value)}
                    >
                      <option value="">{t('shop.orderFlow.stepTwo.selectPlaceholder')}</option>
                      {heardAboutOptions.map((value) => (
                        <option key={value} value={value}>
                          {t(`shop.orderFlow.heardAbout.${value}`)}
                        </option>
                      ))}
                    </select>
                    {orderErrors.heard_about ? <small>{orderErrors.heard_about}</small> : null}
                  </label>

                  <div className="zpos-order-warranty-block">
                    <span className="zpos-order-block-title">{t('shop.orderFlow.stepTwo.partnerWarranty')}</span>
                    <div className="zpos-order-choice-row">
                      <button
                        type="button"
                        className={`zpos-order-choice ${orderForm.has_partner_warranty === true ? 'is-active' : ''}`}
                        onClick={() => updateOrderForm('has_partner_warranty', true)}
                      >
                        {t('shop.orderFlow.common.yes')}
                      </button>
                      <button
                        type="button"
                        className={`zpos-order-choice ${orderForm.has_partner_warranty === false ? 'is-active' : ''}`}
                        onClick={() => updateOrderForm('has_partner_warranty', false)}
                      >
                        {t('shop.orderFlow.common.no')}
                      </button>
                    </div>
                    {orderErrors.has_partner_warranty ? <small className="zpos-order-error-inline">{orderErrors.has_partner_warranty}</small> : null}
                    <div className="zpos-order-partners">
                      <div className="zpos-order-partner">Logo</div>
                      <div className="zpos-order-partner">Logo</div>
                      <div className="zpos-order-partner">Logo</div>
                    </div>
                  </div>

                  {orderForm.has_partner_warranty && (
                    <label className="zpos-order-field">
                      <span>{t('shop.orderFlow.stepTwo.warrantyId')}</span>
                      <input
                        type="text"
                        value={orderForm.partner_warranty_id}
                        onChange={(event) => updateOrderForm('partner_warranty_id', event.target.value)}
                      />
                      {orderErrors.partner_warranty_id ? <small>{orderErrors.partner_warranty_id}</small> : null}
                    </label>
                  )}

                  <div className="zpos-order-actions">
                    <button type="button" className="zpos-order-back" onClick={() => setOrderStep(1)}>
                      {t('common.back')}
                    </button>
                    <button type="button" className="zpos-order-next" disabled={!stepTwoValid} onClick={goToStepThree}>
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              )}

              {orderStep === 3 && (
                <div className="zpos-order-panel">
                  <p className="zpos-modal-kicker">{t('shop.orderFlow.stepLabels.3')}</p>
                  <h2 id="zpos-order-title">{t('shop.orderFlow.stepThree.title')}</h2>
                  <div className="zpos-order-payment-grid">
                    <button type="button" className="zpos-choice is-disabled" disabled>
                      <span className="zpos-choice-label">{t('shop.orderFlow.stepThree.payOnline')}</span>
                      <small>{t('shop.orderFlow.stepThree.onlineDisabled')}</small>
                    </button>
                    <button
                      type="button"
                      className="zpos-choice is-primary"
                      onClick={submitOnsiteOrder}
                      disabled={orderMutation.isLoading}
                    >
                      <span className="zpos-choice-label">{t('shop.orderFlow.stepThree.payOnsite')}</span>
                      <small>
                        {orderMutation.isLoading
                          ? t('shop.orderFlow.stepThree.processing')
                          : t('shop.orderFlow.stepThree.payOnsiteDescription')}
                      </small>
                    </button>
                  </div>
                  {orderErrors.submit ? <p className="zpos-order-submit-error">{orderErrors.submit}</p> : null}
                  <div className="zpos-order-actions">
                    <button type="button" className="zpos-order-back" onClick={() => setOrderStep(2)} disabled={orderMutation.isLoading}>
                      {t('common.back')}
                    </button>
                  </div>
                </div>
              )}

              {orderStep === 4 && createdOrder && (
                <div className="zpos-order-panel zpos-order-success">
                  <p className="zpos-modal-kicker">{t('shop.orderFlow.success.kicker')}</p>
                  <h2 id="zpos-order-title">
                    {t('shop.orderFlow.success.title', { customer_name: createdOrder.customer_name })}
                  </h2>
                  <p>{t('shop.orderFlow.success.orderNumber', { order_number: createdOrder.order_number })}</p>
                  <p>
                    {t('shop.orderFlow.success.contact', {
                      customer_phone_number: createdOrder.customer_phone,
                    })}
                  </p>
                  <strong>{t('shop.orderFlow.success.thankYou')}</strong>
                  <div className="zpos-order-actions">
                    <button type="button" className="zpos-order-next" onClick={closeOrderModal}>
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
