# WooCommerce Integration Setup Guide

## Finding WooCommerce Credentials

### 1. WooCommerce URL
The WooCommerce URL is simply your WordPress/WooCommerce store URL.

**Example:**
- If your store is at `https://shop.gstore.ge`, then `WOOCOMMERCE_URL=https://shop.gstore.ge`
- If your store is at `https://gstore.ge/shop`, then `WOOCOMMERCE_URL=https://gstore.ge`

### 2. Consumer Key and Consumer Secret

To get your WooCommerce API credentials:

1. **Log in to your WordPress admin panel**
2. **Navigate to:** WooCommerce → Settings → Advanced → REST API
3. **Click "Add key"** button
4. **Fill in the details:**
   - Description: `Warranty Portal Integration` (or any name you prefer)
   - User: Select an administrator user
   - Permissions: Select **Read/Write**
5. **Click "Generate API key"**
6. **Copy the credentials:**
   - **Consumer Key** - This is your `WOOCOMMERCE_CONSUMER_KEY`
   - **Consumer Secret** - This is your `WOOCOMMERCE_CONSUMER_SECRET`

⚠️ **Important:** The Consumer Secret is only shown once! Make sure to copy it immediately.

### 3. Add to .env file

Add these to your backend `.env` file:

```env
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Webhook Setup

### Webhook URL

The webhook URL must include the port number if your backend is not running on port 80/443.

**For your Lightsail instance:**
```
http://3.68.134.145:3000/api/woocommerce/webhook/order
```

**If you have a domain with SSL:**
```
https://api.gstore.ge/api/woocommerce/webhook/order
```

### Setting up the Webhook in WooCommerce

1. **Navigate to:** WooCommerce → Settings → Advanced → Webhooks
2. **Click "Add webhook"**
3. **Configure the webhook:**
   - **Name:** `Warranty Portal - Order Updates`
   - **Status:** Active
   - **Topic:** `Order updated`
   - **Delivery URL:** `http://3.68.134.145:3000/api/woocommerce/webhook/order`
   - **Secret:** (optional, leave empty for now)
   - **API Version:** WP REST API Integration v3
4. **Click "Save webhook"**

### Testing the Webhook

1. Create a test order in WooCommerce
2. Change the order status to "Completed"
3. Check the backend logs to see if the webhook was received
4. Check if a warranty was created in the warranty portal

## Troubleshooting

### Webhook Connection Refused

**Problem:** `cURL error 7: Failed to connect to 3.68.134.145 port 80: Connection refused`

**Solution:** 
- Make sure the webhook URL includes the correct port: `http://3.68.134.145:3000/api/woocommerce/webhook/order`
- Ensure your backend is running and accessible
- Check firewall settings on Lightsail to allow port 3000

### Webhook Not Receiving Data

1. **Check backend logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST http://3.68.134.145:3000/api/woocommerce/webhook/order \
     -H "Content-Type: application/json" \
     -d '{"id": 123, "status": "completed"}'
   ```

3. **Check WooCommerce webhook logs:**
   - Go to WooCommerce → Settings → Advanced → Webhooks
   - Click on your webhook to see delivery logs

### API Authentication Errors

If you get authentication errors:
1. Verify your Consumer Key and Secret are correct
2. Make sure the API key has **Read/Write** permissions
3. Check that the user associated with the API key is still active

## Order Meta Data Requirements

For automatic warranty creation, WooCommerce orders should include:

### Required:
- **Serial Number:** Should be in order line item meta data with key `serial_number` or `serial`
- If serial number is missing, the system will generate one: `ORD-{orderId}-PROD-{productId}-{lineItemIndex}`

### Optional:
- **IMEI:** For phones, should be in meta data with key `imei`

### How to Add Meta Data to Orders

You can add custom meta data to orders using:
1. WooCommerce custom fields
2. Custom order meta plugins
3. Custom code in your theme's `functions.php`

Example code to add serial number to order:
```php
add_action('woocommerce_checkout_create_order_line_item', 'add_serial_to_order', 10, 4);
function add_serial_to_order($item, $cart_item_key, $values, $order) {
    if (isset($values['serial_number'])) {
        $item->add_meta_data('serial_number', $values['serial_number']);
    }
}
```

## Manual Order Sync

If you need to sync existing orders:

```bash
# Using curl
curl -X POST http://3.68.134.145:3000/api/woocommerce/sync/order/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or use the staff portal UI (if implemented)
```

