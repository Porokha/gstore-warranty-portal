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

const shopJourney = [
  {
    step: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7.25 4.75h9.5A2.25 2.25 0 0 1 19 7v10a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5 17V7a2.25 2.25 0 0 1 2.25-2.25Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 7.75h4M11 16.25h2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    step: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m17 17 3.5 3.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.25 10.5h4.5M10.5 8.25v4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    step: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.75 4.5 7.5V12c0 4.35 2.95 8.31 7.5 9.45 4.55-1.14 7.5-5.1 7.5-9.45V7.5L12 3.75Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m9.25 12 1.75 1.75 3.75-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    step: '04',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3.75 7.75h11.5v7.5H3.75v-7.5ZM15.25 10h2.41c.45 0 .88.2 1.16.55l1.43 1.8c.19.24.3.53.3.83v2.07h-5.3V10Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 18.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.5 18.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.25 18.25H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const getProductOnlyPrice = (product) => product.sale_price ?? product.price;
const getServicePrice = (product) => product.service_price;
const getDisplayPrice = (product) => getProductOnlyPrice(product) ?? getServicePrice(product);
const canBuyProductOnly = (product) => getProductOnlyPrice(product) != null;
const canBuyWithService = (product) => getServicePrice(product) != null;

const ShopPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('all');
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

  const shopJourneyContent = useMemo(
    () =>
      shopJourney.map((item, index) => ({
        ...item,
        label: t(`shop.journey.${index}.label`),
        title: t(`shop.journey.${index}.title`),
        description: t(`shop.journey.${index}.description`),
      })),
    [t],
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
      const haystack = `${product.title} ${product.issue_label || ''} ${product.part_category} ${product.device_category}`.toLowerCase();
      const numericMin = priceMin === '' ? null : Number(priceMin);
      const numericMax = priceMax === '' ? null : Number(priceMax);

      if (tab !== 'all' && product.device_category !== tab) return false;
      if (parts.length > 0 && !parts.includes(product.part_category)) return false;
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (!sources.includes(product.inventory_source)) return false;
      if (numericMin !== null && activePrice !== null && activePrice < numericMin) return false;
      if (numericMin !== null && activePrice === null) return false;
      if (numericMax !== null && activePrice !== null && activePrice > numericMax) return false;
      return true;
    });
  }, [parts, priceMax, priceMin, products, search, sources, tab]);

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

  const resetFilters = () => {
    setTab('all');
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
        <div className="zpos-shop-banner-copy">
          <h1>
            {t('shop.banner.titleLead')}
            <em>{t('shop.banner.titleEmphasis')}</em>
          </h1>
          <p>{t('shop.banner.description')}</p>
        </div>

        <div className="zpos-shop-banner-grid" aria-label={t('shop.aria.process')}>
          {shopJourneyContent.map((item, index) => (
            <article className="zpos-shop-step" key={item.step}>
              <div className="zpos-shop-step-mark">{item.step}</div>
              <div className="zpos-shop-step-icon">{item.icon}</div>
              <p className="zpos-shop-step-label">{item.label}</p>
              <h2>{item.title}</h2>
              <p className="zpos-shop-step-desc">{item.description}</p>
              {index < shopJourney.length - 1 ? (
                <span className="zpos-shop-step-connector" aria-hidden="true"></span>
              ) : null}
            </article>
          ))}
        </div>

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

          <section className="zpos-filter-section">
            <div className="zpos-section-head">
              <p>{t('shop.scope.kicker')}</p>
              <h3>{t('shop.scope.title')}</h3>
            </div>
            <ul className="zpos-note-list">
              <li>{t('shop.scope.points.0')}</li>
              <li>{t('shop.scope.points.1')}</li>
              <li>{t('shop.scope.points.2')}</li>
            </ul>
          </section>
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
                        {t(labelForDevice[product.device_category])} • {t(labelForPart[product.part_category])} •{' '}
                        {t(labelForSource[product.inventory_source])}
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
                {t(labelForDevice[activeProduct.device_category])} • {t(labelForPart[activeProduct.part_category])} •{' '}
                {t(labelForSource[activeProduct.inventory_source])}
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
