# Trade-in Integration

The trade-in feature is isolated from the existing shop, warranty, and service data.

## Namespaces

- Public API: `/api/trade-in/*`
- Shop admin API: `/api/shop/admin/trade-in/*`
- Public media: `/trade-in/media/*`
- Database tables: `trade_in_*`

## Initial Data Import

1. Apply `database/migrations/022_create_trade_in_tables.sql`.
2. Ensure the backend dependencies are installed.
3. Run the importer with the production database environment variables:

```bash
DB_HOST=127.0.0.1 \
DB_PORT=3306 \
DB_NAME=gstore_warranty \
DB_USER=gstore \
DB_PASSWORD=... \
node scripts/import-trade-in-data.js /path/to/zezvatrade-handoff/data/db.sqlite
```

The importer is idempotent. Categories, products, pricing trees, settings, and legacy
quotes are upserted using stable source IDs and slugs.

## Regression Boundary

The integration does not read from or write to `shop_products`, `shop_orders`,
`warranties`, or `service_cases`.
