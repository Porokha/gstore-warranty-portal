# CSV Import Format Documentation

## Warranty CSV Import Format

### Required Columns

These columns **must** be present and have values:

- **title** - Product title/name (e.g., "iPhone 15 Pro")
- **customer_name** - Customer's first name
- **customer_phone** - Customer's phone number

### Optional but Recommended Columns

- **sku** - Product SKU (if empty, will be auto-generated from order_id/product_id)
- **serial_number** - Device serial number (if empty, will use IMEI or auto-generate)
- **imei** - Device IMEI (used as serial_number if serial_number is empty)
- **customer_last_name** - Customer's last name (defaults to empty string if missing)
- **customer_email** - Customer's email address

### Date Columns

- **purchase_date** - Purchase date (format: YYYY-MM-DD or ISO format)
  - If missing, defaults to current date
- **warranty_start** - Warranty start date (format: YYYY-MM-DD or ISO format)
  - If missing, defaults to purchase_date
- **warranty_end** - Warranty end date (format: YYYY-MM-DD or ISO format)
  - If missing, calculated from warranty_start + warranty_duration_days
- **warranty_duration_days** - Warranty duration in days (default: 365)

### Order/WooCommerce Columns

- **order_id** - WooCommerce order ID (if applicable)
- **product_id** - WooCommerce product ID (if applicable)
- **order_line_index** - Order line item index (if applicable)
- **created_source** - Source: "woocommerce", "auto_woo", or "manual" (default: "manual")

### Product Information Columns

- **device_type** - Device type (e.g., "Phone", "Laptop", "Tablet") - Default: "Laptop"
- **price** - Product price (numeric, default: 0)
- **thumbnail_url** - Product image URL

### Admin-Only Columns

These columns are for internal use and won't be visible to customers:

- **brand** - Product brand (e.g., "Apple", "Samsung")
- **model** - Product model (e.g., "iPhone 15 Pro")
- **condition** - Product condition (e.g., "New", "Used", "Refurbished")
- **personal_identification_number** (or **pn**) - Personal identification number
- **admin_notes** - Internal admin notes
- **extended_days** - Additional warranty days (default: 0)

## Complete Column List (in order)

```
title, sku, serial_number, imei, device_type, customer_name, customer_last_name, 
customer_phone, customer_email, purchase_date, warranty_start, warranty_end, 
warranty_duration_days, order_id, product_id, order_line_index, created_source, 
price, thumbnail_url, brand, model, condition, personal_identification_number, 
admin_notes, extended_days
```

## Example CSV Row

```csv
title,sku,serial_number,imei,device_type,customer_name,customer_last_name,customer_phone,customer_email,purchase_date,warranty_start,warranty_end,warranty_duration_days,order_id,product_id,order_line_index,created_source,price,thumbnail_url,brand,model,condition,personal_identification_number,admin_notes,extended_days
iPhone 15 Pro,SKU-001,SN123456789,IMEI123456789012345,Phone,John,Doe,+995555123456,john.doe@example.com,2024-01-15,2024-01-15,2025-01-15,365,12345,67890,0,manual,999.99,https://example.com/image.jpg,Apple,iPhone 15 Pro,New,PN-12345,Internal note for admin,0
```

## Auto-Generation Rules

### If `sku` is empty:
1. Uses `ORDER-{order_id}-{product_id}` if both order_id and product_id exist
2. Uses `ORDER-{order_id}` if only order_id exists
3. Uses `SN-{serial_number}` if serial_number exists
4. Otherwise generates from title + customer info

### If `serial_number` is empty:
1. Uses `imei` value if available
2. Uses `ORDER-{order_id}-PROD-{product_id}` if both exist
3. Uses `ORDER-{order_id}` if only order_id exists
4. Otherwise generates unique identifier from title + customer + row number

## Date Format

Dates can be in any format that JavaScript `Date()` can parse:
- `YYYY-MM-DD` (recommended)
- `YYYY-MM-DD HH:MM:SS`
- `MM/DD/YYYY`
- ISO 8601 format

## Notes

- All columns are case-sensitive - use exact column names as shown
- Empty values are allowed for optional columns
- The importer will skip duplicate warranties (based on serial_number + order_id)
- CSV file should be UTF-8 encoded
- Maximum file size: 10MB

## Download Example Template

You can download an example CSV template from the admin panel:
- Go to **Import Data** → **Import Warranties (CSV)** → Click **Download Preset**

This will download a CSV file with all columns and example data.

