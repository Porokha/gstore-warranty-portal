import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';
import '../../styles/shop.css';
import gstoreLogo from '../../assets/gstore-logo.svg';
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

const popularBrandNames = ['apple', 'samsung', 'google', 'sony', 'lenovo', 'microsoft'];

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
const MODAL_CLOSE_MS = 260;
const CART_REMOVE_MS = 220;
const ORDER_MODAL_CLOSE_MS = 260;
const FILTER_DRAWER_CLOSE_MS = 220;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPACT_CART_WIDTH = 920;
const COMPACT_CART_HEIGHT = 919;

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

const FilterOptionList = ({
  allLabel,
  allActive,
  options,
  selectedValues,
  onToggle,
  onAll,
  getLabel = (value) => value,
  searchPlaceholder = 'Search',
  showLessLabel = 'Show less',
  showMoreLabel = (count) => `Show ${count} more`,
  enableSearch = true,
  showAllButton = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const searchable = enableSearch && options.length > 5;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => getLabel(option).toLowerCase().includes(normalizedQuery))
    : options;
  const visibleOptions = searchable && !expanded ? filteredOptions.slice(0, 5) : filteredOptions;

  return (
    <>
      {searchable ? (
        <label className="zpos-filter-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="M20 20l-3.5-3.5"></path>
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(true);
            }}
            placeholder={searchPlaceholder}
          />
        </label>
      ) : null}

      <div className="zpos-filter-list">
        {showAllButton ? (
          <button
            type="button"
            className={`zpos-filter-pill ${allActive ? 'is-active' : ''}`}
            onClick={onAll}
          >
            <span>{allLabel}</span>
          </button>
        ) : null}
        {visibleOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={`zpos-filter-pill ${selectedValues.includes(option) ? 'is-active' : ''}`}
            onClick={() => onToggle(option)}
          >
            <span>{getLabel(option)}</span>
          </button>
        ))}
      </div>

      {searchable && filteredOptions.length > 5 ? (
        <button
          type="button"
          className="zpos-filter-expand"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? showLessLabel : showMoreLabel(filteredOptions.length - 5)}
        </button>
      ) : null}
    </>
  );
};

const BrandFilterList = ({
  allLabel,
  allActive,
  options,
  selectedValues,
  onToggle,
  onAll,
  searchPlaceholder,
  showLessLabel,
  showMoreLabel,
  othersLabel,
}) => {
  const [showOthers, setShowOthers] = useState(false);
  const popularOptions = popularBrandNames
    .map((popularBrand) => options.find((brand) => brand.toLowerCase() === popularBrand))
    .filter(Boolean);
  const popularSet = new Set(popularOptions.map((brand) => brand.toLowerCase()));
  const otherOptions = options.filter((brand) => !popularSet.has(brand.toLowerCase()));
  const hasSelectedOther = selectedValues.some((brand) => !popularSet.has(brand.toLowerCase()));

  return (
    <>
      <div className="zpos-filter-list">
        <button
          type="button"
          className={`zpos-filter-pill ${allActive ? 'is-active' : ''}`}
          onClick={onAll}
        >
          <span>{allLabel}</span>
        </button>
        {popularOptions.map((brand) => (
          <button
            key={brand}
            type="button"
            className={`zpos-filter-pill ${selectedValues.includes(brand) ? 'is-active' : ''}`}
            onClick={() => onToggle(brand)}
          >
            <span>{brand}</span>
          </button>
        ))}
        {otherOptions.length > 0 ? (
          <button
            type="button"
            className={`zpos-filter-pill ${showOthers || hasSelectedOther ? 'is-active' : ''}`}
            onClick={() => setShowOthers((current) => !current)}
          >
            <span>{othersLabel}</span>
          </button>
        ) : null}
      </div>

      {showOthers ? (
        <div className="zpos-filter-others">
          <FilterOptionList
            allLabel={allLabel}
            allActive={false}
            options={otherOptions}
            selectedValues={selectedValues}
            onToggle={onToggle}
            onAll={onAll}
            searchPlaceholder={searchPlaceholder}
            showLessLabel={showLessLabel}
            showMoreLabel={showMoreLabel}
            showAllButton={false}
          />
        </div>
      ) : null}
    </>
  );
};

const ShopPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('all');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sources, setSources] = useState(['oem', 'third-party']);
  const [cart, setCart] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalState, setModalState] = useState('closed');
  const [gridProducts, setGridProducts] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersClosing, setFiltersClosing] = useState(false);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});
  const [removingCartIds, setRemovingCartIds] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const [orderModalState, setOrderModalState] = useState('closed');
  const [orderStep, setOrderStep] = useState(1);
  const [orderForm, setOrderForm] = useState(createInitialOrderForm);
  const [orderErrors, setOrderErrors] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);
  const [compactCart, setCompactCart] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [pullRefresh, setPullRefresh] = useState({ active: false, ready: false, distance: 0 });
  const [productPage, setProductPage] = useState(1);
  const [showSlowProductLoader, setShowSlowProductLoader] = useState(false);
  const rootRef = useRef(null);
  const gridScrollRef = useRef(null);
  const tabsRef = useRef(null);
  const modalCloseTimerRef = useRef(null);
  const orderModalCloseTimerRef = useRef(null);
  const filterDrawerCloseTimerRef = useRef(null);
  const cartRemoveTimersRef = useRef(new Map());
  const loadingNextPageRef = useRef(false);

  const publicProductParams = useMemo(
    () => ({
      page: productPage,
      limit: 80,
      device: tab === 'all' ? undefined : tab,
      brand: brands.length > 0 ? brands.join(',') : undefined,
      model: models.length > 0 ? models.join(',') : undefined,
      part: parts.length > 0 ? parts.join(',') : undefined,
      source: sources.length < 2 ? sources.join(',') : undefined,
      search: search.trim() || undefined,
      price_min: priceMin === '' ? undefined : Number(priceMin),
      price_max: priceMax === '' ? undefined : Number(priceMax),
    }),
    [brands, models, parts, priceMax, priceMin, productPage, search, sources, tab],
  );
  const publicFacetParams = useMemo(
    () => ({
      device: tab === 'all' ? undefined : tab,
      brand: brands.length > 0 ? brands.join(',') : undefined,
      model: models.length > 0 ? models.join(',') : undefined,
      part: parts.length > 0 ? parts.join(',') : undefined,
      source: sources.length < 2 ? sources.join(',') : undefined,
      search: search.trim() || undefined,
      price_min: priceMin === '' ? undefined : Number(priceMin),
      price_max: priceMax === '' ? undefined : Number(priceMax),
    }),
    [brands, models, parts, priceMax, priceMin, search, sources, tab],
  );
  const { data: productsResult, isLoading: isProductsLoading, isFetching: isProductsFetching } = useQuery(
    ['shop-public-products', publicProductParams],
    () => shopService.getPublicProducts(publicProductParams),
    { keepPreviousData: true },
  );
  const products = productsResult?.items || [];
  const productsTotal = productsResult?.total || products.length;
  const hasMoreProducts = gridProducts.length < productsTotal;
  const isInitialProductsLoading = isProductsLoading && gridProducts.length === 0;
  const isFilteringProducts = isProductsFetching && productPage === 1 && gridProducts.length > 0;
  const shouldShowProductLoader = isFilteringProducts && showSlowProductLoader;
  const { data: productFacets = { brands: [], models: [], parts: [] } } = useQuery(
    ['shop-public-facets', publicFacetParams],
    () => shopService.getPublicProductFacets(publicFacetParams),
    { staleTime: 5 * 60 * 1000 },
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
      window.clearTimeout(filterDrawerCloseTimerRef.current);
      cartRemoveTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      cartRemoveTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
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
      document.documentElement.style.setProperty('--zpos-app-height', `${window.innerHeight}px`);

      const shouldUseCompactCart =
        window.innerWidth <= COMPACT_CART_WIDTH && window.innerHeight <= COMPACT_CART_HEIGHT;

      setCompactCart((current) => {
        if (current !== shouldUseCompactCart) {
          setCartExpanded(!shouldUseCompactCart);
        }
        return shouldUseCompactCart;
      });

      if (window.innerWidth > 920) {
        setFiltersClosing(false);
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
        closeFilters();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.removeProperty('--zpos-app-height');
    };
  }, []);

  useEffect(() => {
    const scrollNode = gridScrollRef.current;
    if (!scrollNode) {
      return undefined;
    }

    let startY = 0;
    let pullDistance = 0;
    let shouldTrack = false;
    const threshold = 72;

    const onTouchStart = (event) => {
      if (window.innerWidth > 920 || modalProduct || orderModalState !== 'closed' || filtersOpen) {
        shouldTrack = false;
        return;
      }

      shouldTrack = scrollNode.scrollTop <= 0;
      if (!shouldTrack) {
        return;
      }

      startY = event.touches[0]?.clientY || 0;
      pullDistance = 0;
      setPullRefresh({ active: true, ready: false, distance: 0 });
    };

    const onTouchMove = (event) => {
      if (!shouldTrack) {
        return;
      }

      const currentY = event.touches[0]?.clientY || 0;
      pullDistance = currentY - startY;

      if (pullDistance > 0) {
        event.preventDefault();
        const distance = Math.min(pullDistance, 96);
        setPullRefresh({
          active: true,
          ready: distance >= threshold,
          distance,
        });
      }
    };

    const onTouchEnd = () => {
      if (shouldTrack && pullDistance > threshold) {
        setPullRefresh({ active: true, ready: true, distance: threshold });
        window.location.reload();
        return;
      }

      shouldTrack = false;
      pullDistance = 0;
      setPullRefresh({ active: false, ready: false, distance: 0 });
    };

    scrollNode.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollNode.addEventListener('touchmove', onTouchMove, { passive: false });
    scrollNode.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      scrollNode.removeEventListener('touchstart', onTouchStart);
      scrollNode.removeEventListener('touchmove', onTouchMove);
      scrollNode.removeEventListener('touchend', onTouchEnd);
    };
  }, [filtersOpen, modalProduct, orderModalState]);

  const heardAboutOptions = useMemo(
    () => ['facebook', 'instagram', 'tiktok', 'friend', 'google', 'ai'],
    [],
  );
  const orderStepMeta = useMemo(
    () => [
      {
        id: 1,
        label: t('shop.orderFlow.stepLabels.1'),
        title: t('shop.orderFlow.stepOne.title'),
      },
      {
        id: 2,
        label: t('shop.orderFlow.stepLabels.2'),
        title: t('shop.orderFlow.stepTwo.title'),
      },
      {
        id: 3,
        label: t('shop.orderFlow.stepLabels.3'),
        title: t('shop.orderFlow.stepThree.title'),
      },
    ],
    [t],
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

  const visibleProducts = products;

  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set([...(productFacets.brands || []).map((item) => item.value).filter(Boolean), ...brands]),
      ),
    [brands, productFacets.brands],
  );
  const modelOptions = useMemo(
    () =>
      Array.from(
        new Set([...(productFacets.models || []).map((item) => item.value).filter(Boolean), ...models]),
      ),
    [models, productFacets.models],
  );
  const dynamicPartOptions = useMemo(() => {
    const availableParts = new Set((productFacets.parts || []).map((item) => item.value));
    const filtered = partOptions.filter(([value]) => value === 'all' || availableParts.has(value));
    return filtered.length > 1 ? filtered : partOptions;
  }, [productFacets.parts]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const serviceTotal = total - subtotal;
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    return { subtotal, total, serviceTotal, count };
  }, [cart]);

  useEffect(() => {
    if (!isProductsLoading) {
      setGridProducts((current) =>
        productPage === 1 ? visibleProducts : [...current, ...visibleProducts],
      );
    }
  }, [isProductsLoading, productPage, visibleProducts]);

  useEffect(() => {
    if (!isFilteringProducts) {
      setShowSlowProductLoader(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowSlowProductLoader(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isFilteringProducts]);

  useEffect(() => {
    if (!isProductsFetching) {
      loadingNextPageRef.current = false;
    }
  }, [isProductsFetching]);

  useEffect(() => {
    const scrollNode = gridScrollRef.current;
    if (!scrollNode) {
      return undefined;
    }

    const handleScroll = () => {
      if (!hasMoreProducts || isProductsFetching || loadingNextPageRef.current) {
        return;
      }

      const remaining =
        scrollNode.scrollHeight - scrollNode.scrollTop - scrollNode.clientHeight;

      if (remaining < 520) {
        loadingNextPageRef.current = true;
        setProductPage((current) => current + 1);
      }
    };

    scrollNode.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollNode.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreProducts, isProductsFetching]);

  useEffect(() => {
    setProductPage(1);
    loadingNextPageRef.current = false;
  }, [brands, models, parts, priceMax, priceMin, search, sources, tab]);

  const handleImageReady = (key) => {
    setLoadedImages((current) => (current[key] ? current : { ...current, [key]: true }));
  };

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

  const toggleModel = (model) => {
    if (model === 'all') {
      setModels([]);
      return;
    }

    setModels((current) =>
      current.includes(model) ? current.filter((value) => value !== model) : [...current, model],
    );
  };

  const resetFilters = () => {
    setTab('all');
    setBrands([]);
    setModels([]);
    setParts([]);
    setSearch('');
    setPriceMin('');
    setPriceMax('');
    setSources(['oem', 'third-party']);
    closeFilters();
  };

  const openFilters = () => {
    window.clearTimeout(filterDrawerCloseTimerRef.current);
    setFiltersClosing(false);
    setFiltersOpen(true);
  };

  const closeFilters = () => {
    if (!filtersOpen && !filtersClosing) {
      return;
    }

    setFiltersClosing(true);
    setFiltersOpen(false);
    window.clearTimeout(filterDrawerCloseTimerRef.current);
    filterDrawerCloseTimerRef.current = window.setTimeout(() => {
      setFiltersClosing(false);
    }, FILTER_DRAWER_CLOSE_MS);
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

  const toggleCartExpanded = () => {
    if (!compactCart) {
      return;
    }
    setCartExpanded((current) => !current);
  };

  return (
    <div
      id="zpos-root"
      ref={rootRef}
      className={`zpos-root ${filtersOpen ? 'zpos-filters-open' : ''} ${filtersClosing ? 'zpos-filters-closing' : ''} ${compactCart ? 'zpos-compact-cart-mode' : ''}`}
      aria-label={t('shop.ariaLabel')}
    >
      <button
        type="button"
        className="zpos-filter-overlay"
        aria-label={t('shop.filters.close')}
        onClick={closeFilters}
        tabIndex={filtersOpen || filtersClosing ? 0 : -1}
      />

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
                <p>{t('shop.filters.partTypeKicker')}</p>
                <h3>{t('shop.filters.partTypeTitle')}</h3>
              </div>
              <FilterOptionList
                allLabel={t('common.all')}
                allActive={parts.length === 0}
                options={dynamicPartOptions.filter(([value]) => value !== 'all').map(([value]) => value)}
                selectedValues={parts}
                onToggle={togglePart}
                onAll={() => togglePart('all')}
                getLabel={(value) =>
                  t(dynamicPartOptions.find(([partValue]) => partValue === value)?.[1] || value)
                }
                searchPlaceholder={t('shop.filters.searchOptions')}
                showLessLabel={t('shop.filters.showLess')}
                showMoreLabel={(count) => t('shop.filters.showMore', { count })}
                enableSearch={false}
              />
            </section>

            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.brandKicker')}</p>
                <h3>{t('shop.filters.brandTitle')}</h3>
              </div>
              <BrandFilterList
                allLabel={t('shop.filters.allBrands')}
                allActive={brands.length === 0}
                options={brandOptions}
                selectedValues={brands}
                onToggle={toggleBrand}
                onAll={() => toggleBrand('all')}
                searchPlaceholder={t('shop.filters.searchOptions')}
                showLessLabel={t('shop.filters.showLess')}
                showMoreLabel={(count) => t('shop.filters.showMore', { count })}
                othersLabel={t('shop.filters.otherBrands')}
              />
            </section>

            <section className="zpos-filter-section">
              <div className="zpos-section-head">
                <p>{t('shop.filters.modelKicker')}</p>
                <h3>{t('shop.filters.modelTitle')}</h3>
              </div>
              <FilterOptionList
                allLabel={t('shop.filters.allModels')}
                allActive={models.length === 0}
                options={modelOptions}
                selectedValues={models}
                onToggle={toggleModel}
                onAll={() => toggleModel('all')}
                searchPlaceholder={t('shop.filters.searchOptions')}
                showLessLabel={t('shop.filters.showLess')}
                showMoreLabel={(count) => t('shop.filters.showMore', { count })}
              />
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
                onClick={openFilters}
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
                <strong id="zpos-results-count">{isInitialProductsLoading ? '...' : productsTotal}</strong>
                <span>{t('shop.visible')}</span>
              </div>
            </div>
          </div>

          <div className="zpos-grid-scroll" ref={gridScrollRef}>
            <div
              className={`zpos-pull-indicator ${pullRefresh.active ? 'is-active' : ''} ${pullRefresh.ready ? 'is-ready' : ''}`}
              style={{ '--zpos-pull-distance': `${pullRefresh.distance}px` }}
              aria-hidden="true"
            >
              <span className="zpos-pull-indicator-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 5v14"></path>
                  <path d="M7 10l5-5 5 5"></path>
                </svg>
              </span>
            </div>
            <div
              id="zpos-grid"
              className={`zpos-grid ${isFilteringProducts ? 'is-refetching' : ''}`}
              aria-live="polite"
            >
              {isInitialProductsLoading &&
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

              {!isProductsFetching && !isInitialProductsLoading && gridProducts.length === 0 && (
                <div className="zpos-empty zpos-empty--grid is-visible">
                  <strong>{t('shop.empty.title')}</strong>
                  <p>{t('shop.empty.description')}</p>
                </div>
              )}

              {!isInitialProductsLoading && gridProducts.map((product) => {
                const displayPrice = getDisplayPrice(product);
                const productOnlyAvailable = canBuyProductOnly(product);
                const serviceAvailable = canBuyWithService(product);
                return (
                  <article
                    key={product.id}
                    className="zpos-card is-visible"
                    tabIndex="0"
                    onClick={() => openModal(product)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openModal(product);
                      }
                    }}
                  >
                    <div className={`zpos-thumb ${loadedImages[`product:${product.id}`] ? 'is-loaded' : ''}`}>
                      {product.sale_price != null && product.price != null && (
                        <span className="zpos-badge">{t('shop.badges.sale')}</span>
                      )}
                      {!loadedImages[`product:${product.id}`] && (
                        <div className="zpos-skeleton zpos-skeleton--thumb zpos-image-skeleton" />
                      )}
                      <img
                        src={product.image_url}
                        alt={t('shop.imageAlt.thumbnail', { title: product.title })}
                        loading="lazy"
                        onLoad={() => handleImageReady(`product:${product.id}`)}
                        onError={() => handleImageReady(`product:${product.id}`)}
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
                          aria-label={t('shop.actions.add')}
                          onClick={(event) => {
                            event.stopPropagation();
                            openModal(product);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {shouldShowProductLoader && (
                <div className="zpos-product-loader" role="status" aria-live="polite">
                  <div className="zpos-product-loader-orb" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <strong>{t('shop.loading.title')}</strong>
                  <p>{t('shop.loading.description')}</p>
                </div>
              )}
            </div>
            {!isInitialProductsLoading && (hasMoreProducts || isProductsFetching) && (
              <button
                type="button"
                className={`zpos-load-more ${isProductsFetching ? 'is-loading' : ''}`}
                onClick={() => setProductPage((current) => current + 1)}
                disabled={isProductsFetching || !hasMoreProducts}
              >
                {isProductsFetching ? 'Loading more...' : 'Load more'}
              </button>
            )}
          </div>
        </main>

        <aside
          className={`zpos-cart ${compactCart ? 'zpos-cart--compact' : ''} ${compactCart && cartExpanded ? 'is-expanded' : ''}`}
          aria-label={t('shop.aria.cart')}
        >
          <div className="zpos-cart-head">
            <div className="zpos-cart-head-main">
              <p>{t('shop.cart.kicker')}</p>
              <h2>{t('shop.cart.title')}</h2>
            </div>
            {compactCart ? (
              <div className="zpos-cart-head-side">
                <strong className="zpos-cart-head-total">{formatMoney(cartSummary.total)}</strong>
                <button
                  id="zpos-cart-count"
                  type="button"
                  className={`zpos-cart-count zpos-cart-toggle ${cartExpanded ? 'is-expanded' : ''}`}
                  aria-label={cartExpanded ? t('common.close') : t('shop.aria.cart')}
                  aria-expanded={cartExpanded}
                  onClick={toggleCartExpanded}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 14l5-5 5 5"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <span id="zpos-cart-count" className="zpos-cart-count">
                {cartSummary.count}
              </span>
            )}
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
              >
                <div className={`zpos-cart-item-thumb ${loadedImages[`cart:${item.id}`] ? 'is-loaded' : ''}`}>
                  {!loadedImages[`cart:${item.id}`] && (
                    <div className="zpos-skeleton zpos-image-skeleton" />
                  )}
                  <img
                    src={item.image_url}
                    alt={t('shop.imageAlt.thumbnail', { title: item.title })}
                    loading="lazy"
                    onLoad={() => handleImageReady(`cart:${item.id}`)}
                    onError={() => handleImageReady(`cart:${item.id}`)}
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

            <div
              id="zpos-modal-visual"
              className={`zpos-modal-visual ${loadedImages[`modal:${modalProduct.id}`] ? 'is-loaded' : ''}`}
            >
              {!loadedImages[`modal:${modalProduct.id}`] && (
                <div className="zpos-skeleton zpos-image-skeleton" />
              )}
              <img
                src={modalProduct.image_url}
                alt={t('shop.imageAlt.preview', { title: modalProduct.title })}
                onLoad={() => handleImageReady(`modal:${modalProduct.id}`)}
                onError={() => handleImageReady(`modal:${modalProduct.id}`)}
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
              {orderStep !== 4 ? (
                <>
                  <div className="zpos-order-hero">
                    <div className="zpos-order-hero-copy">
                      <p className="zpos-modal-kicker">{orderStepMeta[orderStep - 1]?.label}</p>
                      <h2 id="zpos-order-title">{orderStepMeta[orderStep - 1]?.title}</h2>
                      <p className="zpos-order-hero-text">
                        {t('shop.orderFlow.summaryLine', { count: cartSummary.count })}
                      </p>
                    </div>
                    <div className="zpos-order-hero-stats" aria-label="Order summary">
                      <div className="zpos-order-hero-stat">
                        <span>{t('shop.cart.title')}</span>
                        <strong>{cartSummary.count}</strong>
                      </div>
                      <div className="zpos-order-hero-stat">
                        <span>{t('shop.cart.total')}</span>
                        <strong>{formatMoney(cartSummary.total)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="zpos-order-progress">
                    <div className="zpos-order-progress-bar">
                      <span
                        style={{
                          width: `${((orderStep - 1) / (orderStepMeta.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="zpos-order-steps">
                      {orderStepMeta.map((step) => (
                        <div
                          key={step.id}
                          className={`zpos-order-step ${orderStep > step.id ? 'is-complete' : ''} ${orderStep === step.id ? 'is-current' : ''}`}
                        >
                          <span className="zpos-order-step-index">{step.id}</span>
                          <div className="zpos-order-step-copy">
                            <small>{step.title}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="zpos-order-layout">
                    <div className="zpos-order-panel">
                      {orderStep === 1 && (
                        <>
                          <div className="zpos-order-panel-head">
                            <h3>{t('shop.orderFlow.stepOne.title')}</h3>
                          </div>
                          <div className="zpos-order-grid">
                            <label className={`zpos-order-field zpos-order-field--floating ${orderForm.customer_name ? 'has-value' : ''}`}>
                              <span>{t('shop.orderFlow.stepOne.fields.firstName')}</span>
                              <input
                                type="text"
                                placeholder=" "
                                value={orderForm.customer_name}
                                onChange={(event) => updateOrderForm('customer_name', event.target.value)}
                              />
                              {orderErrors.customer_name ? <small>{orderErrors.customer_name}</small> : null}
                            </label>
                            <label className={`zpos-order-field zpos-order-field--floating ${orderForm.customer_last_name ? 'has-value' : ''}`}>
                              <span>{t('shop.orderFlow.stepOne.fields.lastName')}</span>
                              <input
                                type="text"
                                placeholder=" "
                                value={orderForm.customer_last_name}
                                onChange={(event) => updateOrderForm('customer_last_name', event.target.value)}
                              />
                              {orderErrors.customer_last_name ? <small>{orderErrors.customer_last_name}</small> : null}
                            </label>
                            <label className={`zpos-order-field zpos-order-field--floating ${orderForm.customer_phone ? 'has-value' : ''}`}>
                              <span>{t('shop.orderFlow.stepOne.fields.phone')}</span>
                              <input
                                type="tel"
                                placeholder=" "
                                value={orderForm.customer_phone}
                                onChange={(event) => updateOrderForm('customer_phone', event.target.value)}
                              />
                              {orderErrors.customer_phone ? <small>{orderErrors.customer_phone}</small> : null}
                            </label>
                            <label className={`zpos-order-field zpos-order-field--floating ${orderForm.customer_email ? 'has-value' : ''}`}>
                              <span>{t('shop.orderFlow.stepOne.fields.email')}</span>
                              <input
                                type="email"
                                placeholder=" "
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
                        </>
                      )}

                      {orderStep === 2 && (
                        <>
                          <div className="zpos-order-panel-head">
                            <h3>{t('shop.orderFlow.stepTwo.title')}</h3>
                          </div>
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
                            {gstoreLogo ? (
                              <div className="zpos-order-partners">
                                <div className="zpos-order-partner">
                                  <img src={gstoreLogo} alt="Gstore" />
                                </div>
                              </div>
                            ) : null}
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
                        </>
                      )}

                      {orderStep === 3 && (
                        <>
                          <div className="zpos-order-panel-head">
                            <h3>{t('shop.orderFlow.stepThree.title')}</h3>
                          </div>
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
                        </>
                      )}
                    </div>

                    <aside className="zpos-order-sidebar">
                      <div className="zpos-order-sidebar-block">
                        <p>{t('shop.cart.title')}</p>
                        <strong>{formatMoney(cartSummary.total)}</strong>
                        <span>{t('shop.orderFlow.summaryCount', { count: cartSummary.count })}</span>
                      </div>
                      <div className="zpos-order-sidebar-list">
                        {cart.map((item) => (
                          <div key={`order-summary-${item.id}`} className="zpos-order-sidebar-item">
                            <div>
                              <strong>{item.title}</strong>
                              <small>{item.mode === 'service' ? t('shop.choiceLabels.withService') : t('shop.choiceLabels.productOnly')}</small>
                            </div>
                            <span>{formatMoney(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>
                </>
              ) : (
                createdOrder && (
                  <div className="zpos-order-panel zpos-order-success">
                    <div className="zpos-order-success-head">
                      <p className="zpos-order-success-kicker">{t('shop.orderFlow.success.kicker')}</p>
                      <h2 id="zpos-order-title">
                        {t('shop.orderFlow.success.title', { customer_name: createdOrder.customer_name })}
                      </h2>
                    </div>
                    <div className="zpos-order-success-grid">
                      <div className="zpos-order-success-card">
                        <span>{t('shop.orderFlow.success.kicker')}</span>
                        <strong>{t('shop.orderFlow.success.orderNumber', { order_number: createdOrder.order_number })}</strong>
                      </div>
                      <div className="zpos-order-success-card">
                        <span>{t('shop.orderFlow.stepOne.fields.phone')}</span>
                        <strong>{createdOrder.customer_phone}</strong>
                      </div>
                    </div>
                    <p className="zpos-order-success-copy">
                      {t('shop.orderFlow.success.contact', {
                        customer_phone_number: createdOrder.customer_phone,
                      })}
                    </p>
                    <div className="zpos-order-success-foot">
                      <strong>{t('shop.orderFlow.success.thankYou')}</strong>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
