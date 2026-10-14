#!/usr/bin/env node

const readline = require('readline');

const entries = new Map();
let timestamp = null;
let active = null;
let section = null;
let changedEvents = 0;

function value(row, column) {
  const raw = row[column];
  return raw === undefined || raw === 'NULL' ? null : Number(raw);
}

function flush() {
  if (!active || !active.before[1] || !active.after[1]) return;
  const before = {
    price: value(active.before, 18),
    sale_price: value(active.before, 19),
    service_price: value(active.before, 20),
  };
  const after = {
    price: value(active.after, 18),
    sale_price: value(active.after, 19),
    service_price: value(active.after, 20),
  };
  if (Object.keys(before).every((key) => before[key] === after[key])) return;
  changedEvents += 1;
  const id = Number(active.after[1]);
  const previous = entries.get(id);
  entries.set(id, {
    id,
    first_before: (previous && previous.first_before) || before,
    desired: after,
    last_edit_utc: active.timestamp,
    edits: ((previous && previous.edits) || 0) + 1,
  });
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
  const date = line.match(/^#(\d{2})(\d{2})(\d{2}) (\d{2}:\d{2}:\d{2}) server id /);
  if (date) {
    timestamp = `20${date[1]}-${date[2]}-${date[3]} ${date[4]}`;
  }
  if (line.startsWith('### UPDATE `gstore_warranty`.`shop_products`')) {
    flush();
    active = { timestamp, before: {}, after: {} };
    section = null;
  } else if (active && line === '### WHERE') {
    section = 'before';
  } else if (active && line === '### SET') {
    section = 'after';
  } else if (active && section && line.startsWith('###   @')) {
    const field = line.match(/^###   @(1|18|19|20)=([^ ]+)/);
    if (field) active[section][field[1]] = field[2];
  } else if (active && !line.startsWith('###')) {
    flush();
    active = null;
    section = null;
  }
});
input.on('close', () => {
  flush();
  process.stdout.write(JSON.stringify({ changedEvents, products: [...entries.values()].sort((a, b) => a.id - b.id) }, null, 2));
});
