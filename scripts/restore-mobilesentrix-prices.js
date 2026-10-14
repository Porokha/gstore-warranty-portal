#!/usr/bin/env node

const fs = require('fs');
const mysql = require('/app/node_modules/mysql2/promise');

const inputPath = process.argv[2];
const apply = process.argv.includes('--apply');
const expectedCount = Number((process.argv.find((arg) => arg.startsWith('--expected=')) || '').split('=')[1]);
if (!inputPath || !Number.isInteger(expectedCount) || expectedCount < 1) {
  throw new Error('Usage: node restore-mobilesentrix-prices.js <recovery.json> --expected=<count> [--apply]');
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const products = input.products || [];
if (products.length !== expectedCount || new Set(products.map((item) => item.id)).size !== expectedCount) {
  throw new Error(`Expected ${expectedCount} unique products, got ${products.length}.`);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    if (apply) await connection.beginTransaction();
    const ids = products.map((item) => item.id);
    const [rows] = await connection.query(
      'SELECT id, supplier, title, price, sale_price, service_price, supplier_auto_sync_disabled, supplier_synced_at, updated_at FROM shop_products WHERE id IN (?)' + (apply ? ' FOR UPDATE' : ''),
      [ids],
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    const changes = [];
    for (const item of products) {
      const current = byId.get(item.id);
      if (!current || current.supplier !== 'mobilesentrix') {
        throw new Error(`Product ${item.id} is missing or is not a MobileSentrix product.`);
      }
      if (!current.supplier_synced_at || current.supplier_synced_at <= new Date(`${item.last_edit_utc}Z`)) {
        throw new Error(`Product ${item.id} was not supplier-synced after the recovered edit.`);
      }
      if (current.updated_at.getTime() - current.supplier_synced_at.getTime() > 120000) {
        throw new Error(`Product ${item.id} changed after its last supplier sync; refusing to overwrite it.`);
      }

      const before = {};
      const after = {};
      for (const field of ['price', 'sale_price', 'service_price']) {
        const currentValue = current[field] == null ? null : Number(current[field]);
        const desiredValue = item.desired[field];
        if (desiredValue != null && (!Number.isFinite(desiredValue) || desiredValue < 0)) {
          throw new Error(`Invalid ${field} for product ${item.id}.`);
        }
        before[field] = currentValue;
        after[field] = item.first_before[field] !== desiredValue ? desiredValue : currentValue;
      }
      changes.push({
        id: item.id,
        title: current.title,
        before,
        after,
        last_edit_utc: item.last_edit_utc,
        previously_locked: Boolean(current.supplier_auto_sync_disabled),
      });
    }

    if (apply) {
      for (const item of changes) {
        await connection.execute(
          'UPDATE shop_products SET price = ?, sale_price = ?, service_price = ?, supplier_auto_sync_disabled = 1 WHERE id = ? AND supplier = ?',
          [item.after.price, item.after.sale_price, item.after.service_price, item.id, 'mobilesentrix'],
        );
      }
      await connection.commit();
    }

    process.stdout.write(`${JSON.stringify({
      applied: apply,
      products: changes.length,
      price_changes: changes.filter((item) => item.before.price !== item.after.price).length,
      sale_price_changes: changes.filter((item) => item.before.sale_price !== item.after.sale_price).length,
      service_price_changes: changes.filter((item) => item.before.service_price !== item.after.service_price).length,
      changes,
    }, null, 2)}\n`);
  } catch (error) {
    if (apply) await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
