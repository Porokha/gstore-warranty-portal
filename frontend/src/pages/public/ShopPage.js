import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BatteryChargingFullOutlined,
  BoltOutlined,
  BuildOutlined,
  CameraAltOutlined,
  CategoryOutlined,
  CropPortraitOutlined,
  DeveloperBoardOutlined,
  DeleteOutline,
  PhoneIphoneOutlined,
  SensorsOutlined,
  VolumeUpOutlined,
} from '@mui/icons-material';
import '../../styles/shop.css';
import '../../styles/shop-figma.css';
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

const SHOP_PAGE_SIZE = 24;

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

const iconForPart = {
  board: DeveloperBoardOutlined,
  screen: CropPortraitOutlined,
  sensor: SensorsOutlined,
  battery: BatteryChargingFullOutlined,
  camera: CameraAltOutlined,
  speaker: VolumeUpOutlined,
  charging: BoltOutlined,
  accessory: CategoryOutlined,
};

const labelForSource = {
  oem: 'shop.sourceLabels.oem',
  'third-party': 'shop.sourceLabels.thirdParty',
};

const formatMoney = (value) => `₾${Number(value || 0).toFixed(2)}`;

const getProductOnlyPrice = (product) => product.sale_price ?? product.price;
const getServicePrice = (product) => product.service_price;
const getDisplayPrice = (product) => getProductOnlyPrice(product) ?? getServicePrice(product);
const getDiscountPercentage = (product) => {
  const regular = Number(product.price);
  const sale = Number(product.sale_price);
  return regular > 0 && product.sale_price != null && sale < regular
    ? Math.round((1 - sale / regular) * 100)
    : 0;
};
const canBuyProductOnly = (product) => getProductOnlyPrice(product) != null;
const canBuyWithService = (product) => getServicePrice(product) != null;
const MODAL_CLOSE_MS = 260;
const CART_REMOVE_MS = 220;
const ORDER_MODAL_CLOSE_MS = 260;
const FILTER_DRAWER_CLOSE_MS = 220;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPACT_CART_WIDTH = 920;
const COMPACT_CART_HEIGHT = 919;
const SHOP_SEARCH_DEBOUNCE_MS = 260;

