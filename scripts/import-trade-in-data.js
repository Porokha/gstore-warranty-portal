#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');
const mysql = require(path.join(__dirname, '..', 'backend', 'node_modules', 'mysql2', 'promise'));

const sourcePath = process.argv[2] || '/Users/gstore/Desktop/zezvatrade-handoff/data/db.sqlite';
const batchSize = 200;

function sqliteJson(sql) {
  const output = execFileSync('sqlite3', ['-json', sourcePath, sql], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
  return output.trim() ? JSON.parse(output) : [];
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function maxTreePrice(tree) {
  let max = 0;
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      const price = Number(value.value);
      if (Number.isFinite(price)) max = Math.max(max, price);
    }
    Object.values(value).forEach(visit);
  };
  visit(tree);
  return max;
}

function normalizeImagePath(value) {
  if (!value) return null;
  if (String(value).includes('image-not-found')) return null;
  const normalized = String(value)
    .replace(/^(\.\.\/)+/, '/')
    .replace(/^\/sell\/media\//, '/media/')
    .replace(/^media\//, '/media/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

async function upsertBatches(connection, sql, rows) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    for (const row of batch) {
      await connection.execute(sql, row);
    }
    process.stdout.write(`\rImported ${Math.min(index + batch.length, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gstore_warranty',
    charset: 'utf8mb4',
  });

  const categories = sqliteJson('SELECT * FROM categories ORDER BY sort_order, id');
  const products = sqliteJson('SELECT * FROM products ORDER BY id');
  const pricingTrees = sqliteJson('SELECT * FROM pricing_trees ORDER BY id');
  const quotes = sqliteJson('SELECT * FROM quotes ORDER BY id');
  const settings = sqliteJson('SELECT * FROM settings ORDER BY key');

  await connection.beginTransaction();
  try {
    console.log(`Importing ${categories.length} categories...`);
    await upsertBatches(
      connection,
      `INSERT INTO trade_in_categories
        (id, slug, label, icon_svg, sort_order, enabled, coming_soon)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        label = VALUES(label), icon_svg = VALUES(icon_svg), sort_order = VALUES(sort_order),
        enabled = VALUES(enabled), coming_soon = VALUES(coming_soon)`,
      categories.map((row) => [
        row.id,
        row.slug,
        row.label,
        row.icon_svg || null,
        row.sort_order || 0,
        row.enabled ? 1 : 0,
        row.coming_soon ? 1 : 0,
      ]),
    );

    console.log(`Importing ${products.length} products...`);
    await upsertBatches(
      connection,
      `INSERT INTO trade_in_products
        (source_id, slug, name, brand, category, category2, image_src, search_tags, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        slug = VALUES(slug), name = VALUES(name), brand = VALUES(brand),
        category = VALUES(category), category2 = VALUES(category2),
        image_src = VALUES(image_src), search_tags = VALUES(search_tags), enabled = VALUES(enabled)`,
      products.map((row) => [
        row.id,
        row.slug,
        row.name,
        row.brand || null,
        row.category || null,
        row.category2 || null,
        normalizeImagePath(row.image_src),
        row.search_tags || null,
        row.enabled ? 1 : 0,
      ]),
    );

    const productIds = new Map(
      (await connection.query('SELECT id, source_id FROM trade_in_products'))[0].map((row) => [
        Number(row.source_id),
        Number(row.id),
      ]),
    );

    console.log(`Importing ${pricingTrees.length} pricing trees...`);
    await upsertBatches(
      connection,
      `INSERT INTO trade_in_pricing_trees
        (product_id, tree_json, max_price, source_updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        tree_json = VALUES(tree_json), max_price = VALUES(max_price),
        source_updated_at = VALUES(source_updated_at)`,
      pricingTrees
        .filter((row) => productIds.has(Number(row.product_id)))
        .map((row) => {
          const tree = parseJson(row.tree_json, []);
          return [
            productIds.get(Number(row.product_id)),
            JSON.stringify(tree),
            maxTreePrice(tree),
            row.updated_at || null,
          ];
        }),
    );

    console.log(`Importing ${quotes.length} historical quotes...`);
    await upsertBatches(
      connection,
      `INSERT INTO trade_in_quotes
        (quote_number, product_id, product_name, pricing_path, final_price,
         customer_name, customer_email, customer_phone, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        product_name = VALUES(product_name), pricing_path = VALUES(pricing_path),
        final_price = VALUES(final_price), customer_name = VALUES(customer_name),
        customer_email = VALUES(customer_email), customer_phone = VALUES(customer_phone),
        status = VALUES(status), notes = VALUES(notes)`,
      quotes.map((row) => [
        `LEGACY-TR-${String(row.id).padStart(6, '0')}`,
        productIds.get(Number(row.product_id)) || null,
        row.product_name || 'Unknown product',
        JSON.stringify(parseJson(row.pricing_path, [])),
        Number(row.final_price || 0),
        row.customer_name || 'Unknown customer',
        row.customer_email || null,
        row.customer_phone || '',
        ['pending', 'contacted', 'accepted', 'completed', 'cancelled'].includes(row.status)
          ? row.status
          : 'pending',
        row.notes || null,
        row.created_at || new Date(),
      ]),
    );

    console.log(`Importing ${settings.length} settings...`);
    await upsertBatches(
      connection,
      `INSERT INTO trade_in_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      settings.map((row) => [row.key, row.value]),
    );

    await connection.commit();
    console.log('Trade-in data import completed.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
