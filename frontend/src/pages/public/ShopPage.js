import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import '../../styles/shop.css';
import { shopService } from '../../services/shopService';

const partOptions = [
  ['all', 'All Parts'],
  ['board', 'Board'],
  ['screen', 'Screen'],
  ['sensor', 'Sensor'],
  ['battery', 'Battery'],
  ['camera', 'Camera'],
  ['speaker', 'Speaker'],
  ['charging', 'Charging'],
];

const deviceTitles = {
  all: 'All repair parts',
  smartphones: 'Smartphone repair parts',
  laptops: 'Laptop repair parts',
  accessories: 'Accessories',
};

const labelForDevice = {
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  accessories: 'Accessories',
};

const labelForPart = {
  board: 'Board',
  screen: 'Screen',
  sensor: 'Sensor',
  battery: 'Battery',
  camera: 'Camera',
  speaker: 'Speaker',
  charging: 'Charging',
  accessory: 'Accessory',
};

const labelForSource = {
  oem: 'OEM',
  'third-party': 'Third Party',
};

const formatMoney = (value) => `₾${Number(value || 0).toFixed(2)}`;

const ShopPage = () => {
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
      const activePrice = product.sale_price ?? product.price;
      const haystack = `${product.title} ${product.issue_label || ''} ${product.part_category} ${product.device_category}`.toLowerCase();
      const numericMin = priceMin === '' ? null : Number(priceMin);
      const numericMax = priceMax === '' ? null : Number(priceMax);

      if (tab !== 'all' && product.device_category !== tab) return false;
      if (parts.length > 0 && !parts.includes(product.part_category)) return false;
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (!sources.includes(product.inventory_source)) return false;
      if (numericMin !== null && activePrice < numericMin) return false;
      if (numericMax !== null && activePrice > numericMax) return false;
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
    const activePrice = mode === 'service' ? product.service_price ?? product.price : product.sale_price ?? product.price;
    const basePrice = product.sale_price ?? product.price;
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
          subtitle: `${labelForDevice[product.device_category]} • ${labelForPart[product.part_category]}`,
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
      aria-label="ZEZVA shop"
    >
      <div className="zpos-shop-banner">
        <div className="zpos-brand">
          <div className="zpos-brand-icon" aria-hidden="true">
            <img src="/shop-assets/svg/logo-icon.svg" alt="" />
          </div>
          <div className="zpos-brand-text" aria-hidden="true">
            <img src="/shop-assets/svg/logo-text.svg" alt="" />
          </div>
        </div>
        <div className="zpos-shop-banner-copy">
          <span className="zpos-prototype-chip">Shop Preview</span>
          <h1>ZEZVA Parts Store</h1>
          <p>Prototype storefront for service parts, repair bundles, and future checkout integration.</p>
        </div>
        <div className="zpos-shop-banner-side">
          <span className="zpos-operator-label">Live Area</span>
          <strong>Public catalog</strong>
        </div>
      </div>

      <div className="zpos-shell">
        <aside className="zpos-sidebar" aria-label="Filters">
          <div className="zpos-sidebar-head">
            <div>
              <p>Filters</p>
              <h2>Product Filters</h2>
            </div>
            <button className="zpos-reset-btn" type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <section className="zpos-filter-section">
            <div className="zpos-section-head">
              <p>Part Type</p>
              <h3>Component Family</h3>
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
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="zpos-filter-section">
            <div className="zpos-section-head">
              <p>Source</p>
              <h3>Inventory Origin</h3>
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
                <span className="zpos-check-label">{labelForSource[value]}</span>
              </label>
            ))}
          </section>

          <section className="zpos-filter-section">
            <div className="zpos-section-head">
              <p>Price Filter</p>
              <h3>Budget Range</h3>
            </div>
            <div className="zpos-price-grid">
              <label>
                <span>Min</span>
                <input
                  id="zpos-price-min"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={priceMin}
                  onChange={(event) => setPriceMin(event.target.value)}
                />
              </label>
              <label>
                <span>Max</span>
                <input
                  id="zpos-price-max"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="900"
                  value={priceMax}
                  onChange={(event) => setPriceMax(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="zpos-filter-section">
            <div className="zpos-section-head">
              <p>Checkout Status</p>
              <h3>Current Scope</h3>
            </div>
            <ul className="zpos-note-list">
              <li>Catalog and cart are live for preview and admin management.</li>
              <li>Checkout remains prototype-only until payment options are integrated.</li>
              <li>Shop admin is available only through the direct hidden URL.</li>
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
                aria-label="Open filters"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16"></path>
                  <path d="M7 12h10"></path>
                  <path d="M10 17h4"></path>
                </svg>
                <span>Filters</span>
              </button>

              <div className="zpos-tabs" role="tablist" aria-label="Device tabs" ref={tabsRef}>
                {['all', 'smartphones', 'laptops'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`zpos-tab ${tab === value ? 'is-active' : ''}`}
                    onClick={() => setTab(value)}
                  >
                    <span>{value === 'all' ? 'All' : labelForDevice[value]}</span>
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
                  placeholder="Search parts, models, issue tags..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <div className="zpos-results-meta">
                <span className="zpos-results-label" id="zpos-results-title">
                  {deviceTitles[tab] || deviceTitles.all}
                </span>
                <strong id="zpos-results-count">{visibleProducts.length}</strong>
                <span>visible</span>
              </div>
            </div>
          </div>

          <div className="zpos-grid-scroll">
            <div id="zpos-grid" className="zpos-grid" aria-live="polite">
              {visibleProducts.length === 0 && (
                <div className="zpos-empty zpos-empty--grid is-visible">
                  <strong>No parts match these filters</strong>
                  <p>Try another tab, adjust price range, or reset the source selection.</p>
                </div>
              )}

              {visibleProducts.map((product, index) => {
                const activePrice = product.sale_price ?? product.price;
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
                      {product.sale_price != null && <span className="zpos-badge">Sale</span>}
                      <img src={product.image_url} alt={`${product.title} thumbnail`} loading="lazy" />
                    </div>
                    <div className="zpos-card-body">
                      <p className="zpos-meta">
                        {labelForDevice[product.device_category]} • {labelForPart[product.part_category]} •{' '}
                        {labelForSource[product.inventory_source]}
                      </p>
                      <h3>{product.title}</h3>
                      <p className="zpos-issue">{product.issue_label}</p>
                      <div className="zpos-card-footer">
                        <div className="zpos-price">
                          {product.sale_price != null && (
                            <span className="zpos-old-price">{formatMoney(product.price)}</span>
                          )}
                          <strong>{formatMoney(activePrice)}</strong>
                        </div>
                        <button
                          type="button"
                          className="zpos-add"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveProduct(product);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="zpos-cart" aria-label="Cart">
          <div className="zpos-cart-head">
            <div>
              <p>Customer Cart</p>
              <h2>Repair order</h2>
            </div>
            <span id="zpos-cart-count" className="zpos-cart-count">
              {cartSummary.count}
            </span>
          </div>

          <div id="zpos-cart-items" className="zpos-cart-items">
            {cart.length === 0 && (
              <div className="zpos-empty">
                <strong>No parts added yet</strong>
                <p>Add a part or open quick view for service pricing.</p>
              </div>
            )}

            {cart.map((item) => (
              <div key={item.id} className="zpos-cart-item">
                <div className="zpos-cart-item-thumb">
                  <img src={item.image_url} alt={`${item.title} thumbnail`} loading="lazy" />
                </div>
                <div className="zpos-cart-item-main">
                  <p className="zpos-cart-mode">
                    {item.mode === 'service' ? 'With repair service' : 'Product only'}
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
              <span>Subtotal</span>
              <strong id="zpos-subtotal">{formatMoney(cartSummary.subtotal)}</strong>
            </div>
            <div className="zpos-summary-row">
              <span>Service uplift</span>
              <strong id="zpos-service-total">{formatMoney(cartSummary.serviceTotal)}</strong>
            </div>
            <div className="zpos-summary-row is-total">
              <span>Prototype total</span>
              <strong id="zpos-total">{formatMoney(cartSummary.total)}</strong>
            </div>
            <button className="zpos-checkout" type="button">
              Prototype only, checkout stays disabled for now
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
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
              </svg>
            </button>

            <div id="zpos-modal-visual" className="zpos-modal-visual">
              <img src={activeProduct.image_url} alt={`${activeProduct.title} preview`} />
            </div>

            <div className="zpos-modal-content">
              <p id="zpos-modal-kicker" className="zpos-modal-kicker">
                {labelForDevice[activeProduct.device_category]} • {labelForPart[activeProduct.part_category]} •{' '}
                {labelForSource[activeProduct.inventory_source]}
              </p>
              <h2 id="zpos-modal-title">{activeProduct.title}</h2>
              <p id="zpos-modal-desc" className="zpos-modal-desc">
                {activeProduct.description}
              </p>

              <div className="zpos-modal-prices">
                <button
                  type="button"
                  className="zpos-choice is-primary"
                  onClick={() => addToCart(activeProduct, 'product')}
                >
                  <span className="zpos-choice-label">Buy only product</span>
                  <strong>{formatMoney(activeProduct.sale_price ?? activeProduct.price)}</strong>
                  <small>Part only, no installation included.</small>
                </button>

                <button
                  type="button"
                  className="zpos-choice"
                  onClick={() => addToCart(activeProduct, 'service')}
                >
                  <span className="zpos-choice-label">Buy with repair service</span>
                  <strong>{formatMoney(activeProduct.service_price ?? activeProduct.price)}</strong>
                  <small>Part plus fitting and diagnostics handoff.</small>
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