const createInitialOrderForm = () => ({
  customer_name: '',
  customer_last_name: '',
  customer_phone: '',
  customer_email: '',
  heard_about: '',
  has_partner_warranty: false,
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

const ProductSkeletonCards = ({ count = 12, prefix = 'skeleton' }) =>
  Array.from({ length: count }).map((_, index) => (
    <div key={`${prefix}-${index}`} className="zpos-card zpos-card--skeleton is-visible">
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
  ));

const ShopPage = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('smartphones');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sources, setSources] = useState(['oem', 'third-party']);
  const [cart, setCart] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [modalWithService, setModalWithService] = useState(false);
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
  const [showSlowFilterLoader, setShowSlowFilterLoader] = useState(false);
  const [shopIntroOpen, setShopIntroOpen] = useState(false);
  const [cartViewOpen, setCartViewOpen] = useState(false);
  const [desktopModelSearch, setDesktopModelSearch] = useState('');
  const [showAllDesktopBrands, setShowAllDesktopBrands] = useState(false);
  const [showAllDesktopModels, setShowAllDesktopModels] = useState(false);
  const rootRef = useRef(null);
  const gridScrollRef = useRef(null);
  const tabsRef = useRef(null);
  const modalCloseTimerRef = useRef(null);
  const orderModalCloseTimerRef = useRef(null);
  const filterDrawerCloseTimerRef = useRef(null);
  const cartRemoveTimersRef = useRef(new Map());
  const loadingNextPageRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SHOP_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search]);

  const publicProductParams = useMemo(
    () => ({
      page: productPage,
      limit: SHOP_PAGE_SIZE,
      device: tab === 'all' ? undefined : tab,
      brand: brands.length > 0 ? brands.join(',') : undefined,
      model: models.length > 0 ? models.join(',') : undefined,
      part: parts.length > 0 ? parts.join(',') : undefined,
      source: sources.length < 2 ? sources.join(',') : undefined,
      search: debouncedSearch || undefined,
      price_min: priceMin === '' ? undefined : Number(priceMin),
      price_max: priceMax === '' ? undefined : Number(priceMax),
    }),
    [brands, debouncedSearch, models, parts, priceMax, priceMin, productPage, sources, tab],
  );
  const publicFacetParams = useMemo(
    () => ({
      device: tab === 'all' ? undefined : tab,
      brand: brands.length > 0 ? brands.join(',') : undefined,
      model: models.length > 0 ? models.join(',') : undefined,
      part: parts.length > 0 ? parts.join(',') : undefined,
      source: sources.length < 2 ? sources.join(',') : undefined,
      search: debouncedSearch || undefined,
      price_min: priceMin === '' ? undefined : Number(priceMin),
      price_max: priceMax === '' ? undefined : Number(priceMax),
    }),
    [brands, debouncedSearch, models, parts, priceMax, priceMin, sources, tab],
  );
  const { data: productsResult, isLoading: isProductsLoading, isFetching: isProductsFetching } = useQuery(
    ['shop-public-products', publicProductParams],
    () => shopService.getPublicProducts(publicProductParams),
    { keepPreviousData: true, staleTime: 60 * 1000 },
  );
  const products = productsResult?.items || [];
  const productsTotal = productsResult?.total || products.length;
  const hasMoreProducts = gridProducts.length < productsTotal;
  const isInitialProductsLoading = isProductsLoading && gridProducts.length === 0;
  const isFilteringProducts = isProductsFetching && productPage === 1 && gridProducts.length > 0;
  const isProductSkeletonLoading =
    isInitialProductsLoading || (isProductsFetching && productPage === 1 && gridProducts.length === 0);
  const isLoadingNextProducts = isProductsFetching && productPage > 1;
  const {
    data: productFacets = { brands: [], models: [], parts: [] },
    isFetching: isFacetsFetching,
  } = useQuery(
    ['shop-public-facets', publicFacetParams],
    () => shopService.getPublicProductFacets(publicFacetParams),
    { keepPreviousData: true, staleTime: 5 * 60 * 1000 },
  );
  const shouldShowFilterLoader = isFacetsFetching && showSlowFilterLoader;
  const orderMutation = useMutation((payload) => shopService.createPublicOrder(payload), {
    onSuccess: (result, variables) => {
      setCreatedOrder({
        ...result,
        customer_last_name: variables.customer_last_name,
        item_count: variables.items.reduce((count, item) => count + item.quantity, 0),
      });
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

      const shouldUseCompactCart = false;

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

  const visibleProducts = products;

  const brandOptions = useMemo(
    () => {
      const options = Array.from(
        new Set([...(productFacets.brands || []).map((item) => item.value).filter(Boolean), ...brands]),
      );
      const priority = ['apple', 'samsung', 'asus'];
      return options.sort((a, b) => {
        const aRank = priority.indexOf(a.toLocaleLowerCase());
        const bRank = priority.indexOf(b.toLocaleLowerCase());
        return (aRank < 0 ? priority.length : aRank) - (bRank < 0 ? priority.length : bRank) || a.localeCompare(b);
      });
    },
    [brands, productFacets.brands],
  );
  const modelOptions = useMemo(
    () => {
      const options = Array.from(
        new Set([...(productFacets.models || []).map((item) => item.value).filter(Boolean), ...models]),
      );
      const counts = new Map((productFacets.models || []).map((item) => [item.value, item.count || 0]));
      return options.sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b));
    },
    [models, productFacets.models],
  );
  const visibleDesktopBrands = showAllDesktopBrands
    ? brandOptions
    : brandOptions.filter((brand, index) => index < 4 || brands.includes(brand));
  const matchingDesktopModels = modelOptions.filter((model) =>
    model.toLocaleLowerCase().includes(desktopModelSearch.trim().toLocaleLowerCase()),
  );
  const visibleDesktopModels = desktopModelSearch.trim() || showAllDesktopModels
    ? matchingDesktopModels
    : matchingDesktopModels.filter((model, index) => index < 4 || models.includes(model));
  const dynamicPartOptions = useMemo(() => {
    const availableParts = new Set((productFacets.parts || []).map((item) => item.value));
    const filtered = partOptions.filter(([value]) => value === 'all' || availableParts.has(value));
    return filtered.length > 1 ? filtered : partOptions;
  }, [productFacets.parts]);
  const shopIntroTiles = useMemo(
    () => dynamicPartOptions.filter(([value]) => value !== 'all'),
    [dynamicPartOptions],
  );

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const serviceTotal = total - subtotal;
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    return { subtotal, total, serviceTotal, count };
  }, [cart]);

  useEffect(() => {
    if (isProductsFetching || !productsResult) {
      return;
    }

    setGridProducts((current) =>
      productPage === 1 ? visibleProducts : [...current, ...visibleProducts],
    );
  }, [isProductsFetching, productPage, productsResult, visibleProducts]);

  useEffect(() => {
    if (!isFacetsFetching) {
      setShowSlowFilterLoader(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowSlowFilterLoader(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [isFacetsFetching]);

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
      if (!hasMoreProducts || isProductsFetching || loadingNextPageRef.current || gridProducts.length === 0) {
        return;
      }

      const remaining = scrollNode.scrollHeight - scrollNode.scrollTop - scrollNode.clientHeight;

      if (remaining < 520) {
        loadingNextPageRef.current = true;
        setProductPage((current) => current + 1);
      }
    };

    scrollNode.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollNode.scrollHeight <= scrollNode.clientHeight + 520) {
      handleScroll();
    }

    return () => {
      scrollNode.removeEventListener('scroll', handleScroll);
    };
  }, [gridProducts.length, hasMoreProducts, isProductsFetching]);

  useEffect(() => {
    setProductPage(1);
    setGridProducts([]);
    loadingNextPageRef.current = false;
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollTop = 0;
    }
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

  const openShopByPart = (part) => {
    setParts([part]);
    setBrands([]);
    setModels([]);
    setPriceMin('');
    setPriceMax('');
    setSearch('');
    setProductPage(1);
    setGridProducts([]);
    setShopIntroOpen(false);
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
    setTab('smartphones');
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
          servicePrice: getServicePrice(product),
          canProductOnly: canBuyProductOnly(product),
          canService: canBuyWithService(product),
          image_url: product.image_url,
          subtitle: [
            t(labelForSource[product.inventory_source] || product.inventory_source),
            product.quality_line && product.quality_line !== 'N/A' ? product.quality_line : null,
          ].filter(Boolean).join(' · '),
        },
      ];
    });

    closeModal();
  };

  const toggleCartService = (item) => {
    const nextMode = item.mode === 'service' ? 'product' : 'service';
    if (nextMode === 'service' ? !item.canService : !item.canProductOnly) {
      return;
    }

    setCart((current) => {
      const nextId = `${item.productId}:${nextMode}`;
      const existing = current.find((entry) => entry.id === nextId);
      if (existing) {
        return current.filter((entry) => entry.id !== item.id).map((entry) =>
          entry.id === nextId ? { ...entry, qty: entry.qty + item.qty } : entry,
        );
      }
      return current.map((entry) => entry.id === item.id ? {
        ...entry,
        id: nextId,
        mode: nextMode,
        price: nextMode === 'service' ? entry.servicePrice : entry.basePrice,
      } : entry);
    });
  };

  function openModal(product) {
    window.clearTimeout(modalCloseTimerRef.current);
    setModalProduct(product);
    setModalWithService(!canBuyProductOnly(product) && canBuyWithService(product));
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
    const clearPartnerId = field === 'has_partner_warranty' && value === false;
    setOrderForm((current) => ({ ...current, [field]: value, ...(clearPartnerId ? { partner_warranty_id: '' } : {}) }));
    setOrderErrors((current) => ({ ...current, [field]: '', submit: '', ...(clearPartnerId ? { partner_warranty_id: '' } : {}) }));
  };

  const validateCheckout = () => {
    const nextErrors = {};
    if (!orderForm.customer_name.trim()) nextErrors.customer_name = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_last_name.trim()) nextErrors.customer_last_name = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_phone.trim()) nextErrors.customer_phone = t('shop.orderFlow.errors.required');
    if (!orderForm.customer_email.trim()) {
      nextErrors.customer_email = t('shop.orderFlow.errors.required');
    } else if (!EMAIL_RE.test(orderForm.customer_email.trim())) {
      nextErrors.customer_email = t('shop.orderFlow.errors.email');
    }
    if (!orderForm.heard_about) nextErrors.heard_about = t('shop.orderFlow.errors.required');
    if (orderForm.has_partner_warranty && !orderForm.partner_warranty_id.trim()) {
      nextErrors.partner_warranty_id = t('shop.orderFlow.errors.required');
    }
    setOrderErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        const firstInvalid = document.querySelector('.zpos-order-modal.is-checkout [aria-invalid="true"]');
        firstInvalid?.focus();
      });
    }
    return Object.keys(nextErrors).length === 0;
  };

  const submitOnsiteOrder = () => {
    if (cart.length === 0 || orderMutation.isLoading) {
      return;
    }

    if (!validateCheckout()) {
      return;
    }

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
      return;
    }

    setCart((current) => {
      return current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return { ...item, qty: action === 'increase' ? item.qty + 1 : Math.max(1, item.qty - 1) };
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
      className={`zpos-root zpos-root--figma ${filtersOpen ? 'zpos-filters-open' : ''} ${filtersClosing ? 'zpos-filters-closing' : ''} ${compactCart ? 'zpos-compact-cart-mode' : ''} ${cartViewOpen ? 'zpos-cart-view-open' : ''}`}
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

      <div className={`zpos-shell ${shopIntroOpen ? 'zpos-shell--entry' : ''}`}>
        {shopIntroOpen ? (
          <section className="zpos-shop-entry" aria-label={t('shop.filters.partTypeTitle')}>
            <div className="zpos-shop-entry-grid">
              {shopIntroTiles.map(([value, labelKey], index) => {
                const PartIcon = iconForPart[value] || CategoryOutlined;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`zpos-shop-entry-tile zpos-shop-entry-tile--${(index % 4) + 1}`}
                    onClick={() => openShopByPart(value)}
                  >
                    <span className="zpos-shop-entry-arrow" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7 17 17 7"></path>
                        <path d="M9 7h8v8"></path>
                      </svg>
                    </span>
                    <span className="zpos-shop-entry-icon" aria-hidden="true">
                      <PartIcon fontSize="inherit" />
                    </span>
                    <span className="zpos-shop-entry-label">{t('shop.filters.partTypeKicker')}</span>
                    <strong>{t(labelKey)}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <>
        <aside className="zpos-sidebar" aria-label={t('shop.aria.filters')}>
          <div className="zpos-figma-sidebar-tabs" role="tablist" aria-label={t('shop.tabs.ariaLabel')}>
            {['smartphones', 'laptops'].map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''} onClick={() => setTab(value)}>{t(labelForDevice[value])}</button>)}
          </div>
          <div className="zpos-figma-category-rail" aria-label={t('shop.filters.partTypeTitle')}>
            <button type="button" className={parts.length === 0 ? 'is-active' : ''} aria-pressed={parts.length === 0} onClick={() => setParts([])}><CategoryOutlined aria-hidden="true" /><span>{t('common.all')}</span></button>
            {partOptions.filter(([value]) => value !== 'all').map(([value, labelKey]) => {
              const PartIcon = iconForPart[value] || CategoryOutlined;
              return <button key={value} type="button" className={parts.includes(value) ? 'is-active' : ''} aria-pressed={parts.includes(value)} onClick={() => setParts([value])}><PartIcon aria-hidden="true" /><span>{t(labelKey)}</span></button>;
            })}
          </div>
          <div className="zpos-figma-desktop-filters">
            <div className="zpos-figma-filter-heading"><strong>{i18n.language === 'ka' ? 'ფილტრი' : 'Filters'}</strong><button type="button" onClick={resetFilters}>{i18n.language === 'ka' ? 'გასუფთავება' : 'Clear'}</button></div>
            <div className="zpos-figma-filter-group">
              <strong>{t('shop.filters.brandTitle')}</strong>
              {visibleDesktopBrands.map((brand) => <label key={brand}><input type="checkbox" checked={brands.includes(brand)} onChange={() => toggleBrand(brand)} /><span>{brand}</span></label>)}
              {brandOptions.length > 4 && <button type="button" onClick={() => setShowAllDesktopBrands((current) => !current)}>{showAllDesktopBrands ? t('shop.filters.showLess') : t('shop.filters.showMore', { count: brandOptions.length - 4 })}</button>}
            </div>
            <div className="zpos-figma-filter-group">
              <strong>{t('shop.filters.modelTitle')}</strong>
              <input className="zpos-figma-model-search" type="search" value={desktopModelSearch} onChange={(event) => setDesktopModelSearch(event.target.value)} placeholder={t('shop.filters.searchOptions')} />
              {visibleDesktopModels.map((model) => <label key={model}><input type="checkbox" checked={models.includes(model)} onChange={() => toggleModel(model)} /><span>{model}</span><small>{productFacets.models?.find((item) => item.value === model)?.count || ''}</small></label>)}
              {matchingDesktopModels.length === 0 && <p className="zpos-figma-filter-empty">{t('shop.empty.title')}</p>}
              {!desktopModelSearch.trim() && modelOptions.length > 4 && <button type="button" onClick={() => setShowAllDesktopModels((current) => !current)}>{showAllDesktopModels ? t('shop.filters.showLess') : t('shop.filters.showMore', { count: modelOptions.length - 4 })}</button>}
            </div>
            <div className="zpos-figma-filter-group">
              <strong>{t('shop.filters.sourceTitle')}</strong>
              <div className="zpos-figma-filter-chips">{['oem', 'third-party'].map((value) => <button key={value} type="button" className={sources.includes(value) ? 'is-active' : ''} onClick={() => setSources((current) => current.includes(value) ? current.filter((source) => source !== value) : [...current, value])}>{t(labelForSource[value])}</button>)}</div>
            </div>
            <div className="zpos-figma-filter-group">
              <strong>{t('shop.filters.priceTitle')}</strong>
              <div className="zpos-figma-filter-price"><input aria-label={t('shop.filters.min')} type="number" min="0" placeholder="₾0" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} /><span>—</span><input aria-label={t('shop.filters.max')} type="number" min="0" placeholder="₾900" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} /></div>
            </div>
          </div>
          <div className="zpos-sidebar-head">
            <div>
              <p>{t('shop.filters.kicker')}</p>
              <h2>{t('shop.filters.title')}</h2>
            </div>
            <button className="zpos-reset-btn" type="button" onClick={resetFilters}>
              {t('shop.filters.reset')}
            </button>
            <button className="zpos-figma-filter-close" type="button" onClick={closeFilters} aria-label={t('shop.filters.close')}>×</button>
          </div>

          <div className={`zpos-sidebar-scroll ${isFacetsFetching ? 'is-refetching' : ''}`}>
            {shouldShowFilterLoader && (
              <div className="zpos-filter-loader" role="status" aria-live="polite">
                <div className="zpos-product-loader-orb" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <strong>{t('shop.loading.filtersTitle')}</strong>
                <p>{t('shop.loading.filtersDescription')}</p>
              </div>
            )}

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
          <div className="zpos-figma-filter-actions">
            <button type="button" onClick={resetFilters}>{t('shop.filters.reset')}</button>
            <button type="button" onClick={closeFilters}>{isInitialProductsLoading ? '...' : productsTotal.toLocaleString(i18n.language === 'ka' ? 'ka-GE' : 'en-US')} {i18n.language === 'ka' ? 'ნაწილი' : 'parts'}</button>
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
                {['smartphones', 'laptops'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`zpos-tab ${tab === value ? 'is-active' : ''}`}
                    onClick={() => setTab(value)}
                  >
                    <span>{t(labelForDevice[value])}</span>
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
                  placeholder={i18n.language === 'ka' ? 'მოძებნე ნაწილი' : 'Search for a part'}
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
            <div className="zpos-figma-categories" aria-label={t('shop.filters.partTypeTitle')}>
              {partOptions.filter(([value]) => value !== 'all').map(([value, labelKey]) => {
                const PartIcon = iconForPart[value] || CategoryOutlined;
                return <button key={value} type="button" className={parts.includes(value) ? 'is-active' : ''} aria-pressed={parts.includes(value)} onClick={() => setParts([value])}><span><PartIcon aria-hidden="true" /></span><small>{t(labelKey)}</small></button>;
              })}
            </div>
            <p className="zpos-figma-count">{isInitialProductsLoading ? '...' : productsTotal} {i18n.language === 'ka' ? 'ნაწილი' : 'parts'} · {parts.length === 1 ? t(partOptions.find(([value]) => value === parts[0])?.[1] || parts[0]) : t('common.all')}</p>
          </div>

          <div className="zpos-grid-scroll" ref={gridScrollRef} tabIndex={0} aria-label={i18n.language === 'ka' ? 'პროდუქტების სია' : 'Product list'}>
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
              {isProductSkeletonLoading && <ProductSkeletonCards count={12} prefix="search-skeleton" />}

              {!isProductsFetching && !isProductSkeletonLoading && gridProducts.length === 0 && (
                <div className="zpos-empty zpos-empty--grid is-visible">
                  <strong>{t('shop.empty.title')}</strong>
                  <p>{t('shop.empty.description')}</p>
                </div>
              )}

              {!isProductSkeletonLoading && gridProducts.map((product) => {
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
                      {product.stock_quantity <= 0 && <span className="zpos-figma-stock-badge">{i18n.language === 'ka' ? 'შეკვეთით' : 'On order'}</span>}
                      {getDiscountPercentage(product) > 0 && (
                        <span className="zpos-badge">-{getDiscountPercentage(product)}%</span>
                      )}
                      {product.image_url && !loadedImages[`product:${product.id}`] && (
                        <div className="zpos-skeleton zpos-skeleton--thumb zpos-image-skeleton" />
                      )}
                      <PhoneIphoneOutlined className="zpos-figma-image-fallback" aria-hidden="true" />
                      {product.image_url && <img
                        src={product.image_url}
                        alt={t('shop.imageAlt.thumbnail', { title: product.title })}
                        loading="lazy"
                        onLoad={() => handleImageReady(`product:${product.id}`)}
                        onError={(event) => { event.currentTarget.hidden = true; handleImageReady(`product:${product.id}`); }}
                      />}
                    </div>
                    <div className="zpos-card-body">
                      <p className="zpos-meta">
                        {[product.brand, t(labelForDevice[product.device_category]), t(labelForPart[product.part_category]), t(labelForSource[product.inventory_source])]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                      <h3>{product.title}</h3>
                      <p className="zpos-figma-card-source">{t(labelForSource[product.inventory_source] || product.inventory_source)} · {product.brand || t(labelForDevice[product.device_category] || product.device_category)}</p>
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

              {isLoadingNextProducts && <ProductSkeletonCards count={6} prefix="next-page-skeleton" />}
            </div>
          </div>
        </main>

        <aside
          className={`zpos-cart ${compactCart ? 'zpos-cart--compact' : ''} ${compactCart && cartExpanded ? 'is-expanded' : ''} ${cartViewOpen ? 'is-figma-open' : ''}`}
          aria-label={t('shop.aria.cart')}
        >
          <button type="button" className="zpos-figma-cart-close" onClick={() => setCartViewOpen(false)} aria-label={t('common.close')}><span className="zpos-figma-cart-close-desktop">×</span><span className="zpos-figma-cart-close-mobile">‹</span></button>
          <div className="zpos-cart-head">
            <div className="zpos-cart-head-main">
              <p>{t('shop.cart.kicker')}</p>
              <h2>{i18n.language === 'ka' ? 'კალათა' : 'Cart'}</h2>
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

          <div id="zpos-cart-items" className={`zpos-cart-items ${cart.length === 0 ? 'is-empty' : ''}`}>
            {cart.length === 0 && (
              <div className="zpos-empty">
                <img src="/figma-shop-empty-cart.svg" alt="" aria-hidden="true" />
                <strong>{t('shop.cart.emptyTitle')}</strong>
                <p>{t('shop.cart.emptyDescription')}</p>
                <button type="button" onClick={() => setCartViewOpen(false)}>{t('shop.cart.backToCatalog')}</button>
              </div>
            )}

            {cart.map((item) => (
              <div
                key={item.id}
                className={`zpos-cart-item ${removingCartIds.includes(item.id) ? 'is-removing' : ''}`}
              >
                <div className="zpos-cart-line-main">
                  <div className={`zpos-cart-item-thumb ${loadedImages[`cart:${item.id}`] ? 'is-loaded' : ''}`}>
                    {item.image_url && !loadedImages[`cart:${item.id}`] && <div className="zpos-skeleton zpos-image-skeleton" />}
                    <img className="zpos-cart-image-fallback" src="/figma-shop-cart-placeholder.svg" alt="" aria-hidden="true" />
                    {item.image_url && <img src={item.image_url} alt={t('shop.imageAlt.thumbnail', { title: item.title })} loading="lazy" onLoad={() => handleImageReady(`cart:${item.id}`)} onError={(event) => { event.currentTarget.hidden = true; handleImageReady(`cart:${item.id}`); }} />}
                  </div>
                  <div className="zpos-cart-item-main">
                    <div className="zpos-cart-item-head">
                      <div className="zpos-cart-item-copy">
                        <h3 title={item.title}>{item.title}</h3>
                        <p className="zpos-cart-item-sub">{item.subtitle}</p>
                      </div>
                      <button type="button" className="zpos-cart-remove" onClick={() => updateCart(item.id, 'remove')} aria-label={t('common.delete')}><DeleteOutline aria-hidden="true" /></button>
                    </div>
                    <div className="zpos-cart-item-footer">
                      <div className="zpos-qty">
                        <button type="button" disabled={item.qty <= 1} aria-label={i18n.language === 'ka' ? 'რაოდენობის შემცირება' : 'Decrease quantity'} onClick={() => updateCart(item.id, 'decrease')}>-</button>
                        <span>{item.qty}</span>
                        <button type="button" aria-label={i18n.language === 'ka' ? 'რაოდენობის გაზრდა' : 'Increase quantity'} onClick={() => updateCart(item.id, 'increase')}>+</button>
                      </div>
                      <div className="zpos-cart-item-price">{formatMoney((item.canProductOnly ? item.basePrice : item.price) * item.qty)}</div>
                    </div>
                  </div>
                </div>
                {item.canService && <label className={`zpos-cart-service-row ${item.mode === 'service' ? 'is-active' : ''}`}><span className="zpos-cart-service-icon"><BuildOutlined aria-hidden="true" /></span><span>{i18n.language === 'ka' ? 'დაყენების სერვისი' : 'Installation service'} · {item.canProductOnly ? `+${formatMoney(Math.max(0, (item.servicePrice || 0) - item.basePrice) * item.qty)}` : (i18n.language === 'ka' ? 'შედის ფასში' : 'Included')}</span><input type="checkbox" checked={item.mode === 'service'} disabled={!item.canProductOnly} onChange={() => toggleCartService(item)} /></label>}
              </div>
            ))}
          </div>

          {cart.length > 0 && <div className="zpos-summary">
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
              onClick={() => { setCartViewOpen(false); openOrderModal(); }}
              disabled={cart.length === 0 || removingCartIds.length > 0}
            >
              {t('shop.summary.checkoutDisabled')}
            </button>
          </div>}
        </aside>
        {cartViewOpen && <button type="button" className="zpos-figma-cart-backdrop" aria-label={t('common.close')} onClick={() => setCartViewOpen(false)} />}
          </>
        )}
      </div>

      {!shopIntroOpen && !cartViewOpen && cartSummary.count > 0 && <div className="zpos-figma-cart-bar"><div><small>{i18n.language === 'ka' ? 'კალათა' : 'Cart'} · {cartSummary.count} {i18n.language === 'ka' ? 'ნივთი' : 'items'}</small><strong>{formatMoney(cartSummary.total)}</strong></div><button type="button" onClick={() => setCartViewOpen(true)}>{i18n.language === 'ka' ? 'ნახვა' : 'View'}</button></div>}

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
          <div className="zpos-modal zpos-modal--figma-product" role="dialog" aria-modal="true" aria-labelledby="zpos-modal-title">
            <div className="zpos-product-mobile-bar">
              <button type="button" onClick={closeModal} aria-label={t('common.back')}>‹</button>
              <strong>{i18n.language === 'ka' ? 'ნაწილი' : 'Part'}</strong>
            </div>
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
              {modalProduct.image_url && !loadedImages[`modal:${modalProduct.id}`] && (
                <div className="zpos-skeleton zpos-image-skeleton" />
              )}
              <span className="zpos-modal-image-frame">
                <img className="zpos-modal-image-placeholder" src="/figma-shop-product-placeholder.svg" alt="" aria-hidden="true" />
                {modalProduct.image_url && <img
                  className="zpos-modal-product-image"
                  src={modalProduct.image_url}
                  alt={t('shop.imageAlt.preview', { title: modalProduct.title })}
                  onLoad={() => handleImageReady(`modal:${modalProduct.id}`)}
                  onError={(event) => { event.currentTarget.hidden = true; handleImageReady(`modal:${modalProduct.id}`); }}
                />}
              </span>
            </div>

            <div className="zpos-modal-content">
              <h2 id="zpos-modal-title">{modalProduct.title}</h2>
              <div className="zpos-product-badges">
                <span>{t(labelForSource[modalProduct.inventory_source] || modalProduct.inventory_source)}</span>
                {modalProduct.quality_line && modalProduct.quality_line !== 'N/A' && <span>{modalProduct.quality_line}</span>}
                <span>{modalProduct.stock_quantity > 0 ? (i18n.language === 'ka' ? 'მარაგშია' : 'In stock') : (i18n.language === 'ka' ? 'შეკვეთით' : 'On order')}</span>
              </div>

              <div className="zpos-product-details">
                <div><span>{i18n.language === 'ka' ? 'თავსებადობა' : 'Compatibility'}</span><strong>{modalProduct.device_model || modalProduct.title}</strong></div>
                <div><span>{i18n.language === 'ka' ? 'გარანტია' : 'Warranty'}</span><strong>{modalProduct.warranty_line || (i18n.language === 'ka' ? '1 წელი' : '1 year')}</strong></div>
                <div><span>{i18n.language === 'ka' ? 'წარმომავლობა' : 'Source'}</span><strong>{t(labelForSource[modalProduct.inventory_source] || modalProduct.inventory_source)}</strong></div>
                <div><span>{i18n.language === 'ka' ? 'ტიპი' : 'Type'}</span><strong>{modalProduct.quality_line && modalProduct.quality_line !== 'N/A' ? modalProduct.quality_line : t(labelForPart[modalProduct.part_category] || modalProduct.part_category)}</strong></div>
              </div>

              <div className="zpos-product-purchase">
                {canBuyWithService(modalProduct) && (
                  <label className="zpos-product-service">
                    <span className="zpos-product-service-icon"><BuildOutlined aria-hidden="true" /></span>
                    <span className="zpos-product-service-copy"><strong>{canBuyProductOnly(modalProduct) ? (i18n.language === 'ka' ? 'სერვისიც გჭირდება?' : 'Need installation service?') : (i18n.language === 'ka' ? 'სერვისი შედის' : 'Service included')}</strong><small>{i18n.language === 'ka' ? 'შეაკეთეთ ადგილზე' : 'Repair with our team'}</small></span>
                    <span className="zpos-product-service-price">{canBuyProductOnly(modalProduct) ? `+${formatMoney(Math.max(0, (getServicePrice(modalProduct) || 0) - (getProductOnlyPrice(modalProduct) || 0)))}` : (i18n.language === 'ka' ? 'შედის ფასში' : 'Included')}</span>
                    <input type="checkbox" checked={modalWithService} disabled={!canBuyProductOnly(modalProduct)} onChange={(event) => setModalWithService(event.target.checked)} />
                  </label>
                )}

                <div className="zpos-product-bottom">
                  <div><small>{i18n.language === 'ka' ? 'სულ' : 'Total'}</small><strong>{formatMoney(modalWithService ? getServicePrice(modalProduct) : getProductOnlyPrice(modalProduct))}</strong></div>
                  <button type="button" onClick={() => addToCart(modalProduct, modalWithService ? 'service' : 'product')} disabled={!(modalWithService ? canBuyWithService(modalProduct) : canBuyProductOnly(modalProduct))}>{i18n.language === 'ka' ? 'კალათაში' : 'Add to cart'}</button>
                </div>
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
          <div className={`zpos-modal zpos-order-modal ${orderStep === 4 ? 'is-success' : 'is-checkout'}`} role="dialog" aria-modal="true" aria-labelledby="zpos-order-title">
            {orderStep !== 4 && <button
              type="button"
              className="zpos-modal-close"
              onClick={closeOrderModal}
              aria-label={t('common.close')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>}

            <div className="zpos-order-modal-body">
              {orderStep !== 4 ? (
                <div className="zpos-checkout-page">
                  <div className="zpos-checkout-bar">
                    <button type="button" onClick={closeOrderModal} aria-label={t('common.back')}>‹</button>
                    <span id="zpos-order-title">{t('shop.orderFlow.checkout.title')}</span>
                  </div>
                  <form id="zpos-checkout-form" className="zpos-checkout-layout" onSubmit={(event) => { event.preventDefault(); submitOnsiteOrder(); }} noValidate>
                    <div className="zpos-checkout-main">
                      <section className="zpos-checkout-card">
                        <h3>{t('shop.orderFlow.checkout.contact')}</h3>
                        <div className="zpos-checkout-person-type" aria-label={t('shop.orderFlow.checkout.contact')}>
                          <span aria-current="true">{t('shop.orderFlow.checkout.individual')}</span>
                          <button type="button" disabled title={t('shop.orderFlow.checkout.businessUnavailable')}>{t('shop.orderFlow.checkout.business')}</button>
                        </div>
                        <div className="zpos-checkout-fields">
                          {[
                            ['customer_name', 'firstName', 'text'],
                            ['customer_last_name', 'lastName', 'text'],
                            ['customer_phone', 'phone', 'tel'],
                            ['customer_email', 'email', 'email'],
                          ].map(([field, label, type]) => (
                            <label key={field} className="zpos-checkout-field">
                              <span>{t(`shop.orderFlow.stepOne.fields.${label}`)}</span>
                              <input type={type} value={orderForm[field]} onChange={(event) => updateOrderForm(field, event.target.value)} aria-invalid={Boolean(orderErrors[field])} />
                              {orderErrors[field] && <small role="alert">{orderErrors[field]}</small>}
                            </label>
                          ))}
                        </div>
                      </section>
                      <section className="zpos-checkout-card">
                        <h3>{t('shop.orderFlow.checkout.pickup')}</h3>
                        <div className="zpos-checkout-option is-selected"><div><strong>{t('shop.orderFlow.checkout.pickupStore')}</strong><small>{t('shop.orderFlow.checkout.pickupAddress')}</small></div><b>{t('shop.orderFlow.checkout.free')}</b><span className="zpos-checkout-radio" aria-hidden="true" /></div>
                      </section>
                      <section className="zpos-checkout-card">
                        <h3>{t('shop.orderFlow.checkout.payment')}</h3>
                        <div className="zpos-checkout-option is-selected"><div><strong>{t('shop.orderFlow.stepThree.payOnsite')}</strong><small>{t('shop.orderFlow.stepThree.payOnsiteDescription')}</small></div><span className="zpos-checkout-radio" aria-hidden="true" /></div>
                      </section>
                      <section className="zpos-checkout-card">
                        <h3>{t('shop.orderFlow.checkout.additional')}</h3>
                        <label className="zpos-checkout-field">
                          <span>{t('shop.orderFlow.stepTwo.heardAbout')}</span>
                          <select value={orderForm.heard_about} onChange={(event) => updateOrderForm('heard_about', event.target.value)} aria-invalid={Boolean(orderErrors.heard_about)}>
                            <option value="">{t('shop.orderFlow.stepTwo.selectPlaceholder')}</option>
                            {heardAboutOptions.map((value) => <option key={value} value={value}>{t(`shop.orderFlow.heardAbout.${value}`)}</option>)}
                          </select>
                          {orderErrors.heard_about && <small role="alert">{orderErrors.heard_about}</small>}
                        </label>
                        <div className="zpos-checkout-warranty">
                          <span>{t('shop.orderFlow.stepTwo.partnerWarranty')}</span>
                          {gstoreLogo && <img src={gstoreLogo} alt="Gstore" />}
                          <div className="zpos-checkout-toggle">
                            <button type="button" aria-pressed={orderForm.has_partner_warranty === true} aria-invalid={Boolean(orderErrors.has_partner_warranty)} className={orderForm.has_partner_warranty === true ? 'is-selected' : ''} onClick={() => updateOrderForm('has_partner_warranty', true)}>{t('shop.orderFlow.common.yes')}</button>
                            <button type="button" aria-pressed={orderForm.has_partner_warranty === false} className={orderForm.has_partner_warranty === false ? 'is-selected' : ''} onClick={() => updateOrderForm('has_partner_warranty', false)}>{t('shop.orderFlow.common.no')}</button>
                          </div>
                          {orderErrors.has_partner_warranty && <small role="alert">{orderErrors.has_partner_warranty}</small>}
                        </div>
                        {orderForm.has_partner_warranty && <label className="zpos-checkout-field"><span>{t('shop.orderFlow.stepTwo.warrantyId')}</span><input type="text" value={orderForm.partner_warranty_id} onChange={(event) => updateOrderForm('partner_warranty_id', event.target.value)} aria-invalid={Boolean(orderErrors.partner_warranty_id)} />{orderErrors.partner_warranty_id && <small role="alert">{orderErrors.partner_warranty_id}</small>}</label>}
                      </section>
                    </div>
                    <aside className="zpos-checkout-summary">
                      <div className="zpos-checkout-breakdown">
                        <div><span>{t('shop.orderFlow.checkout.parts')}</span><strong>{formatMoney(cartSummary.subtotal)}</strong></div>
                        <div><span>{t('shop.summary.serviceUplift')}</span><strong>{formatMoney(cartSummary.serviceTotal)}</strong></div>
                        <div className="is-total"><span>{t('shop.cart.total')}</span><strong>{formatMoney(cartSummary.total)}</strong></div>
                      </div>
                      {orderErrors.submit && <p className="zpos-order-submit-error" role="alert">{orderErrors.submit}</p>}
                      <button type="submit" className="zpos-checkout-submit" disabled={orderMutation.isLoading}>{orderMutation.isLoading ? t('shop.orderFlow.stepThree.processing') : `${t('shop.orderFlow.checkout.placeOrder')} · ${formatMoney(cartSummary.total)}`}</button>
                      <p className="zpos-checkout-note">{t('shop.orderFlow.checkout.pickupNote')}</p>
                    </aside>
                  </form>
                  <div className="zpos-checkout-mobile-action">
                    {orderErrors.submit && <small role="alert">{orderErrors.submit}</small>}
                    <button type="submit" form="zpos-checkout-form" disabled={orderMutation.isLoading}>{orderMutation.isLoading ? t('shop.orderFlow.stepThree.processing') : `${t('shop.orderFlow.checkout.placeOrder')} · ${formatMoney(cartSummary.total)}`}</button>
                  </div>
                </div>
              ) : (
                createdOrder && (
                  <div className="zpos-order-success-page">
                    <div className="zpos-order-success-bar">
                      <button type="button" onClick={closeOrderModal} aria-label={t('common.back')}>‹</button>
                      <span>{t('shop.orderFlow.success.orderHeading')}</span>
                    </div>
                    <div className="zpos-order-success-content">
                      <div className="zpos-order-success-mark"><img src="/figma-shop-success-check.svg" alt="" aria-hidden="true" /></div>
                      <h2 id="zpos-order-title">{t('shop.orderFlow.success.shortTitle')}</h2>
                      <p className="zpos-order-success-copy">{t('shop.orderFlow.success.pickupConfirmation')}</p>
                      <dl className="zpos-order-success-facts">
                        <div><dt>{t('shop.orderFlow.success.orderNumberLabel')}</dt><dd>#{createdOrder.order_number}</dd></div>
                        <div><dt>{t('shop.orderFlow.success.customerLabel')}</dt><dd>{[createdOrder.customer_name, createdOrder.customer_last_name].filter(Boolean).join(' ')}</dd></div>
                        <div><dt>{t('shop.orderFlow.success.itemCountLabel')}</dt><dd>{createdOrder.item_count}</dd></div>
                        <div><dt>{t('shop.orderFlow.success.amountDueLabel')}</dt><dd>{formatMoney(createdOrder.total_amount)}</dd></div>
                      </dl>
                      <div className="zpos-order-success-actions">
                        <Link to="/">{t('shop.orderFlow.success.backHome')}</Link>
                        <button type="button" onClick={closeOrderModal}>{t('shop.orderFlow.success.continueShopping')}</button>
                      </div>
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
