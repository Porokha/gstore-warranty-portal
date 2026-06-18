CREATE TABLE IF NOT EXISTS trade_in_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(120) NOT NULL,
    label VARCHAR(255) NOT NULL,
    icon_svg MEDIUMTEXT,
    sort_order INT NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    coming_soon TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_trade_in_category_slug (slug),
    INDEX idx_trade_in_category_visibility (enabled, coming_soon, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_in_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_id INT,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(160),
    category VARCHAR(160),
    category2 VARCHAR(160),
    image_src VARCHAR(1000),
    search_tags TEXT,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_trade_in_product_slug (slug),
    UNIQUE KEY uniq_trade_in_product_source_id (source_id),
    INDEX idx_trade_in_product_enabled (enabled),
    INDEX idx_trade_in_product_category_brand (category, brand),
    INDEX idx_trade_in_product_name (name),
    FULLTEXT KEY ft_trade_in_product_search (name, brand, category, category2, search_tags)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_in_pricing_trees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    tree_json JSON NOT NULL,
    max_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    source_updated_at DATETIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_trade_in_pricing_product (product_id),
    CONSTRAINT fk_trade_in_pricing_product
        FOREIGN KEY (product_id) REFERENCES trade_in_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_in_quotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quote_number VARCHAR(40) NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    pricing_path JSON,
    final_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(60) NOT NULL,
    status ENUM('pending', 'contacted', 'accepted', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_trade_in_quote_number (quote_number),
    INDEX idx_trade_in_quote_status_created (status, created_at),
    INDEX idx_trade_in_quote_phone (customer_phone),
    CONSTRAINT fk_trade_in_quote_product
        FOREIGN KEY (product_id) REFERENCES trade_in_products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_in_settings (
    setting_key VARCHAR(160) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
