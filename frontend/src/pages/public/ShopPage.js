import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
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
  const [activeProduct, setActiveProduct] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});
  const tabsRef = useRef(null);

  const { data: products = [] } = useQuery(['shop-public-products'], () =>
    shopService.getPublicProducts(),
  );

  useEffect(() => {
    document.body.classList.add('zpos-fullscreen');
    return () => {
      document.body.classList.remove('zpos-fullscreen');
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
        setActiveProduct(null);
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

    setActiveProduct(null);
  };

  const updateCart = (itemId, action) => {
    setCart((current) => {
      if (action === 'remove') {
        return current.filter((item) => item.id !== itemId);
      }

      return current
        .map((item) =>
          item.id === itemId
            ? { ...item, qty: action === 'increase' ? item.qty + 1 : item.qty - 1 }
            : item,
        )
        .filter((item) => item.qty > 0);
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
                <strong id="zpos-results-count">{visibleProducts.length}</strong>
                <span>{t('shop.visible')}</span>
              </div>
            </div>
          </div>

          <div className="zpos-grid-scroll">
            <div id="zpos-grid" className="zpos-grid" aria-live="polite">
              {visibleProducts.length === 0 && (
                <div className="zpos-empty zpos-empty--grid is-visible">
                  <strong>{t('shop.empty.title')}</strong>
                  <p>{t('shop.empty.description')}</p>
                </div>
              )}

              {visibleProducts.map((product, index) => {
                const displayPrice = getDisplayPrice(product);
                const productOnlyAvailable = canBuyProductOnly(product);
                const serviceAvailable = canBuyWithService(product);
                return (
                  <article
                    key={product.id}
                    className="zpos-card is-visible"
                    style={{ '--zpos-stagger': index }}
                    tabIndex="0"
                    onClick={() => setActiveProduct(product)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveProduct(product);
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
                            setActiveProduct(product);
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
              <div key={item.id} className="zpos-cart-item">
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
            <button className="zpos-checkout" type="button">
              {t('shop.summary.checkoutDisabled')}
            </button>
          </div>
        </aside>
      </div>

      {activeProduct && (
        <div
          id="zpos-modal-backdrop"
          className="zpos-modal-backdrop is-open"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveProduct(null);
            }
          }}
        >
          <div className="zpos-modal" role="dialog" aria-modal="true" aria-labelledby="zpos-modal-title">
            <button
              type="button"
              className="zpos-modal-close"
              onClick={() => setActiveProduct(null)}
              aria-label={t('common.close')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>

            <div id="zpos-modal-visual" className="zpos-modal-visual">
              <img
                src={activeProduct.image_url}
                alt={t('shop.imageAlt.preview', { title: activeProduct.title })}
              />
            </div>

            <div className="zpos-modal-content">
              <p id="zpos-modal-kicker" className="zpos-modal-kicker">
                {[activeProduct.brand, t(labelForDevice[activeProduct.device_category]), t(labelForPart[activeProduct.part_category]), t(labelForSource[activeProduct.inventory_source])]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              <h2 id="zpos-modal-title">{activeProduct.title}</h2>
              <p id="zpos-modal-desc" className="zpos-modal-desc">
                {activeProduct.description}
              </p>

              <div className="zpos-modal-prices">
                <button
                  type="button"
                  className={`zpos-choice is-primary ${canBuyProductOnly(activeProduct) ? '' : 'is-disabled'}`}
                  onClick={() => addToCart(activeProduct, 'product')}
                  disabled={!canBuyProductOnly(activeProduct)}
                >
                  <span className="zpos-choice-label">{t('shop.choiceLabels.productOnly')}</span>
                  <strong>
                    {canBuyProductOnly(activeProduct)
                      ? formatMoney(getProductOnlyPrice(activeProduct))
                      : t('shop.availability.productOnlyWithService')}
                  </strong>
                  <small>
                    {canBuyProductOnly(activeProduct)
                      ? t('shop.choiceDescriptions.productOnly')
                      : t('shop.choiceDescriptions.productOnlyUnavailable')}
                  </small>
                </button>

                <button
                  type="button"
                  className={`zpos-choice ${canBuyWithService(activeProduct) ? '' : 'is-disabled'}`}
                  onClick={() => addToCart(activeProduct, 'service')}
                  disabled={!canBuyWithService(activeProduct)}
                >
                  <span className="zpos-choice-label">{t('shop.choiceLabels.withService')}</span>
                  <strong>
                    {canBuyWithService(activeProduct)
                      ? formatMoney(getServicePrice(activeProduct))
                      : t('shop.availability.serviceUnavailable')}
                  </strong>
                  <small>
                    {canBuyWithService(activeProduct)
                      ? t('shop.choiceDescriptions.withService')
                      : t('shop.choiceDescriptions.serviceUnavailable')}
                  </small>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
