CREATE TABLE IF NOT EXISTS shop_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    device_category ENUM('smartphones', 'laptops', 'accessories') NOT NULL DEFAULT 'smartphones',
    part_category ENUM('board', 'screen', 'sensor', 'battery', 'camera', 'speaker', 'charging', 'accessory') NOT NULL DEFAULT 'accessory',
    inventory_source ENUM('oem', 'third-party') NOT NULL DEFAULT 'third-party',
    issue_label VARCHAR(255) NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10, 2) NULL,
    service_price DECIMAL(10, 2) NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shop_products_active_sort (is_active, sort_order, id),
    INDEX idx_shop_products_device (device_category),
    INDEX idx_shop_products_part (part_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shop_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('draft', 'new', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
    customer_name VARCHAR(255) NOT NULL,
    customer_last_name VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NULL,
    items_json JSON NOT NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    service_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'GEL',
    payment_method VARCHAR(100) NULL,
    customer_note TEXT NULL,
    admin_note TEXT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'prototype_checkout',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shop_orders_status_created (status, created_at),
    INDEX idx_shop_orders_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO shop_products (
    slug,
    title,
    device_category,
    part_category,
    inventory_source,
    issue_label,
    description,
    image_url,
    price,
    sale_price,
    service_price,
    stock_quantity,
    sort_order,
    is_active
)
SELECT * FROM (
    SELECT 'iphone-13-oled-display-assembly', 'iPhone 13 OLED Display Assembly', 'smartphones', 'screen', 'oem',
           'Face ID alignment safe pull',
           'Premium front assembly with vivid color, bonded glass, and frame alignment suitable for premium diagnostic replacement jobs.',
           '/shop-assets/imgs/test1.avif', 540.00, 489.00, 590.00, 8, 10, 1
    UNION ALL
    SELECT 'galaxy-s22-charging-flex', 'Galaxy S22 Charging Flex', 'smartphones', 'charging', 'third-party',
           'Power drop and intermittent charge port',
           'Compact charging sub-board with connector flex for common power and dock failures.',
           '/shop-assets/imgs/test3.avif', 95.00, NULL, 145.00, 14, 20, 1
    UNION ALL
    SELECT 'macbook-pro-m1-trackpad-sensor-cable', 'MacBook Pro M1 Trackpad Sensor Cable', 'laptops', 'sensor', 'oem',
           'No click feedback after spill',
           'Sensor-ready interconnect for precision touch input recovery after liquid ingress or cable stress.',
           '/shop-assets/imgs/laptop-transite-7-1024x624.avif', 160.00, NULL, 250.00, 5, 30, 1
    UNION ALL
    SELECT 'dell-latitude-7420-battery-pack', 'Dell Latitude 7420 Battery Pack', 'laptops', 'battery', 'third-party',
           'Fast drain and swelling risk',
           'Reliable replacement cell pack for business laptop refresh and workshop battery swaps.',
           '/shop-assets/imgs/laptop-transite-8-1024x717.avif', 220.00, 185.00, 265.00, 6, 40, 1
    UNION ALL
    SELECT 'iphone-12-rear-camera-module', 'iPhone 12 Rear Camera Module', 'smartphones', 'camera', 'oem',
           'Blur, shake, and focus failure',
           'Rear imaging module for repair jobs where stabilization or autofocus has degraded.',
           '/shop-assets/imgs/test2.avif', 260.00, NULL, 335.00, 7, 50, 1
    UNION ALL
    SELECT 'lenovo-thinkpad-t14-mainboard-repair-kit', 'Lenovo ThinkPad T14 Mainboard Repair Kit', 'laptops', 'board', 'third-party',
           'No power after DC short',
           'Board-level starter kit intended for workshop diagnostics prototype presentation and quote building.',
           '/shop-assets/imgs/laptop-transite-7-1024x624.avif', 430.00, NULL, 575.00, 4, 60, 1
    UNION ALL
    SELECT 'redmi-note-13-pro-fingerprint-sensor', 'Redmi Note 13 Pro Fingerprint Sensor', 'smartphones', 'sensor', 'third-party',
           'Unlock sensor unresponsive',
           'Compact biometric module for mid-range Android repair flows.',
           '/shop-assets/imgs/test3.avif', 78.00, NULL, 120.00, 12, 70, 1
    UNION ALL
    SELECT 'macbook-air-a2337-speaker-pair', 'MacBook Air A2337 Speaker Pair', 'laptops', 'speaker', 'oem',
           'Crackle and low-volume output',
           'Matched speaker set for audio restoration jobs requiring clean tonal balance.',
           '/shop-assets/imgs/airpods-max2.avif', 180.00, 149.00, 229.00, 9, 80, 1
    UNION ALL
    SELECT 'pixel-8-pro-logic-board-shield-set', 'Pixel 8 Pro Logic Board Shield Set', 'smartphones', 'board', 'oem',
           'Thermal shield and board rebuild',
           'Shielding and support components for advanced board diagnostics and rebuild quotes.',
           '/shop-assets/imgs/test1.avif', 145.00, NULL, 215.00, 11, 90, 1
    UNION ALL
    SELECT 'hp-elitebook-840-screen-panel', 'HP EliteBook 840 Screen Panel', 'laptops', 'screen', 'third-party',
           'Backlight bleed and cracked LCD',
           'Slim matte panel replacement designed for quick workshop turnaround.',
           '/shop-assets/imgs/laptop-transite-8-1024x717.avif', 310.00, 279.00, 389.00, 5, 100, 1
    UNION ALL
    SELECT 'ipad-mini-charging-ic-bundle', 'iPad Mini Charging IC Bundle', 'smartphones', 'charging', 'oem',
           'Tablet draws power but will not boot',
           'Micro-soldering oriented charging bundle used for high-touch diagnostics presentations.',
           '/shop-assets/imgs/test2.avif', 205.00, NULL, 325.00, 6, 110, 1
    UNION ALL
    SELECT 'asus-zenbook-camera-and-mic-module', 'ASUS ZenBook Camera and Mic Module', 'laptops', 'camera', 'third-party',
           'No webcam during intake test',
           'Combined webcam and microphone module for productivity laptop service packages.',
           '/shop-assets/imgs/laptop-transite-7-1024x624.avif', 135.00, NULL, 205.00, 10, 120, 1
) AS seed_rows
WHERE NOT EXISTS (SELECT 1 FROM shop_products LIMIT 1);
