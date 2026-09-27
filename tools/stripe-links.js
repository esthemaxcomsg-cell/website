#!/usr/bin/env node
/*
  Bulk-creates Stripe products, prices and Payment Links from a spreadsheet.
  The Stripe key is read from your own terminal (never stored in this file or the repo).

  1. Make the price sheet (one row per product, prices left blank):
       node tools/stripe-links.js template
     Open tools/stripe-prices.csv in Excel or Numbers, fill the "price" column for the
     products you want to sell (leave blank to skip), save as CSV.

  2. Preview what would be created (nothing is sent to Stripe):
       node tools/stripe-links.js create

  3. Create for real (test key first, then live):
       STRIPE_KEY=rk_test_... node tools/stripe-links.js create --go

  Results (including each buy.stripe.com link) are written to tools/stripe-links-result.csv.
  Running it again skips products that already exist in Stripe (matched by product code).
*/
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SHEET = path.join(__dirname, 'stripe-prices.csv');
const RESULT = path.join(__dirname, 'stripe-links-result.csv');
const SITE = (process.env.SITE || 'https://esthemax.com.sg').replace(/\/$/, '');
const CURRENCY = (process.env.CURRENCY || 'sgd').toLowerCase();

function loadCatalog() {
  global.window = {};
  require(path.join(ROOT, 'assets/data/catalog.js'));
  const E = window.EM, rows = [];
  E.masks.forEach(m => rows.push({ code: m.code, name: m.name + ' Hydrojelly Mask', image: m.img, page: 'product.html?id=' + m.code }));
  E.sets.forEach(s => rows.push({ code: s.code, name: s.name.replace(/^\[[^\]]+\]\s*/, ''), image: s.img, page: 'product.html?id=' + s.code }));
  E.skincare.forEach(s => rows.push({ code: s.code || s.slug, name: s.name, image: s.img, page: 'product.html?id=' + s.slug }));
  return rows;
}
const csvCell = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
function parseCsv(text) {
  const out = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  const [head, ...body] = out.filter(r => r.some(x => x.trim()));
  return body.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

async function stripe(method, endpoint, params) {
  const key = process.env.STRIPE_KEY;
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const url = 'https://api.stripe.com/v1/' + endpoint + (method === 'GET' && body ? '?' + body : '');
  const res = await fetch(url, { method, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' }, body: method === 'GET' ? undefined : body });
  const json = await res.json();
  if (!res.ok) throw new Error((json.error && json.error.message) || res.statusText);
  return json;
}

async function create(go) {
  if (!fs.existsSync(SHEET)) { console.log('No price sheet yet. Run: node tools/stripe-links.js template'); return; }
  const items = parseCsv(fs.readFileSync(SHEET, 'utf8')).filter(r => r.price && !isNaN(parseFloat(r.price)));
  if (!items.length) { console.log('No prices filled in tools/stripe-prices.csv, nothing to do.'); return; }
  const key = process.env.STRIPE_KEY || '';
  if (go && !key) { console.log('Set the key in this terminal first:  STRIPE_KEY=rk_test_... node tools/stripe-links.js create --go'); return; }
  if (go) console.log(key.includes('_live_') ? 'LIVE mode: creating real products.' : 'TEST mode.');
  else console.log('Preview only (add --go to create). ' + items.length + ' product(s):');
  const results = [];
  for (const it of items) {
    const amount = Math.round(parseFloat(it.price) * 100);
    const image = /^https?:/.test(it.image) ? it.image : SITE + '/' + it.image.replace(/^\//, '');
    if (!go) { console.log('  ' + it.code + '  ' + it.name + '  ' + CURRENCY.toUpperCase() + ' ' + (amount / 100).toFixed(2)); continue; }
    try {
      const found = await stripe('GET', 'products/search', { query: "metadata['code']:'" + it.code + "'" });
      if (found.data.length) { console.log('  skip ' + it.code + ' (already in Stripe)'); results.push({ ...it, status: 'exists', product: found.data[0].id, link: '' }); continue; }
      const product = await stripe('POST', 'products', { name: it.name, 'images[0]': image, 'metadata[code]': it.code, url: SITE + '/' + it.page });
      const price = await stripe('POST', 'prices', { product: product.id, unit_amount: String(amount), currency: CURRENCY });
      const link = await stripe('POST', 'payment_links', {
        'line_items[0][price]': price.id, 'line_items[0][quantity]': '1',
        'line_items[0][adjustable_quantity][enabled]': 'true', 'line_items[0][adjustable_quantity][minimum]': '1', 'line_items[0][adjustable_quantity][maximum]': '99',
        'shipping_address_collection[allowed_countries][0]': 'SG', 'phone_number_collection[enabled]': 'true', 'metadata[code]': it.code
      });
      console.log('  made ' + it.code + '  ' + link.url);
      results.push({ ...it, status: 'created', product: product.id, link: link.url });
    } catch (e) { console.log('  FAILED ' + it.code + ': ' + e.message); results.push({ ...it, status: 'failed: ' + e.message, product: '', link: '' }); }
  }
  if (go) {
    const cols = ['code', 'name', 'price', 'status', 'product', 'link'];
    fs.writeFileSync(RESULT, cols.join(',') + '\n' + results.map(r => cols.map(c => csvCell(r[c] || '')).join(',')).join('\n') + '\n');
    console.log('\nDone. Links saved to tools/stripe-links-result.csv');
  }
}

const cmd = process.argv[2];
if (cmd === 'template') {
  const rows = loadCatalog(), cols = ['code', 'name', 'price', 'image'];
  if (fs.existsSync(SHEET)) { console.log('tools/stripe-prices.csv already exists, not overwriting.'); process.exit(0); }
  fs.writeFileSync(SHEET, cols.join(',') + '\n' + rows.map(r => cols.map(c => csvCell(c === 'price' ? '' : r[c])).join(',')).join('\n') + '\n');
  console.log('Wrote tools/stripe-prices.csv with ' + rows.length + ' products. Fill the price column, then run: node tools/stripe-links.js create');
} else if (cmd === 'create') {
  create(process.argv.includes('--go'));
} else {
  console.log('Usage:\n  node tools/stripe-links.js template\n  node tools/stripe-links.js create          (preview)\n  STRIPE_KEY=rk_test_... node tools/stripe-links.js create --go');
}
